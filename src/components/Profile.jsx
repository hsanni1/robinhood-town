import { useEffect, useState } from "react";

const PROFILES_API = (import.meta.env.VITE_SUGGESTIONS_API ?? "/api") + "/profiles";

function normalizeX(v) {
  const t = v.trim().replace(/^@/, "");
  const m = t.match(/(?:x\.com|twitter\.com)\/([A-Za-z0-9_]+)/i);
  return m ? m[1] : t;
}

// Stable anonymous id per browser so re-saves update one record, not many.
function getClientId() {
  try {
    let c = localStorage.getItem("rht-cid");
    if (!c) {
      c = "c_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("rht-cid", c);
    }
    return c;
  } catch {
    return "anon";
  }
}

export default function Profile({ profile, onSave }) {
  const [username, setUsername] = useState(profile.username);
  const [x, setX] = useState(profile.x);
  const [wallet, setWallet] = useState(profile.wallet);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUsername(profile.username);
    setX(profile.x);
    setWallet(profile.wallet);
  }, [profile]);

  const walletOk = wallet.trim() === "" || /^0x[a-fA-F0-9]{40}$/.test(wallet.trim());
  const xHandle = normalizeX(x);

  function submit(e) {
    e.preventDefault();
    if (!walletOk) return;
    const data = { username: username.trim(), x: xHandle, wallet: wallet.trim() };
    onSave(data);
    // Also send to the Robinhood Town backend so it's linked to your account.
    fetch(PROFILES_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cid: getClientId(), ...data }),
    }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const initial = (username.trim()[0] || "?").toUpperCase();

  return (
    <div className="nb-card" style={{ padding: 16 }}>
      <h2 style={{ fontSize: 16, marginBottom: 4 }}>Profile</h2>
      <p className="dim" style={{ fontSize: 12, marginBottom: 14 }}>Set your username, link your X, and add a wallet</p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span
          style={{
            width: 52, height: 52, borderRadius: "50%", border: "3px solid var(--ink)",
            background: "var(--rh-green)", color: "var(--ink)", display: "flex",
            alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)",
            fontSize: 22, boxShadow: "3px 3px 0 0 var(--ink)",
          }}
        >
          {initial}
        </span>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15 }}>{username.trim() || "Pixel Rookie"}</div>
          {xHandle && <div className="dim mono" style={{ fontSize: 12 }}>@{xHandle}</div>}
        </div>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 11, textTransform: "uppercase" }}>Username</span>
          <input className="nb-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="pixel_robinhood" maxLength={24} />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 11, textTransform: "uppercase" }}>X (Twitter)</span>
          <input className="nb-input" value={x} onChange={(e) => setX(e.target.value)} placeholder="@yourhandle or x.com/yourhandle" maxLength={80} />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 11, textTransform: "uppercase" }}>Wallet address</span>
          <input
            className="nb-input"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x..."
            maxLength={42}
            aria-invalid={!walletOk}
            style={!walletOk ? { borderColor: "var(--red)" } : undefined}
          />
          {!walletOk && <span className="down" style={{ fontSize: 11 }}>Enter a valid 0x wallet address (42 chars) or leave blank</span>}
        </label>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="nb-btn nb-btn-primary" type="submit" disabled={!walletOk}>Save profile</button>
          {saved && <span className="nb-badge nb-badge-green" style={{ fontSize: 11 }}>Saved</span>}
        </div>
        <p className="dim" style={{ fontSize: 10.5 }}>
          Saved on your device and to your Robinhood Town account so the team can reach you about mints and rewards.
        </p>
      </form>

      {profile.x && (
        <a className="nb-btn nb-btn-block" href={`https://x.com/${profile.x}`} target="_blank" rel="noopener noreferrer" style={{ marginTop: 14, textAlign: "center" }}>
          View @{profile.x} on X
        </a>
      )}
    </div>
  );
}
