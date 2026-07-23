// Minimal shared-suggestions backend - pure Node, zero dependencies.
// Persists to server/suggestions.json so every visitor hitting this server
// sees the same feed. Swap for a hosted DB (Supabase/Firestore) later by
// keeping the same GET/POST /api/suggestions contract.
import http from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE = join(__dirname, "suggestions.json");
const SCORE_FILE = join(__dirname, "scores.json");
const PROFILE_FILE = join(__dirname, "profiles.json");
const SECTION_FILE = join(__dirname, "sections.json");
const SECTIONS = ["trending", "marketplace", "contacts", "runner", "quests", "leaderboard", "suggestions", "profile"];
const PORT = process.env.PORT || 8787;
const MAX_STORED = 500;
const MAX_SCORES = 100;
const MAX_PROFILES = 5000;
const MAX_NAME = 24;
const MAX_TEXT = 280;
// Admin key gates reading collected profiles. Set ADMIN_KEY in production.
const ADMIN_KEY = process.env.ADMIN_KEY || "dev-admin-key";

const SEED = [
  { id: 1, name: "Robin", text: "Add a global leaderboard for top Rug Runner scores!", ts: Date.now() - 5400e3 },
  { id: 2, name: "Sherwood", text: "Would love push alerts when a watched NFT is about to mint.", ts: Date.now() - 2400e3 },
];

function loadJson(file, fallback) {
  try {
    if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    /* fall through */
  }
  return fallback;
}

function writeJson(file, data) {
  try {
    writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("save failed:", e.message);
  }
}

function loadDb() {
  const existing = loadJson(DB_FILE, null);
  if (existing) return existing;
  writeJson(DB_FILE, SEED);
  return [...SEED];
}

function saveDb(v) {
  writeJson(DB_FILE, v);
}

const SCORE_SEED = [
  { id: 1, name: "Robin", score: 640, ts: Date.now() - 7200e3 },
  { id: 2, name: "Sherwood", score: 420, ts: Date.now() - 3600e3 },
  { id: 3, name: "Tuck", score: 260, ts: Date.now() - 1800e3 },
];

let items = loadDb();
let scores = loadJson(SCORE_FILE, null) || (writeJson(SCORE_FILE, SCORE_SEED), [...SCORE_SEED]);
let profiles = loadJson(PROFILE_FILE, []);

// Section status: "open" or "maintenance" (shows as "coming soon" in the app).
let sections = loadJson(SECTION_FILE, null);
if (!sections) {
  sections = Object.fromEntries(SECTIONS.map((s) => [s, "open"]));
  writeJson(SECTION_FILE, sections);
}

function cleanHandle(v) {
  const t = clean(v, 40).replace(/^@/, "");
  const m = t.match(/(?:x\.com|twitter\.com)\/([A-Za-z0-9_]+)/i);
  return (m ? m[1] : t).replace(/[^A-Za-z0-9_]/g, "").slice(0, 24);
}

function cleanWallet(v) {
  const t = clean(v, 60);
  return /^0x[a-fA-F0-9]{40}$/.test(t) ? t : "";
}

function clean(str, max) {
  // Drop control chars (keep tab + newline) without a control-char regex.
  const kept = [...String(str ?? "")].filter((c) => {
    const n = c.charCodeAt(0);
    return n === 9 || n === 10 || (n >= 32 && n !== 127);
  });
  return kept.join("").trim().slice(0, max);
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, code, body) {
  cors(res);
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    cors(res);
    res.writeHead(204);
    return res.end();
  }

  if (url.pathname === "/api/suggestions" && req.method === "GET") {
    return json(res, 200, items);
  }

  if (url.pathname === "/api/suggestions" && req.method === "POST") {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 4096) req.destroy();
    });
    req.on("end", () => {
      let body;
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        return json(res, 400, { error: "invalid JSON" });
      }
      const text = clean(body.text, MAX_TEXT);
      if (!text) return json(res, 400, { error: "text required" });
      const item = { id: Date.now(), name: clean(body.name, MAX_NAME) || "Anon", text, ts: Date.now() };
      items.push(item);
      if (items.length > MAX_STORED) items = items.slice(-MAX_STORED);
      saveDb(items);
      return json(res, 201, item);
    });
    return;
  }

  // ---- leaderboard ----
  if (url.pathname === "/api/scores" && req.method === "GET") {
    const top = [...scores].sort((a, b) => b.score - a.score).slice(0, 25);
    return json(res, 200, top);
  }

  if (url.pathname === "/api/scores" && req.method === "POST") {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 1024) req.destroy();
    });
    req.on("end", () => {
      let body;
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        return json(res, 400, { error: "invalid JSON" });
      }
      const score = Math.max(0, Math.min(1e7, Math.floor(Number(body.score) || 0)));
      if (!score) return json(res, 400, { error: "score required" });
      const entry = { id: Date.now(), name: clean(body.name, MAX_NAME) || "Anon", score, ts: Date.now() };
      scores.push(entry);
      // keep only the top scores
      scores = [...scores].sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
      writeJson(SCORE_FILE, scores);
      const rank = scores.findIndex((s) => s.id === entry.id) + 1;
      return json(res, 201, { ...entry, rank });
    });
    return;
  }

  // ---- profiles: collect on save (public POST), read admin-only (GET w/ key) ----
  if (url.pathname === "/api/profiles" && req.method === "POST") {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 2048) req.destroy();
    });
    req.on("end", () => {
      let body;
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        return json(res, 400, { error: "invalid JSON" });
      }
      const cid = clean(body.cid, 64) || `anon-${Date.now()}`;
      const entry = {
        cid,
        username: clean(body.username, MAX_NAME),
        x: cleanHandle(body.x),
        wallet: cleanWallet(body.wallet),
        updatedAt: Date.now(),
      };
      const existing = profiles.find((p) => p.cid === cid);
      if (existing) {
        Object.assign(existing, entry);
      } else {
        entry.createdAt = Date.now();
        profiles.push(entry);
        if (profiles.length > MAX_PROFILES) profiles = profiles.slice(-MAX_PROFILES);
      }
      writeJson(PROFILE_FILE, profiles);
      return json(res, 201, { ok: true });
    });
    return;
  }

  if (url.pathname === "/api/profiles" && req.method === "GET") {
    if (url.searchParams.get("key") !== ADMIN_KEY) {
      return json(res, 401, { error: "unauthorized" });
    }
    return json(res, 200, { count: profiles.length, profiles });
  }

  // ---- section status: public GET, admin-key POST ----
  if (url.pathname === "/api/sections" && req.method === "GET") {
    return json(res, 200, sections);
  }

  if (url.pathname === "/api/sections" && req.method === "POST") {
    if (url.searchParams.get("key") !== ADMIN_KEY) {
      return json(res, 401, { error: "unauthorized" });
    }
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 512) req.destroy();
    });
    req.on("end", () => {
      let body;
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        return json(res, 400, { error: "invalid JSON" });
      }
      const section = String(body.section || "");
      const status = body.status === "maintenance" ? "maintenance" : "open";
      if (!SECTIONS.includes(section)) return json(res, 400, { error: "unknown section" });
      sections[section] = status;
      writeJson(SECTION_FILE, sections);
      return json(res, 200, sections);
    });
    return;
  }

  json(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT} - suggestions:${items.length} scores:${scores.length} profiles:${profiles.length}`);
  console.log("Admin: GET /api/profiles?key=<ADMIN_KEY>  (key from env, never logged)");
  if (ADMIN_KEY === "dev-admin-key") console.log("WARNING: using default ADMIN_KEY. Set ADMIN_KEY env var before deploying.");
});
