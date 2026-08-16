import { useEffect, useMemo } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Moon } from "lucide-react";
import { useGame } from "../state/GameContext.jsx";
import { NFT_VIRAL, NFT_UPCOMING_MINTS } from "../data/assets.js";
import { NFT_POOL } from "../data/nftPool.js";
import { usePagination } from "../hooks/usePagination.js";
import { useRobinhoodTokens } from "../hooks/useRobinhoodTokens.js";
import { useLaunchFeed } from "../hooks/useLaunchFeed.js";
import { useNftPool, useNftStats } from "../hooks/useNftLive.js";
import PriceChart from "./PriceChart.jsx";
import AssetIcon from "./AssetIcon.jsx";
import Pagination from "./Pagination.jsx";

const HYPE_LABEL = { hot: "Hot", raffle: "Raffle", allowlist: "Allowlist" };

function Delta({ up }) {
  const Icon = up ? ArrowUp : ArrowDown;
  return <Icon size={11} strokeWidth={2.75} style={{ verticalAlign: "-1px" }} aria-label={up ? "up" : "down"} />;
}

// Simulated rows carry an invented "$NNm" volume; live rows carry real OpenSea
// volume denominated in the collection's own currency (not always ETH on this
// chain), so the two format differently.
function fmtVolume(n) {
  if (!n.live) return `$${n.volume.toFixed(0)}M`;
  if (!n.volume) return "-";
  return `${n.volume < 1 ? n.volume.toFixed(3) : n.volume.toFixed(1)} ${n.floorSymbol || "ETH"}`;
}

function fmtFloor(n) {
  const sym = n.floorSymbol || "ETH";
  if (!n.floor) return "-"; // live collection with no active listings
  return `${n.floor < 1 ? n.floor.toFixed(4) : n.floor.toFixed(2)} ${sym}`;
}

const MOVERS_PER_PAGE = 10;
const VIRAL_PER_PAGE = 6;
const MINTS_PER_PAGE = 6;

// Merge live CoinGecko data (when present) over the simulated feed.
function useAssetView() {
  const { market } = useGame();
  const { prices, real, tokens } = market;
  return (sym) => {
    const rd = real[sym];
    const sim = prices[sym];
    return {
      token: tokens[sym],
      live: Boolean(rd),
      price: rd?.price ?? sim.price,
      change24h: rd?.change24h ?? sim.change24h,
      volume: rd?.volume ?? sim.volume,
      series: rd?.sparkline ?? sim.history.map((c) => c.c),
    };
  };
}

