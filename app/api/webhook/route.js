import { NextResponse } from "next/server";
import { verifyWebhookEvent } from "@/lib/stripe";
import { generateLyrics, submitSunoGeneration } from "@/lib/music";
import { sendSongReadyEmail } from "@/lib/email";
import { put } from "@vercel/blob";

export const maxDuration = 60;

export async function POST(request) {
  try {
    var body = await request.text();
    var signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    var event;
    try {
      event = await verifyWebhookEvent(body, signature);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      var session = event.data.object;
      var metadata = session.metadata || {};
      var customerEmail = session.customer_details && session.customer_details.email;
      var appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://tunetots.vercel.app").replace(/\/+$/, "");
      var successPageUrl = appUrl + "/success?session_id=" + session.id;
      var genre = metadata.genre || "pop";
      var mood = metadata.mood || "energetic";

      if (!metadata.childName) {
        console.error("Missing childName in session metadata for session: " + session.id);
        return NextResponse.json({ error: "Missing childName" }, { status: 400 });
      }

      try {
        // Step 1: Generate AI lyrics via Claude
        var lyrics = await generateLyrics(
          metadata.childName, metadata.childAge, metadata.childStory, genre, mood
        );
        // Step 2: Submit Suno generation (don't wait for it)
        var callbackUrl = appUrl + "/api/suno-callback";
        var taskId = await submitSunoGeneration(lyrics, metadata.childName, genre, mood, callbackUrl);
        // Step 3: Save order with "generating" status
        var orderData = {
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
