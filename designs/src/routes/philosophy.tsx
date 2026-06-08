import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "../components/boardr/SiteChrome";

export const Route = createFileRoute("/philosophy")({
  head: () => ({
    meta: [
      { title: "philosophy — zinegeist" },
      { name: "description", content: "why zinegeist insists on tactile interfaces — the design philosophy behind a tool that treats software like a room you walk into." },
      { property: "og:title", content: "philosophy — zinegeist" },
      { property: "og:description", content: "why tactile. why mess. why arrangement is meaning." },
    ],
  }),
  component: PhilosophyPage,
});

const TENETS = [
  {
    n: "01",
    t: "objects, not rows",
    d: "a polaroid is a polaroid. a sticky note is a sticky note. we refuse to flatten the world into list items and database fields. every artifact keeps its weight, its tilt, its tape, its grain.",
  },
  {
    n: "02",
    t: "surfaces are part of the sentence",
    d: "a thought pinned to cork reads differently than the same thought taped to plaster. backgrounds aren't decoration; they're context. that's why surfaces are first-class — cork photographs, cutting mats, custom striped patterns, your own uploaded images.",
  },
  {
    n: "03",
    t: "depth before features",
    d: "we'd rather one well-made object — washi tape with real jagged v-edges and adjustable opacity — than ten flat rectangles labeled 'tape'. craft compounds.",
  },
  {
    n: "04",
    t: "arrangement is the interface",
    d: "you don't configure zinegeist with menus. you arrange it. a board with sticky notes clustered in one corner and polaroids spread across the bottom is already saying something. drag is the primary verb.",
  },
  {
    n: "05",
    t: "publish the room, not the doc",
    d: "when you share a board at /s/key, the viewer walks into the same room you built — same surface, same overlaps, same hanging strings with wooden clips. no flattening, no slide export. the artifact is the deliverable.",
  },
  {
    n: "06",
    t: "pages are rooms, sections are walls",
    d: "a multi-page board is a small apartment — each page is its own route, each section is an anchor on a continuous wall. you scroll the wall, you walk between the rooms. the geometry of the site mirrors the geometry of the thought.",
  },
  {
    n: "07",
    t: "the plus invites",
    d: "every polaroid, photo frame, and photostrip has a big plus inside its empty middle. the interface should beg to be filled. no upload buttons hidden in menus.",
  },
  {
    n: "08",
    t: "mess is not a bug",
    d: "we will never add 'auto-align' or 'snap-to-grid'. the slight rotation, the overlap, the off-kilter pin — these are the tool earning your trust. a tidy zinegeist board is a sign you're not done thinking yet.",
  },
];

const ANCESTORS = [
  { t: "the corkboard", d: "the original spatial database. pinholes are commits." },
  { t: "the zine", d: "self-published, photocopied, taped together at 1am. permission to make ugly things." },
  { t: "the detective wall", d: "string between pins as a syntax for hypothesis." },
  { t: "the scrapbook", d: "memory as a layered, glued, annotated object." },
  { t: "the moodboard", d: "vibes as data. adjacency as argument." },
  { t: "the field journal", d: "annotation in the margins. the artifact and the note share a page." },
];

function PhilosophyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="bg-editor-header border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-700">/ philosophy</span>
          <h1 className="mt-4 font-display text-5xl md:text-6xl leading-[0.95] lowercase tracking-tight">
            software should feel like<br />
            <span className="text-stone-700/70">a room you walk into.</span>
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            zinegeist is built on a handful of stubborn opinions about how thinking,
            arranging, and publishing should feel. here they are, in order of importance.
          </p>
        </div>
      </section>

      {/* TENETS */}
      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ tenets</span>
          <h2 className="mt-2 font-display text-3xl lowercase">eight things we won't budge on</h2>
          <div className="mt-10 grid sm:grid-cols-2 gap-3">
            {TENETS.map((p) => (
              <div key={p.n} className="bg-card rounded-md border border-border p-5 analog-shadow-sm">
                <div className="font-mono text-[10px] text-muted-foreground">{p.n}</div>
                <div className="mt-2 font-display text-xl lowercase">{p.t}</div>
                <p className="mt-2 font-mono text-xs text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ANCESTORS */}
      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ ancestors</span>
          <h2 className="mt-2 font-display text-3xl lowercase">what we descend from</h2>
          <p className="mt-4 max-w-2xl font-mono text-sm text-muted-foreground leading-relaxed">
            zinegeist isn't trying to be new. it's trying to honor a long lineage of analog tools
            that already knew how thinking actually works.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ANCESTORS.map((a, i) => (
              <div
                key={a.t}
                className="bg-card rounded-md border border-border p-5 analog-shadow-sm"
                style={{ transform: `rotate(${((i % 3) - 1) * 0.5}deg)` }}
              >
                <div className="font-display text-lg lowercase">{a.t}</div>
                <p className="mt-2 font-mono text-xs text-muted-foreground leading-relaxed lowercase">{a.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PULL QUOTE */}
      <section className="border-b border-border/60">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <p className="font-display text-3xl md:text-4xl leading-snug lowercase text-stone-800">
            "the medium is not neutral.<br />
            the corkboard already had opinions —<br />
            we're just defending them in software."
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-board-cork py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-4xl lowercase text-stone-50">go arrange something.</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-md bg-stone-50 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-900 hover:bg-white analog-shadow-sm"
            >
              open dashboard →
            </Link>
            <Link
              to="/positioning"
              className="rounded-md border border-stone-50/40 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50 hover:bg-stone-50/10"
            >
              read positioning
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
