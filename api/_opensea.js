// Server-side OpenSea client.
//
// The key stays here deliberately. OpenSea does send permissive CORS headers,
// so the browser *could* call it directly - but only by shipping the key in the
// bundle, where anyone can read it. Everything goes through the functions.
//
// Every v2 endpoint we use needs the key. Unauthenticated requests sometimes
// return 200 purely because Cloudflare has that exact response edge-cached, so
// a one-off successful curl is not evidence the call is public.
//
// The other reason to proxy: the upstream rate limit is shared across all our
// visitors, so responses are cached in Redis and one upstream call serves
// everybody until the TTL lapses.
import { readJson, writeJson } from "./_store.js";

const BASE = "https://api.opensea.io/api/v2";
const CHAIN = process.env.OPENSEA_CHAIN || "robinhood";

export const hasKey = Boolean(process.env.OPENSEA_API_KEY);

async function osFetch(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      accept: "application/json",
      ...(process.env.OPENSEA_API_KEY ? { "x-api-key": process.env.OPENSEA_API_KEY } : {}),
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`opensea ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Read-through cache. Returns { value, cached } so callers can tell a fresh
 * upstream hit from a served-from-Redis one. On upstream failure we fall back
 * to the stale entry if there is one - a stale floor price beats an error.
 */
async function cached(key, ttlSeconds, fetcher) {
  const hit = await readJson(key, null);
  if (hit && hit.expires > Date.now()) return { value: hit.value, cached: true };
  try {
    const value = await fetcher();
    // Keep the entry a little past its logical TTL so it can serve as the
    // stale fallback if OpenSea is down when it expires.
    await writeJson(key, { value, expires: Date.now() + ttlSeconds * 1000 }, ttlSeconds * 4);
    return { value, cached: false };
  } catch (e) {
    if (hit) {
      console.error(`opensea refresh failed, serving stale ${key}:`, e.message);
      return { value: hit.value, cached: true, stale: true };
    }
    throw e;
  }
}

/** Live collections on the configured chain, normalised to the NFT_POOL shape. */
export async function fetchCollections(limit = 100) {
  return cached(`rht:os:collections:${CHAIN}:${limit}`, 600, async () => {
    const data = await osFetch(`/collections?chain=${encodeURIComponent(CHAIN)}&limit=${limit}`);
    return (data.collections || [])
      .filter((c) => !c.is_disabled && !c.is_nsfw)
      .map((c) => ({
        name: c.name || c.collection,
        slug: c.collection,
        img: c.image_url || "",
        url: c.opensea_url || `https://opensea.io/collection/${c.collection}`,
      }));
  });
}

/**
 * Real trading stats for one collection.
 *
 * OpenSea has no floor-change field, so rather than invent one we snapshot the
 * floor under a key that expires after 24h: the first read seeds it and reports
 * change24h = null, later reads compare against a genuinely ~24h-old value.
 * Null means "not known yet", and the UI shows a dash for it.
 */
/**
 * Name, artwork and canonical URL for a collection. Cached far longer than
 * stats because it barely changes, which keeps the per-slug cost at roughly
 * one upstream call once warm.
 */
export async function fetchMeta(slug) {
  // Key is versioned: adding a field to a cached shape would otherwise serve
  // 6h-old entries that lack it.
  const { value } = await cached(`rht:os:meta2:${slug}`, 21600, async () => {
    const c = await osFetch(`/collections/${encodeURIComponent(slug)}`);
    return {
      name: c.name || slug,
      img: c.image_url || "",
      url: c.opensea_url || `https://opensea.io/collection/${slug}`,
      // Slug guesses can land on a same-named collection from another chain,
      // so callers need this to confirm they matched the right one.
      chains: [...new Set((c.contracts || []).map((x) => x.chain).filter(Boolean))],
    };
  });
  return value;
}

/**
 * Spread expiries over 5-10 minutes instead of a single instant. With ~60
 * tracked collections a fixed TTL means they all go stale together and the
 * next request fires 60 upstream calls at once.
 */
function jitteredTtl(slug, base) {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return base + (h % base);
}

