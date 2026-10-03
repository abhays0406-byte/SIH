"use client";
import React, { useEffect } from "react";
import "./ws.css";

interface Props {
  open: boolean;
  onClose?: () => void;
  tone?: "navy" | "pass" | "fail" | "warn";
  wide?: boolean;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, tone = "navy", wide, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="bs-modal-mask" onMouseDown={onClose}>
      <div
        className={`bs-modal${tone === "pass" ? " tone-pass" : tone === "fail" ? " tone-fail" : tone === "warn" ? " tone-warn" : ""}${wide ? " wide" : ""}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}