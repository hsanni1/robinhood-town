import { useGame } from "../state/GameContext.jsx";

export default function Toasts() {
  const { toasts } = useGame();

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        zIndex: 1000,
        pointerEvents: "none",
        width: "min(320px, 92vw)",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="nb-card"
          style={{
            padding: "8px 14px",
            textAlign: "center",
            fontFamily: "var(--font-display)",
            fontSize: 13,
            background: t.kind === "win" ? "var(--rh-green)" : "var(--red)",
            color: t.kind === "win" ? "var(--ink)" : "#fff",
            animation: "pop-in 0.2s ease",
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
