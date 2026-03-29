/**
 * youtube.js — YouTube Video Upload via YouTube Data API v3
 */

import { google } from "googleapis";

function getYouTubeClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return google.youtube({ version: "v3", auth: oauth2Client });
}

export async function uploadToYouTube(videoStream, options) {
  const youtube = getYouTubeClient();

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: options.title || (options.childName + "'s Special Song | LittleBops"),
        description:
          "A personalized song made just for " + options.childName + "!\n\n" +
          "Created with love by LittleBops\n" +
          "Create yours at https://getlittlebops.com\n\n" +
          "#LittleBops #PersonalizedSong #KidsMusic",
        tags: ["LittleBops", "kids music", "personalized song", options.childName],
        categoryId: "10",
      },
      status: {
        privacyStatus: "unlisted",
        selfDeclaredMadeForKids: true,
      },
    },
    media: { body: videoStream },
  });

  const videoId = response.data.id;
  return {
    videoId: videoId,
    videoUrl: "https://www.youtube.com/watch?v=" + videoId,
    embedUrl: "https://www.youtube.com/embed/" + videoId,
    shortUrl: "https://youtu.be/" + videoId,
  };
}
