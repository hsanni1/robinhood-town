import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { RH_PROJECTS } from "../data/assets.js";
import AssetIcon from "./AssetIcon.jsx";
import SearchField from "./SearchField.jsx";

/** "Discord · handle" when the project gave one, otherwise it's X DMs. */
function contactLabel(p) {
  return p.discord ? `Discord · ${p.discord}` : "X DMs";
}

export default function ContactList() {
  const [copied, setCopied] = useState(null);
  const [query, setQuery] = useState("");

  // Match the project name, its X handle and its Discord handle - someone who
  // only remembers "abdulmub" should still find the row.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RH_PROJECTS;
    return RH_PROJECTS.filter((p) =>
      [p.name, p.x, p.discord].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [query]);

  function copy(handle) {
    navigator.clipboard?.writeText(handle).then(
      () => {
        setCopied(handle);
        setTimeout(() => setCopied((c) => (c === handle ? null : c)), 1600);
      },
      () => {} // clipboard blocked - the handle is still on screen to read
    );
  }

  return (
    <div className="nb-card" style={{ padding: 14 }}>
      <h2 style={{ fontSize: 16, marginBottom: 4 }}>Contacts</h2>
      <p className="dim" style={{ fontSize: 12, marginBottom: 12 }}>
        Reach a project directly. Discord values are usernames to DM, not server invites.
      </p>

      <div style={{ marginBottom: 12 }}>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search projects..."
          label="Search contacts"
          recentsKey="rht-contact-searches"
        />
      </div>

      {results.length === 0 && (
        <p className="dim" style={{ fontSize: 13 }}>No projects match &ldquo;{query.trim()}&rdquo;.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {results.map((p) => (
          <div key={p.slug} className="nb-panel contact-card">
            <AssetIcon img={p.img} alt={p.name} size={38} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="contact-name nft-name">{p.name}</div>
              <div className="dim contact-meta">{contactLabel(p)}</div>
            </div>

            <div className="contact-actions">
              <a
                className="nb-btn contact-btn"
                href={`https://x.com/${p.x}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open @${p.x} on X`}
              >
                X
              </a>
              {/* A Discord username cannot be linked - it is copied and pasted
                  into Discord's search, so offer the copy instead of a dead
                  discord.gg URL. */}
              {p.discord && (
                <button
                  type="button"
                  className="nb-btn contact-btn"
                  onClick={() => copy(p.discord)}
                  title={`Copy Discord username ${p.discord}`}
                  aria-label={`Copy Discord username ${p.discord}`}
                >
                  {copied === p.discord ? (
                    <Check size={13} strokeWidth={2.5} aria-hidden="true" />
                  ) : (
                    <Copy size={13} strokeWidth={2.5} aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
