import { jest } from "@jest/globals";

// Mock the Stripe constructor before importing
var mockCreate = jest.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" });
jest.unstable_mockModule("stripe", () => ({
  default: function Stripe() {
    return { checkout: { sessions: { create: mockCreate } } };
  },
}));

var { createCheckoutSession } = await import("../../lib/stripe.js");

describe("createCheckoutSession", () => {
  beforeEach(() => {
    mockCreate.mockClear();
    process.env.NEXT_PUBLIC_APP_URL = "https://getlittlebops.com";
  });

  test("truncates story longer than 500 characters", async () => {
    var longStory = "a".repeat(600);
    await createCheckoutSession({ childName: "Emma", story: longStory });

    var metadata = mockCreate.mock.calls[0][0].metadata;
    expect(metadata.childStory.length).toBeLessThanOrEqual(500);
    expect(metadata.childStory.endsWith("...")).toBe(true);
  });

  test("does not truncate story under 500 characters", async () => {
    var shortStory = "She loves cats";
    await createCheckoutSession({ childName: "Emma", story: shortStory });

    var metadata = mockCreate.mock.calls[0][0].metadata;
    expect(metadata.childStory).toBe("She loves cats");
  });

  test("handles missing story gracefully", async () => {
    await createCheckoutSession({ childName: "Emma" });

    var metadata = mockCreate.mock.calls[0][0].metadata;
    expect(metadata.childStory).toBe("");
  });

  test("passes child name in metadata", async () => {
    await createCheckoutSession({ childName: "Liam", story: "test" });

    var metadata = mockCreate.mock.calls[0][0].metadata;
    expect(metadata.childName).toBe("Liam");
  });

  test("defaults genre to pop", async () => {
    await createCheckoutSession({ childName: "Emma", story: "test" });

    var metadata = mockCreate.mock.calls[0][0].metadata;
    expect(metadata.genre).toBe("pop");
  });

  test("defaults mood to energetic", async () => {
    await createCheckoutSession({ childName: "Emma", story: "test" });

    var metadata = mockCreate.mock.calls[0][0].metadata;
    expect(metadata.mood).toBe("energetic");
  });

  test("uses provided genre and mood", async () => {
    await createCheckoutSession({
      childName: "Emma",
      story: "test",
      genre: "lullaby",
      mood: "calming",
    });

    var metadata = mockCreate.mock.calls[0][0].metadata;
    expect(metadata.genre).toBe("lullaby");
    expect(metadata.mood).toBe("calming");
  });

  test("constructs success URL with trailing slash stripped", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://getlittlebops.com/";
    await createCheckoutSession({ childName: "Emma", story: "test" });

    var args = mockCreate.mock.calls[0][0];
    expect(args.success_url).toBe(
      "https://getlittlebops.com/success?session_id={CHECKOUT_SESSION_ID}"
    );
  });

  test("sets unit amount to 299 cents", async () => {
    await createCheckoutSession({ childName: "Emma", story: "test" });

    var lineItem = mockCreate.mock.calls[0][0].line_items[0];
    expect(lineItem.price_data.unit_amount).toBe(299);
  });

  test("sets currency to usd", async () => {
    await createCheckoutSession({ childName: "Emma", story: "test" });

    var lineItem = mockCreate.mock.calls[0][0].line_items[0];
    expect(lineItem.price_data.currency).toBe("usd");
  });

  test("includes child name in product description", async () => {
    await createCheckoutSession({ childName: "Mia", story: "test" });

    var product = mockCreate.mock.calls[0][0].line_items[0].price_data.product_data;
    expect(product.description).toContain("Mia");
  });

  test("returns checkout URL", async () => {
    var url = await createCheckoutSession({ childName: "Emma", story: "test" });
    expect(url).toBe("https://checkout.stripe.com/test");
  });
});
