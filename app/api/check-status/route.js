import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

export async function GET(request) {
  var url = new URL(request.url);
  var sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    var { blobs } = await list({ prefix: "orders/" });

    var orderBlob = null;
    for (var i = 0; i < blobs.length; i++) {
      if (blobs[i].pathname.includes(sessionId)) {
        orderBlob = blobs[i];
        break;
      }
    }

    if (!orderBlob) {
      return NextResponse.json({ status: "processing" });
    }

    var orderResponse = await fetch(orderBlob.url);
    var text = (await orderResponse.text()).trim();

    if (!text.startsWith("{")) {
      return NextResponse.json({ status: "processing" });
    }

    var orderData = JSON.parse(text);

    // Already done — return immediately
    if (orderData.status === "complete") {
      return NextResponse.json(orderData);
    }

    if (orderData.status === "failed") {
      return NextResponse.json(orderData);
    }

    // Another poll is already handling this — back off
    if (orderData.status === "completing") {
      return NextResponse.json({ status: "processing", childName: orderData.childName });
    }

    if (orderData.status === "generating" && orderData.sunoTaskId) {
      try {
        var kieResponse = await fetch(
          "https://api.kie.ai/api/v1/generate/record-info?taskId=" + orderData.sunoTaskId,
          { headers: { "Authorization": "Bearer " + process.env.KIE_API_KEY } }
        );

        var kieText = (await kieResponse.text()).trim();

        if (kieText.startsWith("{")) {
          var kieData = JSON.parse(kieText);

          if (kieData.code === 200 && kieData.data) {
            var taskStatus = kieData.data.status;
            var resp = kieData.data.response;
            var audioUrl = null;

            if (resp) {
              if (resp.sunoData && resp.sunoData.length > 0) {
                audioUrl = resp.sunoData[0].audioUrl || resp.sunoData[0].streamAudioUrl || null;
              }
              if (!audioUrl && Array.isArray(resp) && resp.length > 0) {
                audioUrl = resp[0];
              }
              if (!audioUrl && typeof resp === "string" && resp.startsWith("http")) {
                audioUrl = resp;
              }
            }
            if (!audioUrl && kieData.data.audioUrl) {
              audioUrl = kieData.data.audioUrl;
            }

            if (audioUrl && audioUrl.startsWith("http")) {
              // LOCK immediately — prevents other polls from starting
              orderData.status = "completing";
              await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
                access: "public",
                contentType: "application/json",
              });

              // Download the audio
              var audioResp = await fetch(audioUrl);

              if (audioResp.ok) {
                var audioBuffer = Buffer.from(await audioResp.arrayBuffer());

                // If file is empty or too small, reset and retry next poll
                if (audioBuffer.length < 10000) {
                  orderData.status = "generating";
                  await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
                    access: "public", contentType: "application/json",
                  });
                  return NextResponse.json({ status: "processing", childName: orderData.childName });
                }

                // Save song to blob storage
                var safeName = orderData.childName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
                var blob = await put("songs/" + safeName + "-" + Date.now() + ".mp3", audioBuffer, {
                  access: "public",
                  contentType: "audio/mpeg",
                });

                // Mark complete with emailSent=false FIRST, save immediately
                orderData.songUrl = blob.url;
                orderData.status = "complete";
                orderData.completedAt = new Date().toISOString();
                orderData.emailSent = false;

                await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
                  access: "public",
                  contentType: "application/json",
                });

                // Now re-read the order to check if another poll already sent email
                try {
                  var { blobs: checkBlobs } = await list({ prefix: "orders/" });
                  for (var j = 0; j < checkBlobs.length; j++) {
                    if (checkBlobs[j].pathname.includes(sessionId)) {
                      var checkResp = await fetch(checkBlobs[j].url);
                      var checkText = (await checkResp.text()).trim();
                      if (checkText.startsWith("{")) {
                        var checkOrder = JSON.parse(checkText);
                        if (checkOrder.emailSent) {
                          return NextResponse.json(orderData);
                        }
                      }
                      break;
                    }
                  }
                } catch (e) {
                  console.error("Email dedup check failed:", e.message);
                }

                // Send email exactly once
                if (orderData.customerEmail) {
                  try {
                    var { sendSongReadyEmail } = await import("@/lib/email");
                    await sendSongReadyEmail({
                      to: orderData.customerEmail,
                      childName: orderData.childName,
                      songUrl: blob.url,
                      lyrics: orderData.lyrics,
                      successPageUrl: orderData.successPageUrl,
                    });

                    // Save emailSent flag immediately
                    orderData.emailSent = true;
                    await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
                      access: "public",
                      contentType: "application/json",
                    });
                  } catch (e) {
                    console.error("Email err:", e.message);
                  }
                }

                return NextResponse.json(orderData);
              } else {
                // Download failed — reset to generating
                console.error("Audio download failed: " + audioResp.status);
                orderData.status = "generating";
                await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
                  access: "public", contentType: "application/json",
                });
              }
            }

            if (taskStatus === "CREATE_TASK_FAILED" || taskStatus === "GENERATE_AUDIO_FAILED" || taskStatus === "SENSITIVE_WORD_ERROR") {
              orderData.status = "failed";
              await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
                access: "public", contentType: "application/json",
              });
              return NextResponse.json(orderData);
            }
          }
        }
      } catch (pollErr) {
        console.error("Poll err:", pollErr.message);
        // Reset lock so next poll can retry
        try {
          orderData.status = "generating";
          await put("orders/" + orderData.sessionId + ".json", JSON.stringify(orderData), {
            access: "public", contentType: "application/json",
          });
        } catch (e) {
          console.error("Failed to reset order lock:", e.message);
        }
      }
    }

    return NextResponse.json({ status: "processing", childName: orderData.childName });
  } catch (error) {
    console.error("Check err:", error.message);
    return NextResponse.json({ status: "processing" });
  }
}
