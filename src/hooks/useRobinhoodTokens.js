import { useEffect, useState } from "react";

// Live market data scoped to CoinGecko's "Robinhood Ecosystem" category - i.e.
// tokens that are actually on Robinhood / Robinhood Chain (chain id 4663).
const ENDPOINT =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=robinhood-ecosystem&order=volume_desc&per_page=30&sparkline=true&price_change_percentage=24h";
const REFRESH_MS = 90000;

function hashHue(str) {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 360;
}

/**
 * Auto-updating roster of real Robinhood-Chain tokens with live price, 24h
 * change, volume and a real 7-day sparkline. New tokens that list on the chain
 * show up here automatically and get merged into Top Movers. Fails soft to an
 * empty list (browser CORS ok).
 */
export function useRobinhoodTokens() {
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(ENDPOINT, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        if (cancelled || !Array.isArray(rows)) return;
        const mapped = rows
          .map((row) => ({
            symbol: (row.symbol || "").toUpperCase(),
            name: row.name,
            price: row.current_price ?? 0,
            change24h: row.price_change_percentage_24h ?? 0,
            volume: (row.total_volume ?? 0) / 1e6, // -> $M
            img: row.image,
            series: (row.sparkline_in_7d?.price ?? []).slice(-48),
            hue: hashHue(row.symbol || row.name || ""),
            // Per-token page. Uniswap's bare /swap route is identical for every
            // token, so it told you nothing about the row you clicked.
            tradeUrl: row.id
              ? `https://www.coingecko.com/en/coins/${row.id}`
              : "https://app.uniswap.org/swap",
          }))
          .filter((c) => c.symbol && c.price > 0);
        setCoins(mapped);
      } catch {
        /* keep last good list */
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return coins;
}
