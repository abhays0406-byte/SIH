"use client";
import React from "react";
import "./ws.css";
import { IdField } from "./data";

interface Props {
  fields: IdField[];
  company: string;
}

const SRCS = ["declared", "udyam", "gstn", "pan", "mca"] as const;
const SL: Record<string, string> = { declared: "DECLARED", udyam: "UDYAM", gstn: "GSTN", pan: "PAN/ITD", mca: "MCA21" };

function driftColor(s: number) {
  if (s >= 85) return { color: "var(--pass)", bar: "var(--pass)" };
  if (s >= 65) return { color: "var(--warn)", bar: "var(--warn)" };
  return { color: "var(--fail)", bar: "var(--fail)" };
}

export default function IdentityMatrix({ fields, company }: Props) {
  return (
    <div className="bs-card" style={{ overflow: "hidden" }}>
      <div className="bs-card-head">
        <div className="bs-card-head-left">
          <span className="bs-card-title">Identity Cross-Match</span>
          <span className="bs-card-sub">{company}</span>
        </div>
        <span className="bs-card-sub">token + phonetic + Indian-name norm</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="bs-table">
          <thead>
            <tr>
              <th style={{ width: "13%" }}>Field</th>
              {SRCS.map((s) => (
                <th key={s} style={{ textAlign: "center", color: s === "declared" ? "var(--navy)" : undefined, borderLeft: "1px solid var(--rule)" }}>
                  {SL[s]}
                </th>
              ))}
              <th style={{ textAlign: "center", borderLeft: "1px solid var(--rule)", width: "15%" }}>Drift</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 800, fontSize: 9.5, color: "var(--ink-50)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {f.field}
                </td>
                {SRCS.map((s) => {
                  const val = f[s];
                  const isDec = s === "declared";
                  const match = val && f.declared && val.toLowerCase() === f.declared.toLowerCase();
                  return (
                    <td key={s} style={{ textAlign: "center", borderLeft: "1px solid var(--rule)" }}>
                      {val ? (
                        <span
                          className="mono-cell"
                          style={{
                            fontSize: 9.5,
                            color: isDec ? "var(--navy)" : match ? "var(--pass)" : "var(--fail)",
                            background: !isDec ? (match ? "var(--pass-bg)" : "var(--fail-bg)") : "transparent",
                            padding: "1px 6px",
                            borderRadius: 2,
                            fontWeight: isDec ? 700 : 500,
                          }}
                        >
                          {val}
                        </span>
                      ) : (
                        <span style={{ color: "var(--ink-20)" }}>—</span>
                      )}
                    </td>
                  );
                })}
                <td style={{ textAlign: "center", borderLeft: "1px solid var(--rule)" }}>
                  {f.drift !== undefined ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <span style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 700, color: driftColor(f.drift).color }} className="bs-num">
                        {f.drift}
                      </span>
                      <div className="bs-bar" style={{ width: 34 }}>
                        <i style={{ width: `${f.drift}%`, background: driftColor(f.drift).bar }} />
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: "var(--ink-20)" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: "6px 12px", borderTop: "1px solid var(--rule)", background: "var(--band)", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 8.5, color: "var(--ink-35)" }}>green cells confirm statutory equality · red flags drift</span>
        <span className="bs-card-sub">cross-source fuzz threshold 85</span>
      </div>
    </div>
  );
}