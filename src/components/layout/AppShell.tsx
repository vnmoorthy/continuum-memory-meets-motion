"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  GitBranch,
  Home,
  Orbit,
  Settings2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/app", label: "Command", icon: Home },
  { href: "/app/memory", label: "Memory", icon: GitBranch },
  { href: "/app/loops", label: "Open Loops", icon: Orbit },
  { href: "/app/runs", label: "Motion", icon: Activity },
  { href: "/app/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-line-strong bg-bg-soft">
              <Sparkles className="h-4 w-4 text-accent" />
            </span>
            <div>
              <div className="display text-lg leading-none">Continuum</div>
              <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted">
                Memory → Motion
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/app" ? pathname === "/app" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-bg-soft text-ink"
                      : "text-muted hover:bg-bg-soft/60 hover:text-ink",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 chip sm:inline-flex">
              <span className="live-dot" />
              Live graph
            </span>
            <Link href="/app/loops" className="btn btn-primary text-sm">
              Close a loop
            </Link>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-t border-line px-2 py-1 md:hidden">
          {links.map(({ href, label }) => {
            const active =
              href === "/app" ? pathname === "/app" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "whitespace-nowrap px-3 py-2 text-xs",
                  active ? "text-accent" : "text-muted",
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">
        {children}
      </main>
    </div>
  );
}
