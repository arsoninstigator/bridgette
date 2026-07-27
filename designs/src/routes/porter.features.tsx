import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/porter/features")({
  head: () => ({
    meta: [
      { title: "porter features — figma, psd, ai, eps" },
      { name: "description", content: "everything porter does today: figma oauth + tokens, psd layer trees, ai/eps parsing, per-layer policy, viewer mode." },
      { property: "og:title", content: "porter features" },
      { property: "og:description", content: "what porter can do, source by source." },
    ],
  }),
  component: Features,
});

const sections = [
  {
    heading: "sources",
    items: [
      { t: "figma via oauth", d: "authorize your figma account in one click (client id required). frames stream in through the figma api." },
      { t: "figma via personal token", d: "no oauth? paste a personal access token. stored locally, never sent elsewhere." },
      { t: ".psd files", d: "full photoshop layer tree, blend modes, opacity, and effect names — parsed with ag-psd." },
      { t: ".ai files", d: "illustrator layer names and titles extracted from the file directory (best-effort)." },
      { t: ".eps files", d: "encapsulated postscript titles and layer comments parsed and surfaced." },
    ],
  },
  {
    heading: "per-layer policy",
    items: [
      { t: "locked", d: "viewer sees the layer render, nothing they can touch." },
      { t: "partial", d: "expose only what matters — color, opacity, border, position — one checkbox at a time." },
      { t: "customizable", d: "everything editable, including text swap and image replace." },
    ],
  },
  {
    heading: "workflow",
    items: [
      { t: "admin / viewer toggle", d: "flip modes to preview exactly what the end user sees before you ship." },
      { t: "saved packs", d: "every configuration persists locally as a named pack. reload, revise, remove." },
      { t: "layer tree with fx badges", d: "spot effect-heavy layers instantly. click to configure in the right rail." },
    ],
  },
];

function Features() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <h1 className="font-display text-5xl lowercase tracking-tight">what porter does</h1>
      <p className="mt-4 max-w-xl text-sm text-stone-700">
        the current, working lab feature set. still shy of v1 — but everything below is
        wired up right now.
      </p>

      <div className="mt-14 space-y-16">
        {sections.map((s) => (
          <section key={s.heading}>
            <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500">{s.heading}</p>
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              {s.items.map((i) => (
                <div key={i.t} className="rounded-md border border-stone-300 bg-white/70 p-4">
                  <h3 className="font-display text-lg lowercase">{i.t}</h3>
                  <p className="mt-2 text-[13px] text-stone-600 leading-relaxed">{i.d}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16">
        <Link to="/porter/lab" className="rounded-full bg-stone-900 text-white px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-stone-700">
          open the lab →
        </Link>
      </div>
    </div>
  );
}
