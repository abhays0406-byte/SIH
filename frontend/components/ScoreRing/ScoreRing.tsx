"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Props {
  score: number | null;
  riskLevel: string | null;
  knockout: boolean;
}

const RISK_COLOR: Record<string, string> = {
  LOW: "#34d399",
  MEDIUM: "#fbbf24",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

export default function ScoreRing({ score, riskLevel, knockout }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const size = 160, r = 60, strokeW = 12;
    const color = riskLevel ? RISK_COLOR[riskLevel] : "#6366f1";
    const pct = score !== null ? score / 100 : 0;

    const arc = d3.arc<d3.DefaultArcObject>()
      .innerRadius(r - strokeW)
      .outerRadius(r)
      .startAngle(-Math.PI / 2)
      .cornerRadius(6);

    const g = svg.append("g").attr("transform", `translate(${size / 2},${size / 2})`);

    // Background ring
    g.append("path")
      .datum({ endAngle: Math.PI * 1.5 } as d3.DefaultArcObject)
      .attr("d", arc)
      .attr("fill", "rgba(255,255,255,0.05)");

    // Score arc
    g.append("path")
      .datum({ endAngle: -Math.PI / 2 } as d3.DefaultArcObject)
      .attr("d", arc)
      .attr("fill", color)
      .transition()
      .duration(800)
      .attrTween("d", function (d) {
        const interp = d3.interpolate(d.endAngle, -Math.PI / 2 + Math.PI * 2 * pct);
        return (t) => arc({ ...d, endAngle: interp(t) } as d3.DefaultArcObject) || "";
      });

    // Score text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", color)
      .attr("font-size", "28px")
      .attr("font-weight", "bold")
      .text(score !== null ? score.toFixed(1) : "—");

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.8em")
      .attr("fill", "#9ca3af")
      .attr("font-size", "10px")
      .text(riskLevel || "PENDING");
  }, [score, riskLevel]);

  return (
    <div className="glass-card p-4 flex flex-col items-center">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Compliance Score</h3>
      <svg ref={svgRef} width={160} height={160} />
      {knockout && (
        <div className="mt-2 text-xs text-red-400 bg-red-900/30 px-3 py-1 rounded-full">
          ⚠ Knockout Triggered
        </div>
      )}
    </div>
  );
}
