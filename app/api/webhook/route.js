import { NextResponse } from "next/server";
import { verifyWebhookEvent } from "@/lib/stripe";
import { generateLyrics, submitSunoGeneration } from "@/lib/music";
import { sendSongReadyEmail } from "@/lib/email";
import { put } from "@vercel/blob";

export const maxDuration = 60;

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    let event;
    try {
      event = await verifyWebhookEvent(body, signature);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata;
      const customerEmail = session.customer_details && session.customer_details.email;
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://tunetots.vercel.app").replace(/\/+$/, "");
      const successPageUrl = appUrl + "/success?session_id=" + session.id;
      const genre = metadata.genre || "pop";
      const mood = metadata.mood || "energetic";

      console.log("Payment received for " + metadata.childName + "!");
      console.log("Genre: " + genre + " | Mood: " + mood);

      try {
        // Step 1: Generate AI lyrics via Claude
        console.log("Step 1: Generating AI lyrics...");
        const lyrics = await generateLyrics(
          metadata.childName, metadata.childAge, metadata.childStory, genre, mood
        );
        console.log("Lyrics generated!");

        // Step 2: Submit Suno generation (don't wait for it)
        console.log("Step 2: Submitting Suno generation...");
        const callbackUrl = appUrl + "/api/suno-callback";
        const taskId = await submitSunoGeneration(lyrics, metadata.childName, genre, mood, callbackUrl);
        console.log("Suno task submitted! ID: " + taskId);

        // Step 3: Save order with "generating" status
        const orderData = {
          sessionId: session.id,
          childName: metadata.childName,
          childAge: metadata.childAge,
          childStory: metadata.childStory,
          genre: genre,
          mood: mood,
          sunoTaskId: taskId,
          songUrl: null,
          lyrics: lyrics,
          customerEmail: customerEmail || "",
          successPageUrl: successPageUrl,
          createdAt: new Date().toISOString(),
          status: "generating",
        };

        await put("orders/" + session.id + ".json", JSON.stringify(orderData), {
          access: "public",
          contentType: "application/json",
        });
        console.log("Order saved with generating status!");
        console.log("Suno will call back when the song is ready.");

      } catch (err) {
        console.error("Pipeline failed:", err.message);
        try {
          await put("orders/" + session.id + ".json", JSON.stringify({
            sessionId: session.id,
            childName: metadata.childName,
            error: err.message,
            status: "failed",
            createdAt: new Date().toISOString(),
          }), { access: "public", contentType: "application/json" });
        } catch (e) {
          console.error("Could not save failed order:", e.message);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
