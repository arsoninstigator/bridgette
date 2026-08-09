import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

type PorterTo = "/porter" | "/porter/lab" | "/porter/about" | "/porter/features" | "/porter/purpose";

const nav: { to: PorterTo; label: string }[] = [
  { to: "/porter", label: "home" },
  { to: "/porter/features", label: "features" },
  { to: "/porter/purpose", label: "purpose" },
  { to: "/porter/lab", label: "lab" },
  { to: "/porter/about", label: "about" },
];

export function PorterSquiggle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 60" className={className} preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 42 C 20 10, 50 6, 62 26 C 74 46, 46 58, 40 40 C 34 22, 66 8, 92 30 C 118 52, 148 8, 172 26 C 196 44, 168 58, 162 40 C 156 22, 188 8, 214 30 C 240 52, 270 8, 294 26 C 318 44, 290 58, 284 40 C 278 22, 310 8, 336 30 C 362 52, 392 8, 416 26 C 440 44, 412 58, 406 40 C 400 22, 432 8, 458 30 C 484 52, 514 8, 538 26 C 562 44, 580 40, 600 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PorterStitches({ className = "" }: { className?: string }) {
  return <div className={`porter-stitch ${className}`}>× × × × ×</div>;
}

export function PorterShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="porter-paper min-h-screen flex flex-col text-stone-900">
      <header className="border-b-2 border-stone-900 bg-[#fbfaf6]/85 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/porter" className="flex items-baseline gap-2">
            <span className="font-display text-2xl lowercase tracking-tight">porter</span>
            <span className="porter-highlight font-mono text-[10px] uppercase tracking-[0.2em] text-stone-700">
              design-file configurator
            </span>
          </Link>
          <nav className="flex items-center gap-5">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`font-mono text-[11px] uppercase tracking-[0.18em] transition-colors hover:text-stone-900 ${
                  pathname === n.to ? "text-stone-900 porter-highlight" : "text-stone-500"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/porter/lab"
              className="porter-btn ml-1 bg-[#4b53d6] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-50"
            >
              open lab
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="relative border-t-2 border-stone-900 bg-[#fbfaf6]/70">
        <PorterSquiggle className="w-full h-10 text-[#4b53d6] -mt-5" />
        <div className="max-w-6xl mx-auto px-6 pb-8 pt-2 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono uppercase tracking-[0.18em] text-stone-600">
          <span>porter · a standalone configurator lab</span>
          <span className="porter-highlight">designed for designers who ship files, not tickets.</span>
        </div>
      </footer>
    </div>
  );
}
