import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/porter/")({
  head: () => ({
    meta: [
      { title: "porter — design-file configurator" },
      { name: "description", content: "porter turns figma frames, psd, ai and eps files into shareable configurator packs — decide what stays locked, what viewers can tweak." },
      { property: "og:title", content: "porter — design-file configurator" },
      { property: "og:description", content: "figma / psd / ai / eps → configurable, layered artifacts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PorterLanding,
});

function PorterLanding() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="inline-block rounded-full border border-stone-400 bg-white/60 px-3 py-1 font-mono text-[10px] lowercase tracking-widest text-stone-600">
        porter · v0 lab
      </div>
      <h1 className="mt-6 font-display text-6xl lowercase tracking-tight leading-[1.05]">
        turn any design file<br />into a configurator.
      </h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-stone-700">
        drop in a figma frame, a photoshop file, an illustrator artboard or an eps.
        porter reads the layer tree, keeps every effect intact, and lets you pick
        exactly which layers your audience can customize — the rest stays locked.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/porter/lab" className="rounded-full bg-stone-900 text-white px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-stone-700">
          open the lab →
        </Link>
        <Link to="/porter/features" className="rounded-full border border-stone-400 bg-white/60 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-white">
          see features
        </Link>
      </div>

      <div className="mt-20 grid md:grid-cols-3 gap-6">
        {[
          { t: "no more layer hell", d: "no exposing psd anarchy to end users. surface only the knobs that matter." },
          { t: "keep the effects", d: "shadows, blend modes, opacity — parsed and preserved, not flattened away." },
          { t: "four sources", d: "figma api (oauth or token), .psd, .ai, .eps — one pack format on the other side." },
        ].map((c) => (
          <div key={c.t} className="rounded-md border border-stone-300 bg-white/70 p-5">
            <h3 className="font-display text-xl lowercase">{c.t}</h3>
            <p className="mt-2 text-sm text-stone-600">{c.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-20 rounded-lg border border-stone-300 bg-white/70 p-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500">how it works</p>
        <ol className="mt-4 grid md:grid-cols-4 gap-6 text-sm">
          {["import a source", "auto-parse layers", "tag locked / partial / custom", "ship a configurator pack"].map((s, i) => (
            <li key={s} className="border-l-2 border-stone-300 pl-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">step {i + 1}</span>
              <p className="mt-1 font-display text-lg lowercase">{s}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
