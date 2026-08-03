"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, Clock3, Flame, Landmark } from "lucide-react";
import type { DebtMetrics } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function DebtDashboard({ metrics }: { metrics: DebtMetrics | null }) {
  const reduce = useReducedMotion();

  if (!metrics) {
    return (
      <div className="panel grid gap-4 p-5 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse bg-bg-soft" />
        ))}
      </div>
    );
  }

  const reduced = Math.max(0, metrics.beforeScore - metrics.afterScore);
  const side = [
    {
      label: "$ at risk",
      value: formatMoney(metrics.dollarsAtRisk),
      hint: `${metrics.openLoops} open · Acme $220k once`,
      icon: Landmark,
      accent: "text-accent",
    },
    {
      label: "Hours trapped",
      value: String(metrics.hoursTrapped),
      hint: `Avg ${metrics.avgAgeHours}h · ${metrics.agingCritical} aging`,
      icon: Clock3,
      accent: "text-memory",
    },
    {
      label: "Debt burned",
      value: formatMoney(metrics.dollarsFreedLifetime),
      hint: `${metrics.closedLoops} loops closed`,
      icon: ArrowDownRight,
      accent: "text-success",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.24em] text-muted">Open Loop OS</p>
          <h2 className="display mt-1 text-3xl md:text-4xl">Open Loop Debt</h2>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-muted sm:text-right">
          Score = priority × age × unique $ risk. Motion burns debt; ledger never double-counts.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel panel-glow-motion relative overflow-hidden p-5 md:p-6"
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(232,149,108,0.18),transparent_70%)]" />
          <div className="flex items-center justify-between">
            <span className="mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Debt score
            </span>
            <Flame className="h-4 w-4 text-motion" aria-hidden />
          </div>
          <div className="display metric-hero mt-3 text-5xl text-ink md:text-6xl">
            {metrics.score.toLocaleString()}
          </div>
          <p className="mt-3 text-sm text-muted">
            {reduced > 0
              ? `↓ ${reduced} from baseline ${metrics.beforeScore}`
              : `Baseline ${metrics.beforeScore} · close a loop to burn`}
          </p>
        </motion.div>

        {side.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.06 * (i + 1) }}
            className="panel p-4 md:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="mono text-[10px] uppercase tracking-[0.14em] text-muted">
                {c.label}
              </span>
              <c.icon className={`h-4 w-4 ${c.accent}`} aria-hidden />
            </div>
            <div className="display metric-hero mt-3 text-3xl md:text-4xl">{c.value}</div>
            <p className="mt-2 text-xs text-muted">{c.hint}</p>
          </motion.div>
        ))}
      </div>

      {metrics.breakdown.filter((b) => b.status !== "closed").length > 0 && (
        <div className="panel overflow-hidden">
          <div className="border-b border-line px-4 py-2.5 mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Debt breakdown
          </div>
          <div className="divide-y divide-[color:var(--line)]">
            {metrics.breakdown
              .filter((b) => b.status !== "closed")
              .slice(0, 5)
              .map((b) => (
                <div
                  key={b.loopId}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
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
