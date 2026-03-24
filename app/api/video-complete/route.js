import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

/**
 * Replicate calls this endpoint when video generation is complete.
 * We save the video to Blob storage and update the order.
 */
export async function POST(request) {
  try {
    var body = await request.json();


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


    // The prediction ID is in the body
    var predictionId = body.id;

    // Find the order that has this prediction ID
    var { blobs } = await list({ prefix: "orders/" });
    var orderBlob = null;
    var orderData = null;

    for (var i = 0; i < blobs.length; i++) {
      try {
        var res = await fetch(blobs[i].url);
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


    // Download the video from Replicate and save to our Blob storage
    var videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      console.error("Failed to download video: " + videoResponse.status);
      return NextResponse.json({ received: true });
    }
    var videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    var safeName = orderData.childName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    var videoFilename = "videos/" + safeName + "-" + Date.now() + ".mp4";

    var blob = await put(videoFilename, videoBuffer, {
      access: "public",
      contentType: "video/mp4",
    });


    // Update the order with the video URL
    orderData.videoUrl = blob.url;
    orderData.videoStatus = "complete";

    await put(orderBlob.pathname, JSON.stringify(orderData), {
      access: "public",
      contentType: "application/json",
    });


  } catch (error) {
    console.error("Video webhook error:", error);
  }

  return NextResponse.json({ received: true });
}
