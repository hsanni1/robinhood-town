import { readJson, writeJson } from "./_store.js";
import { KEYS, MAX_NAME, MAX_PROFILES, adminOk, body, clean, cleanHandle, cleanWallet, json, preflight } from "./_lib.js";

export default async function handler(req, res) {
  if (preflight(req, res)) return;

  // Collected on save by any visitor; readable only with the admin key.
  if (req.method === "POST") {
    const payload = body(req);
    if (!payload) return json(res, 400, { error: "invalid JSON" });

    const cid = clean(payload.cid, 64) || `anon-${Date.now()}`;
    const entry = {
      cid,
      username: clean(payload.username, MAX_NAME),
      x: cleanHandle(payload.x),
      wallet: cleanWallet(payload.wallet),
      updatedAt: Date.now(),
    };

    let profiles = await readJson(KEYS.profiles, []);
    if (!Array.isArray(profiles)) profiles = [];
    const existing = profiles.find((p) => p.cid === cid);
    if (existing) {
      Object.assign(existing, entry);
    } else {
      entry.createdAt = Date.now();
      profiles.push(entry);
      if (profiles.length > MAX_PROFILES) profiles = profiles.slice(-MAX_PROFILES);
    }
    await writeJson(KEYS.profiles, profiles);
    return json(res, 201, { ok: true });
  }

  if (req.method === "GET") {
    if (!adminOk(req)) return json(res, 401, { error: "unauthorized" });
    const profiles = await readJson(KEYS.profiles, []);
    return json(res, 200, { count: profiles.length, profiles });
  }

  return json(res, 405, { error: "method not allowed" });
}
