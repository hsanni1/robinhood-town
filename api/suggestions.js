import { readJson, writeJson } from "./_store.js";
import { KEYS, MAX_STORED, MAX_NAME, MAX_TEXT, SUGGESTION_SEED, adminOk, body, clean, json, param, preflight } from "./_lib.js";

export default async function handler(req, res) {
  if (preflight(req, res)) return;

  if (req.method === "GET") {
    const items = await readJson(KEYS.suggestions, SUGGESTION_SEED);
    return json(res, 200, items);
  }

  if (req.method === "POST") {
    const payload = body(req);
    if (!payload) return json(res, 400, { error: "invalid JSON" });

    const text = clean(payload.text, MAX_TEXT);
    if (!text) return json(res, 400, { error: "text required" });

    const item = { id: Date.now(), name: clean(payload.name, MAX_NAME) || "Anon", text, ts: Date.now() };
    let items = await readJson(KEYS.suggestions, SUGGESTION_SEED);
    if (!Array.isArray(items)) items = [...SUGGESTION_SEED];
    items.push(item);
    if (items.length > MAX_STORED) items = items.slice(-MAX_STORED);
    await writeJson(KEYS.suggestions, items);
    return json(res, 201, item);
  }

  // Moderation: remove one entry by id. Admin-gated - the feed is public.
  if (req.method === "DELETE") {
    if (!adminOk(req)) return json(res, 401, { error: "unauthorized" });

    const id = Number(param(req, "id"));
    if (!id) return json(res, 400, { error: "id required" });

    const items = await readJson(KEYS.suggestions, SUGGESTION_SEED);
    const kept = items.filter((s) => s.id !== id);
    if (kept.length === items.length) return json(res, 404, { error: "not found" });
    await writeJson(KEYS.suggestions, kept);
    return json(res, 200, { removed: id, remaining: kept.length });
  }

  return json(res, 405, { error: "method not allowed" });
}
