# LittleBops

Personalized AI-generated songs for kids.

## Quick Start

1. Clone this repo
2. Run `npm install`
3. Copy `.env.example` to `.env.local` and fill in your API keys
4. Run `npm run dev`
5. Open http://localhost:3000

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to vercel.com and import the repo
3. Add all environment variables from `.env.example`
4. Deploy!

## Environment Variables

### Required

- `STRIPE_SECRET_KEY` — From stripe.com/dashboard
- `STRIPE_WEBHOOK_SECRET` — From Stripe webhooks settings
- `ANTHROPIC_API_KEY` — From console.anthropic.com
- `KIE_API_KEY` — From kie.ai for Suno music generation
- `CALLBACK_SECRET` — A random secret string used to authenticate webhook callbacks (generate with `openssl rand -hex 32`)

### Optional

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — From stripe.com/dashboard
- `REPLICATE_API_TOKEN` — From replicate.com/account/api-tokens (for video generation)
- `GOOGLE_CLIENT_ID` — From Google Cloud Console (for YouTube uploads)
- `GOOGLE_CLIENT_SECRET` — From Google Cloud Console
- `GOOGLE_REFRESH_TOKEN` — OAuth refresh token for YouTube API
- `NEXT_PUBLIC_APP_URL` — Your live URL (e.g. https://getlittlebops.com)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage token (auto-set on Vercel)
