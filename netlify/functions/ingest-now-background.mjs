// netlify/functions/ingest-now-background.mjs
import { runIngest } from "./_shared/ingest.js";

export async function handler() {
  runIngest().catch((e) => console.error("ingest-now error:", e));
  return {
    statusCode: 202,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ok: true, queued: true }),
  };
}