function fmtPrice(p) {
  return p < 1 ? p.toFixed(4) : p.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtVol(v) {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v.toFixed(1)}M`;
}

function fmtCountdown(mintAt) {
  const ms = mintAt - Date.now();
  if (ms <= 0) return "Minting now";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `Mints in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Mints in ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Mints in ${days}d ${hrs % 24}h`;
}

export default function TrendingTicker() {
  const { market, progressQuest } = useGame();
  const view = useAssetView();
  const rhTokens = useRobinhoodTokens();
  // Live OpenSea collections when a key is configured, else the bundled pool.
  const { pool: nftPool } = useNftPool(NFT_POOL);
  // Curated collections are real collections, so they get real stats first -
  // they are what's actually on screen before the reveal timer surfaces any
  // pool entries. Pool slugs fill whatever budget is left.
  const statSlugs = useMemo(
    () => [
      ...NFT_VIRAL.map((n) => n.slug),
      ...NFT_UPCOMING_MINTS.map((n) => n.slug),
      ...nftPool.map((c) => c.slug),
    ],
    [nftPool]
  );
  const nftStats = useNftStats(statSlugs);
  const { viral: viralNfts, upcoming } = useLaunchFeed(NFT_VIRAL, NFT_UPCOMING_MINTS, nftPool, nftStats);

  const symbols = Object.keys(market.tokens);
  // Dedupe set: bare letters, plus the de-suffixed form of stock tokens (NVDAx -> NVDA).
  const baseSyms = new Set();
  for (const s of symbols) {
    const sym = market.tokens[s].symbol.toUpperCase().replace(/[^A-Z]/g, "");
    baseSyms.add(sym);
    if (sym.endsWith("X")) baseSyms.add(sym.slice(0, -1));
  }

  // Top Movers = curated tokens + auto-added live tokens from the Robinhood chain.
  const baseRows = symbols.map((sym) => ({ key: sym, isNew: false, ...view(sym) }));
  const rhRows = rhTokens
    .filter((c) => !baseSyms.has(c.symbol.replace(/[^A-Z]/g, "")))
    .map((c) => ({
      key: "rh-" + c.symbol,
      isNew: false,
      token: { symbol: c.symbol, name: c.name, img: c.img, color: `hsl(${c.hue} 72% 55%)`, kind: "robinhood chain", tradeUrl: c.tradeUrl },
      live: true,
      price: c.price,
      change24h: c.change24h,
      volume: c.volume,
      series: c.series,
    }));
  const movers = [...baseRows, ...rhRows].sort((a, b) => b.change24h - a.change24h);
  const byVolume = [...movers].sort((a, b) => b.volume - a.volume).slice(0, 5);
  const liveCount = movers.filter((r) => r.live).length;

  const liveNftCount = viralNfts.filter((n) => n.live).length;

  const moversPg = usePagination(movers.length, MOVERS_PER_PAGE);
  const viralPg = usePagination(viralNfts.length, VIRAL_PER_PAGE);
  const mintsPg = usePagination(upcoming.length, MINTS_PER_PAGE);

  useEffect(() => {
    progressQuest("scout", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="trending-grid">
      {/* LEFT: Top Movers */}
      <div className="nb-card" style={{ padding: 0, overflow: "hidden", alignSelf: "start" }}>
        <div style={{ padding: "10px 14px", borderBottom: "var(--line) solid var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: 16 }}>Top Movers</h2>
            <p className="dim" style={{ fontSize: 12 }}>Auto-updating - live Robinhood-Chain tokens added as they list</p>
          </div>
          <span className={`nb-badge ${liveCount ? "nb-badge-green" : ""}`} style={{ fontSize: 10 }}>
            {liveCount ? <><span className="live-dot" aria-hidden="true" /> {liveCount} LIVE</> : <><Moon size={11} strokeWidth={2.5} aria-hidden="true" /> SIM</>}
          </span>
        </div>

        <div style={{ overflow: "hidden", whiteSpace: "nowrap", padding: "8px 0", borderBottom: "var(--line) solid var(--ink)" }}>
          <div className="marquee-track" style={{ display: "inline-flex", gap: 22 }}>
            {[...movers, ...movers].map((r, i) => {
              const up = r.change24h >= 0;
              return (
                <span key={r.key + i} className="mono" style={{ fontSize: 13 }}>
                  {r.token.symbol}{" "}
                  <span className={up ? "up" : "down"}><Delta up={up} /> {Math.abs(r.change24h).toFixed(1)}%</span>
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ padding: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {moversPg.paginate(movers).map((r) => {
              const up = r.change24h >= 0;
              return (
                <a key={r.key} href={r.token.tradeUrl} target="_blank" rel="noopener noreferrer" className="asset-row" title={`View ${r.token.symbol} market data`}>
                  <AssetIcon img={r.token.img} alt={r.token.name} color={r.token.color} />
                  <div style={{ width: 66 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      {r.token.symbol}
                      {r.isNew ? <span className="tag-new">NEW</span> : r.live && <span className="live-dot" title="Live price" />}
                    </div>
                    <div className="dim" style={{ fontSize: 10, textTransform: "uppercase" }}>{r.token.kind}</div>
                  </div>
                  <div style={{ width: 84, fontFamily: "var(--font-mono)", fontSize: 12 }}>${fmtPrice(r.price)}</div>
                  <div style={{ flex: 1, height: 36, minWidth: 54 }}>
                    <PriceChart data={r.series} up={up} />
                  </div>
                  <div className={`mono ${up ? "up" : "down"}`} style={{ width: 60, textAlign: "right", fontSize: 12 }}>
                    <Delta up={up} /> {Math.abs(r.change24h).toFixed(1)}%
                  </div>
                  <span className="row-go dim" style={{ display: "inline-flex" }}><ArrowUpRight size={13} strokeWidth={2.5} aria-hidden="true" /></span>
                </a>
              );
            })}
          </div>

          <Pagination page={moversPg.page} totalPages={moversPg.totalPages} onPageChange={moversPg.setPage} label="Top movers pagination" />

          <h3 style={{ fontSize: 12.5, margin: "16px 0 8px" }}>Gaining the Most Volume</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {byVolume.map((r, rank) => (
              <a key={r.key} href={r.token.tradeUrl} target="_blank" rel="noopener noreferrer" className="asset-row" title={`View ${r.token.symbol} market data`}>
                <span className="mono dim" style={{ width: 16, fontSize: 12 }}>#{rank + 1}</span>
                <AssetIcon img={r.token.img} alt={r.token.name} color={r.token.color} size={28} />
                <div style={{ flex: 1, fontFamily: "var(--font-display)", fontSize: 12 }}>{r.token.symbol}</div>
                <span className="mono" style={{ fontSize: 12 }}>{fmtVol(r.volume)} vol</span>
                <span className="row-go dim" style={{ display: "inline-flex" }}><ArrowUpRight size={13} strokeWidth={2.5} aria-hidden="true" /></span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Upcoming Mints (top) + Viral NFTs */}
      <div className="trending-col">
        <div className="nb-card" style={{ padding: 14 }}>
          <h2 style={{ fontSize: 16, marginBottom: 4 }}>Upcoming NFT Mints</h2>
          <p className="dim" style={{ fontSize: 12, marginBottom: 10 }}>Auto-updating launch feed - soonest first</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {mintsPg.paginate(upcoming).map((n) => (
              <a key={n.slug} href={n.url} target="_blank" rel="noopener noreferrer" className="nb-panel asset-row" style={{ padding: "8px 12px" }} title={`View ${n.name}`}>
                <AssetIcon img={n.img} icon={n.icon} alt={n.name} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    {n.name}
                    {n.isNew && <span className="tag-new">NEW</span>}
                  </div>
                  <div className="dim" style={{ fontSize: 11 }}>{fmtCountdown(n.mintAt)} · {n.supply.toLocaleString()} supply</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: 12 }}>{n.price}</div>
                  <span className="nb-badge nb-badge-green" style={{ fontSize: 9, marginTop: 2 }}>{HYPE_LABEL[n.hype]}</span>
                </div>
                <span className="row-go dim" style={{ display: "inline-flex" }}><ArrowUpRight size={13} strokeWidth={2.5} aria-hidden="true" /></span>
              </a>
            ))}
          </div>
          <Pagination page={mintsPg.page} totalPages={mintsPg.totalPages} onPageChange={mintsPg.setPage} label="Upcoming mints pagination" />
        </div>

        <div className="nb-card" style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 16, marginBottom: 4 }}>Viral NFTs</h2>
            <span className={`nb-badge ${liveNftCount ? "nb-badge-green" : ""}`} style={{ fontSize: 10 }}>
              {liveNftCount ? <><span className="live-dot" aria-hidden="true" /> {liveNftCount} LIVE</> : <><Moon size={11} strokeWidth={2.5} aria-hidden="true" /> SIM</>}
            </span>
          </div>
          <p className="dim" style={{ fontSize: 12, marginBottom: 10 }}>Auto-updating - fresh collections added as they pop off</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {viralPg.paginate(viralNfts).map((n) => {
              const hasChange = typeof n.change === "number";
              const up = hasChange && n.change >= 0;
              return (
                <a key={n.slug} href={n.url} target="_blank" rel="noopener noreferrer" className="nb-panel asset-row" style={{ padding: "8px 12px" }} title={`View ${n.name} on OpenSea`}>
                  <AssetIcon img={n.img} alt={n.name} size={34} />
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                    {n.name}
                    {n.isNew && <span className="tag-new">NEW</span>}
                  </span>
                  <span className="mono dim vol-cell" style={{ fontSize: 11 }}>{fmtVolume(n)}</span>
                  <span className="mono dim" style={{ fontSize: 11 }}>{fmtFloor(n)}</span>
                  <span className={`mono ${hasChange ? (up ? "up" : "down") : "dim"}`} style={{ fontSize: 12, width: 54, textAlign: "right" }}>
                    {hasChange ? <><Delta up={up} /> {Math.abs(n.change).toFixed(1)}%</> : "-"}
                  </span>
                  <span className="row-go dim" style={{ display: "inline-flex" }}><ArrowUpRight size={13} strokeWidth={2.5} aria-hidden="true" /></span>
                </a>
              );
            })}
          </div>
          <Pagination page={viralPg.page} totalPages={viralPg.totalPages} onPageChange={viralPg.setPage} label="Viral NFTs pagination" />
        </div>
      </div>
    </div>
  );
}
