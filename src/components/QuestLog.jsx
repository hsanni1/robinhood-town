import { useGame } from "../state/GameContext.jsx";
import { useStreak } from "../hooks/useStreak.js";

export default function QuestLog() {
  const { quests, claimQuest } = useGame();
  const streak = useStreak();

  return (
    <div className="nb-card" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <h2 style={{ fontSize: 16 }}>Daily Missions</h2>
        <div
          className="nb-panel"
          title={`Best streak: ${streak.best || streak.count} days`}
          style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}
        >
          <span className="mono" style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--rh-green-dark)" }}>{streak.count}</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 10, textTransform: "uppercase", lineHeight: 1.05 }}>
            Day<br />streak
          </span>
        </div>
      </div>
      <p className="dim" style={{ fontSize: 11.5, margin: "-4px 0 10px" }}>
        Show up daily to grow your streak. Miss a day and it restarts.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {quests.map((q) => {
          const done = q.progress >= q.target;
          return (
            <div
              key={q.id}
              className="nb-panel"
              style={{ padding: 10, opacity: q.claimed ? 0.55 : 1 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ fontSize: 13.5 }}>{q.title}</strong>
                <span className="nb-badge nb-badge-green" style={{ fontSize: 11 }}>
                  +{q.reward} {"\u{1FA99}"} / +{q.xp} XP
                </span>
              </div>
              <p className="dim" style={{ fontSize: 12.5, margin: "4px 0 8px" }}>{q.detail}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="nb-progress" style={{ flex: 1 }}>
                  <div
                    className="nb-progress-fill"
                    style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                  />
                </div>
                <span className="mono dim" style={{ fontSize: 11 }}>{q.progress}/{q.target}</span>
              </div>
              {done && !q.claimed && (
                <button className="nb-btn nb-btn-yellow nb-btn-block" style={{ marginTop: 8 }} onClick={() => claimQuest(q.id)}>
                  Claim Reward
                </button>
              )}
              {q.claimed && <div className="mono dim" style={{ fontSize: 11, marginTop: 6 }}>{"\u{2713}"} Claimed</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
