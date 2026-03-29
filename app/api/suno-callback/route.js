import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

export const maxDuration = 60;

/**
 * KIE.ai calls this endpoint when a Suno music generation task completes.
 * We find the matching order, download the audio, save it, and email the customer.
 *
 * Authenticated via a secret token in the callback URL query string.
 */
export async function POST(request) {
  try {
    // Verify callback token
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!process.env.CALLBACK_SECRET || token !== process.env.CALLBACK_SECRET) {
      console.error("Suno callback: invalid or missing token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Suno callback received!");
    console.log("Callback body keys: " + Object.keys(body).join(", "));
    console.log("Callback body: " + JSON.stringify(body).substring(0, 500));
    console.log("Status: " + (body.data && body.data.status));

    const taskData = body.data;
    if (!taskData) {
      console.log("No data in callback body");
      return NextResponse.json({ received: true });
    }

    const taskId = taskData.taskId;
    const status = taskData.status;

    console.log("Task ID: " + taskId + " | Status: " + status);

    // Only process completed tasks
    if (status !== "SUCCESS" && status !== "FIRST_SUCCESS") {
      console.log("Task not complete yet, ignoring callback");
      return NextResponse.json({ received: true });
    }

    // Get the audio URL from the response
    const sunoData = taskData.response && taskData.response.sunoData;
    if (!sunoData || sunoData.length === 0) {
      console.error("No sunoData in callback");
      return NextResponse.json({ received: true });
    }

    const audioUrl = sunoData[0].audioUrl;
    console.log("Audio URL: " + audioUrl);

    // Find the order that matches this task ID
    const { blobs } = await list({ prefix: "orders/" });
    let orderBlob = null;
    let orderData = null;

    for (let i = 0; i < blobs.length; i++) {
      try {
        const res = await fetch(blobs[i].downloadUrl);
        const data = await res.json();
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

    console.log("Found order for " + orderData.childName + "!");

    // Download the audio file
    console.log("Downloading audio...");
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      console.error("Failed to download audio: " + audioResponse.status);
      return NextResponse.json({ received: true });
    }

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    console.log("Audio downloaded! Size: " + (audioBuffer.length / 1024 / 1024).toFixed(1) + "MB");

    // Save to Vercel Blob
    const safeName = orderData.childName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const filename = "songs/" + safeName + "-" + Date.now() + ".mp3";

    const blob = await put(filename, audioBuffer, {
      access: "public",
      contentType: "audio/mpeg",
    });
    console.log("Song saved! URL: " + blob.url);

    // Update order to complete — save with emailSent=true BEFORE sending
    // to prevent check-status from also sending during the race window
    orderData.songUrl = blob.url;
    orderData.status = "complete";
    orderData.completedAt = new Date().toISOString();
    orderData.emailSent = !!orderData.customerEmail;

    await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
      access: "public",
      contentType: "application/json",
    });
    console.log("Order updated to complete!");

    // Now send email
    if (orderData.customerEmail) {
      try {
        const { sendSongReadyEmail } = await import("@/lib/email");
        await sendSongReadyEmail({
          to: orderData.customerEmail,
          childName: orderData.childName,
          songUrl: orderData.songUrl,
          lyrics: orderData.lyrics,
          successPageUrl: orderData.successPageUrl,
        });
        console.log("Email sent to " + orderData.customerEmail);
      } catch (emailErr) {
        // If email fails, reset flag so check-status fallback can retry
        console.error("Email send error:", emailErr.message);
        orderData.emailSent = false;
        await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
          access: "private",
          contentType: "application/json",
        });
      }
    }

    console.log("Pipeline complete for " + orderData.childName + "! 🎵");

  } catch (error) {
    console.error("Suno callback error:", error);
  }

  return NextResponse.json({ received: true });
}
