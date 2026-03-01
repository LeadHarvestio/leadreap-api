// ─────────────────────────────────────────────────────────────
// EMAIL — Send magic login links
// Uses console.log in dev. Swap for Resend/SendGrid in prod.
// ─────────────────────────────────────────────────────────────

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const FROM_EMAIL = process.env.FROM_EMAIL || "hello@leadreap.com";

/**
 * Send a magic login link to the user.
 * In production, replace the console block with a real email service.
 */
export async function sendMagicLinkEmail(email, code) {
  const loginUrl = `${FRONTEND_URL}/login?code=${code}`;

  // ─── PRODUCTION: Uncomment one of these ───────────────
  // await sendWithResend(email, code, loginUrl);
  // await sendWithSendGrid(email, code, loginUrl);

  // ─── DEV MODE: Log to console ─────────────────────────
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  🔗 MAGIC LOGIN LINK                     ║`);
  console.log(`║  To: ${email.padEnd(35)}║`);
  console.log(`║  Code: ${code.padEnd(33)}║`);
  console.log(`║  URL: ${loginUrl.slice(0, 34).padEnd(34)}║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  return { sent: true, dev: true };
}

// ─────────────────────────────────────────────────────────────
// RESEND (recommended — free tier: 3k emails/month)
// npm install resend
// Set RESEND_API_KEY in .env
// ─────────────────────────────────────────────────────────────
/*
async function sendWithResend(email, code, loginUrl) {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Your LeadReap login code: ${code}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #f0b429; margin-bottom: 8px;">🎯 LeadReap</h2>
        <p style="color: #666; margin-bottom: 24px;">Here's your login code:</p>
        <div style="background: #111; color: #f0b429; font-size: 32px; font-weight: bold; letter-spacing: 4px; text-align: center; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          ${code}
        </div>
        <p style="color: #666; margin-bottom: 24px;">Or click this button to log in instantly:</p>
        <a href="${loginUrl}" style="display: inline-block; background: #f0b429; color: #000; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
          Log In to LeadReap →
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}
*/

// ─────────────────────────────────────────────────────────────
// SENDGRID (alternative)
// npm install @sendgrid/mail
// Set SENDGRID_API_KEY in .env
// ─────────────────────────────────────────────────────────────
/*
async function sendWithSendGrid(email, code, loginUrl) {
  const sgMail = (await import("@sendgrid/mail")).default;
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  await sgMail.send({
    to: email,
    from: FROM_EMAIL,
    subject: `Your LeadReap login code: ${code}`,
    html: `<p>Your code: <strong>${code}</strong></p><p><a href="${loginUrl}">Click here to log in</a></p>`,
  });
}
*/
