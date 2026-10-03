"use client";
import React, { useRef, useState } from "react";
import "./ws.css";
import Modal from "./Modal";
import { AuditEntry, fmtDateTime, shortHash } from "./data";

interface Props {
  entries: AuditEntry[];
  onVerify?: () => Promise<{ integrity: "valid" | "broken"; total_entries: number; broken_at_sequence?: number }>;
  scope?: string;
}

const EV_LABEL: Record<string, string> = {
  verification_run: "VERIFICATION RUN",
  officer_decision: "OFFICER DECISION",
  document_uploaded: "DOCUMENT UPLOAD",
  tender_created: "TENDER CREATED",
};

const EV_COLOR: Record<string, string> = {
  verification_run: "#1A3A6B",
  officer_decision: "#0D5C2E",
  document_uploaded: "#7A4A00",
  tender_created: "#55657A",
};

export default function AuditTrail({ entries, onVerify, scope = "tender · verification · decision" }: Props) {
  const [verifying, setVerifying] = useState(false);
  const [tamperOn, setTamperOn] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [result, setResult] = useState<{ integrity: "valid" | "broken"; total_entries: number; broken_at_sequence?: number } | null>(null);
  const [showVerdict, setShowVerdict] = useState(false);
  const [showBreach, setShowBreach] = useState(false);
  const [scanned, setScanned] = useState(false);
  const verifiedOnce = useRef(false);

  const tamperedAt = tamperOn && entries.length >= 2 ? entries[Math.floor(entries.length / 2)].sequence : null;

  const handleVerify = async () => {
    if (!onVerify) return;
    setVerifying(true);
    setResult(null);
    setShowBreach(false);
    await new Promise((r) => setTimeout(r, 260));
    setScanned(true);
    await new Promise((r) => setTimeout(r, 1350));
    const r = await onVerify();
    setScanned(false);
    setVerifying(false);
    setResult(r);
    verifiedOnce.current = true;
    setShowVerdict(true);
  };

  const handleTamper = () => {
    if (entries.length < 2) return;
    if (tamperOn) { setTamperOn(false); return; }
    setTamperOn(true);
    setShowBreach(true);
  };

  return (
    <div className="bs-card" style={{ overflow: "hidden", position: "relative" }}>
      {scanned && <div className="bs-verify-scan" />}
      <div className="bs-card-head">
        <div className="bs-card-head-left">
          <span className="bs-card-title">Audit Trail</span>
          <span className="bs-card-sub">SHA-256 chain · {scope}</span>
        </div>
        <div className="bs-card-head-right">
          <span className={`bs-chip ${entries.length ? "hot" : ""}`}>
            {entries.length ? `◼ ${entries.length} sealed` : "empty ledger"}
          </span>
        </div>
      </div>

      <div style={{ padding: "9px 16px", display: "flex", gap: 8, borderBottom: "1px solid var(--rule)", background: "var(--band)", flexWrap: "wrap" }}>
        <button className="bs-btn sm" onClick={handleVerify} disabled={verifying || entries.length === 0}>
          {verifying ? "Recomparing…" : "Verify chain integrity"}
        </button>
        <button className="bs-btn sm reject" onClick={handleTamper} disabled={entries.length < 2}>
          {tamperOn ? "Restore chain" : "Simulate tampering"}
        </button>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 8.5, color: "var(--ink-35)", alignSelf: "center" }}>
          {verifiedOnce.current ? "integrity checked this session" : "not yet verified this session"}
        </span>
      </div>

      <div style={{ position: "relative", maxHeight: 430, overflowY: "auto" }}>
        {scanned && <div className="bs-scan" />}
        {entries.length === 0 ? (
          <div className="bs-ledger-empty">
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", color: "var(--ink-35)", textTransform: "uppercase" }}>No entries yet</div>
            <div style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 12, color: "var(--ink-70)" }}>
              Each decision is sealed to the previous one.
            </div>
            <div className="g">GENESIS 00000000…0000 · awaiting first seal</div>
            <div className="g">append-only · never mutate</div>
          </div>
        ) : (
<div className="bs-ledger">
              <div className="bs-chain-line" />
              {entries.map((e) => {
                const isExp = expanded === e.id;
                const isTampered = tamperOn && e.sequence === tamperedAt;
                const color = EV_COLOR[e.eventType] || "#55657A";
                return (
                  <div
                    key={e.id}
                    className={`bs-block${isExp ? " sel" : ""}${isTampered ? " tampered" : ""}`}
                    onClick={() => setExpanded(isExp ? null : e.id)}
                  >
                    <span className="bs-block-node bs-num">{e.sequence}</span>
                    <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 8, height: 8, background: isTampered ? "var(--fail)" : color, borderRadius: 1, flex: "none" }} />
                      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em", color: isTampered ? "var(--fail)" : color, textTransform: "uppercase" }}>
                        {EV_LABEL[e.eventType] || e.eventType.replace(/_/g, " ").toUpperCase()}
                      </span>
                      {isTampered && <span className="bs-badge fail" style={{ animation: "bs-flash 1s infinite" }}>hash mismatch</span>}
                      <span className="bs-card-sub" style={{ marginLeft: "auto" }}>{fmtDateTime(e.createdAt)}</span>
                    </div>
                    <div style={{ padding: "0 12px 8px", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                      <span className="bs-card-sub">payload {shortHash(e.payloadHash, 10)}</span>
                      <span className="bs-card-sub" style={{ color: isTampered ? "var(--fail)" : undefined }}>prev {shortHash(e.prevHash, 10)}</span>
                      <span className="bs-card-sub" style={{ color: isTampered ? "var(--fail)" : undefined }}>chain {shortHash(e.chainHash, 10)}</span>
                      {e.actorId && <span className="bs-card-sub">actor {shortHash(e.actorId, 6)}</span>}
                      <span style={{ marginLeft: "auto", fontSize: 8.5, color: "var(--ink-35)" }}>{isExp ? "▲" : "▼"}</span>
                    </div>
                    {isExp && (
                      <div style={{ padding: "0 12px 10px", animation: "bs-typed 0.2s ease" }}>
                        <div style={{ background: "var(--ink)", borderRadius: 4, padding: "9px 11px" }}>
                          <pre style={{ margin: 0, fontSize: 8.5, color: "#7C94B2", fontFamily: "var(--mono)", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.7 }}>
                            {JSON.stringify(e.payload ?? { payload: null }, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: "6px 16px", borderTop: "1px solid var(--rule)", background: "var(--band)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 8.5, color: "var(--ink-35)" }}>
            {tamperOn ? "LEDGER ALTERED — shown alongside reality for audit drill" : "append-only chain · each block hashes previous"}
          </span>
          {entries.length > 0 && (
            <span className="bs-card-sub" style={{ color: tamperOn ? "var(--fail)" : undefined }}>
              latest {shortHash(entries[0].chainHash, 12)}
            </span>
          )}
        </div>
      {/* verdict popup */}
      <Modal open={showVerdict} onClose={() => setShowVerdict(false)} tone={result?.integrity === "valid" ? "pass" : "fail"}>
        <div style={{ padding: 18 }}>
          <div className="bs-kicker" style={{ color: result?.integrity === "valid" ? "var(--pass)" : "var(--fail)", marginBottom: 6 }}>
            chain integrity report
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span className={`bs-stamp${result?.integrity === "valid" ? "" : " fail"} anim`}>
              {result?.integrity === "valid" ? "VALID" : "BROKEN"}
            </span>
            <div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>
                {result?.integrity === "valid" ? "Evidence chain intact." : "Evidence chain compromised."}
              </div>
              <div style={{ fontSize: 10, color: "var(--ink-50)", marginTop: 2 }}>
                {result?.total_entries} sealed entries re-derived through SHA-256.
              </div>
            </div>
          </div>
          <button className="bs-btn primary" style={{ width: "100%" }} onClick={() => setShowVerdict(false)}>
            Acknowledge
          </button>
        </div>
      </Modal>

      {/* tamper popup */}
      <Modal open={showBreach} onClose={() => {}} tone="fail">
        <div style={{ padding: 18 }}>
          <div className="bs-kicker" style={{ color: "var(--fail)", marginBottom: 6 }}>audit drill · tamper simulation</div>
          <div className="bs-stamp fail anim" style={{ marginBottom: 10 }}>BREACH</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
            Block #{tamperedAt} fingerprint flipped.
          </div>
          <div style={{ fontSize: 10.5, color: "var(--ink-70)", lineHeight: 1.6, marginBottom: 12 }}>
            The sealed hash no longer matches re-derivation. Any downstream verification fails at this block. Restore the chain to continue.
          </div>
          <button
            className="bs-btn primary"
            style={{ width: "100%" }}
            onClick={() => {
              setTamperOn(false);
              setShowBreach(false);
            }}
          >
            Restore chain
          </button>
        </div>
      </Modal>
    </div>
  );
}