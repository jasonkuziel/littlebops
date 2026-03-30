/**
 * env.js — Validate required environment variables at startup
 */

const REQUIRED_ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "ANTHROPIC_API_KEY",
  "KIE_API_KEY",
  "CALLBACK_SECRET",
];

const OPTIONAL_ENV_VARS = [
  "REPLICATE_API_TOKEN",
  "NEXT_PUBLIC_APP_URL",
  "BLOB_READ_WRITE_TOKEN",
  "PROMO_SECRET",
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      "WARNING: Missing required environment variables: " + missing.join(", ")
    );
  }

  const missingOptional = OPTIONAL_ENV_VARS.filter((key) => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(
      "Missing optional environment variables (some features may not work): " +
        missingOptional.join(", ")
    );
  }
}
