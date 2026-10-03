"use client";
import React, { useEffect, useRef, useState } from "react";
import "./ws.css";
import { CheckRow, St, STATUS_THEME } from "./data";

interface Props {
  rows: CheckRow[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onStatusChange?: (id: string, s: St) => void;
  whatIf?: { active: boolean; delta: number; modified: number };
}

const CYCLE: Record<St, St> = { pass: "warn", warn: "fail", fail: "na", na: "pass" };
type SortKey = "weight" | "check" | "status";

export default function ChecksTable({ rows, selectedId, onSelect, onStatusChange, whatIf }: Props) {
  const [sort, setSort] = useState<SortKey>("weight");
  const [dir, setDir] = useState<1 | -1>(-1);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  useEffect(() => {
    if (selectedId) {
      const el = rowRefs.current.get(selectedId);
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedId]);

  const sorted = [...rows].sort((a, b) => {
    const va = a[sort];
    const vb = b[sort];
    return (va > vb ? 1 : va < vb ? -1 : 0) * dir;
  });

  const toggleSort = (k: SortKey) => {
    if (sort === k) setDir((d) => (d === 1 ? -1 : 1));
    else { setSort(k); setDir(-1); }
  };

  const onBadge = (e: React.MouseEvent, row: CheckRow) => {
    e.stopPropagation();
    onStatusChange?.(row.id, CYCLE[row.status]);
  };

  const modified = rows.filter((r) => r.status !== r.orig).length;

  const cols: { k: SortKey | null; l: string; w?: string }[] = [
    { k: "check", l: "Check", w: "24%" },
    { k: null, l: "Source portal" },
    { k: "status", l: "Status", w: "12%" },
    { k: "weight", l: "Wt %", w: "10%" },
    { k: null, l: "Finding" },
  ];

  return (
    <div className="bs-card" style={{ overflow: "hidden" }}>
      <div className="bs-card-head">
        <div className="bs-card-head-left">
          <span className="bs-card-title">Compliance Ledger</span>
          <span className="bs-chip">{rows.length} checks</span>
          {whatIf?.active && (
            <span className="bs-whatif">
              what-if projection · {whatIf.modified} modified · Δ {whatIf.delta >= 0 ? "+" : ""}{whatIf.delta.toFixed(1)}
            </span>
          )}
        </div>
        <div className="bs-card-head-right">
          <span className="bs-card-sub">click a status badge to simulate</span>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="bs-table">
          <thead>
            <tr>
              {cols.map((c) => (
                <th
                  key={c.l}
                  onClick={() => c.k && toggleSort(c.k)}
                  style={{ cursor: c.k ? "pointer" : "default", userSelect: "none", width: c.w }}
                >
                  {c.l}
                  {c.k && (
                    <span style={{ marginLeft: 4, opacity: sort === c.k ? 1 : 0.3, fontSize: 7.5 }}>
                      {sort === c.k ? (dir === -1 ? "▼" : "▲") : "▼"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
{sorted.map((row) => {
              const sel = selectedId === row.id;
              const mod = row.status !== row.orig;
              const th = STATUS_THEME[row.status];
              return (
                <tr
                  key={row.id}
                  className={`${sel ? "sel" : ""}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) return;
                    onSelect?.(sel ? null : row.id);
                  }}
                  style={mod ? { background: "#FFFDF5" } : undefined}
                  ref={(el) => {
                    if (el) rowRefs.current.set(row.id, el);
                  }}
                >
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 7, height: 7, background: th.solid, borderRadius: 1, flex: "none" }} />
                      <span className="strong">{row.check}</span>
                    </div>
                  </td>
                  <td className="mono-cell">{row.source}</td>
                  <td>
                    <button
                      className={`bs-badge ${row.status}`}
                      onClick={(e) => onBadge(e, row)}
                      title="Cycle status: Pass → Warn → Fail → N/A"
                      style={{ cursor: "pointer" }}
                    >
                      <span className="sq" />
                      {th.label}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                      <div className="bs-bar" style={{ width: 26 }}>
                        <i style={{ width: `${(row.weight / 20) * 100}%`, background: th.solid }} />
                      </div>
                      <span className="bs-num" style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-50)" }}>{row.weight}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 9.5, color: "var(--ink-50)" }}>{row.finding}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 22, textAlign: "center", color: "var(--ink-25)", fontSize: 10 }}>
                  Run verification to populate the ledger.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ padding: "6px 12px", borderTop: "1px solid var(--rule)", background: "var(--band)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 8.5, color: "var(--ink-35)" }}>
          Status badges loop PASS → WARN → FAIL → N/A for live what-if scoring. Nothing is persisted.
        </span>
        {whatIf?.active && modified > 0 ? (
          <span style={{ fontSize: 8.5, fontWeight: 800, color: "var(--warn)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {modified} overridden
          </span>
        ) : (
          <span className="bs-card-sub">{rows.length} rows</span>
        )}
      </div>
    </div>
  );
}