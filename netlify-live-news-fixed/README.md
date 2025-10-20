# Netlify Live News (fixed) — UFOs • Financials • Trump • International Politics

React 3-column reader with **live updates**, **infinite scroll**, and a **persisted archive** via Netlify Functions + Blobs.

## What’s fixed
- Uses **modern scheduled function** style for `ingest` (cron-only, not HTTP).
- Adds **HTTP background trigger** at `/.netlify/functions/ingest-now-background` that returns **202** for manual/CI runs.
- Shared ingestion code lives in `netlify/functions/_shared/ingest.js`.

## Deploy (Netlify)
1. Push this folder to a Git repo.
2. On Netlify: **New site from Git** → choose repo.
3. Build command: `npm run build` — Publish directory: `dist`.
4. After first deploy, either wait for the scheduled `ingest` (runs every minute) **or** hit:
   - `https://<yoursite>.netlify.app/.netlify/functions/ingest-now-background` (returns 202)

## Dev
```bash
npm install
npm run dev
# or for full functions locally:
npm i -g netlify-cli
netlify dev
```
