// ─────────────────────────────────────────────────────────────
// LeadReap Payments — Stripe Integration
// One-time payments via Stripe Checkout
// ─────────────────────────────────────────────────────────────

import Stripe from "stripe";
import { upgradeUser } from "./auth.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ─────────────────────────────────────────────────────────────
// PLAN CONFIG — maps plan names to Stripe product IDs + prices
// ─────────────────────────────────────────────────────────────
const PLANS = {
  starter: {
    productId: process.env.STRIPE_PRODUCT_STARTER || "prod_U4kYWh7G59zknT",
    amount: 4700, // $47.00 in cents
    name: "LeadReap Starter",
  },
  pro: {
    productId: process.env.STRIPE_PRODUCT_PRO || "prod_U4kcR4aYnop2pB",
    amount: 9700, // $97.00 in cents
    name: "LeadReap Pro",
  },
  agency: {
    productId: process.env.STRIPE_PRODUCT_AGENCY || "prod_U4kcUrer7izt17",
    amount: 19700, // $197.00 in cents
    name: "LeadReap Agency",
  },
};

// ─────────────────────────────────────────────────────────────
// CREATE CHECKOUT — generates a Stripe Checkout Session URL
// ─────────────────────────────────────────────────────────────
export async function createCheckout(plan, email) {
  const planConfig = PLANS[plan];
  if (!planConfig) throw new Error(`Unknown plan: ${plan}`);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product: planConfig.productId,
          unit_amount: planConfig.amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      plan,
      email,
    },
    success_url: `${FRONTEND_URL}/?upgraded=${plan}`,
    cancel_url: `${FRONTEND_URL}/?canceled=true`,
  });

  console.log(`[Payments] Checkout created: ${plan} for ${email} → ${session.id}`);
  return { checkoutUrl: session.url };
}

// ─────────────────────────────────────────────────────────────
// VERIFY WEBHOOK — validates Stripe webhook signature
// ─────────────────────────────────────────────────────────────
export function constructWebhookEvent(rawBody, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Payments] STRIPE_WEBHOOK_SECRET not set");
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[Payments] Webhook signature verification failed:", err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// HANDLE WEBHOOK EVENT — process completed checkout
// ─────────────────────────────────────────────────────────────
export function handleWebhookEvent(event) {
  import { processWebhookEvent, upgradeUserFromStripe, handleRefund } from "./auth.js";

export function handleWebhookEvent(event) {
  // 1. Idempotency Check to ignore duplicate webhooks
  if (processWebhookEvent(event.id)) {
    console.log(`[Stripe] Skipping duplicate event: ${event.id}`);
    return { received: true, duplicate: true };
  }

  console.log(`[Stripe] Processing new event: ${event.type}`);

  try {
    switch (event.type) {
      // ── Happy Path: Initial One-Time Purchase ──
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.payment_status === "paid") {
          const email = session.customer_details?.email || session.customer_email;
          const plan = session.metadata?.plan || "pro"; 
          const customerId = session.customer;

          if (email) {
            upgradeUserFromStripe(email, plan, customerId);
            console.log(`[Stripe] Upgraded ${email} to ${plan}`);
          }
        }
        break;
      }

      // ── Unhappy Path: Refund or Chargeback ──
      case "charge.refunded":
      case "charge.dispute.created": {
        const charge = event.data.object;
        const email = charge.billing_details?.email || charge.receipt_email;
        
        if (email) {
          handleRefund(email);
          console.log(`[Stripe] Access revoked for ${email} due to refund/dispute`);
        }
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Stripe] Error handling ${event.type}:`, err.message);
    throw err; // Throwing ensures Stripe retries if there was a server error
  }

  return { received: true };
}
