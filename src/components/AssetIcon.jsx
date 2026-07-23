export default function AssetIcon({ icon, img, alt = "", color = "var(--surface)", size = 34 }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: "50%",
        border: "2px solid var(--ink)",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        boxShadow: "2px 2px 0 0 var(--ink)",
        overflow: "hidden",
      }}
    >
      {img ? (
        <img
          src={img}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        icon
      )}
    </span>
  );
}
