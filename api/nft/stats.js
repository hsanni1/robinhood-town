import { fetchStats, hasKey } from "../_opensea.js";
import { json, param, preflight } from "../_lib.js";

// Every displayed collection needs stats, so this has to cover the curated
// viral + upcoming lists plus whatever the reveal has surfaced.
const MAX_SLUGS = 40;
// OpenSea's limit is ~120/window and each slug costs up to two calls, so fan
// out in bounded waves rather than firing 80 requests at once.
const CONCURRENCY = 6;

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

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  if (req.method !== "GET") return json(res, 405, { error: "method not allowed" });

  const raw = param(req, "slugs") || param(req, "slug") || "";
  const slugs = [
    ...new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ].slice(0, MAX_SLUGS);

  if (!slugs.length) return json(res, 400, { error: "slug(s) required" });

  // Stats are key-gated too. Unauthenticated calls only appear to work when
  // Cloudflare happens to have the response edge-cached; every cold slug 401s.
  // Bail early rather than burn upstream calls on guaranteed failures.
  if (!hasKey) return json(res, 503, { error: "OPENSEA_API_KEY not configured" });

  const results = await mapLimit(slugs, CONCURRENCY, async (slug) => {
    try {
      return await fetchStats(slug);
    } catch (e) {
      console.error(`stats ${slug} failed:`, e.message);
      return { slug, error: true };
    }
  });

  return json(res, 200, Object.fromEntries(results.map((r) => [r.slug, r])));
}
