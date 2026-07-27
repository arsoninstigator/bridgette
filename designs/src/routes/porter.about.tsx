import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/porter/about")({
  head: () => ({
    meta: [
      { title: "about porter — design-file configurator" },
      { name: "description", content: "porter exists because design files shouldn't be black boxes or free-for-alls. it's the middle path: layered, opinionated, configurable." },
      { property: "og:title", content: "about porter" },
      { property: "og:description", content: "why porter exists — the middle path between locked pdf and open psd." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="font-display text-5xl lowercase tracking-tight">about porter</h1>
      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-stone-700">
        <p>
          porter is a lab experiment inside the zinegeist family — a standalone tool for
          turning source design files into <em>configurator packs</em>: opinionated presets
          where every editable knob is deliberate.
        </p>
        <p>
          for years the choice has been binary. either you ship a locked pdf (nothing
          customizable, no life), or you hand off the raw psd and hope the recipient
          doesn't nuke your kerning. porter is the middle path.
        </p>
        <p>
          the admin imports a figma frame or an adobe file. porter reads the layer tree
          — with effects, blend modes and hierarchy intact — and the admin decides,
          per layer: <span className="font-mono text-stone-900">locked</span>,
          <span className="font-mono text-stone-900"> partial</span> (only certain
          properties), or <span className="font-mono text-stone-900">customizable</span>.
        </p>
        <p>
          the viewer gets a clean, tiny interface — no layers panel, no accidental
          catastrophes. just the knobs you meant.
        </p>
      </div>
      <div className="mt-10">
        <Link to="/porter/lab" className="rounded-full bg-stone-900 text-white px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-stone-700">
          try the lab →
        </Link>
      </div>
    </div>
  );
}
