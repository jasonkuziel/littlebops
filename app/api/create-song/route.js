import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(request) {
  try {
    const body = await request.json();
    const { childName, age, story, genre, mood } = body;

    if (!childName || !story) {
      return NextResponse.json(
        { error: "Please fill in your child's name and story" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const validGenres = ["pop", "lullaby", "rock", "country", "hiphop", "reggae"];
    const validMoods = ["energetic", "calming", "silly", "adventurous", "sweet"];

    const sanitized = {
      childName: String(childName).trim().substring(0, 100),
      age: age ? String(age).trim().substring(0, 10) : "",
      story: String(story).trim().substring(0, 2000),
      genre: validGenres.includes(genre) ? genre : "pop",
      mood: validMoods.includes(mood) ? mood : "energetic",
    };

    const checkoutUrl = await createCheckoutSession(sanitized);

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
