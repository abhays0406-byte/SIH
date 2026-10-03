"use client";
import { motion } from "framer-motion";
import { Hash } from "lucide-react";

interface AuditLog {
  id: string;
  sequence: number;
  event_type: string;
  chain_hash: string;
  payload_hash: string;
  created_at: string;
  payload?: Record<string, unknown>;
}

export default function AuditChainView({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="w-4 h-4 text-indigo-400" />
        <h3 className="font-medium text-white">Audit Chain</h3>
        <span className="text-xs text-gray-500">({logs.length} entries)</span>
      </div>
      {logs.length === 0 && <p className="text-gray-500 text-sm">No audit events yet.</p>}
      <div className="space-y-2">
        {logs.map((log, i) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
          >
            <div className="flex flex-col items-center">
              <span className="text-xs text-indigo-400 font-mono">#{log.sequence}</span>
              {i < logs.length - 1 && <div className="w-px h-4 bg-white/10 mt-1" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">{log.event_type}</span>
                <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString("en-IN")}</span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                chain: {log.chain_hash.slice(0, 32)}...
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
