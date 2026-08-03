"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  GitBranch,
  Home,
  Orbit,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/app", label: "Command", icon: Home },
  { href: "/app/memory", label: "Memory", icon: GitBranch },
  { href: "/app/loops", label: "Loops", icon: Orbit },
  { href: "/app/runs", label: "Motion", icon: Activity },
  { href: "/app/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-amber-900/30 bg-amber-950/25 px-4 py-1.5 text-center text-[11px] leading-snug text-amber-100/90 md:px-6">
        <span className="mono tracking-wider text-amber-200/90">DEMO</span>
        <span className="mx-2 text-amber-200/40">·</span>
        Simulated research & notify unless sponsor keys are set · isolated workspace per browser
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_oklab,var(--bg)_78%,transparent)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <span className="display text-xl leading-none transition group-hover:text-accent md:text-2xl">
              Continuum
            </span>
            <span className="hidden mono text-[10px] uppercase tracking-[0.22em] text-faint sm:inline">
              Open Loop OS
            </span>
          </Link>

          <nav className="hidden items-center md:flex" aria-label="Primary">
            {links.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/app" ? pathname === "/app" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "nav-link flex items-center gap-2 px-3 py-2 text-sm",
                    active ? "text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="chip mobile-hide hidden items-center gap-2 sm:inline-flex">
              <span className="live-dot" aria-hidden />
              Graph live
            </span>
            <Link href="/app/loops" className="btn btn-primary py-2 text-sm">
              Close a loop
            </Link>
          </div>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto border-t border-line px-2 py-1 md:hidden"
          aria-label="Mobile"
        >
          {links.map(({ href, label }) => {
            const active =
              href === "/app" ? pathname === "/app" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap px-3 py-2 text-xs",
                  active ? "text-accent" : "text-muted",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-7 md:px-6 md:py-9">
        {children}
      </main>
    </div>
  );
}
