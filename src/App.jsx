import React, { useEffect, useMemo, useRef, useState } from "react";

const AU_PARAMS = "hl=en-AU&gl=AU&ceid=AU:en"; // reserved for future server filtering if needed

const TOPICS = [
  { key: "ufos", title: "UFOs / UAP", color: "var(--tag-purple)" },
  { key: "financials", title: "Financials", color: "var(--tag-green)" },
  { key: "trump", title: "Trump", color: "var(--tag-red)" },
  { key: "intl", title: "International Politics", color: "var(--tag-blue)" },
];

function formatDate(d) {
  const date = new Date(d);
  if (isNaN(date)) return "";
  return date.toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
}

async function fetchSlice(topic, cursor = 0, limit = 30) {
  const res = await fetch(`/.netlify/functions/news?topic=${encodeURIComponent(topic)}&cursor=${cursor}&limit=${limit}`);
  if (!res.ok) throw new Error("fetch failed");
  return await res.json();
}

function FeedColumn({ topic, pollEveryMs = 60000, initialReveal = 30, revealStep = 30 }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [visibleCount, setVisibleCount] = useState(initialReveal);
  const [nextCursor, setNextCursor] = useState(0);
  const [queuedNew, setQueuedNew] = useState(0);
  const [total, setTotal] = useState(0);
  const scrollerRef = useRef(null);
  const atTopRef = useRef(true);

  // initial load
  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus("loading");
      try {
        const data = await fetchSlice(topic.key, 0, initialReveal);
        if (!alive) return;
        setItems(data.items);
        setTotal(data.total || data.items.length);
        setNextCursor(data.nextCursor ?? data.items.length);
        setVisibleCount(data.items.length);
        setStatus("ok");
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setStatus("error");
      }
    })();
    return () => { alive = false; };
  }, [topic.key, initialReveal]);

  // polling for new head items
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const head = await fetchSlice(topic.key, 0, initialReveal);
        if (head.total > total) {
          const newCount = head.total - total;
          setTotal(head.total);
          if (atTopRef.current) {
            // refresh top slice
            setItems(head.items);
            setVisibleCount(head.items.length);
          } else {
            setQueuedNew((n) => n + newCount);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, pollEveryMs);
    return () => clearInterval(id);
  }, [topic.key, total, initialReveal, pollEveryMs]);

  // scroll behavior
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      atTopRef.current = el.scrollTop < 16;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (nearBottom && nextCursor !== null) {
        // load more
        (async () => {
          try {
            const data = await fetchSlice(topic.key, nextCursor, revealStep);
            setItems((prev) => [...prev, ...data.items]);
            setNextCursor(data.nextCursor);
            setVisibleCount((v) => v + data.items.length);
          } catch (e) {
            console.error(e);
          }
        })();
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [nextCursor, topic.key, revealStep]);

  const revealQueued = async () => {
    setQueuedNew(0);
    try {
      const head = await fetchSlice(topic.key, 0, visibleCount);
      setItems(head.items);
      setTotal(head.total);
      if (scrollerRef.current) scrollerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <section className="column">
      <header className="column__header">
        <span className="topic-dot" style={{ background: topic.color }} aria-hidden />
        <h2 className="column__title">{topic.title}</h2>
        <div className="chip">{total.toLocaleString()}</div>
        <button
          className="refresh"
          onClick={revealQueued}
          title="Show latest"
        >
          ↻
        </button>
      </header>

      {queuedNew > 0 && (
        <button className="toast" onClick={revealQueued}>
          ⬆ {queuedNew} new {queuedNew === 1 ? "article" : "articles"} — show
        </button>
      )}

      {status === "loading" && <p className="hint">Loading latest…</p>}
      {status === "error" && <p className="hint error">Couldn’t load. Check your Netlify functions.</p>}

      <div className="cards scroll" ref={scrollerRef}>
        {items.map((it, i) => (
          <a className="card" key={`${topic.key}-${i}-${it.link}`} href={it.link} target="_blank" rel="noopener noreferrer">
            <div className="thumb">
              {it.image ? <img src={it.image} alt="" loading="lazy" /> : <div className="thumb__fallback">No Image</div>}
            </div>
            <div className="meta">
              <div className="meta__source">{it.source || (() => { try { return new URL(it.link).hostname.replace("www.",""); } catch { return ""; } })()}</div>
              <div className="meta__date">{formatDate(it.ts)}</div>
            </div>
            <h3 className="card__title">{it.title}</h3>
          </a>
        ))}
        <div className="endcap">
          {nextCursor !== null ? "Scroll to load more…" : "No more saved items"}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const columns = useMemo(() => TOPICS, []);
  return (
    <div className="app">
      <nav className="topbar">
        <h1>Live News — UFOs • Financials • Trump • International Politics</h1>
        <p className="topbar__note">
          Stored on Netlify Blobs. New items appear at the top; scroll for history.
        </p>
      </nav>
      <main className="grid">
        {columns.map((t) => (
          <FeedColumn key={t.key} topic={t} />
        ))}
      </main>
      <footer className="foot">
        <small>Images and headlines © their publishers. Educational reader.</small>
      </footer>
    </div>
  );
}
