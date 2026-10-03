"use client";
import React, { useEffect, useRef, useState } from "react";
import "./ws.css";
import { RiskLevel, RISK_THEME, RISK_LABEL } from "./data";

interface Breakdown {
  label: string;
  earned: number;
  max: number;
  status: string;
}

interface Props {
  score: number;
  risk: RiskLevel;
  breakdown?: Breakdown[];
  whatIfScore?: number;
  whatIfRisk?: RiskLevel;
}

const W = 300;
const H = 172;
const cx = W / 2;
const R = 132;
const cy = H - 18;

const ZONES = [
  { from: 0, to: 30, fill: "#FAECE7", stroke: "#8C2020" },
  { from: 30, to: 55, fill: "#FBF1DC", stroke: "#7A4A00" },
  { from: 55, to: 75, fill: "#FDF4E3", stroke: "#B04A12" },
  { from: 75, to: 100, fill: "#E7F2EA", stroke: "#0D5C2E" },
];

const ang = (v: number) => Math.PI + (v / 100) * Math.PI;

export default function ScoreGauge({ score, risk, breakdown, whatIfScore, whatIfRisk }: Props) {
  const [anim, setAnim] = useState(0);
  const [open, setOpen] = useState(false);
  const [needle, setNeedle] = useState<React.CSSProperties>({});
  const prev = useRef(0);

  useEffect(() => {
    let raf = 0;
    const start = prev.current;
    const delta = score - start;
    const t0 = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setAnim(Math.round(start + delta * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = score;
    };
    raf = requestAnimationFrame(tick);
    setNeedle({
      transform: `rotate(${-90 + (score / 100) * 180}deg)`,
      transition: "transform 0.9s cubic-bezier(0.2, 0.8, 0.25, 1)",
    });
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const t = RISK_THEME[risk];
  const wT = whatIfRisk ? RISK_THEME[whatIfRisk] : undefined;
  const delta = whatIfScore !== undefined ? whatIfScore - score : undefined;
  const riskCls = risk === "LOW" ? "pass" : risk === "MEDIUM" ? "warn" : "fail";

  return (
    <div className="bs-card">
      <div className="bs-card-head">
        <div className="bs-card-head-left">
          <span className="bs-card-title">Compliance Score</span>
          <span className="bs-card-sub">weighted per rules</span>
        </div>
        {delta !== undefined && (
          <span className="bs-whatif" style={{ fontSize: 8 }}>
            PROJ {delta >= 0 ? "+" : ""}{Math.round(delta)}
          </span>
        )}
      </div>

      <div className="bs-card-body">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", maxWidth: 300, margin: "0 auto" }}>
          {ZONES.map((z) => {
            const a1 = ang(z.from);
            const a2 = ang(z.to);
            const big = a2 - a1 > Math.PI ? 1 : 0;
            return (
              <g key={z.from}>
                <path
                  d={`M ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} A ${R} ${R} 0 ${big} 1 ${cx + R * Math.cos(a2)} ${cy + R * Math.sin(a2)} L ${cx + (R - 15) * Math.cos(a2)} ${cy + (R - 15) * Math.sin(a2)} A ${R - 15} ${R - 15} 0 ${big} 0 ${cx + (R - 15) * Math.cos(a1)} ${cy + (R - 15) * Math.sin(a1)} Z`}
                  fill={z.fill}
                />
                <line
                  x1={cx + (R - 15) * Math.cos(a2)}
                  y1={cy + (R - 15) * Math.sin(a2)}
                  x2={cx + R * Math.cos(a2)}
                  y2={cy + R * Math.sin(a2)}
                  stroke={z.stroke}
                  strokeWidth="1"
                  opacity="0.45"
                />
              </g>
            );
          })}

          {Array.from({ length: 21 }).map((_, i) => {
            const a = ang((i / 20) * 100);
            const maj = i % 5 === 0;
            const r1 = maj ? R - 18 : R - 14;
            return (
              <line
                key={i}
                x1={cx + r1 * Math.cos(a)}
                y1={cy + r1 * Math.sin(a)}
                x2={cx + (R + 1) * Math.cos(a)}
                y2={cy + (R + 1) * Math.sin(a)}
                stroke={maj ? "#C0B8A8" : "#E6E2D4"}
                strokeWidth={maj ? 1.5 : 0.7}
              />
            );
          })}

          {["0", "25", "50", "75", "100"].map((l, i) => {
            const a = ang(i * 25);
            return (
              <text
                key={l}
                x={cx + (R + 12) * Math.cos(a)}
                y={cy + (R + 12) * Math.sin(a) + 2}
                textAnchor="middle"
                style={{ fontFamily: "var(--mono)", fontSize: 8, fill: "var(--ink-25)" }}
              >
                {l}
              </text>
            );
          })}

          <path
            d={`M ${cx + (R - 8) * Math.cos(ang(0))} ${cy + (R - 8) * Math.sin(ang(0))} A ${R - 8} ${R - 8} 0 0 1 ${cx + (R - 8) * Math.cos(ang(100))} ${cy + (R - 8) * Math.sin(ang(100))}`}
            fill="none"
            stroke="var(--rule)"
            strokeWidth="1"
          />
{whatIfScore !== undefined && wT && (
            <g>
              <line
                x1={cx + 8 * Math.cos(ang(whatIfScore))}
                y1={cy + 8 * Math.sin(ang(whatIfScore))}
                x2={cx + (R - 13) * Math.cos(ang(whatIfScore))}
                y2={cy + (R - 13) * Math.sin(ang(whatIfScore))}
                stroke={wT.solid}
                strokeWidth="2"
                strokeDasharray="5 4"
              />
              <circle cx={cx + (R - 24) * Math.cos(ang(whatIfScore))} cy={cy + (R - 24) * Math.sin(ang(whatIfScore))} r="3" fill={wT.solid} />
            </g>
          )}

          <g style={needle} transform-origin={`${cx}px ${cy}px`}>
            <polygon points={`${cx - 6},${cy} ${cx + R - 18},${cy - 2} ${cx + R - 18},${cy + 2}`} fill={t.solid} />
          </g>
          <circle cx={cx} cy={cy} r="7" fill={t.solid} />
          <circle cx={cx} cy={cy} r="4.2" fill="#fff" />
        </svg>

        <div style={{ textAlign: "center", marginTop: -6 }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 46, fontWeight: 700, lineHeight: 1, color: t.solid }} className="bs-num">
            {anim}
          </div>
          <div className="bs-kicker" style={{ marginTop: 3 }}>of 100</div>
          <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 7, padding: "3px 12px", background: t.bg, border: `1px solid ${t.rule}`, borderRadius: 2 }}>
            <span style={{ width: 8, height: 8, background: t.solid, borderRadius: 1, display: "inline-block" }} />
            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.16em", color: t.solid }}>{RISK_LABEL[risk]}</span>
          </div>
        </div>

        <button onClick={() => setOpen((o) => !o)} className="bs-btn ghost sm" style={{ display: "block", margin: "10px auto 0" }}>
          {open ? "Hide breakdown" : "Why this score?"}
        </button>

        {open && (
          <div style={{ borderTop: "1px solid var(--rule)", marginTop: 10, paddingTop: 10, animation: "bs-rise 0.2s ease" }}>
            {breakdown?.map((b, i) => {
              const pct = b.max > 0 ? Math.round((b.earned / b.max) * 100) : 0;
              const col = b.status === "pass" ? "var(--pass)" : b.status === "warn" ? "var(--warn)" : "var(--fail)";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 8.5, color: "var(--ink-70)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                    {b.label}
                  </span>
                  <div className="bs-bar" style={{ width: 60 }}>
                    <i style={{ width: `${pct}%`, background: col }} />
                  </div>
                  <span className="bs-num" style={{ fontSize: 8.5, color: "var(--ink-35)", minWidth: 32, textAlign: "right" }}>
                    {b.earned}/{b.max}
                  </span>
                </div>
              );
            })}
            {!breakdown?.length && <span style={{ fontSize: 9.5, color: "var(--ink-25)" }}>Run verification to compute a weighted breakdown.</span>}
          </div>
        )}

        <div style={{ marginTop: 10, borderTop: "1px dashed var(--rule)", paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
          <span className="bs-card-sub">cut-offs: 30 / 55 / 75</span>
          <span className="bs-card-sub">{whatIfScore !== undefined ? `projected ${whatIfScore}` : "live statutory"}</span>
        </div>
      </div>
    </div>
  );
}