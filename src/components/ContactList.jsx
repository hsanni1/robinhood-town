import { useState } from "react";
import { Lock } from "lucide-react";
import { NFT_UPCOMING_MINTS } from "../data/assets.js";

// Sort by soonest mint so the list mirrors the Upcoming feed order.
const CONTACTS = [...NFT_UPCOMING_MINTS].sort((a, b) => a.mintInHours - b.mintInHours);

// Collab manager contacts stay behind an auth wall so managers don't get
// spammed with DMs. Flip this once real sign-in exists.
const AUTH_READY = false;

function AuthWall() {
  return (
    <div className="nb-card" style={{ padding: 28, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <Lock size={40} strokeWidth={2} aria-hidden="true" />
      </div>
      <h2 style={{ fontSize: 18 }}>Members Only</h2>
      <p className="dim" style={{ fontSize: 13, marginTop: 6, maxWidth: 360, marginInline: "auto" }}>
        Collab manager contacts are locked to verified members. Sign-in is coming soon — this keeps managers safe from spam DMs.
      </p>
    </div>
  );
}

export default function ContactList() {
  const [open, setOpen] = useState(null);

  if (!AUTH_READY) return <AuthWall />;

  return (
    <div className="nb-card" style={{ padding: 14 }}>
      <h2 style={{ fontSize: 16, marginBottom: 4 }}>Contacts</h2>
      <p className="dim" style={{ fontSize: 12, marginBottom: 12 }}>
        Every upcoming mint. Tap a collection to reach its collab manager.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CONTACTS.map((c) => {
          const isOpen = open === c.slug;
          const m = c.manager;
          return (
            <div key={c.slug} className="nb-panel" style={{ padding: 0, overflow: "hidden" }}>
              <button
                className="contact-row"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : c.slug)}
              >
                <span className="contact-thumb">
                  <img src={c.img} alt={c.name} loading="lazy" />
                </span>
                <span style={{ flex: 1, textAlign: "left" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 13, display: "block" }}>{c.name}</span>
                  <span className="dim" style={{ fontSize: 11 }}>{m ? `${m.name} · ${m.role}` : "Team"}</span>
                </span>
                <span className="contact-caret" aria-hidden="true">{isOpen ? "–" : "+"}</span>
              </button>

              {isOpen && m && (
                <div className="contact-detail">
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <a className="nb-btn nb-btn-block contact-link" href={`https://x.com/${m.x}`} target="_blank" rel="noopener noreferrer">
                      X / Twitter · @{m.x}
                    </a>
                    {/* Not every project publishes a Discord - link only what exists. */}
                    {m.discord && (
                      <a className="nb-btn nb-btn-block contact-link" href={`https://discord.gg/${m.discord}`} target="_blank" rel="noopener noreferrer">
                        Discord · discord.gg/{m.discord}
                      </a>
                    )}
                    <a className="nb-btn nb-btn-block contact-link" href={c.url} target="_blank" rel="noopener noreferrer">
                      {c.url.includes("opensea.io") ? "View collection on OpenSea" : "Visit project"}
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
