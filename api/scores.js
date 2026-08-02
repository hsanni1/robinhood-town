import { readJson, writeJson } from "./_store.js";
import { KEYS, MAX_NAME, MAX_SCORES, SCORE_SEED, body, clean, json, preflight } from "./_lib.js";

export default async function handler(req, res) {
  if (preflight(req, res)) return;

  if (req.method === "GET") {
    const scores = await readJson(KEYS.scores, SCORE_SEED);
    const top = [...scores].sort((a, b) => b.score - a.score).slice(0, 25);
    return json(res, 200, top);
  }

  if (req.method === "POST") {
    const payload = body(req);
    if (!payload) return json(res, 400, { error: "invalid JSON" });

    const score = Math.max(0, Math.min(1e7, Math.floor(Number(payload.score) || 0)));
    if (!score) return json(res, 400, { error: "score required" });

    const entry = { id: Date.now(), name: clean(payload.name, MAX_NAME) || "Anon", score, ts: Date.now() };
    let scores = await readJson(KEYS.scores, SCORE_SEED);
    if (!Array.isArray(scores)) scores = [...SCORE_SEED];
    scores.push(entry);
    // keep only the top scores
    scores = scores.sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
    await writeJson(KEYS.scores, scores);
    const rank = scores.findIndex((s) => s.id === entry.id) + 1;
    return json(res, 201, { ...entry, rank });
  }

  return json(res, 405, { error: "method not allowed" });
}
