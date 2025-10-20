# Netlify Live News (UFOs • Financials • Trump • International Politics)

A React 3-column reader with **live updates** and **infinite scroll** backed by **Netlify Functions + Blobs**.

- Ingests Google News RSS every minute (via Netlify **Scheduled Function**).
- Stores articles per topic in **Netlify Blobs** (durable JSON).
- Frontend paginates from `/.netlify/functions/news` and shows new items at the top.

## Deploy (Netlify)

1. Create a new repository and push this folder.
2. On Netlify: **New site from Git** → select repo.
3. Build command: `npm run build`  
   Publish directory: `dist`
4. Deploy. Netlify will also run the scheduled `ingest` function every minute.

## Local dev

```bash
npm install
npm run dev
```

Visit http://localhost:5173

> Functions are deployed on Netlify. For local function testing, use Netlify CLI (`netlify dev`).

## Notes

- The ingest function fetches RSS via `https://api.allorigins.win/raw?...` to avoid CORS from origin sites.
- Items are deduplicated by `link` and capped to the most recent 20,000 per topic.
- You can adjust topics in `netlify/functions/ingest.mjs` and the UI titles/colors in `src/App.jsx`.

Enjoy!
