import { jest } from "@jest/globals";
import { validateEnv } from "../../lib/env.js";

describe("validateEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("logs error when required env vars are missing", () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.KIE_API_KEY;
    delete process.env.CALLBACK_SECRET;

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    validateEnv();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Missing required environment variables")
    );
    errorSpy.mockRestore();
  });

  test("does not throw when all required env vars are set", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
    process.env.ANTHROPIC_API_KEY = "sk-ant-123";
    process.env.KIE_API_KEY = "kie_123";
    process.env.CALLBACK_SECRET = "secret_123";

    expect(() => validateEnv()).not.toThrow();
  });

  test("warns about missing optional env vars", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
    process.env.ANTHROPIC_API_KEY = "sk-ant-123";
    process.env.KIE_API_KEY = "kie_123";
    process.env.CALLBACK_SECRET = "secret_123";

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    validateEnv();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
