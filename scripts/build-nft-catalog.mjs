// Writes public/nft-catalog.json from the in-app NFT lists so the admin
// Graphic Studio (public/admin.html) can match pasted names to artwork.
// Runs via the "prebuild" npm script, so every deploy ships a fresh catalog.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { NFT_VIRAL, NFT_UPCOMING_MINTS } = await import(join(root, "src/data/assets.js"));
const { NFT_POOL } = await import(join(root, "src/data/nftPool.js"));

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

const byKey = new Map();
// Curated lists first so their local /nft/*.avif art and floors win over the
// scraped pool's 96px thumbnails when the same collection appears in both.
for (const n of [...NFT_VIRAL, ...NFT_UPCOMING_MINTS, ...NFT_POOL]) {
  const key = norm(n.name);
  if (!key || byKey.has(key)) continue;
  const entry = { name: n.name, img: n.img || null };
  if (typeof n.floor === "number") entry.floor = n.floor;
  byKey.set(key, entry);
}

const catalog = [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
const out = join(root, "public/nft-catalog.json");
writeFileSync(out, JSON.stringify(catalog));
console.log(`nft-catalog.json: ${catalog.length} collections`);
