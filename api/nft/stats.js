import { fetchStats, hasKey } from "../_opensea.js";
import { json, param, preflight } from "../_lib.js";

// Cap the fan-out: one client request must not turn into 60 upstream calls.
const MAX_SLUGS = 12;

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  if (req.method !== "GET") return json(res, 405, { error: "method not allowed" });

  const raw = param(req, "slugs") || param(req, "slug") || "";
  const slugs = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_SLUGS);

  if (!slugs.length) return json(res, 400, { error: "slug(s) required" });

  // Stats are key-gated too. Unauthenticated calls only appear to work when
  // Cloudflare happens to have the response edge-cached; every cold slug 401s.
  // Bail early rather than burn a dozen upstream calls on guaranteed failures.
  if (!hasKey) return json(res, 503, { error: "OPENSEA_API_KEY not configured" });

  const results = await Promise.all(
    slugs.map(async (slug) => {
      try {
        return await fetchStats(slug);
      } catch (e) {
        console.error(`stats ${slug} failed:`, e.message);
        return { slug, error: true };
      }
    })
  );

  return json(res, 200, Object.fromEntries(results.map((r) => [r.slug, r])));
}
