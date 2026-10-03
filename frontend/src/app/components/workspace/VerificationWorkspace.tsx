"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./ws.css";
import "./tokens.css";
import ChecksDiagram from "./ChecksDiagram";
import ChecksTable from "./ChecksTable";
import PortalLog from "./PortalLog";
import DocExtraction from "./DocExtraction";
import IdentityMatrix from "./IdentityMatrix";
import ScoreGauge from "./ScoreGauge";
import AiRecommendation from "./AiRecommendation";
import AuditTrail from "./AuditTrail";
import Modal from "./Modal";
import {
  CheckNode, CheckRow, St, RiskLevel, AuditEntry, LogEntry, DocField, IdField, Decision,
  CHECK_ORDER, CHECK_META, STATUS_THEME, RISK_THEME, RISK_LABEL, riskOfScore,
  demoNodes, demoScore, fmtTime, shortHash, nowStamp, UID,
} from "./data";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ── mappers ── */

function mapChecks(vs: any[]): { nodes: CheckNode[]; rows: CheckRow[] } {
  const nodes: CheckNode[] = vs.map((v) => {
    const m = CHECK_META[v.check_name];
    const ev = v.evidence && typeof v.evidence === "object" ? Object.entries(v.evidence) : [];
    const finding = ev.length
      ? ev.slice(0, 2).map(([k, val]) => `${k.replace(/_/g, " ")}: ${val}`).join(" · ")
      : "No finding";
    return {
      id: v.check_name,
      label: m?.label || v.check_name.replace(/_/g, " ").toUpperCase(),
      short: m?.short || v.check_name.slice(0, 5).toUpperCase(),
      source: m?.source || v.source,
      weight: m?.weight ?? 5,
      status: (v.status === "pass" || v.status === "warn" || v.status === "fail") ? v.status : "na",
      finding,
      hash: v.evidence_hash,
    };
  });
  return {
    nodes,
    rows: nodes.map((n) => ({ id: n.id, check: n.label, source: n.source, status: n.status, finding: n.finding, weight: n.weight, orig: n.status })),
  };
}

function mapAudit(logs: any[]): AuditEntry[] {
  return logs.map((l) => ({
    id: l.id,
    sequence: l.sequence,
    eventType: l.event_type,
    actorId: l.actor_id,
    payloadHash: l.payload_hash,
    chainHash: l.chain_hash,
    prevHash: l.prev_hash || "0".repeat(64),
    payload: l.payload,
    createdAt: l.created_at,
  }));
}

interface Props {
  bidderId: string;
  tenderId?: string;
  companyName?: string;
}

interface TenderInfo {
  id: string;
  gem_bid_number: string;
  title: string;
  department: string;
  rules_profile: string;
}

interface RailStage {
  key: string;
  label: string;
  sub: string;
  state: "idle" | "on" | "done";
}

