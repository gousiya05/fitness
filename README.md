<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f3e4887f-d2ad-446c-b64b-17ad87a474c7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment

### Deploy to Vercel

1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the root directory.
3. Add your `GEMINI_API_KEY` to the Vercel project environment variables.
4. The project is already configured with `vercel.json` and a serverless API in `api/server.ts`.
