# Robinhood Town

A play-to-learn trading adventure (Vite + React). Trending tab shows live
Robinhood-Chain tokens (CoinGecko) and real Robinhood-chain NFT collections
(OpenSea), plus a Rug Runner mini-game, quests, and a shared suggestions chat.

## Run

The app needs **two processes** — the Vite dev server and the suggestions API:

```bash
npm install
npm run server   # suggestions backend on http://localhost:8787
npm run dev      # app on http://localhost:5199 (proxies /api -> :8787)
```

Open http://localhost:5199 and hit the ☰ toggle (top-right) for the shared
suggestions board.

## Suggestions backend

`server/index.mjs` is a tiny zero-dependency Node HTTP server that persists to
`server/suggestions.json`. Everyone hitting the same server sees the same feed.

- `GET  /api/suggestions` → array of `{ id, name, text, ts }`
- `POST /api/suggestions` with `{ name?, text }` → the created item

**Deploy for real internet-wide sharing:** host `server/index.mjs` on any Node
host (Render / Railway / Fly / a VPS), then build the client with the API base
pointed at it:

```bash
VITE_SUGGESTIONS_API="https://your-api.example.com/api" npm run build
```

The client falls back to `localStorage` and shows an "Offline (local)" badge if
the API is unreachable, so a note is never lost.

**Prefer a managed DB?** The same `GET`/`POST /api/suggestions` contract maps
directly onto Supabase or Firestore — swap `server/index.mjs` for a serverless
function backed by either and keep the client unchanged.
