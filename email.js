// ─────────────────────────────────────────────────────────────
// EMAIL — Send magic login links via Resend
// ─────────────────────────────────────────────────────────────

import { Resend } from "resend";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const FROM_EMAIL = process.env.FROM_EMAIL || "hello@leadreap.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendMagicLinkEmail(email, code) {
  const loginUrl = `${FRONTEND_URL}/login?code=${code}`;

  // Production: send via Resend
  if (resend) {
    try {
      await resend.emails.send({
        from: `LeadReap <${FROM_EMAIL}>`,
        to: email,
        subject: `Your login code: ${code}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <div style="margin-bottom: 32px;">
              <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #111;">Lead</span><span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #f0b429;">Reap</span>
            </div>
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Enter this code to log in to your account:</p>
            <div style="background: #0a0a0b; color: #f0b429; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 24px; border-radius: 12px; margin-bottom: 28px; font-family: 'SF Mono', 'Fira Code', monospace;">
              ${code}
            </div>
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Or log in with one click:</p>
            <a href="${loginUrl}" style="display: inline-block; background: #f0b429; color: #000; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px;">
              Log In to LeadReap →
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 36px; line-height: 1.5;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
      console.log(`[Email] Magic code sent to ${email}`);
      return { sent: true };
    } catch (err) {
      console.error(`[Email] Failed to send to ${email}:`, err.message);
      throw new Error("Failed to send login email — please try again");
    }
  }

  // Fallback: dev mode (no API key set)
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  MAGIC LOGIN (dev mode — no RESEND key)  ║`);
  console.log(`║  To: ${email.padEnd(35)}║`);
  console.log(`║  Code: ${code.padEnd(33)}║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  return { sent: true, dev: true };
}

/**
 * Send a sequence email (cold outreach)
 * Supports {{name}}, {{business}}, {{email}} placeholders in subject/body
 */
export async function sendSequenceEmail({ to, fromName, subject, body, leadData }) {
  // Replace placeholders
  const replacements = {
    "{{name}}": leadData?.name || "",
    "{{business}}": leadData?.name || "",
    "{{email}}": to,
    "{{phone}}": leadData?.phone || "",
    "{{website}}": leadData?.website || "",
    "{{rating}}": leadData?.rating || "",
    "{{city}}": leadData?.address?.split(",").slice(-2, -1)[0]?.trim() || "",
  };

  let finalSubject = subject;
  let finalBody = body;
  for (const [key, val] of Object.entries(replacements)) {
    finalSubject = finalSubject.replaceAll(key, val);
    finalBody = finalBody.replaceAll(key, val);
  }

  // Convert newlines to <br> for HTML
  const htmlBody = finalBody.replace(/\n/g, "<br>");

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: `${fromName || "LeadReap"} <${FROM_EMAIL}>`,
        to,
        subject: finalSubject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; font-size: 15px; line-height: 1.7;">
            ${htmlBody}
          </div>
        `,
      });
      console.log(`[Sequence] Email sent to ${to}: "${finalSubject}"`);
      return { sent: true, id: result?.data?.id };
    } catch (err) {
      console.error(`[Sequence] Failed to send to ${to}:`, err.message);
      throw err;
    }
  }

  // Dev mode
  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  SEQUENCE EMAIL (dev mode)                    ║`);
  console.log(`║  To: ${to.padEnd(39)}║`);
  console.log(`║  Subject: ${finalSubject.slice(0, 34).padEnd(34)}║`);
  console.log(`╚══════════════════════════════════════════════╝\n`);
  return { sent: true, dev: true };
}

/**
 * Send a team invite email
 */
export async function sendTeamInviteEmail(email, teamName, inviteToken) {
  const joinUrl = `${FRONTEND_URL}/join?token=${inviteToken}`;

  if (resend) {
    try {
      await resend.emails.send({
        from: `LeadReap <${FROM_EMAIL}>`,
        to: email,
        subject: `You've been invited to join ${teamName} on LeadReap`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <div style="margin-bottom: 32px;">
              <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #111;">Lead</span><span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #f0b429;">Reap</span>
            </div>
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">You've been invited to join <strong>${teamName}</strong> on LeadReap. As a team member, you'll have access to shared lists and leads.</p>
            <a href="${joinUrl}" style="display: inline-block; background: #f0b429; color: #000; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px;">
              Accept Invite →
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 36px; line-height: 1.5;">This invitation expires in 7 days. If you don't have a LeadReap account yet, you'll be asked to create one first.</p>
          </div>
        `,
      });
      console.log(`[Email] Team invite sent to ${email} for ${teamName}`);
      return { sent: true };
    } catch (err) {
      console.error(`[Email] Team invite failed for ${email}:`, err.message);
      throw err;
    }
  }

  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  TEAM INVITE (dev mode)                       ║`);
  console.log(`║  To: ${email.padEnd(39)}║`);
  console.log(`║  Team: ${teamName.padEnd(37)}║`);
  console.log(`╚══════════════════════════════════════════════╝\n`);
  return { sent: true, dev: true };
}
