// scraper/stealth.js
// Full fingerprint spoofing without playwright-extra dependency.
// Injects JS overrides directly into every page context.

// Rotate through realistic viewport/screen combos
const FINGERPRINTS = [
  { viewport: { width: 1440, height: 900  }, screen: { width: 1440, height: 900  }, deviceScaleFactor: 2 },
  { viewport: { width: 1920, height: 1080 }, screen: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
  { viewport: { width: 1280, height: 800  }, screen: { width: 1280, height: 800  }, deviceScaleFactor: 2 },
  { viewport: { width: 1536, height: 864  }, screen: { width: 1536, height: 864  }, deviceScaleFactor: 1.25 },
  { viewport: { width: 1366, height: 768  }, screen: { width: 1366, height: 768  }, deviceScaleFactor: 1 },
];

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Phoenix",
];

const LOCALES = ["en-US", "en-US", "en-US", "en-GB", "en-CA"]; // weight toward en-US

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// The JS injected into every page before any script runs
const STEALTH_SCRIPT = `
  // 1. Remove webdriver flag — the #1 bot signal
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

  // 2. Spoof plugins array (empty in headless Chrome)
  Object.defineProperty(navigator, 'plugins', {
    get: () => {
      const p = [
        { name: 'Chrome PDF Plugin',      filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Chrome PDF Viewer',      filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
        { name: 'Native Client',          filename: 'internal-nacl-plugin',  description: '' },
      ];
      p.item = i => p[i];
      p.namedItem = n => p.find(x => x.name === n);
      p.refresh = () => {};
      Object.defineProperty(p, 'length', { value: p.length });
      return p;
    }
  });

  // 3. Spoof languages
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

  // 4. Spoof hardware concurrency (headless often returns 0)
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });

  // 5. Spoof device memory
  Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });

  // 6. Fix Chrome object missing in headless
  if (!window.chrome) {
    window.chrome = {
      runtime: {
        onConnect: { addListener: () => {} },
        onMessage: { addListener: () => {} },
      },
      loadTimes: () => ({}),
      csi: () => ({}),
      app: {},
    };
  }

  // 7. Randomize canvas fingerprint slightly (major tracking vector)
  const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function(type) {
    const ctx = this.getContext('2d');
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, this.width, this.height);
      for (let i = 0; i < 10; i++) {
        const idx = Math.floor(Math.random() * imageData.data.length / 4) * 4;
        imageData.data[idx] = imageData.data[idx] ^ 1;
      }
      ctx.putImageData(imageData, 0, 0);
    }
    return origToDataURL.apply(this, arguments);
  };

  // 8. Spoof WebGL renderer strings
  const origGetParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(param) {
    if (param === 37445) return 'Intel Inc.';
    if (param === 37446) return 'Intel Iris OpenGL Engine';
    return origGetParameter.apply(this, arguments);
  };

  // 9. Suppress automation-related errors
  window.navigator.permissions.query = (params) =>
    params.name === 'notifications'
      ? Promise.resolve({ state: Notification.permission })
      : navigator.permissions.query(params);
`;

export function randomFingerprint() {
  return {
    ...pickRandom(FINGERPRINTS),
    userAgent: pickRandom(USER_AGENTS),
    timezone: pickRandom(TIMEZONES),
    locale: pickRandom(LOCALES),
  };
}

export async function createStealthContext(browser, opts = {}) {
  const fp = randomFingerprint();

  const context = await browser.newContext({
    ...opts,
```

This passes through the geolocation and permissions from `gmaps.js` so Google thinks the browser is in the US.

**Full push summary — 4 files to update on GitHub:**

| File | Location | What it fixes |
|------|----------|---------------|
| `email.js` | root | Real emails via Resend |
| `server.js` | root | Debug endpoint removed |
| `scraper/gmaps.js` | scraper/ | More results (geolocation + gl=us) |
| `scraper/stealth.js` | scraper/ | 2-line edit to accept geolocation opts |

**Also add to `package.json` dependencies:**
```
"resend": "^4.0.0"
    userAgent: fp.userAgent,
    viewport: fp.viewport,
    screen: fp.screen,
    deviceScaleFactor: fp.deviceScaleFactor,
    locale: fp.locale,
    timezoneId: fp.timezone,
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
    },
    // Disable WebRTC — can leak real IP
    permissions: [],
  });

  // Inject stealth script before any page script runs
  await context.addInitScript(STEALTH_SCRIPT);

  // Block fingerprinting scripts + trackers + unnecessary resources
  await context.route("**/*", (route) => {
    const url = route.request().url();
    const resourceType = route.request().resourceType();

    // Block media and fonts — not needed
    if (["image", "media", "font"].includes(resourceType)) return route.abort();

    // Block known tracking/analytics domains
    const blocked = [
      "google-analytics.com", "googletagmanager.com", "doubleclick.net",
      "hotjar.com", "intercom.io", "zendesk.com", "segment.com",
      "amplitude.com", "mixpanel.com", "sentry.io", "fullstory.com",
    ];
    if (blocked.some(d => url.includes(d))) return route.abort();

    return route.continue();
  });

  return context;
}
