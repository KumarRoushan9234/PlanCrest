// Dependency-free SVG charts in the console style.
import { useLayoutEffect, useRef, useState } from "react";
import { niceStep } from "./utils";

function useSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

/**
 * Stacked bar chart.
 * data: [{ label, tooltipLabel?, values: [n, n, ...] }]  series: [{ key, label, color }]
 */
export function StackedBars({ data, series, height = 190, emptyText = "No data in this period yet" }) {
  const [ref, { w }] = useSize();
  const [hover, setHover] = useState(null);
  const h = height;
  const pad = { l: 30, r: 4, t: 8, b: 20 };
  const totals = data.map((d) => d.values.reduce((a, b) => a + b, 0));
  const top = Math.max(1, ...totals);
  const step = niceStep(top / 3);
  const yMax = Math.ceil(top / step) * step;
  const cw = Math.max(0, w - pad.l - pad.r);
  const ch = h - pad.t - pad.b;
  const slot = data.length ? cw / data.length : 0;
  const bw = Math.max(4, Math.min(28, slot * 0.62));
  const y = (v) => pad.t + ch - (v / yMax) * ch;
  const every = Math.ceil(data.length / Math.max(2, Math.floor(cw / 56)));
  const empty = totals.every((t) => !t);

  return (
    <>
      <div className="pc-legend">
        {series.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="pc-chart" ref={ref} style={{ height: h }} onMouseLeave={() => setHover(null)}>
        {w > 0 && (
          <svg width={w} height={h} role="img" aria-label="Bar chart">
            {Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step).map((v) => (
              <g key={v}>
                <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} className={v ? "gl" : "base"} />
                <text x={pad.l - 6} y={y(v)} dy="0.32em" textAnchor="end" className="tick">
                  {v}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const x = pad.l + i * slot + (slot - bw) / 2;
              let acc = 0;
              return (
                <g key={i} style={{ filter: hover === i ? "brightness(1.2)" : undefined }}>
                  {d.values.map((v, si) => {
                    if (!v) return null;
                    const yTop = y(acc + v);
                    const rect = (
                      <rect key={si} x={x} y={yTop} width={bw} height={Math.max(1, y(acc) - yTop - (acc ? 1.5 : 0))} rx={si === d.values.length - 1 || acc + v === totals[i] ? 3 : 0} fill={series[si].color} />
                    );
                    acc += v;
                    return rect;
                  })}
                  {i % every === 0 && (
                    <text x={x + bw / 2} y={h - 4} textAnchor="middle" className="tick">
                      {d.label}
                    </text>
                  )}
                  <rect x={pad.l + i * slot} y={pad.t} width={slot} height={ch} fill="transparent" onMouseEnter={() => setHover(i)} />
                </g>
              );
            })}
          </svg>
        )}
        {empty && w > 0 && <div style={{ position: "absolute", inset: `0 0 ${pad.b}px ${pad.l}px`, display: "grid", placeItems: "center", fontSize: 12.5, color: "var(--dim)" }}>{emptyText}</div>}
        {hover != null && data[hover] && (
          <div className="pc-tip" style={{ left: Math.min(Math.max(0, w - 140), Math.max(0, pad.l + hover * slot + slot / 2 - 68)) }}>
            <span>{data[hover].tooltipLabel ?? data[hover].label}</span>
            {series.map((s, si) => (
              <b key={s.key}>
                <i style={{ background: s.color }} />
                {s.label}
                <em>{data[hover].values[si]}</em>
              </b>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/** Thin donut with a centre label. */
export function Donut({ segments, size = 132, thickness = 14, centerLabel, centerSub }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }} role="img" aria-label="Distribution">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1b1d25" strokeWidth={thickness} />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * c;
            const el = <circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-offset} />;
            offset += len;
            return el;
          })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{centerLabel}</div>
          {centerSub && <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{centerSub}</div>}
        </div>
      </div>
    </div>
  );
}

/** Horizontal bar rows (label, bar, value). */
export function BarRows({ rows, max }) {
  const peak = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1fr) 40px", alignItems: "center", gap: 10, fontSize: 12.5 }}>
          <span style={{ color: "var(--sub)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
          <div className="pc-progress" style={{ height: 6 }}>
            <i style={{ width: `${(r.value / peak) * 100}%`, background: r.color ?? "#3987e5" }} />
          </div>
          <b style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{r.value}</b>
        </div>
      ))}
    </div>
  );
}
