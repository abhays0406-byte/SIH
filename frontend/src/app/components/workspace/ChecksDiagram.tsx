"use client";
import React, { useEffect, useRef, useState } from "react";
import "./ws.css";
import { CheckNode, STATUS_THEME, RISK_THEME, RISK_LABEL, RiskLevel } from "./data";

interface Props {
  checks: CheckNode[];
  score: number;
  risk: RiskLevel;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onEvidence?: (node: CheckNode) => void;
}

const ICON: Record<string, React.ReactNode> = {
  pass: <path d="M4 8.5L7 11.5L13 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  warn: (
    <>
      <path d="M9 3.5L15.2 14H2.8L9 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <line x1="9" y1="8" x2="9" y2="10.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="12.4" r="0.7" fill="currentColor" />
    </>
  ),
  fail: <path d="M5.5 5.5L12.5 12.5M12.5 5.5L5.5 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  na: <path d="M5 9.5H13M9 5.5V13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />,
};

export default function ChecksDiagram({ checks, score, risk, selectedId, onSelect, onEvidence }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(760);
  const [hov, setHov] = useState<string | null>(null);

  useEffect(() => {
    const ro = new ResizeObserver((e) => {
      const w = e[0].contentRect.width;
      if (w > 40) setW(w);
    });
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const n = checks.length;
  const H = Math.max(380, Math.round(W * 0.56));
  const cx = W / 2;
  const cy = H / 2 + 8;
  const RX = W * 0.37;
  const RY = H * 0.34;
  const cR = 46;

  const pts = checks.map((_, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + RX * Math.cos(a), y: cy + RY * Math.sin(a), a };
  });

  const active = checks.find((c) => c.id === (hov ?? selectedId));
  const t = RISK_THEME[risk];
  const passCount = checks.filter((c) => c.status === "pass").length;
  const riskCls = risk === "LOW" ? "pass" : risk === "MEDIUM" ? "warn" : "fail";

  return (
    <div className="bs-card" style={{ overflow: "hidden" }}>
      <div className="bs-card-head">
        <div className="bs-card-head-left">
          <span className="bs-card-title">Verification Field Diagram</span>
          <span className="bs-kicker">{n} statutory nodes</span>
        </div>
        <div className="bs-card-head-right">
          <span className="bs-chip">PASS {passCount}/{n}</span>
          <span className={`bs-badge ${riskCls}`}>
            <span className="sq" />
            {RISK_LABEL[risk]}
          </span>
        </div>
      </div>

      <div ref={wrapRef} style={{ background: "var(--card)", borderBottom: "1px solid var(--rule)" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Compliance diagram">
          <defs>
            <radialGradient id="bs-centre" cx="50%" cy="42%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F6F4ED" />
            </radialGradient>
          </defs>

          <ellipse cx={cx} cy={cy} rx={RX} ry={RY} fill="none" stroke="var(--rule)" strokeWidth="1" strokeDasharray="2 4" />
          {pts.map((p, i) => (
            <g key={i} style={{ animation: "bs-line-fade 0.5s ease both", animationDelay: `${i * 34}ms` }}>
              <line
                x1={cx + (cR + 12) * Math.cos(p.a)}
                y1={cy + (cR + 12) * Math.sin(p.a)}
                x2={p.x}
                y2={p.y}
                stroke="var(--rule)"
                strokeWidth="0.75"
                opacity="0.7"
              />
              <circle cx={p.x} cy={p.y} r="1.6" fill="var(--ink-20)" />
            </g>
          ))}

          <circle cx={cx} cy={cy} r={cR + 9} fill="none" stroke="var(--navy-rule)" strokeWidth="1" opacity="0.6" />
          <circle cx={cx} cy={cy} r={cR} fill="url(#bs-centre)" stroke="var(--navy)" strokeWidth="1.5" />
          <text x={cx} y={cy + 1} textAnchor="middle" style={{ fontFamily: "var(--serif)", fontSize: 46, fontWeight: 700, fill: "var(--ink)" }} className="bs-num">
            {Math.round(score)}
          </text>
          <text x={cx} y={cy + 19} textAnchor="middle" style={{ fontSize: 7, letterSpacing: "0.22em", fill: "var(--ink-35)", fontWeight: 800 }}>
            COMPLIANCE
          </text>
          <rect x={cx - 34} y={cy + 30} width="68" height="15" rx="2" fill={t.bg} stroke={t.rule} />
          <text x={cx} y={cy + 40} textAnchor="middle" style={{ fontSize: 7.5, letterSpacing: "0.14em", fontWeight: 800, fill: t.solid }}>
            {risk === "LOW" ? "LOW RISK" : risk === "MEDIUM" ? "MEDIUM" : risk === "HIGH" ? "HIGH" : "CRITICAL"}
          </text>
{/* nodes */}
        {checks.map((c, i) => {
          const p = pts[i];
          const th = STATUS_THEME[c.status];
          const r = 9 + c.weight * 0.55;
          const on = hov === c.id || selectedId === c.id;
          return (
            <g
              key={c.id}
              className="bs-node-in"
              style={{ animationDelay: `${120 + i * 34}ms`, cursor: "pointer" }}
              transform={`translate(${p.x},${p.y})`}
              onClick={() => {
                if (onSelect) onSelect(on && selectedId ? null : c.id);
              }}
              onMouseEnter={() => setHov(c.id)}
              onMouseLeave={() => setHov(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && onSelect) onSelect(on && selectedId ? null : c.id);
              }}
              tabIndex={0}
              role="button"
              aria-label={`${c.label}, ${c.status}`}
            >
              <circle r={r} fill={th.bg} stroke={th.solid} strokeWidth={on ? 2.2 : 1.3} />
              {on && <circle r={r + 5} fill="none" stroke={th.solid} strokeWidth="1" strokeDasharray="3 3" opacity="0.75" />}
              <g transform={`translate(-${r * 0.42},-${r * 0.42}) scale(${(r * 0.84) / 18})`} style={{ color: th.solid }}>
                {ICON[c.status]}
              </g>
              <text y={r + 13} textAnchor="middle" style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: "0.1em", fill: on ? th.solid : "var(--ink-50)", fontFamily: "var(--mono)" }}>
                {c.short}
              </text>
              <text y={r + 21} textAnchor="middle" style={{ fontSize: 6.5, fill: "var(--ink-25)", fontFamily: "var(--mono)" }}>
                {c.weight}%
              </text>
            </g>
          );
        })}
        </svg>
      </div>

      {/* detail strip */}
      <div className="bs-strip" style={{ borderTop: "none", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <div className="bs-strip-top" style={{ background: active ? STATUS_THEME[active.status].solid : "var(--rule)" }} />
        {active ? (
          <div style={{ padding: "11px 16px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 9, height: 9, background: STATUS_THEME[active.status].solid, borderRadius: 2, flex: "none" }} />
                <span style={{ fontFamily: "var(--serif)", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{active.label}</span>
                <span className={`bs-badge ${active.status}`}>{STATUS_THEME[active.status].label}</span>
              </div>
              <div style={{ marginTop: 3, fontSize: 10, color: "var(--ink-70)", lineHeight: 1.5 }}>{active.finding}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flex: "none" }}>
              <div style={{ textAlign: "right" }}>
                <div className="bs-kicker" style={{ marginBottom: 2 }}>source</div>
                <div className="bs-mono" style={{ fontSize: 9.5, color: "var(--ink-70)" }}>{active.source}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="bs-kicker" style={{ marginBottom: 2 }}>weight</div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 19, fontWeight: 700, color: STATUS_THEME[active.status].solid, lineHeight: 1 }}>{active.weight}%</div>
              </div>
              <button className="bs-btn" onClick={() => onEvidence?.(active)} style={{ borderColor: "var(--navy)", color: "var(--navy)" }}>
                View evidence
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: "11px 16px", fontSize: 10, color: "var(--ink-35)", fontStyle: "italic" }}>
            Select any node or ledger row to inspect its finding, source portal and weight.
          </div>
        )}
      </div>

      {/* legend */}
      <div className="bs-card-head" style={{ borderTop: "1px solid var(--rule)", borderBottom: "none", paddingTop: 6, paddingBottom: 6 }}>
        <div className="bs-legend">
          {(Object.keys(STATUS_THEME) as (keyof typeof STATUS_THEME)[]).map((k) => (
            <span key={k} className="bs-legend-item">
              <span className="sq" style={{ background: STATUS_THEME[k].solid }} />
              {STATUS_THEME[k].label}
            </span>
          ))}
        </div>
        <span className="bs-card-sub">node size ∝ statutory weight</span>
      </div>
    </div>
  );
}