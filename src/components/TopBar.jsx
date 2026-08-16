import { Moon, Sun } from "lucide-react";
import { useGame } from "../state/GameContext.jsx";

export default function TopBar({ night, onToggleTheme, themeManual, onOpenMenu, menuOpen }) {
  const { coins, level, xpIntoLevel } = useGame();
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="nb-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        margin: 12,
        marginBottom: 0,
        flexWrap: "wrap",
      }}
    >
      <img
        src="/logo-wordmark.png"
        alt="Robinhood Town"
        style={{
          height: 30,
          width: "auto",
          display: "block",
          imageRendering: "pixelated",
          border: "2px solid var(--ink)",
          borderRadius: 6,
        }}
      />

      <div style={{ flex: 1 }} />

      <div className="nb-badge nb-badge-green">
        <span className="mono">{coins.toLocaleString()} RC</span>
      </div>

      <div className="nb-badge" style={{ minWidth: 92 }}>
        <span>LVL {level}</span>
        <div className="nb-progress" style={{ width: 44, height: 8 }}>
          <div className="nb-progress-fill" style={{ width: `${xpIntoLevel}%` }} />
        </div>
      </div>

      <button
        type="button"
        className="nb-badge mono theme-toggle"
        onClick={onToggleTheme}
        aria-label={`Switch to ${night ? "light" : "dark"} mode`}
        aria-pressed={night}
        title={
          themeManual
            ? `${night ? "Dark" : "Light"} mode - click to switch`
            : "Theme follows your clock - click to switch"
        }
        style={{ padding: "4px 10px", cursor: "pointer" }}
      >
        {night ? <Moon size={13} strokeWidth={2.25} aria-hidden="true" /> : <Sun size={13} strokeWidth={2.25} aria-hidden="true" />} {timeStr}
      </button>

      <button
        className="nb-btn hamburger"
        onClick={onOpenMenu}
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={Boolean(menuOpen)}
        title="Menu"
      >
        <span className="hamburger-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
    </div>
  );
}
