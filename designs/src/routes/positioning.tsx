import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "../components/boardr/SiteChrome";

export const Route = createFileRoute("/positioning")({
  head: () => ({
    meta: [
      { title: "positioning — zinegeist" },
      { name: "description", content: "zinegeist treats interfaces like environments, not software. less project management, more obsessive curation." },
      { property: "og:title", content: "positioning — zinegeist" },
      { property: "og:description", content: "interfaces like environments, not software." },
    ],
  }),
  component: PositioningPage,
});

const NOT = [
  "rigid folders", "sterile productivity software", "linear note apps",
  "static canvases", "project management dashboards", "infinite zoom whiteboards",
];

const IS = [
  "detective apartment walls", "media studies thesis boards",
  "internet archivist desks", "junk journals", "fan conspiracy boards",
  "indie web scrapbooks", "obsessive scholar workspaces",
];

const PRINCIPLES = [
  { n: "01", t: "mess carries meaning", d: "the disorder is signal, not noise. cluster, overlap, and adjacency tell a story." },
  { n: "02", t: "arrangement matters", d: "where you place something on the board is part of what it means." },
  { n: "03", t: "texture matters", d: "cork, paper, metal, plaster. the surface tints the thought." },
  { n: "04", t: "overlap matters", d: "tape over photo over note. layered traces, not flat documents." },
  { n: "05", t: "interfaces are environments", d: "you don't open a file. you walk into a place you built." },
  { n: "06", t: "nothing is throwaway", d: "every receipt, every margin scrawl can become evidence later." },
];

const VOCAB = [
  "nonlinear", "tactile", "obsessive", "spatial", "archival", "interconnected",
  "dossier", "artifact", "scrapbook", "evidence wall", "rabbit hole", "archive",
  "marginalia", "ephemera", "annotation", "fragments", "traces", "constellation",
];

function PositioningPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="bg-editor-header border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-700">/ positioning</span>
          <h1 className="mt-4 font-display text-5xl md:text-6xl leading-[0.95] lowercase tracking-tight">
            interfaces like environments,<br />
            <span className="text-stone-700/70">not software.</span>
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            most tools treat your thoughts like rows in a database. zinegeist treats them
            like objects on a wall. the difference is everything.
          </p>
        </div>
      </section>

      {/* NOT / IS */}
      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ less</span>
            <h2 className="mt-2 font-display text-2xl lowercase">less "project management"</h2>
            <ul className="mt-6 space-y-2 font-mono text-sm text-stone-500 lowercase line-through decoration-stone-400/40">
              {NOT.map((n) => <li key={n}>· {n}</li>)}
            </ul>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ more</span>
            <h2 className="mt-2 font-display text-2xl lowercase">more "obsessive curation"</h2>
            <ul className="mt-6 space-y-2 font-mono text-sm text-stone-800 lowercase">
              {IS.map((n) => <li key={n}>· {n}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ principles</span>
          <h2 className="mt-2 font-display text-3xl lowercase">what we hold to</h2>
          <div className="mt-10 grid sm:grid-cols-2 gap-3">
            {PRINCIPLES.map((p) => (
              <div key={p.n} className="bg-card rounded-md border border-border p-5 analog-shadow-sm">
                <div className="font-mono text-[10px] text-muted-foreground">{p.n}</div>
                <div className="mt-2 font-display text-xl lowercase">{p.t}</div>
                <p className="mt-2 font-mono text-xs text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2AM */}
      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ the 2am feeling</span>
          <p className="mt-6 font-display text-2xl md:text-3xl lowercase leading-snug text-stone-800">
            zinegeist preserves the feeling of finding something at 2am and opening
            twelve more tabs because suddenly everything connects.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            {VOCAB.map((w, i) => (
              <span
                key={w}
                className="font-mono text-[11px] lowercase tracking-wide rounded-sm border border-border bg-secondary/50 px-3 py-1.5"
                style={{ transform: `rotate(${((i % 5) - 2) * 0.8}deg)` }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-board-cork py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-4xl lowercase text-stone-50">build your own rabbit hole.</h2>
          <div className="mt-8">
            <Link
              to="/dashboard"
              className="rounded-md bg-stone-50 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-900 hover:bg-white analog-shadow-sm"
            >
              open dashboard →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
