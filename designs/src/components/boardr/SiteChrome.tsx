import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type NavTo =
  | "/"
  | "/about"
  | "/positioning"
  | "/philosophy"
  | "/features"
  | "/roadmap"
  | "/compare"
  | "/dashboard"
  | "/assets"
  | "/templates"
  | "/auth";

export function SiteHeader() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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

  const otherRoutes: { to: NavTo; label: string; blurb: string }[] = [
    { to: "/assets", label: "assets", blurb: "the asset library" },
    { to: "/templates", label: "templates", blurb: "starter boards" },
    { to: "/roadmap", label: "roadmap", blurb: "what's pinned next" },
    { to: "/compare", label: "compare", blurb: "vs other tools" },
    { to: "/philosophy", label: "philosophy", blurb: "why tactile" },
  ];
  const otherActive = otherRoutes.some((r) => r.to === pathname);

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
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] hover:text-foreground transition-colors outline-none ${
                otherActive ? "text-foreground" : "text-stone-600"
              }`}
            >
              other <ChevronDown className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]">
              {otherRoutes.map((r) => (
                <DropdownMenuItem
                  key={r.to}
                  onSelect={() => navigate({ to: r.to })}
                  className="flex flex-col items-start gap-0.5 cursor-pointer"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em]">{r.label}</span>
                  <span className="font-mono text-[10px] lowercase text-muted-foreground">{r.blurb}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {user ? (
            <button
              onClick={() => signOut()}
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-600 hover:text-foreground"
            >
              sign out
            </button>
          ) : (
            <NavLink to="/auth" label="sign in" />
          )}
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

const FOOTER_LINKS = {
  product: [
    { to: "/features" as const, label: "features" },
    { to: "/roadmap" as const, label: "roadmap" },
    { to: "/compare" as const, label: "compare" },
    { to: "/dashboard" as const, label: "dashboard" },
  ],
  resources: [
    { to: "/assets" as const, label: "assets" },
    { to: "/templates" as const, label: "templates" },
  ],
  company: [
    { to: "/about" as const, label: "about" },
    { to: "/philosophy" as const, label: "philosophy" },
    { to: "/positioning" as const, label: "positioning" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-12 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-4">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full bg-red-700 ring-2 ring-red-900/60" />
            <span className="font-display text-base lowercase tracking-tight">zinegeist</span>
          </div>
          <p className="mt-4 max-w-xs font-mono text-[11px] leading-relaxed text-muted-foreground lowercase">
            a tactile spatial publishing platform for rabbit holes, archives,
            investigations, and obsessive curation.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            saved locally · shared via /s/key
          </p>
        </div>

        {/* Product */}
        <div className="col-span-1 md:col-span-2 md:col-start-6">
          <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground">product</h4>
          <ul className="mt-4 space-y-2.5">
            {FOOTER_LINKS.product.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="font-mono text-[11px] lowercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div className="col-span-1 md:col-span-2">
          <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground">resources</h4>
          <ul className="mt-4 space-y-2.5">
            {FOOTER_LINKS.resources.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="font-mono text-[11px] lowercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div className="col-span-1 md:col-span-2">
          <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground">company</h4>
          <ul className="mt-4 space-y-2.5">
            {FOOTER_LINKS.company.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="font-mono text-[11px] lowercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
            © {new Date().getFullYear()} zinegeist
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/auth"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              sign in
            </Link>
            <span className="text-muted-foreground/30">·</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
              made with obsession
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
