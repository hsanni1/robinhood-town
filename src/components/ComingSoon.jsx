export default function ComingSoon({ title }) {
  return (
    <div className="nb-card" style={{ padding: 28, textAlign: "center" }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>{"\u{1F6A7}"}</div>
      <h2 style={{ fontSize: 18 }}>Coming Soon</h2>
      <p className="dim" style={{ fontSize: 13, marginTop: 6 }}>
        {title ? `${title} is under maintenance.` : "This section is under maintenance."} Check back shortly.
      </p>
    </div>
  );
}
