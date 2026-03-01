# 🎯 LeadReap v3.1

Google Maps lead scraper SaaS with auth, payments, and export.

## Architecture

```
leadreap/
├── server.js            ← Express API (auth + payments + scraper)
├── auth.js              ← SQLite-backed user/session management
├── payments.js          ← LemonSqueezy checkout + webhooks
├── email.js             ← Magic link email sender
├── middleware.js         ← Auth + rate limiting middleware
├── scraper/
│   ├── gmaps.js         ← Playwright Google Maps scraper
│   ├── queue.js         ← Job queue (FIFO, 1 at a time)
│   ├── cache.js         ← SQLite result cache
│   ├── stealth.js       ← Anti-detection browser config
│   ├── techstack.js     ← Website tech stack detection
│   ├── linkedin.js      ← LinkedIn enrichment
│   ├── utils.js         ← Phone/email normalization
│   └── exporter.js      ← XLSX export
├── web/                 ← Vite + React frontend
│   ├── src/
│   │   ├── App.jsx      ← Auth wrapper (login, checkout)
│   │   └── LeadReap.jsx ← Main UI component
│   ├── index.html
│   └── vite.config.js
├── .env.example
├── railway.toml         ← Railway deploy config
└── vercel.json          ← Vercel deploy config
```

## Quick Start (Local Dev)

```bash
# 1. Install backend
cp .env.example .env     # edit with your keys
npm install
npx playwright install chromium --with-deps

# 2. Start backend
npm run dev              # → http://localhost:3001

# 3. Install + start frontend
cd web
npm install
npm run dev              # → http://localhost:5173
```

## Deploy to Production

### Step 1: LemonSqueezy Setup (15 min)

1. Create account at [lemonsqueezy.com](https://lemonsqueezy.com)
2. Create a Store
3. Create 3 Products:
   - **Starter** — $47 one-time
   - **Pro** — $97 one-time
   - **Agency** — $197 one-time
4. For each product, note the **Variant ID** (in product settings)
5. Go to Settings → API → create an API key
6. Go to Settings → Webhooks → create a webhook:
   - URL: `https://YOUR-RAILWAY-URL.railway.app/api/webhook/lemonsqueezy`
   - Events: `order_created`
   - Note the signing secret

### Step 2: Deploy Backend to Railway (10 min)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init           # select "Empty project"
railway up             # deploys from current directory
```

Then in Railway dashboard → Variables, set ALL env vars from `.env.example`.

Note your Railway URL (e.g., `leadreap-api-production.up.railway.app`).

⚠️ **Important:** Railway needs at least the **Starter plan ($5/mo)** for Playwright/Chromium to work (needs ~1GB RAM).

### Step 3: Deploy Frontend to Vercel (5 min)

1. Edit `vercel.json` — replace `YOUR-RAILWAY-URL` with your actual Railway URL
2. Edit `web/src/App.jsx` — or set `VITE_API_URL` env var in Vercel to your Railway URL

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel                 # follow prompts, select web/ as root
```

Or: push to GitHub and connect the repo in Vercel dashboard.

Set environment variable in Vercel:
- `VITE_API_URL` = `https://your-railway-url.railway.app`

### Step 4: Update LemonSqueezy Webhook URL

Go back to LemonSqueezy → Webhooks and update the URL to your production Railway URL.

### Step 5: Set Up Email (Optional but Recommended)

For real magic link emails, sign up for [Resend](https://resend.com) (free: 3k emails/month):

1. Get API key from Resend
2. Add `RESEND_API_KEY` to Railway env vars
3. Uncomment the Resend block in `email.js`
4. Add `FROM_EMAIL` env var (must be from a verified domain in Resend)

Without this, magic link codes are logged to the server console (fine for testing).

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/magic` | Send magic login link |
| POST | `/api/auth/verify` | Verify code → session token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Destroy session |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkout` | Create LemonSqueezy checkout URL |
| POST | `/api/webhook/lemonsqueezy` | Payment webhook (automated) |

### Leads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/leads/search` | Queue a scrape job |
| GET | `/api/leads/job/:id` | Poll for results |
| GET | `/api/leads/export/:id` | Download XLSX (paid only) |
| GET | `/api/leads/jobs` | List recent jobs |

All endpoints accept `Authorization: Bearer <token>` header.

## Rate Limits

| Plan | Searches/day | Leads per search | Export |
|------|-------------|------------------|--------|
| Free | 3 | 20 (show 5) | ❌ |
| Starter | 30 | 60 | ✅ CSV |
| Pro | Unlimited | 60 | ✅ CSV + XLSX |
| Agency | Unlimited | 60 | ✅ Bulk + API |
