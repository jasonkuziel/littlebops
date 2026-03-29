import Stripe from "stripe";

let _stripe;
function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export async function createCheckoutSession(childData) {
  // Stripe metadata values max 500 chars — truncate story if needed
  let story = childData.story || "";
  if (story.length > 500) {
    story = story.substring(0, 497) + "...";
  }

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "LittleBops — Personalized Song",
            description: "A unique 2-minute " + (childData.genre || "pop") + " song for " + childData.childName,
          },
          unit_amount: 299,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: (process.env.NEXT_PUBLIC_APP_URL || "https://getlittlebops.com").replace(/\/+$/, "") + "/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: (process.env.NEXT_PUBLIC_APP_URL || "https://getlittlebops.com").replace(/\/+$/, "") + "/?canceled=true",
    metadata: {
      childName: childData.childName,
      childAge: childData.age || "",
      childStory: story,
      genre: childData.genre || "pop",
      mood: childData.mood || "energetic",
    },
  });

  return session.url;
}

export async function verifyWebhookEvent(body, signature) {
  return getStripe().webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
