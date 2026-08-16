import { useEffect, useMemo, useRef, useState } from "react";

const REVEAL_MS = 14000; // surface a new collection from the pool every 14s
const HOUR = 3600 * 1000;
const HYPES = ["hot", "raffle", "allowlist"];
const PRICES = ["Free", "0.004 ETH", "0.008 ETH", "0.01 ETH", "0.015 ETH", "0.02 ETH"];

function seed(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967295; // 0..1, stable per slug
}

/**
 * Simulated "OpenSea live launch feed": every REVEAL_MS it surfaces the next
 * real collection from NFT_POOL and routes it into Viral (just went viral) or
 * Upcoming (about to launch), so both NFT sections auto-grow over time.
 *
 * The pool comes from OpenSea via our /api/nft proxy when a key is configured,
 * otherwise from the pre-scraped bundled list; images are hotlinked from
 * OpenSea's CDN either way.
 *
 * Trading attributes prefer real stats from `stats` (keyed by slug) and mark
 * those rows `live`. Anything OpenSea does not publish - mint countdowns,
 * supply, hype - stays derived deterministically from the slug, so rows don't
 * jump around between renders.
 */
// Pure transform (exported for tests): given how many pool items have been
// revealed, route them into Viral / Upcoming and merge with the curated sets.
export function buildFeed(baseViral, baseUpcoming, pool, revealCount, start, stats = {}) {
  const revealed = pool.slice(0, revealCount);

  const newViral = [];
  const newUpcoming = [];
  revealed.forEach((c, i) => {
    const r = seed(c.slug);
    const real = stats[c.slug];
    const hasFloor = real && typeof real.floor === "number";
    if (i % 2 === 0) {
      // just went viral
      newViral.push({
        ...c,
        isNew: true,
        live: Boolean(hasFloor),
        floor: hasFloor ? real.floor : +(0.003 + r * 0.05).toFixed(4),
        // Robinhood-chain collections are not all ETH-denominated - some price
        // in USDG - so carry the symbol rather than assuming.
        floorSymbol: (hasFloor && real.floorSymbol) || "ETH",
        // A live row must not carry an invented change %. Real 24h change is
        // null until the floor snapshot is 24h old, so show nothing until then;
        // only fully simulated rows get the derived value.
        change: hasFloor
          ? (typeof real.change24h === "number" ? real.change24h : null)
          : +((r - 0.35) * 120).toFixed(1),
        volume: hasFloor && typeof real.volume === "number" ? real.volume : +(4 + r * 45).toFixed(1),
        sales: real?.sales ?? null,
        owners: real?.owners ?? null,
      });
    } else {
      // about to launch - imminent countdown so it leads the list
      newUpcoming.push({
        ...c,
        isNew: true,
        mintInHours: 1 + r * 8,
        price: PRICES[Math.floor(r * PRICES.length)],
        supply: 1000 + Math.floor(r * 9000),
        hype: HYPES[Math.floor(r * HYPES.length)],
      });
    }
  });

  // Viral: highest floor price first (volume as tiebreak).
  const viral = [...newViral, ...baseViral].sort(
    (a, b) => b.floor - a.floor || b.volume - a.volume
  );

  // Upcoming: unified, sorted by soonest mint (revealed imminents lead).
  const upcoming = [...baseUpcoming, ...newUpcoming]
    .map((n) => ({ ...n, mintAt: start + n.mintInHours * HOUR }))
    .sort((a, b) => a.mintAt - b.mintAt);

  return { viral, upcoming };
}

export function useLaunchFeed(baseViral, baseUpcoming, pool, stats) {
  const startRef = useRef(Date.now());
  const [revealCount, setRevealCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setRevealCount((c) => Math.min(c + 1, pool.length));
    }, REVEAL_MS);
    return () => clearInterval(id);
  }, [pool.length]);

  return useMemo(
    () => buildFeed(baseViral, baseUpcoming, pool, revealCount, startRef.current, stats),
    [revealCount, pool, baseViral, baseUpcoming, stats]
  );
}
