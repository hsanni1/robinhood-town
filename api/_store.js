// Storage adapter for the Vercel deployment.
//
// server/index.mjs keeps state in JSON files, which works locally but not on
// Vercel: the serverless filesystem is read-only and instances are not shared.
// This talks to Upstash Redis over its REST API instead (no dependency needed
// - it is one fetch call), and falls back to a per-instance in-memory store so
// the app still renders if the store is not wired up yet.
//
// Env vars: the Vercel Marketplace Upstash integration sets
// UPSTASH_REDIS_REST_URL/TOKEN; older Vercel KV stores set KV_REST_API_URL/TOKEN.
// Either pair works.
const REST_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

export const hasRedis = Boolean(REST_URL && REST_TOKEN);

// Survives warm invocations only - a deliberate degraded mode, not persistence.
const memory = new Map();

async function command(args) {
  const res = await fetch(REST_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`upstash HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

/**
 * Read a JSON value. Returns `fallback` when the key is unset, and also when
 * the store errors - the game is better off serving seed data than a 500.
 */
export async function readJson(key, fallback) {
  if (!hasRedis) return memory.has(key) ? memory.get(key) : fallback;
  try {
    const raw = await command(["GET", key]);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`read ${key} failed:`, e.message);
    return fallback;
  }
}

/**
 * Write a JSON value. Resolves to false if the write did not stick.
 * Pass `ttlSeconds` to have Redis expire the key - used for the OpenSea
 * caches, which should go stale rather than serve month-old floor prices.
 */
export async function writeJson(key, value, ttlSeconds) {
  if (!hasRedis) {
    memory.set(key, value);
    return false;
  }
  try {
    const args = ["SET", key, JSON.stringify(value)];
    if (ttlSeconds > 0) args.push("EX", String(Math.floor(ttlSeconds)));
    await command(args);
    return true;
  } catch (e) {
    console.error(`write ${key} failed:`, e.message);
    return false;
  }
}
