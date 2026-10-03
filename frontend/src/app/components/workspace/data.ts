"use client";

/* ════════════════════════════════════════════════════════════════
   BIDSENTINEL · SHARED WORKSPACE DATA
   Check catalogue, status palettes, demo dataset, formatters.
   ════════════════════════════════════════════════════════════════ */

export type St = "pass" | "warn" | "fail" | "na";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Decision = "qualify" | "clarify" | "reject";

export interface CheckNode {
  id: string;
  label: string;
  short: string;
  source: string;
  weight: number;
  status: St;
  finding: string;
  hash?: string;
}

export interface CheckRow {
  id: string;
  check: string;
  source: string;
  status: St;
  finding: string;
  weight: number;
  orig: St;
}

export interface LogEntry {
  id: string;
  ts: string;
  portal: string;
  check: string;
  status: "PASS" | "WARN" | "FAIL" | "RUNNING" | "SEALED" | "INFO";
  message: string;
}

export type DocMatch = "EXTRACTED" | "MISMATCH" | "MISSING" | "PENDING";

export interface DocField {
  field: string;
  source: string;
  value: string;
  match: DocMatch;
  gstValue?: string;
}

export interface IdField {
  field: string;
  declared: string;
  udyam?: string;
  gstn?: string;
  pan?: string;
  mca?: string;
  drift?: number;
}

