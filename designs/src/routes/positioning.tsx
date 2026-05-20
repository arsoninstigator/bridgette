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

const VOCAB = [
  "nonlinear", "tactile", "obsessive", "spatial", "archival", "interconnected",
  "dossier", "artifact", "scrapbook", "evidence wall", "rabbit hole", "archive",
  "marginalia", "ephemera", "annotation", "fragments", "traces", "constellation",
];

function Section({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border-b border-border/60 py-20 ${className}`}>
      <div className="max-w-4xl mx-auto px-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ {title}</span>
        {subtitle && <h2 className="mt-2 font-display text-3xl md:text-4xl lowercase">{subtitle}</h2>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function PositioningPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="bg-editor-header border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-700">/ positioning</span>
          <h1 className="mt-4 font-display text-5xl md:text-6xl leading-[0.95] lowercase tracking-tight">
            thought doesn’t happen in straight lines.
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            zinegeist was built for the way curiosity actually feels: nonlinear, tactile, 
            obsessive, and spatial. it's not about organizing your thoughts perfectly; 
            it's about building places for them to live.
          </p>
        </div>
      </section>

      <Section title="environment" subtitle="software vs environment">
        <div className="grid md:grid-cols-2 gap-10 font-mono text-sm leading-relaxed text-stone-700">
          <div className="space-y-4">
            <p className="font-bold text-stone-900 uppercase tracking-widest text-[10px]">less "project management"</p>
            <ul className="space-y-2 opacity-80">
              <li>· rigid folders</li>
              <li>· sterile productivity software</li>
              <li>· linear note apps</li>
              <li>· static canvases</li>
            </ul>
          </div>
          <div className="space-y-4">
            <p className="font-bold text-stone-900 uppercase tracking-widest text-[10px]">more "obsessive curation"</p>
            <ul className="space-y-2">
              <li>· detective apartment walls</li>
              <li>· internet archivist desks</li>
              <li>· junk journals</li>
              <li>· fan conspiracy boards</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="meaning" subtitle="mess carries meaning">
        <p className="font-mono text-sm leading-relaxed text-stone-700 max-w-2xl">
          in zinegeist, arrangement matters. texture matters. overlap matters. 
          the board itself becomes part of the meaning. everything is interactive — 
          cards unfold, folders expand, and photographs flip over to reveal hidden notes.
          boards become explorable archives instead of static canvases.
        </p>
      </Section>

      <Section title="feeling" subtitle="the 2am feeling">
        <p className="font-mono text-sm leading-relaxed text-stone-700 max-w-2xl italic">
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
      </Section>

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
