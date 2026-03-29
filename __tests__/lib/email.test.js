import { jest } from "@jest/globals";
import { capitalizeWords, buildEmailHtml, escapeHtml } from "../../lib/email.js";

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

describe("escapeHtml", () => {
  test("escapes angle brackets", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  test("escapes ampersands", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  test("escapes double quotes", () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });

  test("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  test("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  test("leaves safe strings unchanged", () => {
    expect(escapeHtml("Emma")).toBe("Emma");
  });
});

describe("buildEmailHtml XSS protection", () => {
  test("escapes HTML in child name", () => {
    const html = buildEmailHtml(
      '<script>alert("xss")</script>',
      "https://example.com/song.mp3",
      "Hello",
      "https://example.com/success"
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("escapes HTML in lyrics", () => {
    const html = buildEmailHtml(
      "Emma",
      "https://example.com/song.mp3",
      '<img src=x onerror=alert(1)>',
      "https://example.com/success"
    );
    expect(html).not.toContain('<img src=x');
    expect(html).toContain("&lt;img");
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
