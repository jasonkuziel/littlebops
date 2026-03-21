/**
 * pipeline.js — Orchestrates: Payment → Lyrics → Music → Video → YouTube
 */

import { generateLyrics, generateSong } from "./music.js";
import { generateVideo } from "./video.js";
import { uploadToYouTube } from "./youtube.js";

export async function runPipeline(orderData) {
  var { tier, childName, childAge, childStory, photoUrl, sessionId } = orderData;
  console.log("Starting pipeline for " + childName + " (" + tier + ")");

  try {
    // Step 1: Generate lyrics
    console.log("Step 1: Generating lyrics...");
    var lyrics = generateLyrics(childName, childAge, childStory);

    // Step 2: Generate music via ElevenLabs
    console.log("Step 2: Generating song with ElevenLabs...");
    var song = await generateSong(lyrics, childName);

    // Step 3: Generate video (if tier includes it)
    var youtubeResult = null;
    if (tier === "song_video" || tier === "star_bundle") {
      console.log("Step 3: Generating video...");
      var videoResult = await generateVideo(photoUrl, null, childName, childStory);

      // Step 4: Upload to YouTube
      console.log("Step 4: Uploading to YouTube...");
      // In production, you'd combine video clips + audio first using FFmpeg or Shotstack
      // For now, we upload the first video clip
      if (videoResult.clips && videoResult.clips[0]) {
        var videoResponse = await fetch(videoResult.clips[0]);
        var videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        var { Readable } = await import("stream");
        var videoStream = Readable.from(videoBuffer);

        youtubeResult = await uploadToYouTube(videoStream, { childName: childName });
        console.log("Uploaded to YouTube: " + youtubeResult.videoUrl);
      }
    }

    var result = {
      sessionId: sessionId,
      childName: childName,
      status: "complete",
      lyrics: lyrics,
      youtubeUrl: youtubeResult ? youtubeResult.videoUrl : null,
      youtubeEmbed: youtubeResult ? youtubeResult.embedUrl : null,
      completedAt: new Date().toISOString(),
    };

    console.log("Pipeline complete for " + childName + "!");
    return result;

  } catch (error) {
    console.error("Pipeline failed for " + childName + ":", error);
    throw error;
  }
}
