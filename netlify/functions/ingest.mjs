// netlify/functions/ingest.mjs
import { runIngest } from "./_shared/ingest.js";

export default async () => {
  await runIngest();
  return new Response(null, { status: 204 });
};

export const config = {
  schedule: "*/1 * * * *",
};
