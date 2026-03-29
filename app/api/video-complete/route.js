import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

export const maxDuration = 60;

/**
 * Replicate calls this endpoint when video generation is complete.
 * We save the video to Blob storage and update the order.
 *
 * Authenticated via a secret token in the webhook URL query string.
 */
export async function POST(request) {
  try {
    // Verify callback token
    var reqUrl = new URL(request.url);
    var token = reqUrl.searchParams.get("token");
    if (!process.env.CALLBACK_SECRET || token !== process.env.CALLBACK_SECRET) {
      console.error("Video webhook: invalid or missing token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    var body = await request.json();

    console.log("Replicate webhook received! Status: " + body.status);

    if (body.status !== "succeeded") {
      console.error("Video generation failed:", body.error || "Unknown error");
      return NextResponse.json({ received: true });
    }

    // Get the video URL from Replicate's response
    var videoUrl = body.output;
    if (Array.isArray(videoUrl)) {
      videoUrl = videoUrl[0];
    }

    if (!videoUrl) {
      console.error("No video URL in Replicate response");
      return NextResponse.json({ received: true });
    }

    console.log("Video generated! Replicate URL: " + videoUrl);

    // The prediction ID is in the body
    var predictionId = body.id;

    // Find the order that has this prediction ID
    var { blobs } = await list({ prefix: "orders/" });
    var orderBlob = null;
    var orderData = null;

    for (var i = 0; i < blobs.length; i++) {
      try {
        var res = await fetch(blobs[i].downloadUrl);
        var data = await res.json();
        if (data.videoPredictionId === predictionId) {
          orderBlob = blobs[i];
          orderData = data;
          break;
        }
      } catch (e) {
        // Skip invalid entries
      }
    }

    if (!orderData) {
      console.error("Could not find order for prediction: " + predictionId);
      return NextResponse.json({ received: true });
    }

    console.log("Found order for " + orderData.childName + "! Saving video...");

    // Download the video from Replicate and save to our Blob storage
    var videoResponse = await fetch(videoUrl);
    var videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    var safeName = orderData.childName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    var videoFilename = "videos/" + safeName + "-" + Date.now() + ".mp4";

    var blob = await put(videoFilename, videoBuffer, {
      access: "public",
      contentType: "video/mp4",
    });

    console.log("Video saved! URL: " + blob.url);

    // Update the order with the video URL
    orderData.videoUrl = blob.url;
    orderData.videoStatus = "complete";

    await put(orderBlob.pathname, JSON.stringify(orderData), {
      access: "private",
      contentType: "application/json",
    });

    console.log("Order updated with video for " + orderData.childName + "!");

  } catch (error) {
    console.error("Video webhook error:", error);
  }

  return NextResponse.json({ received: true });
}
