import { Construction } from "lucide-react";

export default function ComingSoon({ title }) {
  return (
    <div className="nb-card" style={{ padding: 28, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <Construction size={44} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <h2 style={{ fontSize: 18 }}>Coming Soon</h2>
      <p className="dim" style={{ fontSize: 13, marginTop: 6 }}>
        {title ? `${title} is under maintenance.` : "This section is under maintenance."} Check back shortly.
      </p>
    </div>
  );
}
