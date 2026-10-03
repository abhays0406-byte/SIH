"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBidders, addBidder, getHeatmap, triggerBatch } from "@/lib/api";
import "../../../components/workspace/ws.css";

interface Heat { bidder_id: string; company_name: string; score: number | null; risk_level: string | null; knockout: boolean; decision: string; }

const RCLS: Record<string, string> = { LOW: "pass", MEDIUM: "warn", HIGH: "fail", CRITICAL: "fail" };

export default function TenderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [heat, setHeat] = useState<Heat[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ company_name: "", pan: "", gstin: "", cin: "", udyam_number: "" });

  const load = () => getHeatmap(id).then((r) => setHeat(r.data)).catch(() => {});
  useEffect(() => { load(); }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await addBidder(id, form); setShow(false); load(); } catch { /* silent */ }
  };

  return (
    <div className="bs-root">
      <header className="bs-masthead">
        <div className="bs-masthead-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="bs-mark">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V8C14 11.5 11.6 14.6 8 15C4.4 14.6 2 11.5 2 8V4.5L8 1Z" stroke="#fff" strokeWidth="1.4" fill="none" />
                <path d="M5 8L7 10L11 6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <div className="bs-wordmark">BidSentinel</div>
              <div className="bs-office">Central Procurement Verification</div>
            </div>
          </div>
          <button onClick={() => router.push("/dashboard")}
            style={{ background: "none", border: "1px solid #3A5270", color: "#CCD9EA", fontFamily: "var(--mono)", fontSize: 9, cursor: "pointer", letterSpacing: "0.14em", padding: "4px 10px", borderRadius: 2 }}>
            ← TENDERS
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1060, margin: "28px auto 0", padding: "0 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <div className="bs-kicker" style={{ marginBottom: 4 }}>tender dossier</div>
            <div className="bs-title">Bidder Heatmap</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="bs-btn" onClick={() => setShow((s) => !s)}>+ Add bidder</button>
            <button className="bs-btn primary" onClick={() => { triggerBatch(id).catch(() => {}); setTimeout(load, 900); }}>Run batch verification</button>
          </div>
        </div>
{show && (
          <div className="bs-card" style={{ marginBottom: 16 }}>
            <div className="bs-card-head">
              <span className="bs-card-title">Register bidder</span>
              <span className="bs-card-sub">PAN + GSTIN drive the statutory checks</span>
            </div>
            <form onSubmit={submit} style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <input className="bs-input" placeholder="Company name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
              <input className="bs-input" placeholder="PAN" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
              <input className="bs-input" placeholder="GSTIN" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
              <input className="bs-input" placeholder="CIN" value={form.cin} onChange={(e) => setForm({ ...form, cin: e.target.value })} />
              <input className="bs-input" placeholder="Udyam no." value={form.udyam_number} onChange={(e) => setForm({ ...form, udyam_number: e.target.value })} />
              <button type="submit" className="bs-btn primary">Add to tender</button>
            </form>
          </div>
        )}

        <div className="bs-card" style={{ overflow: "hidden" }}>
          <div className="bs-card-head">
            <div className="bs-card-head-left">
              <span className="bs-card-title">Bidders on record</span>
              <span className="bs-chip">{heat.length} filed</span>
            </div>
            <span className="bs-card-sub">open a row for the verification workspace</span>
          </div>
          <table className="bs-table">
            <thead>
              <tr>
                <th>Company</th>
                <th style={{ textAlign: "right" }}>Score</th>
                <th style={{ textAlign: "center" }}>Risk</th>
                <th style={{ textAlign: "center" }}>Knockout</th>
                <th style={{ textAlign: "center" }}>Decision</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {heat.map((b) => (
                <tr key={b.bidder_id} style={{ cursor: "pointer" }} onClick={() => router.push(`/workspace/${b.bidder_id}`)}>
                  <td className="strong">{b.company_name}</td>
                  <td style={{ textAlign: "right" }}>
                    {b.score !== null ? (
                      <span className="bs-num" style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 700, color: b.score >= 75 ? "var(--pass)" : b.score >= 50 ? "var(--warn)" : "var(--fail)" }}>
                        {b.score.toFixed(1)}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {b.risk_level ? <span className={`bs-badge ${RCLS[b.risk_level] || "na"}`}>{b.risk_level}</span> : "—"}
                  </td>
                  <td style={{ textAlign: "center", fontSize: 9, color: b.knockout ? "var(--fail)" : "var(--ink-25)", letterSpacing: "0.1em" }}>
                    {b.knockout ? "YES" : "no"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: b.decision === "qualify" ? "var(--pass)" : b.decision === "disqualify" ? "var(--fail)" : b.decision === "clarify" ? "var(--warn)" : "var(--ink-25)" }}>
                      {b.decision || "pending"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="bs-btn sm" onClick={(e) => { e.stopPropagation(); router.push(`/workspace/${b.bidder_id}`); }}>
                      Open dossier
                    </button>
                  </td>
                </tr>
              ))}
              {heat.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 26, textAlign: "center", color: "var(--ink-25)", fontSize: 10 }}>
                    No bidders filed. Add one to begin verification.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}