/**
 * music.js — AI Lyrics (via Claude) + AI Music (via Suno through KIE.ai)
 *
 * Uses callback approach: submit task, KIE calls us back when done.
 * No polling needed — avoids Vercel timeout issues.
 */

var GENRE_DESCRIPTIONS = {
  pop: "upbeat children's pop, catchy and danceable",
  lullaby: "gentle lullaby, soft and soothing, bedtime",
  rock: "fun children's rock, energetic guitars and drums",
  country: "warm country folk, acoustic guitar, storytelling",
  hiphop: "bouncy children's hip-hop, fun rhythmic beats",
  reggae: "sunny children's reggae, island vibes, feel-good",
};

var MOOD_DESCRIPTIONS = {
  energetic: "high energy, makes kids want to dance",
  calming: "peaceful and gentle, relaxing",
  silly: "goofy and fun, playful humor",
  adventurous: "bold and exciting, grand quest",
  sweet: "warm and heartfelt, full of love",
};

var GENRE_STYLES = {
  pop: "Children's Pop, Upbeat, Catchy, Sing-along, Fun",
  lullaby: "Lullaby, Soft, Gentle, Soothing, Piano, Bedtime",
  rock: "Children's Rock, Energetic, Electric Guitar, Fun Drums",
  country: "Children's Country, Acoustic Guitar, Folk, Warm",
  hiphop: "Children's Hip-Hop, Bouncy Beat, Fun Rap, Rhythmic",
  reggae: "Children's Reggae, Sunny, Island Vibes, Feel-good",
};

export async function generateLyrics(childName, age, story, genre, mood) {
  console.log("Generating AI lyrics for " + childName + " (genre: " + genre + ", mood: " + mood + ")...");

  var genreDesc = GENRE_DESCRIPTIONS[genre] || GENRE_DESCRIPTIONS.pop;
  var moodDesc = MOOD_DESCRIPTIONS[mood] || MOOD_DESCRIPTIONS.energetic;

  var prompt = "You are a professional children's songwriter. Write a fun, age-appropriate song for a child.\n\n" +
    "Child's name: " + childName + "\n" +
    (age ? "Age: " + age + "\n" : "") +
    "About them: " + story + "\n\n" +
    "Genre: " + genreDesc + "\n" +
    "Mood: " + moodDesc + "\n\n" +
    "Requirements:\n" +
    "- Write lyrics for a 2-minute song (about 4 sections + choruses)\n" +
    "- Include the child's name at least 6 times throughout\n" +
    "- Reference SPECIFIC details from their story\n" +
    "- Use section markers: [Verse 1], [Chorus], [Verse 2], [Bridge], [Chorus], [Outro]\n" +
    "- Match the genre style in your word choices and rhythm\n" +
    "- Match the mood — " + moodDesc + "\n" +
    "- Use simple words a young child would understand\n" +
    "- Make the chorus super catchy and easy to sing along to\n" +
    "- Include fun actions (clap, stomp, spin, jump, dance)\n" +
    (genre === "hiphop" ? "- Include fun rhythmic patterns and rhyme schemes typical of hip-hop\n" : "") +
    (genre === "lullaby" ? "- Keep it gentle and reassuring, perfect for winding down\n" : "") +
    (mood === "silly" ? "- Include funny lines and unexpected twists that make kids laugh\n" : "") +
    (mood === "calming" ? "- Use soothing imagery like stars, clouds, warm blankets\n" : "") +
    "\nReturn ONLY the lyrics with section markers. No explanations or notes.";

  var response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    var errorText = await response.text();
    console.error("Claude API error: " + response.status + " - " + errorText);
    console.log("Falling back to template lyrics...");
    return generateTemplateLyrics(childName, age, story);
  }

  var data = await response.json();
  var lyrics = data.content[0].text.trim();
  console.log("AI lyrics generated successfully!");
  return lyrics;
}

export function generateTemplateLyrics(childName, age, story) {
  var ageText = age ? (age + " years old") : "so amazing";
  return [
    "[Verse 1]",
    "Hey there " + childName + ", it's your special day,",
    "Time to sing and dance and play!",
    "You're " + ageText + " and shining bright,",
    "Like a star that lights the night!",
    "",
    "[Chorus]",
    childName + "! " + childName + "! Look at you go!",
    "The most amazing kid we know!",
    "Clap your hands and stomp your feet,",
    childName + "'s song has got the beat!",
    "",
    "[Verse 2]",
    "Every day's a brand new chance,",
    "So come on " + childName + ", let's all dance!",
    "",
    "[Outro]",
    childName + ", you're a superstar,",
    "We love you just the way you are!",
  ].join("\n");
}

/**
 * Submits a Suno generation task via KIE.ai.
 * Returns the taskId — does NOT wait for completion.
 * KIE will call the callbackUrl when the song is ready.
 */
export async function submitSunoGeneration(lyrics, childName, genre, mood, callbackUrl) {
  var style = GENRE_STYLES[genre] || GENRE_STYLES.pop;
  var moodDesc = MOOD_DESCRIPTIONS[mood] || MOOD_DESCRIPTIONS.energetic;
  style = style + ", " + moodDesc;

  var title = childName + "'s Song";
  if (title.length > 80) title = title.substring(0, 80);

  console.log("Submitting Suno generation...");
  console.log("Style: " + style);
  console.log("Callback: " + callbackUrl);

  var response = await fetch("https://api.kie.ai/api/v1/generate", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.KIE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: lyrics,
      customMode: true,
      instrumental: false,
      model: "V5",
      style: style.substring(0, 1000),
      title: title,
      callBackUrl: callbackUrl,
    }),
  });

  if (!response.ok) {
    var errorText = await response.text();
    throw new Error("KIE/Suno submit error: " + response.status + " - " + errorText);
  }

  var data = await response.json();
  if (data.code !== 200) {
    throw new Error("KIE/Suno submit failed: " + data.msg);
  }

  return data.data.taskId;
}
