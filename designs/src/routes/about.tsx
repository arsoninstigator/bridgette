import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "../components/boardr/SiteChrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "about — zinegeist" },
      { name: "description", content: "zinegeist is a tactile spatial publishing platform for rabbit holes, archives, investigations, nonlinear storytelling, and obsessive curation." },
      { property: "og:title", content: "about — zinegeist" },
      { property: "og:description", content: "interfaces like environments, not software." },
    ],
  }),
  component: About,
});

const PART = [
  { p: "part", w: "corkboard" },
  { p: "part", w: "scrapbook" },
  { p: "part", w: "dossier archive" },
  { p: "part", w: "evidence wall" },
  { p: "part", w: "indie web artifact" },
];

const SURFACES = [
  "corkboard", "pegboard", "blackboard", "tiled walls", "notebook paper",
  "metallic boards", "cutting mats", "wallpaper", "dotted grids",
  "lined paper", "handmade textures",
];

const OBJECTS = [
  "polaroids", "photostrips", "sticky notes", "evidence tags", "library cards",
  "receipts", "stamps", "folders", "tape", "pushpins",
  "handwritten annotations", "clipped documents", "sketches", "diagrams", "strings",
];

const FEELS = [
  { t: "detective apartment wall", d: "red thread, photographs, names circled twice." },
  { t: "media studies thesis board", d: "screenshots, quotes, citations interleaved." },
  { t: "internet archivist desk", d: "ephemera and screenshots from forgotten forums." },
  { t: "junk journal", d: "ticket stubs and pressed flowers on dotted paper." },
  { t: "fan conspiracy board", d: "lore fragments mapped across episodes." },
  { t: "indie web scrapbook", d: "personal artifacts, link-rotted and beloved." },
  { t: "obsessive scholar workspace", d: "marginalia stacked across boards." },
];

const USECASES = [
  "loreboards", "evidence walls", "rabbit holes", "visual essays",
  "interactive scrapbooks", "conspiracy webs", "fandom archives",
  "research clusters", "worldbuilding systems", "moodboards", "field journals",
  "timelines", "annotated galleries", "media analysis boards",
  "nonlinear presentations", "nested dossiers", "interconnected archives",
  "digital zines", "memory palaces", "investigation maps",
  "character relationship webs", "internet archaeology projects",
  "visual knowledge systems",
];

const AUDIENCE = [
  "archivists", "researchers", "writers", "artists", "worldbuilders",
  "fandom historians", "curious people", "people who keep too many tabs open",
  "people who think spatially", "people who annotate everything",
  "people who fall into rabbit holes on purpose",
];

function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="bg-editor-header border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-700">/ about</span>
          <h1 className="mt-4 font-display text-5xl md:text-6xl leading-[0.95] lowercase tracking-tight">
            a tactile spatial publishing platform for rabbit holes.
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            zinegeist is for archives, investigations, nonlinear storytelling, and obsessive curation.
            instead of rigid folders and sterile productivity software, zinegeist lets you build
            living spaces for thought — messy, layered, interconnected, and deeply personal.
          </p>
        </div>
      </section>

      {/* PART X, PART Y */}
      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ what it is</span>
          <h2 className="mt-2 font-display text-3xl lowercase">part everything.</h2>
          <ul className="mt-8 space-y-2">
            {PART.map((row, i) => (
              <li key={i} className="flex items-baseline gap-3 font-display text-2xl lowercase">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground w-8">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-muted-foreground">{row.p}</span>
                <span>{row.w}.</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* THE FEEL */}
      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ the feel</span>
          <h2 className="mt-2 font-display text-3xl lowercase">thought doesn't happen in straight lines.</h2>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            zinegeist was built for the way curiosity actually feels:
            nonlinear, tactile, obsessive, spatial, archival, interconnected.
            the board itself becomes part of the meaning.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 gap-3">
            {FEELS.map((f) => (
              <div key={f.t} className="bg-card border border-border rounded-md p-4 analog-shadow-sm">
                <div className="font-display text-lg lowercase">{f.t}</div>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground lowercase leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SURFACES + OBJECTS */}
      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ surfaces</span>
            <h2 className="mt-2 font-display text-2xl lowercase">choose a physical surface</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {SURFACES.map((s) => (
                <span key={s} className="font-mono text-xs lowercase px-3 py-1 bg-card border border-border rounded-full">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ objects</span>
            <h2 className="mt-2 font-display text-2xl lowercase">fill it with analog things</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {OBJECTS.map((o) => (
                <span key={o} className="font-mono text-xs lowercase px-3 py-1 bg-card border border-border rounded-full">{o}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE */}
      <section className="bg-board-cork border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-100/80">/ interaction</span>
          <h2 className="mt-2 font-display text-3xl lowercase text-stone-50">everything is interactive.</h2>
          <ul className="mt-6 space-y-1 font-mono text-sm text-stone-50/90 lowercase">
            <li>· cards unfold.</li>
            <li>· folders expand.</li>
            <li>· photographs flip over.</li>
            <li>· connections pulse.</li>
            <li>· clusters collapse and reopen.</li>
            <li>· annotations hide in margins.</li>
            <li>· boards become explorable archives instead of static canvases.</li>
          </ul>
        </div>
      </section>

      {/* USE CASES */}
      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ what you can make</span>
          <h2 className="mt-2 font-display text-3xl lowercase">a thousand small archives.</h2>
          <div className="mt-8 flex flex-wrap gap-2">
            {USECASES.map((u, i) => (
              <span
                key={u}
                className="font-mono text-[11px] lowercase rounded-sm border border-border bg-secondary/50 px-3 py-1.5"
                style={{ transform: `rotate(${((i % 5) - 2) * 0.6}deg)` }}
              >
                {u}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ made for</span>
          <h2 className="mt-2 font-display text-3xl lowercase">people who think spatially.</h2>
          <ul className="mt-6 grid sm:grid-cols-2 gap-y-1 font-mono text-sm text-stone-700 lowercase">
            {AUDIENCE.map((a) => <li key={a}>· {a}</li>)}
          </ul>
        </div>
      </section>

      {/* CLOSING */}
      <section>
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <p className="font-display text-2xl md:text-3xl lowercase text-stone-800 leading-snug">
            zinegeist is not about organizing your thoughts perfectly.<br />
            it's about building places for them to live.
          </p>
          <div className="mt-10">
            <Link
              to="/dashboard"
              className="rounded-md bg-stone-900 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50 hover:bg-stone-800 analog-shadow-sm"
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
