import { jest } from "@jest/globals";
import { capitalizeWords, buildEmailHtml } from "../../lib/email.js";

describe("capitalizeWords", () => {
  test("capitalizes single word", () => {
    expect(capitalizeWords("john")).toBe("John");
  });

  test("capitalizes multiple words", () => {
    expect(capitalizeWords("john doe")).toBe("John Doe");
  });

  test("handles already capitalized input", () => {
    expect(capitalizeWords("John")).toBe("John");
  });

  test("handles empty string", () => {
    expect(capitalizeWords("")).toBe("");
  });

  test("handles single character", () => {
    expect(capitalizeWords("a")).toBe("A");
  });
});

describe("buildEmailHtml", () => {
  var html;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://getlittlebops.com";
    html = buildEmailHtml(
      "Emma",
      "https://example.com/song.mp3",
      "[Verse 1]\nHello Emma\n\n[Chorus]\nLa la la",
      "https://getlittlebops.com/success?session_id=123"
    );
  });

  test("includes child name in heading", () => {
    expect(html).toContain("Emma's song is ready!");
  });

  test("includes song download link", () => {
    expect(html).toContain("https://example.com/song.mp3");
  });

  test("includes success page link", () => {
    expect(html).toContain("https://getlittlebops.com/success?session_id=123");
  });

  test("styles section markers differently from regular lines", () => {
    expect(html).toContain("text-transform: uppercase");
    expect(html).toContain("[Verse 1]");
    expect(html).toContain("[Chorus]");
  });

  test("includes regular lyrics lines", () => {
    expect(html).toContain("Hello Emma");
    expect(html).toContain("La la la");
  });

  test("includes branding", () => {
    expect(html).toContain("LittleBops");
  });

  test("is valid HTML structure", () => {
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });
});
