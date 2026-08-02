import { readJson, writeJson } from "./_store.js";
import { KEYS, MAX_STORED, MAX_NAME, MAX_TEXT, SUGGESTION_SEED, body, clean, json, preflight } from "./_lib.js";

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

  return json(res, 405, { error: "method not allowed" });
}
