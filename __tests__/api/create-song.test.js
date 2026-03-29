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
