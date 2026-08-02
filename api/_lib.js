// Shared limits, sanitisers and response helpers for the /api functions.
// Kept byte-for-byte compatible with server/index.mjs so the client contract
// (and the local dev server) do not drift apart.

export const SECTIONS = [
  "trending",
  "marketplace",
  "contacts",
  "runner",
  "quests",
  "leaderboard",
  "suggestions",
  "profile",
];

export const MAX_STORED = 500;
export const MAX_SCORES = 100;
export const MAX_PROFILES = 5000;
export const MAX_NAME = 24;
export const MAX_TEXT = 280;

export const KEYS = {
  suggestions: "rht:suggestions",
  scores: "rht:scores",
  profiles: "rht:profiles",
  sections: "rht:sections",
};

export const SUGGESTION_SEED = [
  { id: 1, name: "Robin", text: "Add a global leaderboard for top Rug Runner scores!", ts: Date.now() - 5400e3 },
  { id: 2, name: "Sherwood", text: "Would love push alerts when a watched NFT is about to mint.", ts: Date.now() - 2400e3 },
];

export const SCORE_SEED = [
  { id: 1, name: "Robin", score: 640, ts: Date.now() - 7200e3 },
  { id: 2, name: "Sherwood", score: 420, ts: Date.now() - 3600e3 },
  { id: 3, name: "Tuck", score: 260, ts: Date.now() - 1800e3 },
];

export const DEFAULT_SECTIONS = Object.fromEntries(SECTIONS.map((s) => [s, "open"]));

export function clean(str, max) {
  // Drop control chars (keep tab + newline) without a control-char regex.
  const kept = [...String(str ?? "")].filter((c) => {
    const n = c.charCodeAt(0);
    return n === 9 || n === 10 || (n >= 32 && n !== 127);
  });
  return kept.join("").trim().slice(0, max);
}

export function cleanHandle(v) {
  const t = clean(v, 40).replace(/^@/, "");
  const m = t.match(/(?:x\.com|twitter\.com)\/([A-Za-z0-9_]+)/i);
  return (m ? m[1] : t).replace(/[^A-Za-z0-9_]/g, "").slice(0, 24);
}

export function cleanWallet(v) {
  const t = clean(v, 60);
  return /^0x[a-fA-F0-9]{40}$/.test(t) ? t : "";
}

export function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function json(res, code, body) {
  cors(res);
  // These are live, user-writable feeds - never let the CDN or browser cache them.
  res.setHeader("Cache-Control", "no-store");
  res.status(code).json(body);
}

/** Handles OPTIONS preflight. Returns true when the request is fully served. */
export function preflight(req, res) {
  if (req.method !== "OPTIONS") return false;
  cors(res);
  res.status(204).end();
  return true;
}

/**
 * Vercel parses JSON bodies for us, but a raw string arrives when the client
 * omits the content-type. Normalise both, and never throw.
 */
export function body(req) {
  const b = req.body;
  if (b && typeof b === "object") return b;
  try {
    return JSON.parse(b || "{}");
  } catch {
    return null;
  }
}

/**
 * The admin key gates reading collected profiles and flipping section status.
 * Unset in production means locked, not open - the dev default only applies
 * outside production so `vercel dev` keeps working.
 */
export function adminOk(req) {
  const expected = process.env.ADMIN_KEY || (process.env.VERCEL_ENV === "production" ? "" : "dev-admin-key");
  if (!expected) return false;
  const key = req.query?.key;
  return (Array.isArray(key) ? key[0] : key) === expected;
}