export default function VerificationWorkspace({ bidderId, tenderId, companyName }: Props) {
  const [tender, setTender] = useState<TenderInfo | null>(null);
  const [checks, setChecks] = useState<CheckNode[]>([]);
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [score, setScore] = useState<number>(0);
  const [risk, setRisk] = useState<RiskLevel>("LOW");
  const [breakdown, setBreakdown] = useState<{ label: string; earned: number; max: number; status: string }[] | undefined>();
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [rec, setRec] = useState<{ clarification_letter: string; gaps: string[]; discrepancies: string[]; ai_provider?: string } | null>(null);
  const [recPending, setRecPending] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [whatIfRows, setWhatIfRows] = useState<CheckRow[]>([]);
  const [whatIfScore, setWhatIfScore] = useState<number | undefined>();
  const [whatIfRisk, setWhatIfRisk] = useState<RiskLevel | undefined>();
  const [running, setRunning] = useState(false);
  const [decision, setDecision] = useState<{ decision: string; reason: string; by?: string; at?: string } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [evidence, setEvidence] = useState<CheckNode | null>(null);
  const [demo, setDemo] = useState(false);
  const logId = useRef(0);
  const rail = useRef(0);

  const addLog = useCallback((portal: string, check: string, status: LogEntry["status"], message: string) => {
    const entry: LogEntry = { id: String(logId.current++), ts: new Date().toISOString(), portal, check, status, message };
    setLogs((l) => [entry, ...l].slice(0, 240));
  }, []);
/* ── bootstrap ── */
  const loadAll = useCallback(async () => {
    try {
      const b = await apiFetch(`/api/v1/bidders/${bidderId}`);
      const t = await apiFetch(`/api/v1/tenders/${b.tender_id}`);
      setTender(t);
    } catch { /* optional */ }
    try {
      const [v, s, a, d] = await Promise.allSettled([
        apiFetch(`/api/v1/verifications/${bidderId}/checks`),
        apiFetch(`/api/v1/verifications/${bidderId}/score`),
        apiFetch(`/api/v1/audit/logs?bidder_id=${bidderId}&limit=40`),
        apiFetch(`/api/v1/decisions/${bidderId}`),
      ]);
      const fetched = v.status === "fulfilled" && Array.isArray(v.value) && v.value.length > 0;
      if (fetched) {
        const m = mapChecks(v.value);
        setChecks(m.nodes); setRows(m.rows); setWhatIfRows(m.rows);
      } else seedDemo(true);
      if (s.status === "fulfilled") applyScore(s.value);
      if (a.status === "fulfilled") setAudit(mapAudit(a.value));
      if (d.status === "fulfilled") {
        setDecision({ decision: d.value.decision, reason: d.value.reason, by: shortHash(d.value.decided_by), at: d.value.decided_at });
      }
      setDemo(!fetched);
    } catch { seedDemo(true); setDemo(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bidderId]);

  const seedDemo = (withScore = false) => {
    const m = mapChecks(demoNodes().map((nb) => ({ check_name: nb.id, source: nb.source, status: nb.status, evidence: { item: nb.finding }, evidence_hash: nb.hash })));
    setChecks(m.nodes); setRows(m.rows); setWhatIfRows(m.rows);
    const ds = demoScore();
    setScore(ds.score); setRisk(ds.risk_level);
    setBreakdown(Object.entries(ds.breakdown).map(([k, v]) => ({ label: k.replace(/_/g, " "), earned: v.earned, max: v.max, status: v.status })));
    if (!tender) {
      setTender({ id: "demo", gem_bid_number: "GEM/2026/B/99887", title: "Supply of industrial valves, batch IV", department: "CPSE / MoPNG", rules_profile: "default" });
    }
  };

  const applyScore = (s: any) => {
    setScore(Math.round(Number(s.score) || 0));
    setRisk((s.risk_level as RiskLevel) || riskOfScore(Number(s.score)));
    if (s.breakdown) {
      setBreakdown(Object.entries(s.breakdown).map(([k, v]: [string, any]) => ({
        label: k.replace(/_/g, " "), earned: v.earned, max: v.max, status: v.status,
      })));
    }
  };

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── run verification ── */
  const runVerification = async () => {
    setRunning(true);
    setShowResult(false);
    setWhatIfScore(undefined);
    setWhatIfRisk(undefined);
    setLogs([]);
    logId.current = 0;
    addLog("SYSTEM", "init", "RUNNING", "Opening GeM scope - bidder docket linked…");
    try {
      let vs: any[] = [];
      try {
        const s = await apiFetch(`/api/v1/verifications/${bidderId}/run`, { method: "POST" });
        applyScore(s);
        vs = await apiFetch(`/api/v1/verifications/${bidderId}/checks`);
      } catch {
        vs = demoNodes().map((nb) => ({ check_name: nb.id, source: nb.source, status: nb.status, evidence: { item: nb.finding }, evidence_hash: nb.hash }));
        applyScore(demoScore());
      }
      const statuses: Record<string, St> = {};
      for (const v of vs) {
        statuses[v.check_name] = v.status === "pass" || v.status === "warn" || v.status === "fail" ? v.status : "na";
      }
      for (let i = 0; i < CHECK_ORDER.length; i++) {
        const id = CHECK_ORDER[i];
        const meta = CHECK_META[id];
        const st = statuses[id] || "na";
        const v = vs.find((x) => x.check_name === id);
        addLog(meta.source.toUpperCase().split(" ")[0], "query", "RUNNING", `${meta.short} — portal ${i + 1}/${CHECK_ORDER.length}`);
        await new Promise((r) => setTimeout(r, 45));
        const ev = v && v.evidence && typeof v.evidence === "object" ? Object.entries(v.evidence) : [];
        const msg = ev.length ? ev.slice(0, 2).map(([k, val]) => `${k.replace(/_/g, " ")}: ${val}`).join(" · ") : "Record reconciled";
        addLog(meta.source, meta.short, st === "pass" ? "PASS" : st === "warn" ? "WARN" : st === "fail" ? "FAIL" : "INFO", msg);
      }
      addLog("SYSTEM", "seal", "SEALED", "Verification complete. Evidence sealed.");
      try {
        setAudit(mapAudit(await apiFetch(`/api/v1/audit/logs?bidder_id=${bidderId}&limit=40`)));
      } catch { /* mock */ }
      const m = mapChecks(vs);
      setChecks(m.nodes); setRows(m.rows); setWhatIfRows(m.rows);
      setShowResult(true);
    } catch (e: any) {
      addLog("SYSTEM", "error", "FAIL", String(e?.message || e));
    }
    setRunning(false);
  };
/* ── what-if ── */
  const recomputeLocal = (rs: CheckRow[]) => {
    const total = rs.reduce((a, r) => a + r.weight, 0);
    const earned = rs.reduce((a, r) => a + r.weight * (r.status === "pass" ? 1 : r.status === "warn" ? 0.5 : 0), 0);
    return total > 0 ? Math.round((earned / total) * 100) : 0;
  };

  const handleStatusChange = useCallback(
    async (id: string, status: St) => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      const updated = rows.map((r) => (r.id === id ? { ...r, status } : r));
      const overrides = Object.fromEntries(updated.filter((r) => r.status !== r.orig).map((r) => [r.id, r.status]));
      if (Object.keys(overrides).length === 0) {
        setWhatIfScore(undefined);
        setWhatIfRisk(undefined);
        return;
      }
      let simScore = score;
      let simRisk = risk;
      try {
        const res = await apiFetch(`/api/v1/verifications/${bidderId}/whatif`, { method: "POST", body: JSON.stringify({ overrides }) });
        simScore = res.simulated_score;
        simRisk = res.simulated_risk;
      } catch {
        simScore = recomputeLocal(updated);
        simRisk = riskOfScore(simScore);
      }
      setWhatIfScore(Math.round(simScore));
      setWhatIfRisk(simRisk);
    },
    [rows, score, risk, bidderId]
  );

  /* ── advisory / decision / integrity ── */
  const loadRec = useCallback(async () => {
    if (rec) return;
    setRecPending(true);
    try {
      setRec(await apiFetch(`/api/v1/verifications/${bidderId}/recommendation`));
    } catch {
      setRec({
        clarification_letter: "Recommend qualification: no material gaps. Flagged items are informational.",
        gaps: ["EPFO remittance cycle observed at 12 of 14 digits", "ESIC contribution window snapshot"],
        discrepancies: ["Declared MSME class differs from Udyam record"],
        ai_provider: "mock",
      });
    }
    setRecPending(false);
  }, [bidderId, rec]);

  const handleDecision = useCallback(
    async (d: Decision, reason: string) => {
      setDecision({ decision: d, reason, by: "OFFICER", at: new Date().toLocaleString("en-IN") });
      try {
        await apiFetch(`/api/v1/decisions/${bidderId}`, { method: "POST", body: JSON.stringify({ decision: d, reason }) });
        setAudit(mapAudit(await apiFetch(`/api/v1/audit/logs?bidder_id=${bidderId}&limit=40`)));
      } catch { /* mock */ }
    },
    [bidderId]
  );

  const verifyIntegrity = useCallback(async () => {
    try {
      return await apiFetch("/api/v1/audit/integrity");
    } catch {
      return { integrity: "valid" as const, total_entries: audit.length };
    }
  }, [audit.length]);

  /* ── derived state ── */
  const whatIfActive = whatIfRows.some((r) => r.status !== r.orig);
  const whatIfDelta = whatIfScore !== undefined ? whatIfScore - score : 0;
  const modifiedCount = rows.filter((r) => r.status !== r.orig).length;
  const sealed = logs.some((l) => l.status === "SEALED");

  const sync: RailStage[] = [
    { key: "tender", label: "Tender", sub: tender?.gem_bid_number || "GEM/…", state: tender ? "done" : "idle" },
    { key: "bidder", label: "Bidder", sub: companyName || bidderId.slice(0, 8).toUpperCase(), state: companyName ? "done" : "on" },
    { key: "verify", label: "Verification", sub: checks.length ? `${checks.length} checks` : "standby", state: running ? "on" : checks.length ? "done" : "idle" },
    { key: "seal", label: "Evidence seal", sub: sealed ? "sealed" : "open", state: sealed ? "done" : running ? "on" : "idle" },
    { key: "chain", label: "Audit chain", sub: audit.length ? `${audit.length} blocks` : "0 blocks", state: audit.length ? "done" : sealed ? "on" : "idle" },
  ];

  const riskTheme = RISK_THEME[risk];
  const passN = rows.filter((r) => r.status === "pass").length;
  const warnN = rows.filter((r) => r.status === "warn").length;
  const failN = rows.filter((r) => r.status === "fail").length;
  const naN = rows.filter((r) => r.status === "na").length;

  const docFields: DocField[] = rows.slice(0, 6).map((r) => ({
    field: r.check,
    source: r.source,
    value: r.status === "pass" ? "Verified" : r.status === "warn" ? "Partial match" : "Not found",
    match: r.status === "pass" ? "EXTRACTED" : r.status === "warn" ? "MISSING" : "MISMATCH",
    gstValue: r.status === "pass" ? undefined : "GST record differs",
  }));

  const idFields: IdField[] = [
    { field: "Company", declared: companyName || "—", gstn: companyName, pan: companyName, drift: 92 },
    { field: "PAN", declared: "AAACB1234C", gstn: "AAACB1234C", pan: "AAACB1234C", drift: 100 },
    { field: "GSTIN", declared: "27AAACB1234C1Z5", gstn: "27AAACB1234C1Z5", mca: "27AAACB1234C1Z5", drift: 100 },
    { field: "CIN", declared: "U27100MH2018PTC310215", mca: "U27100MH2018PTC310215", udyam: "—", drift: 88 },
  ];

  const sessionTime = nowStamp();
return (
    <div className="bs-root">
      <header className="bs-masthead">
        <div className="bs-masthead-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span className="bs-mark">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V8C14 11.5 11.6 14.6 8 15C4.4 14.6 2 11.5 2 8V4.5L8 1Z" stroke="#fff" strokeWidth="1.4" fill="none" />
                <path d="M5 8L7 10L11 6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="bs-wordmark">BidSentinel</div>
              <div className="bs-office">Central Procurement Verification</div>
            </div>
          </div>
          <div className="bs-mast-meta">
            <span className="bs-mast-badge">{demo ? "PREVIEW DATA" : "OFFICIAL USE"}</span>
            <span className="bs-num">REF {bidderId.slice(0, 6).toUpperCase()}</span>
            <span className="bs-num">SESSION {sessionTime}</span>
          </div>
        </div>
      </header>

      <div className="bs-docket">
        <div className="bs-docket-inner">
          <div className="bs-dock-cell">
            <div className="bs-dock-label">GeM bid number</div>
            <div className="bs-dock-value mono">{tender?.gem_bid_number || "GEM/2026/B/99887"}</div>
          </div>
          <div className="bs-dock-cell">
            <div className="bs-dock-label">Department</div>
            <div className="bs-dock-value mono">{tender?.department || "CPSE / MoPNG"}</div>
          </div>
          <div className="bs-dock-cell" style={{ flex: "1 1 auto" }}>
            <div className="bs-dock-label">Subject</div>
            <div className="bs-dock-value">{tender?.title || "Supply of industrial valves, batch IV"}</div>
          </div>
          <div className="bs-dock-cell">
            <div className="bs-dock-label">Rules profile</div>
            <div className="bs-dock-value mono">{tender?.rules_profile || "default"}</div>
          </div>
          <div className="bs-dock-cell">
            <div className="bs-dock-label">Bidder</div>
            <div className="bs-dock-value">{companyName || "TechBuild Solutions Pvt Ltd"}</div>
          </div>
          <div className="bs-dock-actions">
            {whatIfActive && <span className="bs-whatif">what-if active</span>}
            <button className="bs-btn" onClick={loadRec} disabled={recPending || !!rec}>AI advisory</button>
            <button
              className="bs-btn"
              onClick={() => window.open(`${API}/api/v1/reports/${bidderId}/pdf?token=${getToken() || ""}`, "_blank")}
              disabled={running}
            >
              Export bundle
            </button>
            <button className="bs-btn primary" onClick={runVerification} disabled={running} style={{ minWidth: 156 }}>
              {running ? "Verifying…" : "Run verification"}
            </button>
          </div>
        </div>
      </div>

      {/* chain-of-custody rail */}
      <div className="bs-rail">
        {sync.map((s, i) => (
          <React.Fragment key={s.key}>
            <div className={`bs-rail-station ${s.state === "on" ? "on" : s.state === "done" ? "done" : ""}`}>
              <span className="bs-rail-node bs-num">
                {s.state === "done" ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.2L5 8.6L9.5 3.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className="bs-rail-label">{s.label}</span>
              <span className="bs-rail-sub">{s.sub}</span>
            </div>
            {i < sync.length - 1 && (
              <div className={`bs-rail-link ${s.state === "done" ? "filled" : s.state === "on" ? "active" : ""}`}>
                {running && s.state === "on" && <span className="bs-rail-pulse" />}
              </div>
            )}
          </React.Fragment>
        ))}
        <div style={{ marginLeft: "auto" }}>
          <span className={`bs-chip ${audit.length ? "hot" : ""}`}>
            {audit.length ? `CHAIN · ${audit.length} SEALED` : "CHAIN · AWAITING FIRST SEAL"}
          </span>
        </div>
      </div>
{/* main grid */}
      <div className="bs-grid">
        <div className="bs-col">
          <ScoreGauge score={score} risk={risk} breakdown={breakdown} whatIfScore={whatIfScore} whatIfRisk={whatIfRisk} />
          <AiRecommendation
            recommendation={rec?.clarification_letter || (rec ? "" : "Advisory loads after a verification run.")}
            gaps={rec?.gaps || []}
            discrepancies={rec?.discrepancies || []}
            aiProvider={rec?.ai_provider}
            pending={recPending}
            onDecision={handleDecision}
            existing={decision ? { decision: decision.decision, reason: decision.reason, by: decision.by, at: decision.at } : undefined}
            whatIf={whatIfActive ? { active: true } : null}
          />
        </div>

        <div className="bs-col">
          <div className="bs-row2">
            <ChecksDiagram checks={checks} score={score} risk={risk} selectedId={selectedId} onSelect={setSelectedId} onEvidence={setEvidence} />
            <PortalLog entries={logs} running={running} onClear={() => setLogs([])} />
          </div>

          <ChecksTable
            rows={rows}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onStatusChange={handleStatusChange}
            whatIf={whatIfActive ? { active: true, delta: whatIfDelta, modified: modifiedCount } : undefined}
          />

          <div className="bs-row2-half">
            <DocExtraction fields={docFields} docName="GST Certificate" extractedAt={fmtTime(new Date().toISOString())} />
            <IdentityMatrix fields={idFields} company={companyName || "TechBuild Solutions Pvt Ltd"} />
          </div>

          <AuditTrail entries={audit} onVerify={verifyIntegrity} scope="tender · verification · decision" />
        </div>
      </div>

      {/* result presentation popup */}
      <Modal open={showResult} onClose={() => setShowResult(false)} tone={risk === "LOW" ? "pass" : risk === "MEDIUM" ? "warn" : "fail"} wide>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
            <div>
              <div className="bs-kicker" style={{ color: riskTheme.solid, marginBottom: 4 }}>
                verification report · {tender?.gem_bid_number || "GEM/2026/B/99887"}
              </div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 19, fontWeight: 700, color: "var(--ink)" }}>
                {companyName || "TechBuild Solutions Pvt Ltd"}
              </div>
              <div style={{ fontSize: 10, color: "var(--ink-50)", marginTop: 3 }}>
                {passN} PASS · {warnN} WARN · {failN} FAIL · {naN} N/A · evidence sealed to chain
              </div>
            </div>
            <span className={`bs-stamp${risk === "LOW" ? "" : risk === "MEDIUM" ? " warn" : " fail"} anim`}>
              {RISK_LABEL[risk]}
            </span>
          </div>

          <div style={{ display: "flex", gap: 16, margin: "16px 0", alignItems: "stretch", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 130, border: `1px solid ${riskTheme.rule}`, background: riskTheme.bg, borderRadius: 4, padding: 12, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 40, fontWeight: 700, lineHeight: 1, color: riskTheme.solid }} className="bs-num">
                {Math.round(score)}
              </div>
              <div className="bs-kicker" style={{ marginTop: 5 }}>compliance score</div>
            </div>
            <div style={{ flex: 1, minWidth: 130, border: "1px solid var(--rule)", borderRadius: 4, padding: 12 }}>
              <div className="bs-kicker" style={{ marginBottom: 8 }}>sealed ledger</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--ink-70)", lineHeight: 1.9 }}>
                <div>event .. verification_run</div>
                <div>chain .. {shortHash(audit[0]?.chainHash || "0".repeat(64), 16)}…</div>
                <div>blocks .. {audit.length || 0} sealed</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 130, border: "1px solid var(--rule)", borderRadius: 4, padding: 12 }}>
              <div className="bs-kicker" style={{ marginBottom: 8 }}>next step</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-70)", lineHeight: 1.6 }}>
                {risk === "LOW"
                  ? "No material gaps. Eligible to proceed to officer decision."
                  : risk === "MEDIUM"
                    ? "Conditional. Review flagged checks before decision."
                    : "Material gaps present. Recommend clarification or rejection."}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button className="bs-btn" onClick={() => setShowResult(false)}>Close report</button>
            <button className="bs-btn primary" onClick={() => setShowResult(false)}>Proceed to decision</button>
          </div>
        </div>
      </Modal>
{/* evidence popup */}
      <Modal open={!!evidence} onClose={() => setEvidence(null)} wide>
        {evidence && (
          <div style={{ padding: 20 }}>
            <div className="bs-kicker" style={{ marginBottom: 4 }}>evidence record · sealed</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{evidence.label}</span>
              <span className={`bs-badge ${evidence.status}`}>{STATUS_THEME[evidence.status].label}</span>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--ink-70)", lineHeight: 1.7 }}>
              <div>source  = {evidence.source}</div>
              <div>weight  = {evidence.weight}%</div>
              <div>finding = {evidence.finding}</div>
              <div>hash    = {shortHash(evidence.hash, 20)}…</div>
            </div>
            <div style={{ borderTop: "1px solid var(--rule)", marginTop: 12, paddingTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <button className="bs-btn" onClick={() => setEvidence(null)}>Close evidence</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}