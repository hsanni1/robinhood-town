import { readJson, writeJson } from "./_store.js";
import { DEFAULT_SECTIONS, KEYS, SECTIONS, adminOk, body, json, preflight } from "./_lib.js";

export default async function handler(req, res) {
  if (preflight(req, res)) return;

  if (req.method === "GET") {
    const sections = await readJson(KEYS.sections, DEFAULT_SECTIONS);
    return json(res, 200, { ...DEFAULT_SECTIONS, ...sections });
  }

  if (req.method === "POST") {
    if (!adminOk(req)) return json(res, 401, { error: "unauthorized" });

    const payload = body(req);
    if (!payload) return json(res, 400, { error: "invalid JSON" });

    const section = String(payload.section || "");
    const status = payload.status === "maintenance" ? "maintenance" : "open";
    if (!SECTIONS.includes(section)) return json(res, 400, { error: "unknown section" });

    const sections = { ...DEFAULT_SECTIONS, ...(await readJson(KEYS.sections, {})) };
    sections[section] = status;
    await writeJson(KEYS.sections, sections);
    return json(res, 200, sections);
  }

  return json(res, 405, { error: "method not allowed" });
}
