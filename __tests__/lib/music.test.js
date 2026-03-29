import { generateTemplateLyrics } from "../../lib/music.js";

describe("generateTemplateLyrics", () => {
  test("includes child name multiple times", () => {
    var lyrics = generateTemplateLyrics("Emma", "5", "loves dancing");
    var count = (lyrics.match(/Emma/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("includes section markers", () => {
    var lyrics = generateTemplateLyrics("Emma", "5", "loves dancing");
    expect(lyrics).toContain("[Verse 1]");
    expect(lyrics).toContain("[Chorus]");
    expect(lyrics).toContain("[Verse 2]");
    expect(lyrics).toContain("[Outro]");
  });

  test("includes age when provided", () => {
    var lyrics = generateTemplateLyrics("Liam", "3", "loves trucks");
    expect(lyrics).toContain("3 years old");
  });

  test("uses fallback text when age is not provided", () => {
    var lyrics = generateTemplateLyrics("Liam", null, "loves trucks");
    expect(lyrics).toContain("so amazing");
    expect(lyrics).not.toContain("years old");
  });

  test("handles empty age string", () => {
    var lyrics = generateTemplateLyrics("Mia", "", "loves cats");
    expect(lyrics).toContain("so amazing");
  });

  test("returns a string", () => {
    var lyrics = generateTemplateLyrics("Noah", "4", "likes trains");
    expect(typeof lyrics).toBe("string");
  });

  test("has multiple lines", () => {
    var lyrics = generateTemplateLyrics("Ava", "6", "plays soccer");
    var lines = lyrics.split("\n").filter((l) => l.trim() !== "");
    expect(lines.length).toBeGreaterThan(5);
  });
});
