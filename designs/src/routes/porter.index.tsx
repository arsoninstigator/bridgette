import { createFileRoute, Link } from "@tanstack/react-router";
import { PorterSquiggle, PorterStitches } from "@/porter/PorterShell";

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
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="relative">
        <div className="porter-chip inline-block bg-[#e8ff4a] px-3 py-1 font-mono text-[10px] lowercase tracking-widest text-stone-900">
          porter · v0 lab
        </div>

        <div className="porter-sticker absolute right-0 -top-4 hidden md:flex h-32 w-52 items-center justify-center bg-[#fbfaf6] px-6 text-center">
          <p className="font-display text-[15px] lowercase leading-tight text-[#2b8f76] rotate-[-2deg]">
            bring ur psd,<br />ai, eps &amp; figma
          </p>
        </div>

        <PorterStitches className="mt-6" />
        <h1 className="mt-2 font-display text-6xl lowercase tracking-tight leading-[1.02]">
          turn any design file<br />
          into a <span className="porter-highlight">configurator</span>.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-stone-700">
          drop in a figma frame, a photoshop file, an illustrator artboard or an eps.
          porter reads the layer tree, keeps every effect intact, and lets you pick
          exactly which layers your audience can customize — the rest stays locked.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link to="/porter/lab" className="porter-btn bg-[#4b53d6] text-stone-50 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em]">
          open the lab →
        </Link>
        <Link to="/porter/features" className="porter-btn bg-white px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em]">
          see features
        </Link>
      </div>

      <PorterSquiggle className="mt-14 h-12 w-full text-[#4b53d6]/70" />

      <div className="mt-10 grid md:grid-cols-3 gap-6">
        {[
          { t: "no more layer hell", d: "no exposing psd anarchy to end users. surface only the knobs that matter.", c: "#e8ff4a" },
          { t: "keep the effects", d: "shadows, blend modes, opacity — parsed and preserved, not flattened away.", c: "#9ee8cf" },
          { t: "four sources", d: "figma api (oauth or token), .psd, .ai, .eps — one pack format on the other side.", c: "#c3c6ff" },
        ].map((c, i) => (
          <div key={c.t} className="porter-card p-5" style={{ transform: `rotate(${i === 1 ? 0.6 : i === 0 ? -0.8 : 0.4}deg)` }}>
            <span className="inline-block px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest" style={{ background: c.c }}>
              0{i + 1}
            </span>
            <h3 className="mt-3 font-display text-xl lowercase">{c.t}</h3>
            <p className="mt-2 text-sm text-stone-600">{c.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 porter-card p-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500">how it works</p>
        <ol className="mt-4 grid md:grid-cols-4 gap-6 text-sm">
          {["import a source", "auto-parse layers", "tag locked / partial / custom", "ship a configurator pack"].map((s, i) => (
            <li key={s} className="border-l-4 border-[#4b53d6] pl-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">step {i + 1}</span>
              <p className="mt-1 font-display text-lg lowercase">{s}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
