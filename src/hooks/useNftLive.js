import { useEffect, useMemo, useRef, useState } from "react";

const API = import.meta.env.VITE_SUGGESTIONS_API ?? "/api";
const POOL_REFRESH_MS = 10 * 60 * 1000;
const STATS_REFRESH_MS = 5 * 60 * 1000;
// Must not exceed MAX_SLUGS in api/nft/stats.js.
const STATS_BATCH = 70;

/**
 * Live collection list from OpenSea via our proxy, falling back to the bundled
 * pool. `live` reports whether we are actually showing chain data, so the UI
 * can badge it the same way Top Movers does.
 *
 * The proxy answers 503 when no OPENSEA_API_KEY is set, which lands here as
 * "keep the fallback".
 */
export function useNftPool(fallback) {
  const [pool, setPool] = useState(fallback);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API}/nft/collections`, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled || !Array.isArray(data.collections) || !data.collections.length) return;
        setPool(data.collections);
        setLive(true);
      } catch {
        /* keep the bundled pool */
      }
    }
    load();
    const id = setInterval(load, POOL_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fallback]);

  return { pool, live };
}

const EMPTY_PULSE = { gainers: [] };

/**
 * Chain pulse: collections whose 24h volume has jumped well above their own
 * recent average. The scan and the thresholds live server-side; this just
 * polls the result.
 */
export function useNftPulse(watchSlugs = []) {
  const [pulse, setPulse] = useState(EMPTY_PULSE);
  // The chain list skews brand-new; established collections are the only ones
  // with enough history to spike, so they are passed in explicitly.
  const key = useMemo(() => watchSlugs.slice(0, STATS_BATCH).join(","), [watchSlugs]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const url = key ? `${API}/nft/pulse?slugs=${encodeURIComponent(key)}` : `${API}/nft/pulse`;
        const res = await fetch(url, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setPulse({ gainers: Array.isArray(data.gainers) ? data.gainers : [] });
      } catch {
        /* keep last good lists */
      }
    }
    load();
    const id = setInterval(load, POOL_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [key]);

  return pulse;
}

/**
 * Real floor/volume/sales for the given slugs, keyed by slug. Capped and
 * debounced because each slug is an upstream call behind the cache; slugs
 * beyond the cap simply keep their simulated numbers.
 */
export function useNftStats(slugs) {
  const [stats, setStats] = useState({});
  // Join into a primitive so the effect does not re-run on every new array.
  const key = useMemo(() => slugs.slice(0, STATS_BATCH).join(","), [slugs]);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API}/nft/stats?slugs=${encodeURIComponent(key)}`, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled || !data || typeof data !== "object") return;
        setStats((prev) => ({ ...prev, ...data }));
      } catch {
        /* keep whatever we already have */
      }
    }
    load();
    const id = setInterval(load, STATS_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [key]);

  return stats;
}
