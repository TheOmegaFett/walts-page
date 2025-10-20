import { getStore } from "@netlify/blobs";

export async function handler(event) {
  const qp = new URLSearchParams(event.rawQuery || "");
  const topic = qp.get("topic") || "ufos";
  const cursor = parseInt(qp.get("cursor") || "0", 10);
  const limit = Math.min(parseInt(qp.get("limit") || "30", 10), 100);

  const store = await getStore({ name: "news-store" });
  const data = (await store.get(`news:${topic}:v1`, { type: "json" })) || [];

  const slice = data.slice(cursor, cursor + limit);
  const next = cursor + slice.length;
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      items: slice,
      nextCursor: next < data.length ? next : null,
      total: data.length,
    }),
  };
}
