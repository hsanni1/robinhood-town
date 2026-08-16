import { Flame, TrendingUp } from "lucide-react";
import { useGame } from "../state/GameContext.jsx";

export default function MarketEventBanner() {
  const { market } = useGame();
  const { event } = market;
  if (!event) return null;

  const bull = event.type === "bull";
  const secsLeft = Math.max(0, Math.round((event.endsAt - Date.now()) / 1000));

  return (
    <div
      className="nb-card"
      style={{
        margin: "0 12px",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: bull ? "var(--rh-green)" : "var(--red)",
        color: bull ? "var(--ink)" : "#fff",
        animation: "pop-in 0.25s ease",
      }}
    >
      <span style={{ display: "inline-flex" }} aria-hidden="true">
        {bull ? <TrendingUp size={24} strokeWidth={2.5} /> : <Flame size={24} strokeWidth={2.5} />}
      </span>
      <div style={{ flex: 1 }}>
        <strong style={{ fontFamily: "var(--font-display)", fontSize: 13 }}>
          {bull ? "BULL RUN ACTIVE" : "FLASH CRASH"}
        </strong>
        <div style={{ fontSize: 12, opacity: 0.85 }}>
          {bull ? "Volume is spiking across the chain - Runner rewards are boosted." : "Prices are diving - dodge extra rugs in Runner and watch your holdings."}
        </div>
      </div>
      <span className="mono" style={{ fontSize: 12 }}>{secsLeft}s</span>
    </div>
  );
}
