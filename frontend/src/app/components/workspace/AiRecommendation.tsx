"use client";
import React, { useState } from "react";
import "./ws.css";
import { Decision } from "./data";

interface Props {
  recommendation: string;
  gaps: string[];
  discrepancies: string[];
  aiProvider?: string;
  onDecision: (d: Decision, reason: string) => void;
  existing?: { decision: string; reason: string; by?: string; at?: string };
  pending?: boolean;
  whatIf?: { active: boolean } | null;
}

export const DECISION_LABEL: Record<string, string> = { qualify: "QUALIFY", clarify: "CLARIFY", reject: "REJECT" };

export default function AiRecommendation({ recommendation, gaps, discrepancies, aiProvider, onDecision, existing, pending, whatIf }: Props) {
  const [reason, setReason] = useState(existing?.reason || "");
  const [err, setErr] = useState("");
  const [stamp, setStamp] = useState<Decision | null>(null);

  const isPos = !recommendation || recommendation.toLowerCase().includes("qualif") || recommendation.toLowerCase().includes("no material");
  const total = gaps.length + discrepancies.length;

  const submit = (d: Decision) => {
    if (reason.trim().length < 10) {
      setErr("State a reason of at least 10 characters. It is sealed into the audit chain.");
      return;
    }
    setErr("");
    setStamp(d);
    setTimeout(() => onDecision(d, reason.trim()), 600);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* AI advisory */}
      <div className="bs-card">
        <div className="bs-card-head">
          <div className="bs-card-head-left">
            <span className="bs-card-title">AI Advisory</span>
            <span className="bs-card-sub">{aiProvider || "mock"} · decision-support only</span>
          </div>
          {whatIf?.active && <span className="bs-whatif" style={{ fontSize: 8 }}>recomputed under what-if</span>}
        </div>
        <div className="bs-card-body">
          {pending ? (
            <div style={{ height: 18, width: "72%", background: "var(--band)", borderRadius: 2, animation: "bs-breathe-dr 1s infinite", marginBottom: 8 }} />
          ) : recommendation ? (
            <div style={{ borderLeft: `3px solid ${isPos ? "var(--pass)" : "var(--warn)"}`, padding: "7px 0 7px 12px", background: isPos ? "var(--pass-bg)" : "var(--warn-bg)", borderRadius: "0 var(--r-md) var(--r-md) 0" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: isPos ? "var(--pass-deep)" : "var(--warn)", lineHeight: 1.6, fontFamily: "var(--serif)" }}>
                {recommendation}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 10, color: "var(--ink-25)", fontStyle: "italic" }}>Advisory is generated after a verification run.</div>
          )}

          {(gaps.length > 0 || discrepancies.length > 0) && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {gaps.map((g, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--ink-70)", borderBottom: "1px solid var(--rule)", paddingBottom: 5 }}>
                  <span style={{ flex: "none", fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", color: "var(--fail)", background: "var(--fail-bg)", border: "1px solid var(--fail-rule)", padding: "1px 5px", borderRadius: 2 }}>GAP</span>
                  <span>{g}</span>
                </div>
              ))}
              {discrepancies.map((d, i) => (
                <div key={`d${i}`} style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--ink-70)", borderBottom: "1px solid var(--rule)", paddingBottom: 5 }}>
                  <span style={{ flex: "none", fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", color: "var(--warn)", background: "var(--warn-bg)", border: "1px solid var(--warn-rule)", padding: "1px 5px", borderRadius: 2 }}>DRIFT</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 8.5, color: "var(--ink-35)" }}>{total} flags · materiality vs tender rules</span>
            <span className="bs-card-sub">§ decision-support clause</span>
          </div>
        </div>
      </div>
{/* decision box */}
      <div className="bs-card" style={{ overflow: "hidden" }}>
        {stamp && (
          <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.55)", pointerEvents: "none" }}>
            <span className={`bs-stamp ${stamp === "reject" ? "fail" : stamp === "clarify" ? "warn" : ""} anim`}>
              {DECISION_LABEL[stamp]}
            </span>
          </div>
        )}
        <div className="bs-card-head">
          <div className="bs-card-head-left">
            <span className="bs-card-title">Officer Decision</span>
            <span className="bs-card-sub">final authority: procurement officer</span>
          </div>
        </div>
        <div className="bs-card-body">
          {existing ? (
            <div style={{ animation: "bs-rise 0.25s ease" }}>
              <div style={{ background: "var(--band)", border: "1px solid var(--rule)", borderRadius: 4, padding: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`bs-badge ${existing.decision === "qualify" ? "solid-pass" : existing.decision === "reject" ? "solid-fail" : "warn"}`}>
                    {DECISION_LABEL[existing.decision] || existing.decision.toUpperCase()}
                  </span>
                  {existing.at && <span className="bs-card-sub">sealed {existing.at}</span>}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--ink-70)", marginTop: 6, lineHeight: 1.55 }}>{existing.reason}</div>
              </div>
              <button className="bs-btn ghost sm" onClick={() => setReason("")} style={{ marginTop: 6 }}>
                Revise decision
              </button>
            </div>
          ) : (
            <>
              <textarea
                className="bs-ta"
                value={reason}
                onChange={(e) => { setReason(e.target.value); setErr(""); }}
                placeholder="State reason (min 10 characters). Sealed into the SHA-256 audit chain."
                style={{ borderColor: err ? "var(--fail)" : undefined }}
              />
              {err && <div style={{ fontSize: 9.5, color: "var(--fail)", marginTop: 4 }}>{err}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="bs-btn qualify" style={{ flex: 1 }} onClick={() => submit("qualify")} disabled={pending}>Qualify</button>
                <button className="bs-btn clarify" style={{ flex: 1 }} onClick={() => submit("clarify")} disabled={pending}>Clarify</button>
                <button className="bs-btn reject" style={{ flex: 1 }} onClick={() => submit("reject")} disabled={pending}>Reject</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}