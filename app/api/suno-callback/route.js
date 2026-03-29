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

    // KIE.ai callback format can vary — extract fields flexibly
    const taskData = body.data || body;
    const taskId = taskData.taskId || taskData.task_id || body.taskId || body.task_id;
    const status = taskData.status || body.status;

    console.log("Task ID: " + (taskId || "unknown") + " | Status: " + (status || "unknown"));

    if (!taskId) {
      console.log("No taskId in callback, ignoring");
      return NextResponse.json({ received: true });
    }

    // Only process completed tasks
    const successStatuses = ["SUCCESS", "FIRST_SUCCESS", "success", "completed"];
    if (!successStatuses.includes(status)) {
      console.log("Task not complete yet (" + status + "), ignoring callback");
      return NextResponse.json({ received: true });
    }

    // Extract audio URL from various possible response formats
    const resp = taskData.response || body.response;
    let audioUrl = null;
    if (resp) {
      if (resp.sunoData && resp.sunoData.length > 0) {
        audioUrl = resp.sunoData[0].audioUrl || resp.sunoData[0].streamAudioUrl;
      } else if (Array.isArray(resp) && resp.length > 0 && typeof resp[0] === "string") {
        audioUrl = resp[0];
      } else if (typeof resp === "string" && resp.startsWith("http")) {
        audioUrl = resp;
      }
    }
    if (!audioUrl) audioUrl = taskData.audioUrl || body.audioUrl;

    if (!audioUrl) {
      console.error("No audio URL found in callback");
      return NextResponse.json({ received: true });
    }
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

    console.log("Found order for " + orderData.childName + "! Status: " + orderData.status);

    // If check-status already completed the order, just send the email
    if (orderData.status === "complete" || orderData.status === "completing") {
      console.log("Order already " + orderData.status + " (completed by check-status)");
      if (!orderData.emailSent && orderData.customerEmail && process.env.RESEND_API_KEY) {
        try {
          orderData.emailSent = true;
          await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
            access: "public",
            contentType: "application/json",
          });
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
          console.error("Email send error:", emailErr.message);
          orderData.emailSent = false;
          await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
            access: "public",
            contentType: "application/json",
          });
        }
      } else {
        console.log("Email already sent or not needed, skipping");
      }
      return NextResponse.json({ received: true });
    }

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

    // Update order to complete
    orderData.songUrl = blob.url;
    orderData.status = "complete";
    orderData.completedAt = new Date().toISOString();
    orderData.emailSent = !!(orderData.customerEmail && process.env.RESEND_API_KEY);

    await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
      access: "public",
      contentType: "application/json",
    });
    console.log("Order updated to complete!");

    // Send email
    if (orderData.customerEmail && process.env.RESEND_API_KEY) {
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
        console.error("Email send error:", emailErr.message);
        orderData.emailSent = false;
        await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
          access: "public",
          contentType: "application/json",
        });
      }
    }

    console.log("Pipeline complete for " + orderData.childName + "!");

  } catch (error) {
    console.error("Suno callback error:", error);
  }

  return NextResponse.json({ received: true });
}
