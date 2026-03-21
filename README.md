# 🎵 TuneTots

Personalized AI-generated songs and videos for kids.

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

- `STRIPE_SECRET_KEY` — From stripe.com/dashboard
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — From stripe.com/dashboard
- `STRIPE_WEBHOOK_SECRET` — From Stripe webhooks settings
- `ELEVENLABS_API_KEY` — From elevenlabs.io/app/settings/api-keys
- `REPLICATE_API_TOKEN` — From replicate.com/account/api-tokens
- `GOOGLE_CLIENT_ID` — From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — From Google Cloud Console
- `GOOGLE_REFRESH_TOKEN` — From the get-youtube-token.js helper
- `NEXT_PUBLIC_APP_URL` — Your live URL (e.g. https://tunetots.vercel.app)
