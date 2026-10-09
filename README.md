# Salon & Spheal

A responsive Pokémon-inspired beauty studio demo built with Next.js App Router, React, TypeScript, Tailwind CSS, and Lucide.

## Deployment

[Visit Salon & Spheal](https://superb-sprite-a99631.netlify.app/)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Features

- Filter the service menu by Pokémon type and book a ritual with the three-step appointment flow.
- Review or cancel appointments from the client dashboard. This demo stores bookings in the current browser's `localStorage`; the API validates and returns bookings, but does not persist them to a shared database.
- Ask Nurse Joy-Bot about salon services. The `/api/consult` route ranks curated service and aftercare notes with cosine similarity and uses the retrieved notes to ground its response.
- Optionally configure `OPENAI_API_KEY` to enable LLM responses. `OPENAI_MODEL` can override the default `gpt-4o-mini` model. Without a key, the route returns a local retrieval-grounded response.
- Upload a photo for an on-device, simulated color-palette suggestion. The image is not sent to the server; this heuristic is for styling inspiration, not medical or professional color analysis.

## Checks

```bash
npm run lint
npm run build
```