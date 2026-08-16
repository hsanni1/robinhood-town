import { useCallback, useEffect, useRef, useState } from "react";
import { Moon } from "lucide-react";

// Shared backend (see server/index.mjs). Configurable so you can point at a
// hosted API in production via VITE_SUGGESTIONS_API; defaults to the dev proxy.
const API = (import.meta.env.VITE_SUGGESTIONS_API ?? "/api") + "/suggestions";
const CACHE_KEY = "rht-suggestions-cache";
const POLL_MS = 4000;

function loadCache() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

function fmtTime(ts) {
  return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Suggestions({ username = "" }) {
  const [items, setItems] = useState(loadCache);
  const [name, setName] = useState(username);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("loading"); // loading | shared | offline
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(API, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("bad payload");
      setItems(data);
      setStatus("shared");
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    } catch {
      setStatus((s) => (s === "shared" ? "shared" : "offline"));
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Prefill the composer name from the saved profile when it becomes available.
  useEffect(() => {
    if (username) setName((n) => n || username);
  }, [username]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [items]);

  async function submit(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    const payload = { name: name.trim(), text: t };
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = await res.json();
      setItems((prev) => [...prev, created]);
      setStatus("shared");
      setText("");
    } catch {
      const local = { id: Date.now(), name: payload.name || "Anon", text: t, ts: Date.now(), _local: true };
      const next = [...items, local];
      setItems(next);
      setStatus("offline");
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      setText("");
    } finally {
      setSending(false);
    }
  }

  const statusLabel =
    status === "shared" ? (
      <><span className="live-dot" aria-hidden="true" /> Shared</>
    ) : status === "offline" ? (
      <><Moon size={10} strokeWidth={2.5} aria-hidden="true" /> Offline (local)</>
    ) : (
      "\u{2026} Connecting"
    );

  return (
    <div className="nb-card" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "calc(100dvh - 160px)" }}>
      <div className="drawer-head">
        <div>
          <h2 style={{ fontSize: 16 }}>Suggestions</h2>
          <p className="dim" style={{ fontSize: 11 }}>Shared board, everyone sees these</p>
        </div>
        <span className={`nb-badge ${status === "shared" ? "nb-badge-green" : ""}`} style={{ fontSize: 9 }}>{statusLabel}</span>
      </div>

      <div className="drawer-list" ref={listRef} style={{ minHeight: 180 }}>
        {items.length === 0 && <p className="dim" style={{ fontSize: 13 }}>No suggestions yet, be the first!</p>}
        {items.map((m) => (
          <div key={m.id} className="msg">
            <div className="msg-head">
              <span className="msg-name">
                {m.name}
                {m._local && <span className="dim" style={{ fontSize: 9 }}> · not sent</span>}
              </span>
              <span className="dim mono" style={{ fontSize: 10 }}>{fmtTime(m.ts)}</span>
            </div>
            <div className="msg-text">{m.text}</div>
          </div>
        ))}
      </div>

      <form className="drawer-composer" onSubmit={submit}>
        <input
          className="nb-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          maxLength={24}
          aria-label="Your name"
        />
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <textarea
            className="nb-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            placeholder="Your suggestion..."
            rows={2}
            maxLength={280}
            aria-label="Your suggestion"
            style={{ flex: 1, resize: "none" }}
          />
          <button className="nb-btn nb-btn-primary" type="submit" disabled={!text.trim() || sending}>
            {sending ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
