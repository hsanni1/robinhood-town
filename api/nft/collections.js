import { fetchCollections, hasKey } from "../_opensea.js";
import { json, preflight } from "../_lib.js";

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  if (req.method !== "GET") return json(res, 405, { error: "method not allowed" });

  // Chain filtering is the one thing OpenSea requires a key for. Without it,
  // say so plainly so the client keeps its bundled pool instead of blanking.
  if (!hasKey) return json(res, 503, { error: "OPENSEA_API_KEY not configured", collections: [] });

  try {
    const { value, cached, stale } = await fetchCollections();
    return json(res, 200, { collections: value, cached: Boolean(cached), stale: Boolean(stale) });
  } catch (e) {
    console.error("collections failed:", e.message);
    return json(res, 502, { error: "upstream unavailable", collections: [] });
  }
}
