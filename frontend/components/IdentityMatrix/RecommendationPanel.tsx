"use client";
import { motion } from "framer-motion";
import { Bot, AlertCircle, FileText } from "lucide-react";

interface Recommendation {
  gaps: string[];
  discrepancies: string[];
  clarification_letter: string;
  ai_provider: string;
}

export default function RecommendationPanel({ recommendation }: { recommendation: Recommendation | null }) {
  if (!recommendation) return (
    <div className="glass-card p-8 text-center text-gray-500">
      Click the Recommendation tab to generate AI analysis.
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <h3 className="font-medium text-white">Compliance Gaps</h3>
          <span className="text-xs bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded-full">{recommendation.gaps.length}</span>
        </div>
        <ul className="space-y-1">
          {recommendation.gaps.map((g, i) => (
            <motion.li key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="text-sm text-gray-300 flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span> {g}
            </motion.li>
          ))}
        </ul>
      </div>

      {recommendation.discrepancies.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <h3 className="font-medium text-white">Identity Discrepancies</h3>
          </div>
          <ul className="space-y-1">
            {recommendation.discrepancies.map((d, i) => (
              <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span> {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h3 className="font-medium text-white">Clarification Letter Draft</h3>
          <span className="text-xs text-gray-500 ml-auto">via {recommendation.ai_provider}</span>
        </div>
        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans bg-white/5 rounded-lg p-3">
          {recommendation.clarification_letter}
        </pre>
      </div>

      <p className="text-xs text-gray-500 text-center">
        <Bot className="w-3 h-3 inline mr-1" />
        AI-generated recommendation — for decision support only. Officer makes the final call.
      </p>
    </div>
  );
}
