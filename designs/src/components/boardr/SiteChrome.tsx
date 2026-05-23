import { Link, useLocation } from "@tanstack/react-router";

type NavTo = "/" | "/about" | "/positioning" | "/features" | "/roadmap" | "/compare" | "/dashboard";

export function SiteHeader() {
  const { pathname } = useLocation();
  const NavLink = ({ to, label }: { to: NavTo; label: string }) => (
    <Link
      to={to}
      className={`font-mono text-[11px] uppercase tracking-[0.18em] hover:text-foreground transition-colors ${
        pathname === to ? "text-foreground" : "text-stone-600"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <header className="bg-editor-header border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-block size-3 rounded-full bg-red-700 ring-2 ring-red-900/60" />
          <span className="font-display text-lg lowercase tracking-tight">zinegeist</span>
        </Link>
        <nav className="flex items-center gap-5">
          <NavLink to="/" label="home" />
          <NavLink to="/features" label="features" />
          <NavLink to="/roadmap" label="roadmap" />
          <NavLink to="/compare" label="compare" />
          <NavLink to="/about" label="about" />
          <Link
            to="/dashboard"
            className="rounded-md bg-stone-900 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-50 hover:bg-stone-800"
          >
            dashboard →
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-red-700 ring-2 ring-red-900/60" />
          <span className="font-display text-base lowercase tracking-tight">zinegeist</span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          saved locally · shared via /s/key
        </p>
      </div>
    </footer>
  );
}