export interface AuditEntry {
  id: string;
  sequence: number;
  eventType: string;
  actorId?: string;
  payloadHash: string;
  chainHash: string;
  prevHash: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

/* ── Check catalogue ─────────────────────────────────────────── */

export interface CheckMeta {
  id: string;
  short: string;
  label: string;
  source: string;
  weight: number;
}

export const CHECK_ORDER: string[] = [
  "debarment_check",
  "pan_verification",
  "gstn_verification",
  "mca21_company_status",
  "epfo_compliance",
  "udyam_registration",
  "make_in_india_class",
  "esic_compliance",
  "bis_certification",
  "digilocker_documents",
  "nsic_registration",
  "startup_india_recognition",
];

export const CHECK_META: Record<string, CheckMeta> = {
  debarment_check:           { id: "debarment_check",           short: "DEBAR",  label: "DEBARMENT CHECK",           source: "GeM / CVC",        weight: 20 },
  pan_verification:          { id: "pan_verification",          short: "PAN",    label: "PAN VERIFICATION",          source: "PAN / ITD",        weight: 15 },
  gstn_verification:         { id: "gstn_verification",         short: "GSTN",   label: "GSTN VERIFICATION",         source: "GSTN",             weight: 12 },
  mca21_company_status:      { id: "mca21_company_status",      short: "MCA21",  label: "MCA21 COMPANY STATUS",      source: "MCA21",            weight: 10 },
  epfo_compliance:           { id: "epfo_compliance",           short: "EPFO",   label: "EPFO COMPLIANCE",           source: "EPFO",             weight: 8 },
  udyam_registration:        { id: "udyam_registration",        short: "UDYAM",  label: "UDYAM REGISTRATION",        source: "Udyam",            weight: 8 },
  make_in_india_class:       { id: "make_in_india_class",       short: "MII",    label: "MAKE IN INDIA CLASS",       source: "DPIIT / MII",      weight: 8 },
  esic_compliance:           { id: "esic_compliance",           short: "ESIC",   label: "ESIC COMPLIANCE",           source: "ESIC",             weight: 6 },
  bis_certification:         { id: "bis_certification",         short: "BIS",    label: "BIS CERTIFICATION",         source: "BIS",              weight: 5 },
  digilocker_documents:      { id: "digilocker_documents",      short: "DIGI",   label: "DIGILOCKER DOCUMENTS",      source: "DigiLocker",       weight: 3 },
  nsic_registration:         { id: "nsic_registration",         short: "NSIC",   label: "NSIC REGISTRATION",         source: "NSIC",             weight: 3 },
  startup_india_recognition: { id: "startup_india_recognition", short: "STARTUP", label: "STARTUP INDIA RECOGNITION", source: "DPIIT / Startup",  weight: 2 },
};
/* ── Status palette (single source of truth) ─────────────────── */

export const STATUS_THEME: Record<St, { solid: string; bg: string; rule: string; label: string }> = {
  pass: { solid: "#0D5C2E", bg: "#E7F2EA", rule: "#AFCBB2", label: "PASS" },
  warn: { solid: "#7A4A00", bg: "#FBF1DC", rule: "#E2C27F", label: "WARN" },
  fail: { solid: "#8C2020", bg: "#FAECE7", rule: "#DAA9A0", label: "FAIL" },
  na:   { solid: "#55657A", bg: "#EFEDE6", rule: "#C6C0B4", label: "N/A" },
};

export const RISK_THEME: Record<RiskLevel, { solid: string; bg: string; rule: string }> = {
  LOW:      { solid: "#0D5C2E", bg: "#E7F2EA", rule: "#AFCBB2" },
  MEDIUM:   { solid: "#7A4A00", bg: "#FBF1DC", rule: "#E2C27F" },
  HIGH:     { solid: "#B04A12", bg: "#FBEEDD", rule: "#E0B087" },
  CRITICAL: { solid: "#8C2020", bg: "#FAECE7", rule: "#DAA9A0" },
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: "LOW RISK",
  MEDIUM: "MEDIUM RISK",
  HIGH: "HIGH RISK",
  CRITICAL: "CRITICAL RISK",
};

export function riskOfScore(score: number): RiskLevel {
  if (score < 30) return "CRITICAL";
  if (score < 55) return "HIGH";
  if (score < 75) return "MEDIUM";
  return "LOW";
}

/* ── Log status palette ──────────────────────────────────────── */

export const LOG_THEME: Record<LogEntry["status"], { color: string; prefix: string }> = {
  PASS:    { color: "#6FBF8F", prefix: "PASS" },
  WARN:    { color: "#D9A950", prefix: "WARN" },
  FAIL:    { color: "#E0938C", prefix: "FAIL" },
  RUNNING: { color: "#7FA8D8", prefix: "RUN." },
  SEALED:  { color: "#9AA8C0", prefix: "SEAL" },
  INFO:    { color: "#6E7D92", prefix: "INFO" },
};

/* ── Demo dataset (used when the API is unreachable) ─────────── */

const SAMPLE_FINDINGS: Record<string, string> = {
  debarment_check:           "OEM auth valid till 03/2027 · Clear on debarment & CVC lists",
  pan_verification:          "PAN AAACB1234C active · Name matches declared record",
  gstn_verification:         "GSTIN 27AAACB1234C1Z5 active · Returns filed to 06/2027",
  mca21_company_status:      "Active · No strike-off notice · CIN match confirmed",
  epfo_compliance:           "UAN batch matched · 14-digit remittance observed",
  udyam_registration:        "UDYAM-MM-04-0012345 verified · MSME class II",
  make_in_india_class:       "Class III (goods ≥ 50%) claimed · no DPIIT caveat",
  esic_compliance:           "Employer code active · contribution cycle clear",
  bis_certification:         "License 81002547 for IS 123:2020 in force",
  digilocker_documents:      "GST + PAN documents present · QR signature valid",
  nsic_registration:         "Regn NSIC/SN/2421 active to 11/2027",
  startup_india_recognition: "DPR30/0031 recognised · eligibility window holds",
};

const SAMPLE_STATUS: Record<string, St> = {
  debarment_check: "pass",
  pan_verification: "pass",
  gstn_verification: "pass",
  mca21_company_status: "pass",
  epfo_compliance: "warn",
  udyam_registration: "pass",
  make_in_india_class: "pass",
  esic_compliance: "warn",
  bis_certification: "pass",
  digilocker_documents: "pass",
  nsic_registration: "na",
  startup_india_recognition: "na",
};

export function demoNodes(): CheckNode[] {
  return CHECK_ORDER.map((id) => {
    const m = CHECK_META[id];
    return {
      id,
      label: m.label,
      short: m.short,
      source: m.source,
      weight: m.weight,
      status: SAMPLE_STATUS[id],
      finding: SAMPLE_FINDINGS[id],
      hash: `${id}_demo_${Math.random().toString(16).slice(2, 10)}`,
    };
  });
}

export function demoScore(): { score: number; risk_level: RiskLevel; breakdown: Record<string, { weight: number; status: St; earned: number; max: number }> } {
  const nodes = demoNodes();
  const total = nodes.reduce((a, n) => a + n.weight, 0);
  const earned = nodes.reduce((a, n) => a + n.weight * (n.status === "pass" ? 1 : n.status === "warn" ? 0.5 : 0), 0);
  const score = Math.round((earned / total) * 100);
  return {
    score,
    risk_level: riskOfScore(score),
    breakdown: Object.fromEntries(nodes.map((n) => [n.id, {
      weight: n.weight, status: n.status,
      earned: Math.round(n.weight * (n.status === "pass" ? 1 : n.status === "warn" ? 0.5 : 0) * 100) / 100,
      max: n.weight,
    }])),
  };
}

/* ── Formatters ──────────────────────────────────────────────── */

export function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso.slice(11, 19) || iso;
  }
}

export function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return iso;
  }
}

export function shortHash(h?: string | null, n = 8): string {
  return (h || "").slice(0, n);
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function nowStamp(): string {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export const UID = () => Math.random().toString(36).slice(2, 10);