export async function fetchStats(slug) {
  const { value, cached: wasCached } = await cached(`rht:os:stats:${slug}`, jitteredTtl(slug, 300), async () => {
    const data = await osFetch(`/collections/${encodeURIComponent(slug)}/stats`);
    const total = data.total || {};
    const intervals = data.intervals || [];
    const day = intervals.find((i) => i.interval === "one_day") || {};
    const week = intervals.find((i) => i.interval === "seven_day") || {};
    const month = intervals.find((i) => i.interval === "thirty_day") || {};
    return {
      slug,
      floor: total.floor_price ?? null,
      floorSymbol: total.floor_price_symbol || "ETH",
      volume: total.volume ?? null,
      sales: total.sales ?? null,
      owners: total.num_owners ?? null,
      volume24h: day.volume ?? null,
      sales24h: day.sales ?? null,
      // Windows a 24h spike can be measured against. On a chain this young most
      // collections are under a week old, so 7d often equals 24h and only the
      // 30d window (or our own snapshot) gives a usable baseline.
      volume7d: week.volume ?? null,
      sales7d: week.sales ?? null,
      volume30d: month.volume ?? null,
      sales30d: month.sales ?? null,
    };
  });

  // Artwork/link failures must not sink the numbers, which are the point.
  const meta = await fetchMeta(slug).catch(() => null);
  const change24h = await floorChange(slug, value.floor, wasCached);
  const prevVolume = await volumeBaseline(slug, value.volume, wasCached).catch(() => null);
  return { ...value, ...(meta || {}), change24h, prevVolume };
}

/**
 * How far today's volume runs ahead of the collection's own recent norm.
 *
 * The baseline is the average day in a window *excluding* today, so a spike is
 * not diluted by the very day being measured. The 7d window is preferred, but
 * on the Robinhood chain most collections are younger than a week and report
 * 7d == 24h, which yields no baseline at all - so it falls back to the 30d
 * window, then to a volume snapshot we recorded ourselves ~24h ago.
 *
 * Returns null rather than a number when nothing usable exists: a collection
 * whose first-ever sale is today has no "before" to compare against, and
 * dividing by ~0 would report an infinite spike.
 */
export function volumeSpike(s, prevTotal) {
  const day = s.volume24h;
  if (typeof day !== "number" || !(day > 0)) return null;

  const windows = [
    [s.volume7d, 6],
    [s.volume30d, 29],
  ];
  for (const [total, priorDayCount] of windows) {
    if (typeof total !== "number") continue;
    const priorDays = (total - day) / priorDayCount;
    if (priorDays > 0) return +(day / priorDays).toFixed(2);
  }

  // Our own snapshot: how much lifetime volume accrued before yesterday.
  if (typeof prevTotal === "number" && typeof s.volume === "number") {
    const sinceSnapshot = s.volume - prevTotal;
    if (prevTotal > 0 && sinceSnapshot > 0) return +(sinceSnapshot / prevTotal).toFixed(2);
  }
  return null;
}

/**
 * Record lifetime volume once a day so a spike stays measurable even when
 * OpenSea's own windows collapse (7d == 24h on a young collection). Returns
 * the value from ~24h ago, or null the first time we see the collection.
 */
export async function volumeBaseline(slug, total, wasCached) {
  if (typeof total !== "number") return null;
  const key = `rht:os:vol24:${slug}`;
  const prev = await readJson(key, null);
  if (prev == null) {
    // Seed only on a fresh upstream read, so cache hits cannot reset the clock.
    if (!wasCached) await writeJson(key, total, 86400);
    return null;
  }
  return typeof prev === "number" ? prev : null;
}

async function floorChange(slug, floor, wasCached) {
  if (floor == null) return null;
  const key = `rht:os:floor24:${slug}`;
  const prev = await readJson(key, null);
  if (prev == null) {
    // Seed the window. Only on a fresh upstream read, so a burst of cache hits
    // cannot reset the 24h clock.
    if (!wasCached) await writeJson(key, floor, 86400);
    return null;
  }
  if (!prev) return null;
  return +(((floor - prev) / prev) * 100).toFixed(1);
}
