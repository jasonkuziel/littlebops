import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(request) {
  try {
    var body = await request.json();
    var { childName, age, story, genre, mood } = body;

    if (!childName || !story) {
      return NextResponse.json(
        { error: "Please fill in your child's name and story" },
        { status: 400 }
      );
    }

    var checkoutUrl = await createCheckoutSession({
      childName: childName,
      age: age || "",
      story: story,
      genre: genre || "pop",
      mood: mood || "energetic",
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
