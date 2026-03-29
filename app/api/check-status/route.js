import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

export const maxDuration = 60;

export async function GET(request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const orderData = await findOrder(sessionId);

    if (!orderData) {
      return NextResponse.json({ status: "processing" });
    }

    if (orderData.status === "complete" || orderData.status === "failed") {
      return NextResponse.json(orderData);
    }

    if (orderData.status === "completing") {
      return NextResponse.json({ status: "processing", childName: orderData.childName });
    }

    if (orderData.status === "generating" && orderData.sunoTaskId) {
      return await handleGeneratingOrder(orderData, sessionId);
    }

    return NextResponse.json({ status: "processing", childName: orderData.childName });
  } catch (error) {
    console.error("Check err:", error.message);
    return NextResponse.json({ status: "processing" });
  }
}

async function findOrder(sessionId) {
  // Sanitize sessionId to prevent path traversal
  const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) return null;

  try {
    // Use targeted prefix to find the specific order blob
    const { blobs } = await list({ prefix: "orders/" + safeId });
    if (blobs.length === 0) return null;

    const response = await fetch(blobs[0].downloadUrl);
    const text = await response.text();
    if (text.startsWith("{")) {
      return JSON.parse(text);
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function saveOrder(orderData) {
  await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
    access: "public",
    contentType: "application/json",
  });
}

async function pollKieStatus(taskId) {
  const response = await fetch(
    "https://api.kie.ai/api/v1/generate/record-info?taskId=" + taskId,
    { headers: { "Authorization": "Bearer " + process.env.KIE_API_KEY } }
  );

  const text = await response.text();
  if (!text.startsWith("{")) return null;

  const data = JSON.parse(text);
  if (data.code !== 200 || !data.data) return null;

  return data.data;
}

function extractAudioUrl(kieData) {
  const resp = kieData.response;

  if (resp) {
    if (resp.sunoData && resp.sunoData.length > 0) {
      const url = resp.sunoData[0].audioUrl || resp.sunoData[0].streamAudioUrl;
      if (url) return url;
    }
    if (Array.isArray(resp) && resp.length > 0 && typeof resp[0] === "string" && resp[0].startsWith("http")) {
      return resp[0];
    }
    if (typeof resp === "string" && resp.startsWith("http")) {
      return resp;
    }
  }

  if (kieData.audioUrl) return kieData.audioUrl;

  return null;
}

async function downloadAndSaveAudio(audioUrl, childName) {
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) return null;

  const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
  console.log("Downloaded: " + (audioBuffer.length / 1024 / 1024).toFixed(1) + "MB");

  if (audioBuffer.length < 10000) {
    console.log("Audio too small (" + audioBuffer.length + " bytes), retrying next poll");
    return null;
  }

  const safeName = childName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const blob = await put("songs/" + safeName + "-" + Date.now() + ".mp3", audioBuffer, {
    access: "public",
    contentType: "audio/mpeg",
  });

  return blob.url;
}

const FAILED_STATUSES = ["CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "SENSITIVE_WORD_ERROR"];

async function handleGeneratingOrder(orderData, sessionId) {
  try {
    const kieData = await pollKieStatus(orderData.sunoTaskId);
    if (!kieData) {
      return NextResponse.json({ status: "processing", childName: orderData.childName });
    }

    const audioUrl = extractAudioUrl(kieData);

    if (audioUrl && audioUrl.startsWith("http")) {
      // Re-read order to check if another poll already handled this
      const freshOrder = await findOrder(sessionId);
      if (freshOrder && freshOrder.status === "complete") {
        return NextResponse.json(freshOrder);
      }
      if (freshOrder && freshOrder.status !== "generating") {
        return NextResponse.json({ status: "processing", childName: orderData.childName });
      }

      // Lock to prevent duplicate processing
      orderData.status = "completing";
      await saveOrder(orderData);
      console.log("Locked order as completing");

      console.log("Downloading: " + audioUrl);
      const songUrl = await downloadAndSaveAudio(audioUrl, orderData.childName);

      if (!songUrl) {
        // Download failed or too small — reset for retry
        orderData.status = "generating";
        await saveOrder(orderData);
        return NextResponse.json({ status: "processing", childName: orderData.childName });
      }

      orderData.songUrl = songUrl;
      orderData.status = "complete";
      orderData.completedAt = new Date().toISOString();
      await saveOrder(orderData);
      console.log("DONE! " + songUrl);

      // Email is sent by suno-callback only (single source of truth)
      return NextResponse.json(orderData);
    }

    if (FAILED_STATUSES.includes(kieData.status)) {
      orderData.status = "failed";
      await saveOrder(orderData);
      return NextResponse.json(orderData);
    }

    return NextResponse.json({ status: "processing", childName: orderData.childName });
  } catch (pollErr) {
    console.error("Poll err:", pollErr.message);
    try {
      orderData.status = "generating";
      await saveOrder(orderData);
    } catch (e) {}
    return NextResponse.json({ status: "processing", childName: orderData.childName });
  }
}
