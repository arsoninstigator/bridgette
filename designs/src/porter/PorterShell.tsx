import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

type PorterTo = "/porter" | "/porter/lab" | "/porter/about" | "/porter/features";

const nav: { to: PorterTo; label: string }[] = [
  { to: "/porter", label: "home" },
  { to: "/porter/features", label: "features" },
  { to: "/porter/lab", label: "lab" },
  { to: "/porter/about", label: "about" },
];

export function PorterShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f1ea] text-stone-900">
      <header className="border-b border-stone-300/70 bg-[#efe8dc]/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/porter" className="flex items-baseline gap-2">
            <span className="font-display text-2xl lowercase tracking-tight">porter</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500">design-file configurator</span>
          </Link>
          <nav className="flex items-center gap-6">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`font-mono text-[11px] uppercase tracking-[0.18em] transition-colors hover:text-stone-900 ${
                  pathname === n.to ? "text-stone-900" : "text-stone-500"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/porter/lab"
              className="ml-2 rounded-full border border-stone-900 bg-stone-900 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white hover:bg-stone-700"
            >
              open lab
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-stone-300/70 bg-[#efe8dc]/60">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono uppercase tracking-[0.18em] text-stone-500">
          <span>porter · a standalone configurator lab</span>
          <span>designed for designers who ship files, not tickets.</span>
        </div>
      </footer>
    </div>
  );
}
