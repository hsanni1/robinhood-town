import { useCallback, useEffect, useState } from "react";
import { Moon } from "lucide-react";

const API = (import.meta.env.VITE_SUGGESTIONS_API ?? "/api") + "/scores";

function fmtTime(ts) {
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Leaderboard() {
  const [scores, setScores] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | live | offline

  const load = useCallback(async () => {
    try {
      const res = await fetch(API, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("bad payload");
      setScores(data);
      setStatus("live");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  let myBest = 0;
  try {
    myBest = Number(localStorage.getItem("rht-runner-best")) || 0;
  } catch {
    /* ignore */
  }

  return (
    <div className="nb-card" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 16 }}>Leaderboard</h2>
        <span className={`nb-badge ${status === "live" ? "nb-badge-green" : ""}`} style={{ fontSize: 9 }}>
          {status === "live" ? (
            <><span className="live-dot" aria-hidden="true" /> Live</>
          ) : status === "offline" ? (
            <><Moon size={10} strokeWidth={2.5} aria-hidden="true" /> Offline</>
          ) : (
            "\u{2026} Loading"
          )}
        </span>
      </div>
      <p className="dim" style={{ fontSize: 12, marginBottom: 12 }}>
        Top Rug Runner scores. Your best {myBest}. Finish a run to climb the ranks.
      </p>

      {scores.length === 0 ? (
        <p className="dim" style={{ fontSize: 13 }}>
          {status === "offline" ? "Leaderboard is offline right now." : "No scores yet, be the first!"}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {scores.map((s, i) => (
            <div
              key={s.id ?? i}
              className="nb-panel"
              style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}
            >
              <span
                className="mono"
                style={{
                  width: 30,
                  fontFamily: "var(--font-display)",
                  fontSize: 15,
                  color: i === 0 ? "var(--rh-green-dark)" : "var(--text)",
                }}
              >
                #{i + 1}
              </span>
              <span style={{ flex: 1, fontFamily: "var(--font-display)", fontSize: 13 }}>{s.name}</span>
              <span className="dim mono" style={{ fontSize: 10 }}>{fmtTime(s.ts)}</span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{s.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
