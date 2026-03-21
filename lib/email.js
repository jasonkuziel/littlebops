/**
 * email.js — Send beautiful emails using Resend
 */

function capitalizeWords(str) {
  return str.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

export async function sendSongReadyEmail(options) {
  var { to, childName, songUrl, lyrics, successPageUrl } = options;

  // Ensure name is properly capitalized
  var name = capitalizeWords(childName || "");

  var html = buildEmailHtml(name, songUrl, lyrics, successPageUrl);

  var response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "LittleBops <hello@getlittlebops.com>",
      to: [to],
      subject: name + "'s Song is Ready! 🎵",
      html: html,
    }),
  });

  if (!response.ok) {
    var errorText = await response.text();
    throw new Error("Resend API error: " + response.status + " - " + errorText);
  }

  var data = await response.json();
  console.log("Email sent! ID: " + data.id);
  return data;
}

function buildEmailHtml(childName, songUrl, lyrics, successPageUrl) {
  var lyricsHtml = lyrics
    .split("\n")
    .map(function(line) {
      if (line.startsWith("[")) {
        return '<p style="color: #FF6B4A; font-weight: 700; font-size: 13px; margin: 16px 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">' + line + '</p>';
      }
      if (line.trim() === "") return '<br/>';
      return '<p style="color: #1B1340; margin: 2px 0; font-size: 15px; line-height: 1.7;">' + line + '</p>';
    })
    .join("\n");

  var appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getlittlebops.com";

  return '<!DOCTYPE html>\
<html>\
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\
<body style="margin: 0; padding: 0; background: #FFFBF5; font-family: Arial, sans-serif;">\
<div style="max-width: 520px; margin: 0 auto; padding: 48px 24px;">\
\
  <div style="text-align: center; margin-bottom: 36px;">\
    <div style="font-size: 24px; font-weight: 800; color: #1B1340; margin-bottom: 24px;"><span style="color: #FF6B4A;">&#9835;</span> LittleBops</div>\
    <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>\
    <h1 style="font-size: 26px; color: #1B1340; margin: 0 0 8px 0; font-weight: 800;">' + childName + '\'s song is ready!</h1>\
    <p style="color: #4A4270; font-size: 16px; margin: 0;">A one-of-a-kind song, made with love.</p>\
  </div>\
\
  <div style="text-align: center; margin-bottom: 20px;">\
    <a href="' + successPageUrl + '" style="display: inline-block; background: #FF6B4A; color: #fff; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-size: 17px; font-weight: 700;">Listen to ' + childName + '\'s Song →</a>\
  </div>\
\
  <div style="text-align: center; margin-bottom: 32px;">\
    <a href="' + songUrl + '" style="display: inline-block; color: #FF6B4A; text-decoration: none; padding: 12px 28px; border-radius: 14px; font-size: 15px; font-weight: 700; border: 2px solid #FF6B4A;">↓ Download MP3</a>\
  </div>\
\
  <div style="background: #fff; border-radius: 16px; padding: 24px; border: 1.5px solid #EDE8E3;">\
    <div style="font-size: 12px; font-weight: 700; color: #8B83A8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px;">Lyrics</div>\
    ' + lyricsHtml + '\
  </div>\
\
  <div style="text-align: center; margin-top: 36px; padding-top: 24px; border-top: 1px solid #EDE8E3;">\
    <p style="color: #4A4270; font-size: 14px; margin: 0 0 8px 0;">Want to make another song?</p>\
    <a href="' + appUrl + '" style="color: #FF6B4A; font-weight: 700; text-decoration: none; font-size: 15px;">Create another at LittleBops →</a>\
    <p style="color: #8B83A8; font-size: 12px; margin-top: 24px;">© 2026 LittleBops · All rights reserved</p>\
  </div>\
\
</div>\
</body>\
</html>';
}
