/**
 * video.js — AI Video Generation using Replicate
 * Uses Replicate's webhook feature so we don't have to wait.
 */

export async function startVideoGeneration(options) {
  const { childName, story, orderId, webhookUrl } = options;

  const scene = generateScenePrompt(childName, story);

  console.log("Starting video generation for " + childName + "...");
  console.log("Scene: " + scene);
  console.log("Webhook URL: " + webhookUrl);

  // For official models on Replicate, use the /models/ endpoint
  // instead of /predictions with a version hash
  const response = await fetch("https://api.replicate.com/v1/models/minimax/video-01/predictions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.REPLICATE_API_TOKEN,
      "Content-Type": "application/json",
      "Prefer": "respond-async",
    },
    body: JSON.stringify({
      input: {
        prompt: scene,
      },
      webhook: webhookUrl + (webhookUrl.includes("?") ? "&" : "?") + "token=" + encodeURIComponent(process.env.CALLBACK_SECRET || ""),
      webhook_events_filter: ["completed"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Replicate API error: " + response.status + " - " + errorText);
  }

  const prediction = await response.json();
  console.log("Video generation started! Prediction ID: " + prediction.id);

  return {
    predictionId: prediction.id,
    status: prediction.status,
  };
}

export function generateScenePrompt(childName, story) {
  let baseScene = "A cute colorful animated children's music video scene. " +
    "Bright cheerful cartoon style similar to a kids TV show. " +
    "A happy cartoon child character dancing and singing in a magical colorful world " +
    "with musical notes floating around, rainbows, and sparkles. " +
    "Fun playful animation, vibrant colors, smooth motion.";

  if (story) {
    const lower = story.toLowerCase();
    if (lower.includes("dinosaur")) {
      baseScene += " Friendly colorful dinosaurs playing in the background.";
    }
    if (lower.includes("space") || lower.includes("rocket") || lower.includes("star")) {
      baseScene += " Colorful outer space background with friendly planets and shooting stars.";
    }
    if (lower.includes("ocean") || lower.includes("swim") || lower.includes("fish")) {
      baseScene += " Underwater scene with friendly colorful fish and coral reefs.";
    }
    if (lower.includes("princess") || lower.includes("castle")) {
      baseScene += " A sparkling fairy-tale castle in the background with magical elements.";
    }
    if (lower.includes("animal") || lower.includes("dog") || lower.includes("cat")) {
      baseScene += " Cute friendly cartoon animals dancing alongside the child.";
    }
    if (lower.includes("rainbow") || lower.includes("paint") || lower.includes("color")) {
      baseScene += " Rainbows and splashes of paint creating a colorful art wonderland.";
    }
  }

  return baseScene;
}
