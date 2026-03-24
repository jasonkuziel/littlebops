import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { sendSongReadyEmail } from "@/lib/email";

export const maxDuration = 60;

/**
 * KIE.ai calls this endpoint when a Suno music generation task completes.
 * We find the matching order, download the audio, save it, and email the customer.
 */
export async function POST(request) {
  try {
    var body = await request.json();

    var taskData = body.data;
    if (!taskData) {
      return NextResponse.json({ received: true });
    }

    var taskId = taskData.taskId;
    var status = taskData.status;


    // Only process completed tasks
    if (status !== "SUCCESS" && status !== "FIRST_SUCCESS") {
      return NextResponse.json({ received: true });
    }

    // Get the audio URL from the response
    var sunoData = taskData.response && taskData.response.sunoData;
    if (!sunoData || sunoData.length === 0) {
      console.error("No sunoData in callback");
      return NextResponse.json({ received: true });
    }

    var audioUrl = sunoData[0].audioUrl;

    // Find the order that matches this task ID
    var { blobs } = await list({ prefix: "orders/" });
    var orderBlob = null;
    var orderData = null;

    for (var i = 0; i < blobs.length; i++) {
      try {
        var res = await fetch(blobs[i].url);
        var data = await res.json();
        if (data.sunoTaskId === taskId) {
          orderBlob = blobs[i];
          orderData = data;
          break;
        }
      } catch (e) {
        // Skip invalid entries
      }
    }

    if (!orderData) {
      console.error("Could not find order for task: " + taskId);
      return NextResponse.json({ received: true });
    }


    // Download the audio file
    var audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      console.error("Failed to download audio: " + audioResponse.status);
      return NextResponse.json({ received: true });
    }

    var audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    // Save to Vercel Blob
    var safeName = orderData.childName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    var filename = "songs/" + safeName + "-" + Date.now() + ".mp3";

    var blob = await put(filename, audioBuffer, {
      access: "public",
      contentType: "audio/mpeg",
    });

    // Update order to complete
    orderData.songUrl = blob.url;
    orderData.status = "complete";
    orderData.completedAt = new Date().toISOString();

    await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
      access: "public",
      contentType: "application/json",
    });

    // Send email
    if (orderData.customerEmail) {
      try {
        await sendSongReadyEmail({
          to: orderData.customerEmail,
          childName: orderData.childName,
          songUrl: blob.url,
          lyrics: orderData.lyrics,
          successPageUrl: orderData.successPageUrl,
        });
      } catch (emailError) {
        console.error("Email failed (non-critical):", emailError.message);
      }
    }


  } catch (error) {
    console.error("Suno callback error:", error);
  }

  return NextResponse.json({ received: true });
}
