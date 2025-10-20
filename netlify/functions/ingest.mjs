import { schedule } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { JSDOM } from "jsdom";

const AU_PARAMS = "hl=en-AU&gl=AU&ceid=AU:en";
const TOPICS = {
  ufos: `https://news.google.com/rss/search?q=UFO%20OR%20UAP&${AU_PARAMS}`,
  financials: `https://news.google.com/rss/search?q=finance%20OR%20%22stock%20market%22&${AU_PARAMS}`,
  trump: `https://news.google.com/rss/search?q=Donald%20Trump&${AU_PARAMS}`,
  intl: `https://news.google.com/rss/search?q=international%20politics%20OR%20geopolitics&${AU_PARAMS}`,
};

const proxied = (url) =>
  `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

function extractFromDesc(desc) {
  try {
    const doc = new JSDOM(desc).window.document;
    const img = doc.querySelector("img");
    return img?.getAttribute("src") || "";
  } catch {
    return "";
  }
}

function parseItem(itemEl) {
  const g = (sel) => itemEl.querySelector(sel)?.textContent?.trim() || "";
  const title = g("title");
  const link = g("link");
  const pubDate = g("pubDate");
  const source = itemEl.querySelector("source")?.textContent?.trim() || "";
  let image = itemEl.querySelector("media\\:content")?.getAttribute("url") || "";
  if (!image) image = extractFromDesc(g("description")) || "";

  const ts = Date.parse(pubDate) || Date.now();
  return { title, link, pubDate, source, image, ts };
}

async function fetchRSS(url) {
  const res = await fetch(proxied(url));
  if (!res.ok) throw new Error("RSS fetch failed");
  const xml = await res.text();
  const doc = new JSDOM(xml, { contentType: "text/xml" }).window.document;
  const items = [...doc.querySelectorAll("item")].map(parseItem);
  items.sort((a, b) => b.ts - a.ts);
  return items;
}

async function ingestTopic(store, topicKey, feed) {
  const key = `news:${topicKey}:v1`;
  const current = (await store.get(key, { type: "json" })) || [];
  const currentSet = new Set(current.map((x) => x.link));

  const incoming = await fetchRSS(feed);
  const fresh = incoming.filter((x) => x.link && !currentSet.has(x.link));

  if (!fresh.length) return { added: 0 };
  const merged = [...fresh, ...current].slice(0, 20000); // keep last 20k
  await store.setJSON(key, merged);
  return { added: fresh.length };
}

export const handler = schedule("*/1 * * * *", async () => {
  const store = await getStore({ name: "news-store" });
  const results = {};
  for (const [k, url] of Object.entries(TOPICS)) {
    try {
      results[k] = await ingestTopic(store, k, url);
    } catch (e) {
      results[k] = { error: e.message };
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, results }),
  };
});
