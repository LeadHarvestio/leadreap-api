// ─────────────────────────────────────────────────────────────
// PAYMENTS — LemonSqueezy integration
// Creates checkout URLs and handles webhooks to activate licenses.
// ─────────────────────────────────────────────────────────────

import { createHmac } from "crypto";
import { activateLicense } from "./auth.js";

const LEMON_API = "https://api.lemonsqueezy.com/v1";

const PLAN_VARIANTS = {
  starter: process.env.LEMON_VARIANT_STARTER,
  pro:     process.env.LEMON_VARIANT_PRO,
  agency:  process.env.LEMON_VARIANT_AGENCY,
};

// ─────────────────────────────────────────────────────────────
// CREATE CHECKOUT
// Generates a LemonSqueezy checkout URL for a given plan.
// The user is redirected here to complete payment.
// ─────────────────────────────────────────────────────────────
export async function createCheckout(plan, email) {
  const variantId = PLAN_VARIANTS[plan];
  if (!variantId || variantId === "000000") {
    throw new Error(`No LemonSqueezy variant configured for plan: ${plan}`);
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!apiKey || !storeId) {
    throw new Error("LemonSqueezy API key or store ID not configured");
  }

  const res = await fetch(`${LEMON_API}/checkouts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: email,
            custom: {
              user_email: email,  // passed through to webhook
            },
          },
          product_options: {
            redirect_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/success?plan=${plan}`,
            receipt_button_text: "Go to LeadReap →",
            receipt_thank_you_note: "Your LeadReap license is now active! Head back to the app to start scraping.",
          },
          checkout_options: {
            dark: true,
            logo: true,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[Payments] LemonSqueezy checkout error:", err);
    throw new Error("Failed to create checkout session");
  }

  const data = await res.json();
  return {
    checkoutUrl: data.data.attributes.url,
    checkoutId: data.data.id,
  };
}

// ─────────────────────────────────────────────────────────────
// WEBHOOK HANDLER
// LemonSqueezy sends a POST to /api/webhook/lemonsqueezy
// on order_created. We verify the signature, then activate
// the user's license.
// ─────────────────────────────────────────────────────────────
export function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[Payments] No webhook secret configured — skipping verification");
    return true; // allow in dev, but log warning
  }

  const hmac = createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  return digest === signatureHeader;
}

export function handleWebhookEvent(event) {
  const eventName = event.meta?.event_name;
  console.log(`[Payments] Webhook received: ${eventName}`);

  if (eventName === "order_created") {
    const attrs = event.data?.attributes;
    const email =
      event.meta?.custom_data?.user_email ||
      attrs?.user_email ||
      attrs?.customer_email ||
      null;

    if (!email) {
      console.error("[Payments] No email found in webhook payload");
      return { success: false, error: "No email in payload" };
    }

    // Determine plan from variant ID
    const variantId = String(attrs?.first_order_item?.variant_id || attrs?.variant_id || "");
    let plan = "pro"; // default
    if (variantId === PLAN_VARIANTS.starter) plan = "starter";
    else if (variantId === PLAN_VARIANTS.pro) plan = "pro";
    else if (variantId === PLAN_VARIANTS.agency) plan = "agency";

    const customerId = String(event.data?.id || "");
    const orderId = String(attrs?.order_number || attrs?.identifier || "");

    // Activate the license in our DB
    activateLicense(email, plan, customerId, orderId);

    console.log(`[Payments] ✅ Activated ${plan} for ${email} (order: ${orderId})`);
    return { success: true, plan, email };
  }

  // We only care about order_created for now
  return { success: true, ignored: true };
}
