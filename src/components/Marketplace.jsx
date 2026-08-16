import { useState } from "react";
import { useGame } from "../state/GameContext.jsx";
import { NFT_VIRAL, NFT_UPCOMING_MINTS, TOKENS } from "../data/assets.js";
import { NFT_POOL } from "../data/nftPool.js";
import { usePagination } from "../hooks/usePagination.js";
import Pagination from "./Pagination.jsx";

const PER_PAGE = 12;

// All NFT collections across the feed, deduped by slug.
const ALL_NFTS = (() => {
  const seen = new Set();
  return [...NFT_VIRAL, ...NFT_UPCOMING_MINTS, ...NFT_POOL].filter((n) => {
    if (seen.has(n.slug)) return false;
    seen.add(n.slug);
    return true;
  });
})();

function fmtPrice(p) {
  if (p == null) return null;
  return p < 1 ? p.toFixed(4) : p.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function Marketplace() {
  const { market } = useGame();
  const [tab, setTab] = useState("nfts");
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const nfts = ALL_NFTS.filter((n) => n.name.toLowerCase().includes(query));
  const tokens = Object.keys(TOKENS)
    .map((sym) => {
      const t = TOKENS[sym];
      const price = market.real[sym]?.price ?? market.prices[sym]?.price;
      return { ...t, key: sym, price };
    })
    .filter((t) => (t.name + t.symbol).toLowerCase().includes(query));

  const list = tab === "nfts" ? nfts : tokens;
  const pg = usePagination(list.length, PER_PAGE);
  const pageItems = pg.paginate(list);

  const switchTab = (next) => {
    setTab(next);
    pg.setPage(1);
  };

  return (
    <div className="nb-card" style={{ padding: 14 }}>
      <h2 style={{ fontSize: 16, marginBottom: 4 }}>Marketplace</h2>
      <p className="dim" style={{ fontSize: 12, marginBottom: 12 }}>
        Browse every collection and token on the Robinhood chain. Tap to open on OpenSea or Uniswap.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <button className={`nb-btn ${tab === "nfts" ? "nb-btn-primary" : ""}`} onClick={() => switchTab("nfts")}>
          NFTs ({ALL_NFTS.length})
        </button>
        <button className={`nb-btn ${tab === "tokens" ? "nb-btn-primary" : ""}`} onClick={() => switchTab("tokens")}>
          Tokens ({Object.keys(TOKENS).length})
        </button>
      </div>

      <input
        className="nb-input"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          pg.setPage(1);
        }}
        placeholder={tab === "nfts" ? "Search collections..." : "Search tokens..."}
        aria-label="Search marketplace"
        style={{ marginBottom: 14 }}
      />

      {list.length === 0 ? (
        <p className="dim" style={{ fontSize: 13 }}>No matches for &ldquo;{q}&rdquo;.</p>
      ) : (
        <div className="mkt-grid">
          {tab === "nfts"
            ? pageItems.map((n) => (
                <a key={n.slug} href={n.url} target="_blank" rel="noopener noreferrer" className="mkt-card" title={`View ${n.name} on OpenSea`}>
                  <div className="mkt-thumb">
                    <img src={n.img} alt={n.name} loading="lazy" />
                  </div>
                  <div className="mkt-name">{n.name}</div>
                  <div className="mkt-meta">{n.floor != null ? `${n.floor} ${n.floorSymbol || "ETH"} floor` : n.price ? `${n.price} mint` : "OpenSea"}</div>
                </a>
              ))
            : pageItems.map((t) => (
                <a key={t.key} href={t.tradeUrl} target="_blank" rel="noopener noreferrer" className="mkt-card" title={`View ${t.symbol} market data`}>
                  <div className="mkt-thumb" style={{ background: t.color }}>
                    <img src={t.img} alt={t.name} loading="lazy" style={{ objectFit: "contain", padding: "18%" }} />
                  </div>
                  <div className="mkt-name">{t.symbol}</div>
                  <div className="mkt-meta">{fmtPrice(t.price) ? `$${fmtPrice(t.price)}` : t.kind}</div>
                </a>
              ))}
        </div>
      )}

      <Pagination page={pg.page} totalPages={pg.totalPages} onPageChange={pg.setPage} label="Marketplace pagination" />
    </div>
  );
}
