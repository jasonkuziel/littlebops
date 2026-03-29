import { NextResponse } from "next/server";
import { generateLyrics, submitSunoGeneration } from "@/lib/music";
import { put } from "@vercel/blob";

export const maxDuration = 60;

/**
 * Generate a free song — protected by PROMO_SECRET.
 * Used for giveaways and promos without going through Stripe.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { childName, age, story, genre, mood, key } = body;

    // Verify promo key
    if (!process.env.PROMO_SECRET || key !== process.env.PROMO_SECRET) {
      return NextResponse.json({ error: "Invalid promo key" }, { status: 401 });
    }

    if (!childName || !story) {
      return NextResponse.json({ error: "Name and story are required" }, { status: 400 });
    }

    const validGenres = ["pop", "lullaby", "rock", "country", "hiphop", "reggae"];
    const validMoods = ["energetic", "calming", "silly", "adventurous", "sweet"];

    const safeName = String(childName).trim().substring(0, 100);
    const safeStory = String(story).trim().substring(0, 2000);
    const safeAge = age ? String(age).trim().substring(0, 10) : "";
    const safeGenre = validGenres.includes(genre) ? genre : "pop";
    const safeMood = validMoods.includes(mood) ? mood : "energetic";

    // Generate a unique session ID for this free order
    const sessionId = "free_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://getlittlebops.com").replace(/\/+$/, "");

    console.log("Free song for " + safeName + "!");
    console.log("Genre: " + safeGenre + " | Mood: " + safeMood);

    // Step 1: Generate lyrics
    console.log("Step 1: Generating AI lyrics...");
    const lyrics = await generateLyrics(safeName, safeAge, safeStory, safeGenre, safeMood);
    console.log("Lyrics generated!");

    // Step 2: Submit Suno generation
    console.log("Step 2: Submitting Suno generation...");
    const callbackUrl = appUrl + "/api/suno-callback?token=" + encodeURIComponent(process.env.CALLBACK_SECRET || "");
    const taskId = await submitSunoGeneration(lyrics, safeName, safeGenre, safeMood, callbackUrl);
    console.log("Suno task submitted! ID: " + taskId);

    // Step 3: Save order
    const orderData = {
      sessionId: sessionId,
      childName: safeName,
      childAge: safeAge,
      childStory: safeStory,
      genre: safeGenre,
      mood: safeMood,
      sunoTaskId: taskId,
      songUrl: null,
      lyrics: lyrics,
      customerEmail: "",
      successPageUrl: appUrl + "/success?session_id=" + sessionId,
      createdAt: new Date().toISOString(),
      status: "generating",
      freeOrder: true,
    };

    await put("orders/" + sessionId + ".json", JSON.stringify(orderData), {
      access: "public",
      contentType: "application/json",
    });
    console.log("Free order saved!");

    return NextResponse.json({
      url: appUrl + "/success?session_id=" + sessionId,
    });
  } catch (error) {
    console.error("Free song error:", error);
    return NextResponse.json({ error: "Failed to generate song" }, { status: 500 });
  }
}
