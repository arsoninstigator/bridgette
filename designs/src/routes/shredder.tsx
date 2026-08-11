import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/boardr/SiteChrome";

export const Route = createFileRoute("/shredder")({
  head: () => ({
    meta: [
      { title: "Shredder — document shredding sim | boardr" },
      {
        name: "description",
        content:
          "A playful document shredder simulator for boardr: feed a page in, watch it turn into ribbons, and keep the confetti for your board.",
      },
      { property: "og:title", content: "Shredder — document shredding sim | boardr" },
      {
        property: "og:description",
        content: "Feed a page in, watch it turn into paper ribbons, and scatter the shreds across your board.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShredderPage,
});

const STEPS = [
  { n: "01", t: "feed a page", d: "drop an image, a note, or any board asset into the tray." },
  { n: "02", t: "pick a cut", d: "strip cut, cross cut, or confetti — each leaves a different mess." },
  { n: "03", t: "pull the lever", d: "the motor whirs, the page creeps down, ribbons spill out." },
  { n: "04", t: "keep the shreds", d: "grab the ribbons as loose assets and scatter them on a board." },
];

function ShredderPage() {
  return (
    <>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-16">
        <span className="inline-block rounded-full border border-stone-700/30 px-3 py-1 font-mono text-[10px] lowercase tracking-widest text-stone-600">
          prototype · not wired up yet
        </span>
        <h1 className="mt-4 font-mono text-4xl lowercase tracking-tight text-stone-900 md:text-5xl">shredder</h1>
        <p className="mt-4 max-w-2xl font-mono text-sm lowercase leading-relaxed text-stone-600">
          a document shredding simulator for boardr. paper goes in whole, comes out in ribbons — and the ribbons
          become assets you can tape, pin, and reassemble on the board.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-[1.1fr_.9fr]">
          <ShredderMachine />
          <div className="space-y-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-lg border border-stone-700/20 bg-stone-50/70 p-4">
                <div className="font-mono text-[10px] lowercase tracking-widest text-rose-600">{s.n}</div>
                <div className="mt-1 font-mono text-sm lowercase text-stone-900">{s.t}</div>
                <p className="mt-1 font-mono text-[11px] lowercase leading-relaxed text-stone-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-md border border-stone-700/30 bg-stone-200/60 px-4 py-2 font-mono text-[12px] lowercase text-stone-500"
          >
            shred a document (soon)
          </button>
          <Link
            to="/editor"
            className="rounded-md border border-stone-900/60 bg-stone-900 px-4 py-2 font-mono text-[12px] lowercase text-stone-50"
          >
            back to the board
          </Link>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}

function ShredderMachine() {
  return (
    <div className="rounded-xl border border-stone-700/20 bg-stone-100/70 p-6">
      <div className="mx-auto w-full max-w-sm">
        {/* page going in */}
        <div className="mx-auto h-28 w-3/4 rounded-t-sm border border-stone-400/70 bg-white shadow-sm">
          <div className="space-y-2 p-4">
            {[80, 95, 60, 88].map((w, i) => (
              <div key={i} className="h-[6px] rounded-sm bg-stone-300" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
        {/* machine body */}
        <div className="relative rounded-md border border-stone-800/70 bg-stone-800 px-4 py-5 shadow-lg">
          <div className="mx-auto h-[6px] w-4/5 rounded-full bg-stone-950" />
          <div className="mt-3 flex items-center justify-between font-mono text-[9px] lowercase tracking-widest text-stone-400">
            <span>boardr shredder v0</span>
            <span className="rounded-sm bg-rose-600/80 px-1.5 py-[2px] text-stone-50">idle</span>
          </div>
        </div>
        {/* ribbons */}
        <div className="flex justify-center gap-[3px] px-6">
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className="w-[5px] rounded-b-sm bg-white/90 shadow-sm"
              style={{ height: 40 + ((i * 37) % 55), transform: `rotate(${((i % 5) - 2) * 1.6}deg)` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
