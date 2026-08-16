import { fetchCollections, fetchStats, hasKey, volumeSpike } from "../_opensea.js";
import { readJson, writeJson } from "../_store.js";
import { json, param, preflight } from "../_lib.js";

const SCAN = 60;
const CONCURRENCY = 6;

// A day has to run this far ahead of the collection's own recent average to
// count as "sudden" rather than just a busy day.
const MIN_SPIKE = 2.5;
// Ignore dust: 0.0001 -> 0.001 is a 10x that means nothing.
const MIN_VOLUME_24H = 0.05;

const MAX_ROWS = 12;
const MAX_EXTRA = 70;
const CACHE_KEY = "rht:os:pulse";
const CACHE_TTL = 600;

/** Order-independent fingerprint of the extra slug set, for the cache key. */
function hashSet(slugs) {
  let h = 2166136261;
  for (const s of [...slugs].sort()) {
    for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  }
  return (h >>> 0).toString(36);
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

function row(c, s, extra) {
  return {
    name: c.name,
    slug: c.slug,
    img: s.img || c.img,
    url: s.url || c.url,
    volume24h: s.volume24h,
    volume7d: s.volume7d,
    sales24h: s.sales24h,
    sales: s.sales,
    owners: s.owners,
    floor: s.floor,
    floorSymbol: s.floorSymbol,
    ...extra,
  };
}

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  if (req.method !== "GET") return json(res, 405, { error: "method not allowed" });
  if (!hasKey) return json(res, 503, { error: "OPENSEA_API_KEY not configured", gainers: [] });

  const extra = [
    ...new Set(
      (param(req, "slugs") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ].slice(0, MAX_EXTRA);

  // Scanning this many collections is far too expensive per visitor, so the
  // computed result is cached and everyone shares it. The key covers the extra
  // set so a different caller cannot poison the shared entry.
  const cacheKey = `${CACHE_KEY}:${hashSet(extra)}`;
  const hit = await readJson(cacheKey, null);
  if (hit && hit.expires > Date.now()) {
    return json(res, 200, { ...hit.value, cached: true });
  }

  try {
    const { value: collections } = await fetchCollections();
    // The chain list skews brand-new, and a collection with no history cannot
    // spike by definition. Callers pass their established slugs so the ones
    // with a real baseline are actually watched.
    const known = new Map(collections.map((c) => [c.slug, c]));
    for (const slug of extra) if (!known.has(slug)) known.set(slug, { slug, name: slug, img: "", url: "" });
    const scan = [...collections.slice(0, SCAN), ...extra.filter((s) => !collections.some((c) => c.slug === s)).map((s) => known.get(s))];

    const scanned = await mapLimit(scan, CONCURRENCY, async (c) => {
      try {
        return { c, s: await fetchStats(c.slug) };
      } catch {
        return null; // one bad collection must not sink the section
      }
    });

    const gainers = [];
    for (const item of scanned) {
      if (!item) continue;
      const { c, s } = item;
      const spike = volumeSpike(s, s.prevVolume);
      if (spike != null && spike >= MIN_SPIKE && s.volume24h >= MIN_VOLUME_24H) {
        gainers.push(row(c, s, { spike }));
      }
    }
    gainers.sort((a, b) => b.spike - a.spike);

    const value = { gainers: gainers.slice(0, MAX_ROWS) };
    await writeJson(cacheKey, { value, expires: Date.now() + CACHE_TTL * 1000 }, CACHE_TTL * 3);
    return json(res, 200, { ...value, cached: false });
  } catch (e) {
    console.error("pulse failed:", e.message);
    // Stale beats empty for sections meant to always show something.
    if (hit) return json(res, 200, { ...hit.value, cached: true, stale: true });
    return json(res, 502, { error: "upstream unavailable", gainers: [] });
  }
}
