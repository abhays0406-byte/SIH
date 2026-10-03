"use client";
import React, { useEffect, useRef, useState } from "react";
import "./ws.css";
import { LogEntry, LOG_THEME, fmtTime } from "./data";

interface Props {
  entries: LogEntry[];
  running?: boolean;
  onClear?: () => void;
}

export default function PortalLog({ entries, running, onClear }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (auto) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, auto]);

  const sealed = entries.some((e) => e.status === "SEALED");
  const passCount = entries.filter((e) => e.status === "PASS").length;
  const warnCount = entries.filter((e) => e.status === "WARN").length;
  const failCount = entries.filter((e) => e.status === "FAIL").length;

  return (
    <div className="bs-term">
      <div className="bs-term-head">
        <span className="bs-term-title">
          <span className="bs-term-ctl" style={{ background: "#7A4A00" }} />
          <span className="bs-term-ctl" style={{ background: "#8C2020" }} />
          <span className="bs-term-ctl" style={{ background: "#0D5C2E" }} />
          portal.verification.log
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {running && (
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.18em", color: "#7FA8D8" }}>
              ● REC
            </span>
          )}
          <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.12em", color: "#486180", textTransform: "uppercase" }}>
            {auto ? "FOLW" : "STOP"}
          </span>
        </span>
      </div>

      <div
        ref={bodyRef}
        className="bs-term-body"
        onScroll={() => {
          const el = bodyRef.current;
          if (!el) return;
          setAuto(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
        }}
      >
        {entries.length === 0 && !running && (
          <div className="bs-term-empty">
            <div>// awaiting verification run</div>
            <div>// each connector is polled in sequence and sealed onto the SHA-256 chain<span className="bs-term-caret" style={{ animation: "none" }} /></div>
          </div>
        )}
        {running && entries.length === 0 && (
          <div className="bs-term-line" style={{ color: "#3F5678" }}>
            <span className="t">{new Date().toLocaleTimeString("en-IN", { hour12: false })}</span>
            <span className="s" style={{ color: "#7FA8D8" }}>BOOT</span>
            <span className="p">SYSTEM</span>
            <span className="m">initialising connector pool…</span>
          </div>
        )}

        {entries.map((e, i) => {
          const th = LOG_THEME[e.status];
          const last = i === entries.length - 1;
          return (
            <div className={`bs-term-line${e.status === "PASS" ? " ok" : e.status === "FAIL" ? " er" : ""}`} key={e.id} style={{ background: e.status === "RUNNING" ? "rgba(74,122,184,0.08)" : "transparent" }}>
              <span className="t bs-num">{fmtTime(e.ts)}</span>
              <span className="s" style={{ color: th.color }}>{th.prefix}</span>
              <span className="p">{e.portal}</span>
              <span className="m">
                {e.status === "RUNNING" ? (
                  <span style={{ color: "#7FA8D8" }}>
                    {e.message}
                    <span className="bs-term-caret" />
                  </span>
                ) : (
                  e.message
                )}
              </span>
              {last && entries.length > 0 && e.status !== "RUNNING" && <span className="bs-term-caret" style={{ animation: "none" }} />}
            </div>
          );
        })}

        {sealed && (
          <div className="bs-term-seal">
            VERIFICATION COMPLETE · {passCount} PASS · {warnCount} WARN · {failCount} FAIL · EVIDENCE SEALED · CHAIN UPDATED
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ borderTop: "1px solid #24354E", background: "var(--ink-90)", padding: "6px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, color: "#3F5678" }}>
          § {entries.length} telemetry rows · {running ? "streaming" : "idle"}
        </span>
        <button
          onClick={() => {
            setAuto(true);
            onClear?.();
          }}
          style={{ background: "none", border: "1px solid #33465F", color: "#6E7D92", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", padding: "2px 8px", cursor: "pointer", borderRadius: 2 }}
        >
          CLEAR
        </button>
      </div>
    </div>
  );
}