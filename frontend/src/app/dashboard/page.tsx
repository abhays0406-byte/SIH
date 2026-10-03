"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { getTenders, createTender } from "@/lib/api";
import "../components/workspace/ws.css";

interface Tender { id: string; gem_bid_number: string; title: string; department: string; rules_profile: string; created_at: string; }

export default function Dashboard() {
  const router = useRouter();
  const { token, role, logout } = useAuthStore();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ gem_bid_number: "", title: "", department: "", rules_profile: "default" });

  useEffect(() => { if (!token) { router.push("/"); return; } getTenders().then((r) => setTenders(r.data)).catch(() => {}); }, [token, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const r = await createTender(form); setTenders((p) => [r.data, ...p]); setShowForm(false); } catch { /* silent */ }
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
          <div className="bs-mast-meta">
            <span className="bs-mast-badge">{String(role || "officer").toUpperCase()}</span>
            <button onClick={() => { logout(); router.push("/"); }} style={{ background: "none", border: "none", color: "#8FA3BE", fontFamily: "var(--mono)", fontSize: 9.5, cursor: "pointer" }}>SIGN OUT</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1060, margin: "28px auto 0", padding: "0 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18, gap: 16 }}>
          <div>
            <div className="bs-kicker" style={{ marginBottom: 4 }}>procurement workspace</div>
            <div className="bs-title">Active Tenders</div>
          </div>
          {(role === "officer" || role === "admin") && (
            <button className="bs-btn primary" onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ New tender"}</button>
          )}
        </div>
{showForm && (
          <div className="bs-card" style={{ marginBottom: 16 }}>
            <div className="bs-card-head">
              <span className="bs-card-title">Register tender</span>
              <span className="bs-card-sub">schedules a rules profile for every bidder</span>
            </div>
            <form onSubmit={submit} style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10 }}>
              <input className="bs-input" placeholder="GeM bid number · GEM/2026/B/99887" value={form.gem_bid_number} onChange={(e) => setForm({ ...form, gem_bid_number: e.target.value })} required />
              <input className="bs-input" placeholder="Department · CPSE / MoPNG" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
              <select className="bs-input" value={form.rules_profile} onChange={(e) => setForm({ ...form, rules_profile: e.target.value })}>
                <option value="default">default</option>
                <option value="mopng_cpse">mopng_cpse</option>
              </select>
              <input className="bs-input" style={{ gridColumn: "1 / 3" }} placeholder="Title · Supply of industrial valves" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <button type="submit" className="bs-btn primary">Create</button>
            </form>
          </div>
        )}

        <div className="bs-card" style={{ overflow: "hidden" }}>
          <div className="bs-card-head">
            <div className="bs-card-head-left">
              <span className="bs-card-title">Dockets</span>
              <span className="bs-chip">{tenders.length} open</span>
            </div>
            <span className="bs-card-sub">open a tender for its bidder heatmap</span>
          </div>
          <table className="bs-table">
            <thead>
              <tr>
                <th>GeM bid number</th>
                <th>Title</th>
                <th>Department</th>
                <th>Rules</th>
                <th style={{ textAlign: "right" }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {tenders.map((t) => (
                <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/dashboard/tender/${t.id}`)}>
                  <td className="mono-cell">{t.gem_bid_number}</td>
                  <td className="strong">{t.title}</td>
                  <td>{t.department || "—"}</td>
                  <td className="mono-cell">{t.rules_profile}</td>
                  <td style={{ textAlign: "right" }} className="mono-cell">{new Date(t.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
              {tenders.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 26, textAlign: "center", color: "var(--ink-25)", fontSize: 10 }}>
                    No tenders on file yet. Create one to begin.
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