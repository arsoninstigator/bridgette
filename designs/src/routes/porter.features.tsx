import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Eye,
  Figma,
  FileCode,
  FileImage,
  Image,
  Layers,
  Lock,
  Package,
  Shield,
  Sliders,
  Sparkles,
  Wrench,
  X,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/porter/features")({
  head: () => ({
    meta: [
      { title: "porter features — design-file configurator" },
      { name: "description", content: "everything porter does: import figma, psd, ai, or eps files, parse the full layer tree, and expose only what you want viewers to customize." },
      { property: "og:title", content: "porter features — design-file configurator" },
      { property: "og:description", content: "import figma, psd, ai, or eps files, parse the full layer tree, and expose only what you want viewers to customize." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Features,
});

const sourceCards = [
  {
    icon: Figma,
    title: "figma via oauth",
    description: "authorize the figma account you're already logged into. frames stream through the official figma api with effects intact.",
    badge: "oauth",
  },
  {
    icon: FileCode,
    title: "figma via token",
    description: "paste a personal access token. it stays in your browser; porter never stores it on a server.",
    badge: "token",
  },
  {
    icon: FileImage,
    title: ".psd files",
    description: "full photoshop layer tree, blend modes, opacity, and effect names — parsed with ag-psd so nothing gets flattened.",
    badge: "photoshop",
  },
  {
    icon: FileImage,
    title: ".ai files",
    description: "illustrator artboards and layer names are extracted from the file directory so you can keep the vector hierarchy.",
    badge: "illustrator",
  },
  {
    icon: FileCode,
    title: ".eps files",
    description: "encapsulated postscript titles and layer comments are surfaced as editable layers in the configurator.",
    badge: "postscript",
  },
  {
    icon: Package,
    title: ".zip archives",
    description: "drop an archive of assets and porter will extract the layers it recognizes so you can start configuring immediately.",
    badge: "archive",
  },
];

const policyCards = [
  {
    icon: Lock,
    title: "locked",
    description: "the viewer sees the layer exactly as you drew it. no cursor, no handles, no accidents.",
  },
  {
    icon: Sliders,
    title: "partial",
    description: "expose only the safe knobs — color, opacity, border, position, thickness. one checkbox at a time.",
  },
  {
    icon: Wrench,
    title: "customizable",
    description: "full editing rights: text swap, image replacement, color shifts, and beyond. for the layers that are meant to change.",
  },
];

const workflowCards = [
  {
    icon: Eye,
    title: "admin / viewer toggle",
    description: "preview the configurator exactly as your customer will see it before you publish the pack.",
  },
  {
    icon: Package,
    title: "saved packs",
    description: "every configuration is saved locally as a named pack. reload, duplicate, revise, or delete them anytime.",
  },
  {
    icon: Layers,
    title: "layer tree with fx badges",
    description: "effect-heavy layers are flagged automatically. click a layer to open the per-layer policy panel in the right rail.",
  },
  {
    icon: Sparkles,
    title: "image + color pickers",
    description: "no hex-code guessing. pick colors visually and swap images through the same gallery used in the main board editor.",
  },
];

const comparison = [
  {
    without: "you send the whole .psd and hope the client doesn't touch the wrong layer.",
    with: "you import the .psd and mark every layer as locked, partial, or customizable.",
  },
  {
    without: "google docs of change requests, back-and-forth slack threads, and version chaos.",
    with: "one published pack. the customer tweaks only the allowed fields, nothing else moves.",
  },
  {
    without: "effects and blend modes get flattened into a png because the tool can't read them.",
    with: "porter preserves the full layer tree, opacity, and effect names from the source file.",
  },
  {
    without: "different handoff tools for figma, photoshop, and illustrator.",
    with: "one interface for figma, .psd, .ai, and .eps — same policy language, same output format.",
  },
];

const cta = {
  headline: "try the lab now",
  body: "no account, no upload limit, no credit card. import a file, tag a few layers, and see what a configurator feels like.",
};

function Features() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      {/* Hero */}
      <section className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-stone-400 bg-white/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-stone-600">
          <Sparkles size={12} />
          <span>v0 lab feature set</span>
        </div>
        <h1 className="mt-6 font-display text-5xl md:text-6xl lowercase tracking-tight leading-[1.05]">
          everything porter does today.
        </h1>
        <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-stone-700">
          porter is still shy of v1 — but everything below is wired up and usable right now.
          import a design file, walk the full layer tree, and decide exactly what your audience can touch.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/porter/lab"
            className="inline-flex items-center gap-2 rounded-full bg-stone-900 text-white px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-stone-700"
          >
            open the lab
            <ArrowRight size={14} />
          </Link>
          <Link
            to="/porter/purpose"
            className="rounded-full border border-stone-400 bg-white/60 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-white"
          >
            who is it for?
          </Link>
        </div>
      </section>

      {/* Sources */}
      <section className="mt-20 md:mt-28">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-stone-900/5 p-2 text-stone-700">
            <Image size={18} />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-stone-500">import sources</p>
        </div>
        <h2 className="mt-2 font-display text-3xl md:text-4xl lowercase tracking-tight">one pack, many starting points.</h2>
        <p className="mt-3 max-w-2xl text-stone-700">
          porter doesn't care which tool the design started in. it reads the layer tree and turns it into the same policy-driven configurator.
        </p>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sourceCards.map((card) => (
            <div
              key={card.title}
              className="group rounded-lg border border-stone-300 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-stone-400 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-full bg-stone-900/5 p-2 text-stone-700 group-hover:bg-stone-900 group-hover:text-stone-50 transition-colors">
                  <card.icon size={18} />
                </div>
                <span className="rounded-full border border-stone-300 bg-white/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-stone-500">
                  {card.badge}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl lowercase">{card.title}</h3>
              <p className="mt-2 text-[13px] text-stone-600 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Per-layer policy */}
      <section className="mt-20 md:mt-28">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-stone-900/5 p-2 text-stone-700">
            <Shield size={18} />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-stone-500">per-layer policy</p>
        </div>
        <h2 className="mt-2 font-display text-3xl md:text-4xl lowercase tracking-tight">three permissions. total control.</h2>
        <p className="mt-3 max-w-2xl text-stone-700">
          every layer in the imported file gets one of three states. no need to flatten, hide, or rebuild the file. just tag and ship.
        </p>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {policyCards.map((card, i) => (
            <div
              key={card.title}
              className="relative rounded-lg border border-stone-300 bg-white/70 p-6"
            >
              <div className="absolute top-0 left-0 h-1 w-full rounded-t-lg bg-stone-300" />
              <div className="rounded-full bg-stone-900/5 p-2 w-fit text-stone-700">
                <card.icon size={18} />
              </div>
              <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-stone-500">
                policy {i + 1}
              </div>
              <h3 className="mt-1 font-display text-2xl lowercase">{card.title}</h3>
              <p className="mt-3 text-[13px] text-stone-600 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="mt-20 md:mt-28">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-stone-900/5 p-2 text-stone-700">
            <Zap size={18} />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-stone-500">workflow</p>
        </div>
        <h2 className="mt-2 font-display text-3xl md:text-4xl lowercase tracking-tight">configure, preview, publish.</h2>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowCards.map((card) => (
            <div key={card.title} className="rounded-lg border border-stone-300 bg-white/70 p-5">
              <div className="rounded-full bg-stone-900/5 p-2 w-fit text-stone-700">
                <card.icon size={18} />
              </div>
              <h3 className="mt-4 font-display text-lg lowercase">{card.title}</h3>
              <p className="mt-2 text-[13px] text-stone-600 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="mt-20 md:mt-28">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-stone-900/5 p-2 text-stone-700">
            <Check size={18} />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-stone-500">the difference</p>
        </div>
        <h2 className="mt-2 font-display text-3xl md:text-4xl lowercase tracking-tight">with porter vs. without.</h2>

        <div className="mt-8 overflow-hidden rounded-lg border border-stone-300 bg-white/70">
          <div className="grid grid-cols-12 border-b border-stone-300 bg-stone-100/50">
            <div className="col-span-5 p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">without porter</div>
            <div className="col-span-7 border-l border-stone-300 p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-900">with porter</div>
          </div>
          {comparison.map((row) => (
            <div key={row.with} className="grid grid-cols-12 border-b border-stone-300 last:border-b-0">
              <div className="col-span-5 p-4 text-[13px] text-stone-600 flex items-start gap-2">
                <X size={14} className="mt-1 shrink-0 text-stone-400" />
                <span>{row.without}</span>
              </div>
              <div className="col-span-7 border-l border-stone-300 bg-stone-900/5 p-4 text-[13px] text-stone-800 flex items-start gap-2">
                <Check size={14} className="mt-1 shrink-0 text-stone-700" />
                <span>{row.with}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20 md:mt-28 rounded-2xl border border-stone-300 bg-stone-900 text-stone-50 p-8 md:p-12">
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">ready to try?</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl lowercase tracking-tight">{cta.headline}</h2>
          <p className="mt-4 max-w-xl text-stone-300 leading-relaxed">{cta.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/porter/lab"
              className="inline-flex items-center gap-2 rounded-full bg-white text-stone-900 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-stone-200"
            >
              open the lab
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/porter/about"
              className="rounded-full border border-stone-600 bg-stone-900/50 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-300 hover:bg-stone-800"
            >
              about porter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
