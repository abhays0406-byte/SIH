"use client";
import React from "react";
import "./ws.css";
import { DocField } from "./data";

interface Props {
  fields: DocField[];
  docName?: string;
  extractedAt?: string;
  engine?: string;
}

const MATCH_CLS: Record<DocField["match"], { label: string; cls: string }> = {
  EXTRACTED: { label: "EXTRACTED", cls: "extracted" },
  MISMATCH: { label: "MISMATCH", cls: "fail" },
  MISSING: { label: "MISSING", cls: "warn" },
  PENDING: { label: "PENDING", cls: "na" },
};

export default function DocExtraction({ fields, docName, extractedAt, engine }: Props) {
  const ok = fields.filter((f) => f.match === "EXTRACTED").length;
  const pct = fields.length ? Math.round((ok / fields.length) * 100) : 0;

  return (
    <div className="bs-card" style={{ overflow: "hidden" }}>
      <div className="bs-card-head">
        <div className="bs-card-head-left">
          <span className="bs-card-title">Document Extraction</span>
          <span className="bs-card-sub">{docName || "OCR inbound"}</span>
        </div>
        <div className="bs-card-head-right">
          <span className="bs-chip">
            {ok}/{fields.length} reconciled
          </span>
          {extractedAt && <span className="bs-card-sub">OCR @ {extractedAt}</span>}
        </div>
      </div>

      <div className="bs-bar" style={{ height: 4, borderRadius: 0 }}>
        <i style={{ width: `${pct}%`, background: "var(--pass)" }} />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="bs-table">
          <thead>
            <tr>
              <th style={{ width: "34%" }}>Field / Source</th>
              <th>Value on record</th>
              <th style={{ width: "22%", textAlign: "right" }}>Match vs GST</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f, i) => {
              const m = MATCH_CLS[f.match];
              return (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 10.5 }}>{f.field}</div>
                    <div className="mono-cell" style={{ fontSize: 8.5 }}>{f.source}</div>
                  </td>
                  <td>
                    <span className="mono-cell" style={{ fontSize: 10 }}>{f.value}</span>
                    {f.gstValue && f.match !== "EXTRACTED" && (
                      <div style={{ fontSize: 8.5, color: "var(--fail)", marginTop: 2 }}>GST record: {f.gstValue}</div>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`bs-badge ${m.cls}`}>{m.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ padding: "6px 12px", borderTop: "1px solid var(--rule)", background: "var(--band)", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 8.5, color: "var(--ink-35)" }}>field rules: GSTN schema · normalisation on</span>
        <span className="bs-card-sub">{engine || "tesseract v5 · entity parsing"}</span>
      </div>
    </div>
  );
}