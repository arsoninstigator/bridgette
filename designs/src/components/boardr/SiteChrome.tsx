import { Link, useLocation } from "@tanstack/react-router";

export function SiteHeader() {
  const { pathname } = useLocation();
  const NavLink = ({ to, label }: { to: "/" | "/about" | "/positioning" | "/dashboard"; label: string }) => (
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
        <nav className="flex items-center gap-6">
          <NavLink to="/" label="home" />
          <NavLink to="/positioning" label="positioning" />
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
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          zinegeist · saved locally · shared via /s/key
        </p>
        <div className="flex items-center gap-5">
          <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">home</Link>
          <Link to="/positioning" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">positioning</Link>
          <Link to="/about" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">about</Link>
          <Link to="/dashboard" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">dashboard</Link>
        </div>
      </div>
    </footer>
  );
}