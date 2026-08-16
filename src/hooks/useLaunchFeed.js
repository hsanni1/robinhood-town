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
/**
 * Overlay real OpenSea stats onto one row. Applies to curated rows as much as
 * revealed ones - the curated collections are real collections with real slugs,
 * and showing them with hardcoded numbers was flatly wrong (StonkBrokers was
 * pinned at 0.08 while its actual floor sat at 10.75 ETH).
 *
 * Anything OpenSea does not publish keeps its existing value, so an unmatched
 * row degrades to exactly what it rendered before.
 */
function withStats(row, stats) {
  const real = stats[row.slug];
  const hasFloor = real && typeof real.floor === "number";
  if (!hasFloor) return { ...row, live: false };
  return {
    ...row,
    live: true,
    floor: real.floor,
    // Robinhood-chain collections are not all ETH-denominated - some price in
    // USDG - so carry the symbol rather than assuming.
    floorSymbol: real.floorSymbol || "ETH",
    // A live row must not carry an invented change %. Real 24h change is null
    // until the floor snapshot is 24h old, so show nothing until then.
    change: typeof real.change24h === "number" ? real.change24h : null,
    volume: typeof real.volume === "number" ? real.volume : row.volume,
    sales: real.sales ?? null,
    owners: real.owners ?? null,
    // Prefer OpenSea's own image and URL when we have them - the bundled ones
    // go stale as collections re-upload art.
    img: real.img || row.img,
    url: real.url || row.url,
  };
}

// Pure transform (exported for tests): given how many pool items have been
// revealed, route them into Viral / Upcoming and merge with the curated sets.
export function buildFeed(baseViral, baseUpcoming, pool, revealCount, start, stats = {}) {
  // Skip pool entries already present in the curated lists so a collection
  // cannot appear twice once live discovery starts returning the same slugs.
  const seen = new Set([...baseViral, ...baseUpcoming].map((n) => n.slug));
  const revealed = pool.filter((c) => !seen.has(c.slug)).slice(0, revealCount);

  const newViral = [];
  const newUpcoming = [];
  revealed.forEach((c, i) => {
    const r = seed(c.slug);
    if (i % 2 === 0) {
      // just went viral
      newViral.push({
        ...c,
        isNew: true,
        floor: +(0.003 + r * 0.05).toFixed(4),
        change: +((r - 0.35) * 120).toFixed(1),
        volume: +(4 + r * 45).toFixed(1),
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

  // Viral: real floors first (highest), then anything still simulated.
  const viral = [...newViral, ...baseViral]
    .map((n) => withStats(n, stats))
    .sort((a, b) => b.live - a.live || b.floor - a.floor || b.volume - a.volume);

  // Upcoming: dated mints first (soonest lead), then projects that have
  // announced Robinhood but no date yet, liveliest first so the ones already
  // trading on OpenSea surface above the ones with nothing to show.
  // Mint dates are game flavor - OpenSea publishes none - but floor, image and
  // link are overlaid for real where the collection already trades.
  const upcoming = [...baseUpcoming, ...newUpcoming]
    .map((n) => ({ ...withStats(n, stats), mintAt: start + n.mintInHours * HOUR }))
    .sort((a, b) => {
      const at = a.tba ? 1 : 0;
      const bt = b.tba ? 1 : 0;
      if (at !== bt) return at - bt;
      if (at) return (b.floor || 0) - (a.floor || 0) || a.name.localeCompare(b.name);
      return a.mintAt - b.mintAt;
    });

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
