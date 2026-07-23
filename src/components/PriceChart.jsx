import { useId } from "react";

/**
 * Area/line price chart rendered from a plain array of prices - used for both
 * real CoinGecko sparklines and the simulated series, so every row reads the same.
 */
export default function PriceChart({ data, height = 36, up = true, pulse = false }) {
  const gradId = useId();
  if (!data || data.length < 2) return null;

  const width = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(max - min, 1e-9);
  const pad = height * 0.14;
  const n = data.length;

  const x = (i) => (i / (n - 1)) * width;
  const y = (v) => pad + (1 - (v - min) / span) * (height - pad * 2);

  const linePts = data.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const areaPath = `M0,${height} L${data
    .map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`)
    .join(" L")} L${width},${height} Z`;

  const stroke = up ? "var(--rh-green-dark)" : "var(--red)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className={pulse ? "candle-pulse" : ""}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline points={linePts} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(n - 1)} cy={y(data[n - 1])} r="1.8" fill={stroke} stroke="var(--surface)" strokeWidth="0.8" />
    </svg>
  );
}
