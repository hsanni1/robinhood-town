import { useEffect } from "react";

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

export default function MenuDrawer({ open, onClose, tab, onNavigate }) {
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
          <button className="nb-btn" onClick={onClose} aria-label="Close menu" style={{ padding: "6px 11px" }}>
            ✕
          </button>
        </div>

        <nav className="menu-nav" aria-label="Sections">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`menu-nav-item ${tab === n.id ? "is-active" : ""}`}
              aria-current={tab === n.id ? "page" : undefined}
              onClick={() => onNavigate(n.id)}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
