import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { SiteHeader, SiteFooter } from "../components/boardr/SiteChrome";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "zinegeist vs carrd & other site builders" },
      { name: "description", content: "how zinegeist compares to carrd.co and other one-page site builders — built for interactivity, multi-page, and tactile spatial design." },
      { property: "og:title", content: "zinegeist vs carrd & other site builders" },
      { property: "og:description", content: "zinegeist focuses on interactivity, multi-page boards, and tactile spatial design." },
    ],
  }),
  component: ComparePage,
});

type Cell = boolean | string;
const COLS = ["zinegeist", "carrd.co", "linktree", "notion sites"] as const;
type Col = typeof COLS[number];

const ROWS: { feature: string; values: Record<Col, Cell> }[] = [
  { feature: "tactile drag, rotate, layer", values: { "zinegeist": true, "carrd.co": false, linktree: false, "notion sites": false } },
  { feature: "multi-page / multi-frame boards", values: { "zinegeist": true, "carrd.co": "pro only", linktree: false, "notion sites": true } },
  { feature: "interactive elements (flip, string-connect)", values: { "zinegeist": true, "carrd.co": false, linktree: false, "notion sites": false } },
  { feature: "spatial / freeform canvas", values: { "zinegeist": true, "carrd.co": false, linktree: false, "notion sites": false } },
  { feature: "real surfaces (cork, paper, wood, tile)", values: { "zinegeist": true, "carrd.co": false, linktree: false, "notion sites": false } },
  { feature: "structured blocks (bento, accordions, forms)", values: { "zinegeist": true, "carrd.co": true, linktree: false, "notion sites": true } },
  { feature: "one-page landing site", values: { "zinegeist": true, "carrd.co": true, linktree: true, "notion sites": true } },
  { feature: "no account needed", values: { "zinegeist": true, "carrd.co": false, linktree: false, "notion sites": false } },
  { feature: "publish to short share url", values: { "zinegeist": "/s/key", "carrd.co": "custom", linktree: "linktr.ee/x", "notion sites": "custom" } },
  { feature: "built for nonlinear thinking", values: { "zinegeist": true, "carrd.co": false, linktree: false, "notion sites": "kind of" } },
];

function Mark({ v }: { v: Cell }) {
  if (v === true) return <Check size={16} className="text-emerald-600" />;
  if (v === false) return <Minus size={16} className="text-stone-400" />;
  return <span className="font-mono text-[11px] lowercase text-stone-700">{v}</span>;
}

function ComparePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        <header className="mb-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">compare</p>
          <h1 className="font-display text-5xl lowercase tracking-tight">zinegeist vs the one-pagers.</h1>
          <p className="mt-4 max-w-2xl text-stone-700 leading-relaxed">
            carrd, linktree, and even notion sites are great for static one-pagers. zinegeist plays a
            different game — <em>interactivity, multi-page boards, real tactile surfaces, and freeform spatial layouts</em>.
            if you want a single linktree, those tools win on simplicity. if you want a place for thought
            to live, with multiple frames, flipping objects, and strings between pinned anchors, that’s us.
          </p>
        </header>

        <div className="overflow-x-auto rounded-md border border-border bg-card/60">
          <table className="w-full text-left">
            <thead className="bg-stone-100/60 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">feature</th>
                {COLS.map((c) => (
                  <th
                    key={c}
                    className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] ${
                      c === "zinegeist" ? "text-rose-700" : "text-muted-foreground"
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.feature} className={i % 2 ? "bg-stone-50/40" : ""}>
                  <td className="px-4 py-3 font-mono text-[12px] lowercase text-stone-800">{r.feature}</td>
                  {COLS.map((c) => (
                    <td key={c} className={`px-4 py-3 ${c === "zinegeist" ? "bg-rose-50/40" : ""}`}>
                      <Mark v={r.values[c]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="mt-14 grid md:grid-cols-3 gap-6">
          {[
            { t: "interactivity first", d: "flip, drag, pin, connect. nothing on a zinegeist page is static unless you want it to be." },
            { t: "multi-page by default", d: "boards have frames, not just sections. each frame is its own surface with its own props." },
            { t: "tactile, not flat", d: "real surfaces, real shadows, real torn-paper edges. zinegeist looks and feels like a workshop." },
          ].map((c) => (
            <div key={c.t} className="rounded-md border border-border bg-card/60 p-5">
              <h3 className="font-display text-xl lowercase">{c.t}</h3>
              <p className="mt-2 font-mono text-[12px] lowercase text-stone-700 leading-relaxed">{c.d}</p>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
