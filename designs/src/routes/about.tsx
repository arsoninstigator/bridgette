import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "../components/boardr/SiteChrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "about — zinegeist" },
      { name: "description", content: "zinegeist is a tactile spatial publishing platform for rabbit holes, archives, and nonlinear storytelling." },
      { property: "og:title", content: "about — zinegeist" },
      { property: "og:description", content: "a tactile spatial publishing platform for rabbit holes." },
    ],
  }),
  component: About,
});

const PRINCIPLES = [
  { n: "01", t: "mess carries meaning", d: "instead of rigid folders, zinegeist lets you build living spaces for thought — messy and layered." },
  { n: "02", t: "tactile & spatial", d: "the board itself becomes part of the meaning. arrangement, texture, and overlap all matter." },
  { n: "03", t: "obsessive curation", d: "built for archivists, researchers, and people who fall into rabbit holes on purpose." },
  { n: "04", t: "no login, ever", d: "boards live in your browser. take them with an edit key. no sterile productivity software here." },
];

const MADE_FOR = [
  "archivists", "researchers", "writers", "artists", "worldbuilders", 
  "fandom historians", "curious people", "people who think spatially",
];

function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="bg-editor-header border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-700">/ about</span>
          <h1 className="mt-4 font-display text-5xl md:text-6xl leading-[0.95] lowercase tracking-tight">
            a tactile spatial publishing platform.
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            zinegeist started as a question: what if the browser had a corkboard? not a
            whiteboard, not a kanban — a real, tactile surface where you build nested 
            archives, timelines, field notes, and visual conspiracies. zinegeist treats 
            interfaces like environments, not software.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ principles</span>
          <h2 className="mt-2 font-display text-3xl lowercase">what we hold to</h2>
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
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

      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-20 grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ audience</span>
            <h2 className="mt-2 font-display text-3xl lowercase">who it's for</h2>
          </div>
          <div className="md:col-span-7 flex flex-wrap gap-2">
            {MADE_FOR.map((item) => (
              <span key={item} className="font-mono text-xs lowercase px-3 py-1 bg-card border border-border rounded-full">
                {item}
              </span>
            ))}
            <p className="mt-4 font-mono text-sm text-stone-700 w-full">
              ...and anyone who keeps too many tabs open and thinks in fragments.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h2 className="font-display text-4xl lowercase">enough reading. build a place.</h2>
          <div className="mt-8">
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
