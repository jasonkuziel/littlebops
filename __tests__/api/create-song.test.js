import { jest } from "@jest/globals";

// Mock the stripe lib
jest.unstable_mockModule("@/lib/stripe", () => ({
  createCheckoutSession: jest.fn().mockResolvedValue("https://checkout.stripe.com/test"),
}));

var { createCheckoutSession } = await import("@/lib/stripe");

// Import the route handler after mocking
var { POST } = await import("../../app/api/create-song/route.js");

function makeRequest(body) {
  return {
    json: async () => body,
  };
}

describe("POST /api/create-song", () => {
  beforeEach(() => {
    createCheckoutSession.mockClear();
  });

  test("returns 400 when childName is missing", async () => {
    var response = await POST(makeRequest({ story: "loves cats" }));
    var data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  test("returns 400 when story is missing", async () => {
    var response = await POST(makeRequest({ childName: "Emma" }));
    var data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  test("returns 400 when both are missing", async () => {
    var response = await POST(makeRequest({}));
    var data = await response.json();

    expect(response.status).toBe(400);
  });

  test("returns checkout URL on success", async () => {
    var response = await POST(
      makeRequest({ childName: "Emma", story: "loves cats" })
    );
    var data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe("https://checkout.stripe.com/test");
  });

  test("passes default genre and mood when not provided", async () => {
    await POST(makeRequest({ childName: "Emma", story: "loves cats" }));

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        genre: "pop",
        mood: "energetic",
      })
    );
  });

  test("passes provided genre and mood", async () => {
    await POST(
      makeRequest({
        childName: "Emma",
        story: "loves cats",
        genre: "lullaby",
        mood: "calming",
      })
    );

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        genre: "lullaby",
        mood: "calming",
      })
    );
  });

  test("truncates childName to 100 characters", async () => {
    const longName = "A".repeat(200);
    await POST(makeRequest({ childName: longName, story: "loves cats" }));

    const passedData = createCheckoutSession.mock.calls[0][0];
    expect(passedData.childName.length).toBeLessThanOrEqual(100);
  });

  test("truncates story to 2000 characters", async () => {
    const longStory = "a".repeat(3000);
    await POST(makeRequest({ childName: "Emma", story: longStory }));

    const passedData = createCheckoutSession.mock.calls[0][0];
    expect(passedData.story.length).toBeLessThanOrEqual(2000);
  });

  test("rejects invalid genre and falls back to pop", async () => {
    await POST(
      makeRequest({ childName: "Emma", story: "test", genre: "metal" })
    );

    const passedData = createCheckoutSession.mock.calls[0][0];
    expect(passedData.genre).toBe("pop");
  });

  test("rejects invalid mood and falls back to energetic", async () => {
    await POST(
      makeRequest({ childName: "Emma", story: "test", mood: "angry" })
    );

    const passedData = createCheckoutSession.mock.calls[0][0];
    expect(passedData.mood).toBe("energetic");
  });

  test("returns 500 when checkout session creation fails", async () => {
    createCheckoutSession.mockRejectedValueOnce(new Error("Stripe down"));

    var response = await POST(
      makeRequest({ childName: "Emma", story: "loves cats" })
    );
    var data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
