"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CircuitBoard,
  GitBranch,
  Play,
  Sparkles,
  Sunrise,
  Workflow,
} from "lucide-react";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-20%] h-[60vh] w-[60vw] rounded-full bg-[radial-gradient(circle,rgba(110,168,255,0.18),transparent_60%)] blur-2xl" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(255,143,90,0.16),transparent_60%)] blur-2xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border border-line-strong bg-bg-elevated">
            <Sparkles className="h-4 w-4 text-accent" />
          </span>
          <div>
            <div className="display text-xl leading-none">Continuum</div>
            <div className="mono text-[10px] uppercase tracking-[0.2em] text-muted">
              Open Loop OS
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="#thesis" className="hidden text-sm text-muted hover:text-ink sm:inline">
            How it works
          </a>
          <Link href="/app" className="btn btn-primary">
            Launch app <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:pt-14">
        <div>
          <motion.p
            custom={0}
            initial="hidden"
            animate="show"
            variants={fade}
            className="chip mb-5"
          >
            Memory Meets Motion · Open Loop Debt
          </motion.p>
          <motion.h1
            custom={1}
            initial="hidden"
            animate="show"
            variants={fade}
            className="display text-[clamp(2.8rem,8vw,5.6rem)] leading-[0.9] text-ink"
          >
            Continuum
          </motion.h1>
          <motion.p
            custom={2}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-3 display text-2xl text-accent md:text-3xl"
          >
            The Open Loop OS
          </motion.p>
          <motion.p
            custom={3}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-5 max-w-xl text-lg text-muted md:text-xl"
          >
            Measure unfinished work as Open Loop Debt — then burn it with Cited Motion agents
            that read your graph, close real deliverables, and write results back into memory.
          </motion.p>
          <motion.div
            custom={4}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/app" className="btn btn-primary">
              <Play className="h-4 w-4" /> Open Continuum
            </Link>
            <Link href="/app" className="btn btn-motion">
              <Sunrise className="h-4 w-4" /> Close My Morning
            </Link>
          </motion.div>
          <motion.div
            custom={5}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mt-10 flex flex-wrap gap-2 text-xs text-faint"
          >
            {["RocketRide", "FalkorDB", "Linkup", "LaserData", "$220k Acme at risk"].map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="show"
          variants={fade}
          className="panel drift relative overflow-hidden p-5 md:p-6"
        >
          <div className="mono mb-4 text-[10px] uppercase tracking-[0.18em] text-muted">
            Memory → Motion loop
          </div>
          <div className="space-y-3">
            <div className="border border-line bg-bg p-4">
              <div className="mb-2 flex items-center gap-2 text-memory">
                <GitBranch className="h-4 w-4" /> Memory
              </div>
              <p className="text-sm text-muted">
                Durable graph of people, projects, decisions — not another chat log.
              </p>
            </div>
            <div className="flex justify-center">
              <Workflow className="h-5 w-5 text-accent" />
            </div>
            <div className="border border-line bg-bg p-4">
              <div className="mb-2 flex items-center gap-2 text-motion">
                <CircuitBoard className="h-4 w-4" /> Motion
              </div>
              <p className="text-sm text-muted">
                Agents close loops with citations, then write artifacts back — debt goes down.
              </p>
            </div>
          </div>
          <div className="mt-5 border-t border-line pt-4 text-sm text-muted">
            Seed impact: <span className="text-ink">Acme Health $220k renewal</span> sitting in
            open loops until Continuum moves.
          </div>
        </motion.div>
      </section>

      <section id="thesis" className="relative z-10 border-t border-line bg-bg-elevated/50">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-16 md:grid-cols-3 md:px-8">
          {[
            {
              title: "Quantify debt",
              body: "Open Loop Debt scores priority × age × $ at risk — impact is visible before Motion runs.",
            },
            {
              title: "Cited Motion",
              body: "Every artifact cites memory node IDs. Trustable, explainable autonomous work.",
            },
            {
              title: "Proactive watchdogs",
              body: "LaserData-style rules auto-queue stale, due-soon, and revenue-risk loops.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="panel p-5"
            >
              <div className="mono mb-3 text-[10px] uppercase tracking-[0.18em] text-accent">
                0{i + 1}
              </div>
              <h3 className="display text-2xl">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-line px-5 py-8 text-center text-sm text-faint md:px-8">
        Continuum · Open Loop OS · Memory Meets Motion 2026
      </footer>
    </div>
  );
}
