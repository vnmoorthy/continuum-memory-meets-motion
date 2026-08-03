"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

function HeroMesh() {
  return (
    <svg
      className="hero-mesh pointer-events-none absolute inset-0 h-full w-full opacity-50"
      viewBox="0 0 1200 800"
      fill="none"
      aria-hidden
    >
      <path d="M120 160C280 120 420 220 560 180C720 130 860 70 1040 120" stroke="#5EC8C0" strokeWidth="1.2" opacity="0.55" />
      <path d="M80 420C240 380 360 500 520 460C700 410 880 520 1120 480" stroke="#E8956C" strokeWidth="1.2" opacity="0.5" style={{ animationDelay: "0.4s" }} />
      <path d="M200 680C360 620 500 700 680 640C860 580 980 700 1140 640" stroke="#E4FF5C" strokeWidth="1" opacity="0.35" style={{ animationDelay: "0.8s" }} />
      <circle cx="560" cy="180" r="5" fill="#5EC8C0" />
      <circle cx="520" cy="460" r="6" fill="#E8956C" />
      <circle cx="680" cy="640" r="4" fill="#E4FF5C" />
      <circle cx="280" cy="160" r="3" fill="#5EC8C0" opacity="0.7" />
      <circle cx="860" cy="520" r="3.5" fill="#E8956C" opacity="0.7" />
      <line x1="560" y1="180" x2="520" y2="460" stroke="rgba(236,230,218,0.12)" strokeWidth="1" />
      <line x1="520" y1="460" x2="680" y2="640" stroke="rgba(236,230,218,0.12)" strokeWidth="1" />
    </svg>
  );
}

export default function LandingPage() {
  const reduce = useReducedMotion();
  const fade = {
    hidden: { opacity: 0, y: reduce ? 0 : 22 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: reduce ? 0 : 0.1 * i,
        duration: reduce ? 0 : 0.65,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }),
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6 md:px-8">
        <div>
          <div className="display text-2xl leading-none tracking-tight">Continuum</div>
          <div className="mono mt-1 text-[10px] uppercase tracking-[0.28em] text-muted">
            Open Loop OS
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="#how" className="hidden text-sm text-muted transition hover:text-ink sm:inline">
            How it works
          </a>
          <Link href="/app" className="btn btn-primary">
            Enter <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main id="main">
        {/* Hero: one composition — brand, headline, sentence, CTA, full-bleed mesh */}
        <section className="relative z-10 flex min-h-[78vh] flex-col justify-center px-5 pb-20 pt-6 md:px-8">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <HeroMesh />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
          </div>

          <div className="mx-auto w-full max-w-6xl">
            <motion.p
              custom={0}
              initial="hidden"
              animate="show"
              variants={fade}
              className="mono text-[11px] uppercase tracking-[0.32em] text-memory"
            >
              Memory Meets Motion
            </motion.p>
            <motion.h1
              custom={1}
              initial="hidden"
              animate="show"
              variants={fade}
              className="display mt-4 max-w-4xl text-[clamp(3.4rem,12vw,7.5rem)] leading-[0.88] text-ink"
            >
              Continuum
            </motion.h1>
            <motion.p
              custom={2}
              initial="hidden"
              animate="show"
              variants={fade}
              className="mt-5 max-w-xl text-lg leading-relaxed text-muted md:text-xl"
            >
              Measure unfinished work as Open Loop Debt — then burn it with Cited Motion that
              writes results back into memory.
            </motion.p>
            <motion.div
              custom={3}
              initial="hidden"
              animate="show"
              variants={fade}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Link href="/app" className="btn btn-primary text-base">
                <Play className="h-4 w-4" /> Open Continuum
              </Link>
              <span className="mono text-xs text-faint">Acme Health · $220k at risk in seed</span>
            </motion.div>
          </div>
        </section>

        <div className="rule mx-auto max-w-6xl" />

        <section id="how" className="relative z-10 mx-auto max-w-6xl px-5 py-20 md:px-8">
          <p className="mono text-[11px] uppercase tracking-[0.28em] text-accent">How it works</p>
          <h2 className="display mt-3 max-w-2xl text-4xl leading-tight md:text-5xl">
            Memory that doesn&apos;t just recall — it finishes.
          </h2>

          <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
            {[
              {
                n: "01",
                title: "Quantify debt",
                body: "Priority × age × dollars at risk. See unfinished work before you act.",
                tone: "text-memory",
              },
              {
                n: "02",
                title: "Cited Motion",
                body: "Agents close loops with inspectable memory citations — not opaque chat.",
                tone: "text-accent",
              },
              {
                n: "03",
                title: "Write back",
                body: "Artifacts and edges land in the graph. Debt drops. The world model updates.",
                tone: "text-motion",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: reduce ? 0 : 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: reduce ? 0 : i * 0.08, duration: 0.5 }}
              >
                <div className={`mono text-sm ${item.tone}`}>{item.n}</div>
                <h3 className="display mt-3 text-3xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="relative z-10 border-y border-line bg-bg-elevated/40">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-14 md:flex-row md:items-end md:justify-between md:px-8">
            <div>
              <p className="mono text-[11px] uppercase tracking-[0.28em] text-muted">Sponsors wired</p>
              <p className="display mt-2 text-3xl md:text-4xl">
                RocketRide · FalkorDB · Linkup
                <br />
                LaserData · Guild · Snyk
              </p>
            </div>
            <Link href="/app/settings" className="btn btn-ghost">
              View connector status
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 px-5 py-10 text-center mono text-[11px] uppercase tracking-[0.2em] text-faint md:px-8">
        Continuum · Open Loop OS · Memory Meets Motion
      </footer>
    </div>
  );
}
