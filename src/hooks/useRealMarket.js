import { useEffect, useState } from "react";
import { TOKENS } from "../data/assets.js";

// Map our in-game symbols to CoinGecko ids for the real, tradeable coins.
const CG_IDS = Object.fromEntries(
  Object.entries(TOKENS)
    .filter(([, t]) => t.cgId)
    .map(([sym, t]) => [t.cgId, sym])
);

const IDS = Object.keys(CG_IDS).join(",");
const ENDPOINT = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${IDS}&sparkline=true&price_change_percentage=24h`;
const REFRESH_MS = 60000;

/**
 * Pulls live prices, 24h change, 24h volume and a 7-day sparkline for the
 * real coins (BTC/ETH/SOL/DOGE) from CoinGecko's free public API.
 * Fictional Robinhood-Chain tokens have no cgId and stay simulated.
 *
 * Fails soft: on any network/CORS/rate-limit error we simply return the last
 * good data (or an empty map), and callers fall back to the market sim.
 */
export function useRealMarket() {
  const [real, setReal] = useState({});
  const [status, setStatus] = useState("loading"); // loading | live | offline

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(ENDPOINT, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        if (cancelled) return;
        const next = {};
        for (const row of rows) {
          const sym = CG_IDS[row.id];
          if (!sym) continue;
          const spark = row.sparkline_in_7d?.price ?? [];
          next[sym] = {
            price: row.current_price,
            change24h: row.price_change_percentage_24h ?? 0,
            volume: (row.total_volume ?? 0) / 1e6, // -> $M
            sparkline: spark.slice(-48), // last ~2 days of hourly points
          };
        }
        setReal(next);
        setStatus("live");
      } catch {
        if (!cancelled) setStatus((s) => (s === "live" ? "live" : "offline"));
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { real, status };
}
