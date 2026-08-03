"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, Clock3, Flame, Landmark } from "lucide-react";
import type { DebtMetrics } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function DebtDashboard({ metrics }: { metrics: DebtMetrics | null }) {
  if (!metrics) {
    return (
      <div className="panel grid gap-3 p-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse bg-bg-soft" />
        ))}
      </div>
    );
  }

  const reduced = Math.max(0, metrics.beforeScore - metrics.afterScore);
  const cards = [
    {
      label: "Open Loop Debt",
      value: metrics.score.toLocaleString(),
      hint:
        reduced > 0
          ? `↓ ${reduced} from baseline ${metrics.beforeScore}`
          : `Baseline ${metrics.beforeScore}`,
      icon: Flame,
      accent: "text-motion",
    },
    {
      label: "$ at risk",
      value: formatMoney(metrics.dollarsAtRisk),
      hint: `${metrics.openLoops} open loops · Acme $220k in seed`,
      icon: Landmark,
      accent: "text-accent",
    },
    {
      label: "Hours trapped",
      value: String(metrics.hoursTrapped),
      hint: `Avg age ${metrics.avgAgeHours}h · ${metrics.agingCritical} aging P1/P2`,
      icon: Clock3,
      accent: "text-memory",
    },
    {
      label: "Debt burned",
      value: formatMoney(metrics.dollarsFreedLifetime),
      hint: `${metrics.closedLoops} loops closed lifetime`,
      icon: ArrowDownRight,
      accent: "text-success",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted">Open Loop OS</p>
          <h2 className="display text-2xl md:text-3xl">Open Loop Debt</h2>
        </div>
        <p className="max-w-md text-right text-xs text-muted">
          Score = priority × age × $ risk. Close loops with Motion to burn debt.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="panel p-4"
          >
            <div className="flex items-center justify-between">
              <span className="mono text-[10px] uppercase tracking-[0.14em] text-muted">
                {c.label}
              </span>
              <c.icon className={`h-4 w-4 ${c.accent}`} />
            </div>
            <div className="display mt-2 text-3xl">{c.value}</div>
            <p className="mt-1 text-xs text-muted">{c.hint}</p>
          </motion.div>
        ))}
      </div>
      {metrics.breakdown.filter((b) => b.status !== "closed").length > 0 && (
        <div className="panel overflow-hidden">
          <div className="border-b border-line px-4 py-2 mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Debt breakdown
          </div>
          <div className="divide-y divide-[color:var(--line)]">
            {metrics.breakdown
              .filter((b) => b.status !== "closed")
              .slice(0, 5)
              .map((b) => (
                <div
                  key={b.loopId}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{b.title}</div>
                    <div className="mono text-[10px] text-faint">
                      P{b.priority} · {b.ageHours}h · {formatMoney(b.dollarsAtRisk)}
                    </div>
                  </div>
                  <div className="chip text-motion">{b.score}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
