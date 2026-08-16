import { useEffect } from "react";
import { X } from "lucide-react";

const NAV = [
  { id: "trending", label: "Town Hall" },
  { id: "marketplace", label: "Marketplace" },
  { id: "contacts", label: "Contacts" },
  { id: "runner", label: "Rug Runner" },
  { id: "quests", label: "Quests" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "suggestions", label: "Suggestions" },
  { id: "profile", label: "Profile" },
];

export default function MenuDrawer({ open, onClose, tab, onNavigate, sections = {} }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`drawer-backdrop ${open ? "is-open" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`drawer ${open ? "is-open" : ""}`} role="dialog" aria-label="Menu" aria-hidden={!open}>
        <div className="drawer-head">
          <h2 style={{ fontSize: 16 }}>Menu</h2>
          <button className="nb-btn" onClick={onClose} aria-label="Close menu" style={{ padding: "6px 11px", display: "inline-flex", alignItems: "center" }}>
            <X size={16} strokeWidth={2.75} />
          </button>
        </div>

        <nav className="menu-nav" aria-label="Sections">
          {NAV.map((n) => {
            const maint = sections[n.id] === "maintenance";
            return (
              <button
                key={n.id}
                className={`menu-nav-item ${tab === n.id ? "is-active" : ""}`}
                aria-current={tab === n.id ? "page" : undefined}
                onClick={() => onNavigate(n.id)}
              >
                <span style={{ flex: 1, textAlign: "left" }}>{n.label}</span>
                {maint && <span className="menu-soon">Soon</span>}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
