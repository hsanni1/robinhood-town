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
  const { value } = await cached(`rht:os:meta:${slug}`, 21600, async () => {
    const c = await osFetch(`/collections/${encodeURIComponent(slug)}`);
    return {
      name: c.name || slug,
      img: c.image_url || "",
      url: c.opensea_url || `https://opensea.io/collection/${slug}`,
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
    const day = (data.intervals || []).find((i) => i.interval === "one_day") || {};
    return {
      slug,
      floor: total.floor_price ?? null,
      floorSymbol: total.floor_price_symbol || "ETH",
      volume: total.volume ?? null,
      sales: total.sales ?? null,
      owners: total.num_owners ?? null,
      volume24h: day.volume ?? null,
      sales24h: day.sales ?? null,
    };
  });

  // Artwork/link failures must not sink the numbers, which are the point.
  const meta = await fetchMeta(slug).catch(() => null);
  const change24h = await floorChange(slug, value.floor, wasCached);
  return { ...value, ...(meta || {}), change24h };
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
