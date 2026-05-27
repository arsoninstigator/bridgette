import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/boardr/SiteChrome";

export const Route = createFileRoute("/marketplace/ui")({
  head: () => ({
    meta: [
      { title: "marketplace ideation — zinegeist" },
      { name: "description", content: "concept explorations for the zinegeist community marketplace." },
      { property: "og:title", content: "marketplace ideation — zinegeist" },
      { property: "og:description", content: "concept explorations for the zinegeist community marketplace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MarketplaceIdeationPage,
});

function MarketplaceIdeationPage() {
  const [activeConcept, setActiveConcept] = useState<"shopfront" | "zinestand" | "wall" | "workbench">("shopfront");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-10">
          <div className="inline-block rounded-full border border-border bg-card px-3 py-1 font-mono text-[10px] lowercase tracking-wider text-muted-foreground">
            concept lab
          </div>
          <h1 className="mt-4 font-display text-5xl lowercase tracking-tight">marketplace ideation</h1>
          <p className="mt-3 max-w-2xl text-stone-700 leading-relaxed">
            four directions for how the zinegeist community marketplace could feel. each explores a different metaphor for discovery, ownership, and curation.
          </p>
        </section>

        {/* Concept picker */}
        <section className="max-w-6xl mx-auto px-6 pb-6">
          <div className="flex flex-wrap gap-2">
            {CONCEPTS.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConcept(c.id)}
                className={`rounded-md border px-4 py-2 font-mono text-[11px] lowercase tracking-wider transition ${
                  activeConcept === c.id
                    ? "bg-stone-900 text-stone-50 border-stone-900"
                    : "border-border bg-card text-stone-600 hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {/* Concept display */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          {activeConcept === "shopfront" && <ShopfrontConcept />}
          {activeConcept === "zinestand" && <ZinestandConcept />}
          {activeConcept === "wall" && <WallConcept />}
          {activeConcept === "workbench" && <WorkbenchConcept />}
        </section>

        {/* Shared notes */}
        <section className="border-t border-border bg-card">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <h2 className="font-display text-2xl lowercase tracking-tight">cross-cutting ideas</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div className="rounded-md border border-border bg-background p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">interaction</div>
                <h3 className="mt-2 font-display text-lg lowercase">right-click to tag</h3>
                <p className="mt-2 text-sm text-stone-700 leading-relaxed">
                  every pack, asset, and template gets a context menu. users add semantic tags — "noir", "soft", " ransom-note" — that become community filters. the tag cloud is emergent, not curated.
                </p>
              </div>
              <div className="rounded-md border border-border bg-background p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">economy</div>
                <h3 className="mt-2 font-display text-lg lowercase">free + attribution</h3>
                <p className="mt-2 text-sm text-stone-700 leading-relaxed">
                  packs are free to install. creators choose an attribution license. when you fork a pack, the creator's name travels with it — visible in the board's credit strip, not a paywall.
                </p>
              </div>
              <div className="rounded-md border border-border bg-background p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">discovery</div>
                <h3 className="mt-2 font-display text-lg lowercase">vibe-first search</h3>
                <p className="mt-2 text-sm text-stone-700 leading-relaxed">
                  search is fuzzy and vibe-based. typing "dark moody detective" surfaces noir packs, csi kits, and polaroid sets tagged "evidence". no exact-match tyranny.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

/* ─────────── concepts ─────────── */

const CONCEPTS = [
  { id: "shopfront" as const, label: "the shopfront" },
  { id: "zinestand" as const, label: "the zine stand" },
  { id: "wall" as const, label: "the community wall" },
  { id: "workbench" as const, label: "the workbench" },
];

function ShopfrontConcept() {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl lowercase tracking-tight">the shopfront</h2>
            <p className="mt-2 max-w-xl text-sm text-stone-700 leading-relaxed">
              a clean, commerce-like grid. creators are "vendors". each pack is a product card with a cover image, price (free), and an "add to board" cart action. search bar stays sticky. feels like a refined indie store.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            direction 01
          </span>
        </div>
      </div>

      {/* Mock UI */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        {/* Sticky search bar */}
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur px-5 py-3 flex items-center gap-3">
          <div className="flex-1 max-w-sm h-8 rounded-md border border-border bg-background px-3 flex items-center">
            <span className="text-xs text-muted-foreground">search packs, tags, vibes…</span>
          </div>
          <div className="flex gap-1.5">
            {["all", "assets", "templates", "lists"].map((f) => (
              <span key={f} className="rounded border border-border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-stone-600">{f}</span>
            ))}
          </div>
        </div>

        {/* Hero pack */}
        <div className="px-5 py-6">
          <div className="rounded-md border border-border overflow-hidden bg-background">
            <div className="h-40 grid grid-cols-6">
              <div style={{ background: "#1a1a1a" }} />
              <div style={{ background: "#c9a84c" }} />
              <div style={{ background: "#b91c1c" }} />
              <div style={{ background: "#f5f3ee" }} />
              <div style={{ background: "#8b7355" }} />
              <div style={{ background: "#2d2d2d" }} />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl lowercase">noir detective wall — complete kit</h3>
                  <p className="mt-1 text-sm text-stone-700">42 items · by <span className="text-foreground">zinegeist</span> · #noir #polaroid #red-string</p>
                </div>
                <span className="rounded-md bg-stone-900 px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-stone-50">add to board →</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="px-5 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "cottagecore washi", colors: ["#dce5d4","#a8c0a0","#7d9b76","#f5f0e8"], meta: "12 items · by avacollins" },
            { name: "csi kit", colors: ["#fde047","#0d0d0d","#b91c1c","#f5f3ee"], meta: "38 items · by zinegeist" },
            { name: "halftone shapes", colors: ["#2d2d2d","#4a4a4a","#9ca3af","#f5f3ee"], meta: "24 items · by printlab" },
            { name: "summer tour '24", colors: ["#ff6b35","#f7931e","#e84393","#6c5ce7"], meta: "template · by roadie" },
            { name: "archive box", colors: ["#8b7355","#c9a84c","#1a1a1a","#f5f3ee"], meta: "18 items · by deepstorage" },
            { name: "ransom note", colors: ["#b91c1c","#1a1a1a","#f5f3ee","#c9a84c"], meta: "31 items · by cutpaste" },
          ].map((p, i) => (
            <div key={i} className="rounded-md border border-border overflow-hidden bg-background group hover:shadow-md transition-shadow">
              <div className="h-28 grid grid-cols-4">
                {p.colors.map((c, j) => <div key={j} style={{ background: c }} />)}
              </div>
              <div className="p-4">
                <h4 className="font-display text-base lowercase">{p.name}</h4>
                <p className="mt-1 text-[11px] text-stone-600 font-mono">{p.meta}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-stone-500">free</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-600 group-hover:text-foreground transition">install →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ZinestandConcept() {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl lowercase tracking-tight">the zine stand</h2>
            <p className="mt-2 max-w-xl text-sm text-stone-700 leading-relaxed">
              a scattered, overlapping shelf — like real zines at a distro. packs are different sizes, some overlap, some are pinned at angles. hover lifts a zine forward. feels tactile and chaotic in a good way. curated "stacks" sit on top like staff picks.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            direction 02
          </span>
        </div>
      </div>

      {/* Mock UI — scattered shelf */}
      <div className="rounded-md border border-border bg-[#f0ebe3] p-6 overflow-hidden relative" style={{ minHeight: 520 }}>
        {/* Background texture hint */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(139,115,85,0.15) 0 1px, transparent 2px), radial-gradient(circle at 70% 60%, rgba(139,115,85,0.12) 0 1px, transparent 2px)`,
          backgroundSize: '16px 16px, 20px 20px'
        }} />

        <div className="relative">
          <div className="mb-4 inline-block rounded-full border border-border bg-card/80 px-3 py-1 font-mono text-[10px] lowercase tracking-wider text-muted-foreground">
            staff picks — this week
          </div>

          {/* Scattered zines */}
          <div className="relative" style={{ height: 400 }}>
            {ZINE_ITEMS.map((z, i) => (
              <div
                key={i}
                className="absolute rounded-sm border border-border bg-card p-3 hover:z-50 hover:shadow-xl transition-all duration-300 cursor-pointer"
                style={{
                  left: z.left,
                  top: z.top,
                  width: z.w,
                  transform: `rotate(${z.rot}deg)`,
                  zIndex: z.z,
                }}
              >
                <div className="h-16 grid grid-cols-4 rounded-sm overflow-hidden">
                  {z.colors.map((c, j) => <div key={j} style={{ background: c }} />)}
                </div>
                <div className="mt-2">
                  <h4 className="font-display text-sm lowercase leading-tight">{z.name}</h4>
                  <p className="mt-0.5 text-[10px] text-stone-600 font-mono">{z.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const ZINE_ITEMS = [
  { name: "noir complete kit", colors: ["#1a1a1a","#c9a84c","#b91c1c","#f5f3ee"], meta: "42 items · zinegeist", left: "2%", top: 10, w: 180, rot: -3, z: 1 },
  { name: "cottagecore washi", colors: ["#dce5d4","#a8c0a0","#7d9b76","#f5f0e8"], meta: "12 items · avacollins", left: "22%", top: 30, w: 160, rot: 2, z: 2 },
  { name: "csi kit", colors: ["#fde047","#0d0d0d","#b91c1c","#f5f3ee"], meta: "38 items · zinegeist", left: "42%", top: 5, w: 170, rot: -1, z: 3 },
  { name: "halftone", colors: ["#2d2d2d","#4a4a4a","#9ca3af","#f5f3ee"], meta: "24 items · printlab", left: "62%", top: 25, w: 150, rot: 4, z: 2 },
  { name: "summer tour '24", colors: ["#ff6b35","#f7931e","#e84393","#6c5ce7"], meta: "template · roadie", left: "78%", top: 15, w: 165, rot: -2, z: 1 },
  { name: "archive box", colors: ["#8b7355","#c9a84c","#1a1a1a","#f5f3ee"], meta: "18 items · deepstorage", left: "10%", top: 190, w: 155, rot: 1, z: 2 },
  { name: "ransom note", colors: ["#b91c1c","#1a1a1a","#f5f3ee","#c9a84c"], meta: "31 items · cutpaste", left: "32%", top: 210, w: 175, rot: -4, z: 3 },
  { name: "motion graphics", colors: ["#0c2340","#1a4a6e","#2d8a9e","#5cbdb9"], meta: "16 items · framebyframe", left: "56%", top: 195, w: 160, rot: 3, z: 2 },
  { name: "anchoring kit", colors: ["#8b7355","#c9a84c","#1a1a1a","#b91c1c"], meta: "28 items · zinegeist", left: "75%", top: 220, w: 170, rot: -1, z: 1 },
];

function WallConcept() {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl lowercase tracking-tight">the community wall</h2>
            <p className="mt-2 max-w-xl text-sm text-stone-700 leading-relaxed">
              every pack is a polaroid pinned to a corkboard wall. users can "string" related packs together. the wall is infinite-scroll and zoomable. you follow curators, and their wall updates appear in your feed. feels social and spatial.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            direction 03
          </span>
        </div>
      </div>

      {/* Mock UI — cork wall */}
      <div className="rounded-md border border-border overflow-hidden">
        <div className="bg-board-cork p-6 relative" style={{ minHeight: 480 }}>
          {/* Polaroids scattered on cork */}
          <div className="relative" style={{ height: 440 }}>
            {POLAROIDS.map((p, i) => (
              <div
                key={i}
                className="absolute bg-[#faf8f5] rounded-sm analog-shadow-sm p-2 pb-4 hover:scale-105 transition-transform cursor-pointer"
                style={{
                  left: p.left,
                  top: p.top,
                  width: p.w,
                  transform: `rotate(${p.rot}deg)`,
                }}
              >
                <div className="h-20 grid grid-cols-2">
                  <div style={{ background: p.colors[0] }} />
                  <div style={{ background: p.colors[1] }} />
                </div>
                <div className="mt-2 px-1">
                  <h4 className="font-display text-[11px] lowercase leading-tight">{p.name}</h4>
                  <p className="mt-0.5 text-[9px] text-stone-500 font-mono">{p.meta}</p>
                </div>
                {/* Pin */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ background: p.pinColor }} />
              </div>
            ))}
            {/* String connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <line x1="15%" y1="80" x2="35%" y2="120" stroke="#b91c1c" strokeWidth="1.5" strokeOpacity="0.5" />
              <line x1="35%" y1="120" x2="55%" y2="90" stroke="#b91c1c" strokeWidth="1.5" strokeOpacity="0.4" />
              <line x1="55%" y1="90" x2="75%" y2="140" stroke="#b91c1c" strokeWidth="1.5" strokeOpacity="0.3" />
              <line x1="20%" y1="260" x2="45%" y2="290" stroke="#c9a84c" strokeWidth="1.5" strokeOpacity="0.4" />
              <line x1="45%" y1="290" x2="70%" y2="250" stroke="#c9a84c" strokeWidth="1.5" strokeOpacity="0.3" />
            </svg>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border bg-card flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground">cork wall — drag to pan, scroll to zoom</span>
          <span className="text-[10px] font-mono text-muted-foreground">following 12 curators · 847 packs pinned</span>
        </div>
      </div>
    </div>
  );
}

const POLAROIDS = [
  { name: "noir kit", colors: ["#1a1a1a","#c9a84c"], meta: "zinegeist", left: "8%", top: 40, w: 120, rot: -6, pinColor: "#b91c1c" },
  { name: "csi kit", colors: ["#fde047","#0d0d0d"], meta: "zinegeist", left: "28%", top: 60, w: 115, rot: 4, pinColor: "#1a1a1a" },
  { name: "cottagecore", colors: ["#dce5d4","#a8c0a0"], meta: "avacollins", left: "48%", top: 30, w: 125, rot: -2, pinColor: "#8b7355" },
  { name: "halftone", colors: ["#2d2d2d","#9ca3af"], meta: "printlab", left: "68%", top: 70, w: 110, rot: 5, pinColor: "#c9a84c" },
  { name: "summer tour", colors: ["#ff6b35","#e84393"], meta: "roadie", left: "12%", top: 220, w: 118, rot: 3, pinColor: "#e84393" },
  { name: "archive", colors: ["#8b7355","#c9a84c"], meta: "deepstorage", left: "32%", top: 250, w: 115, rot: -4, pinColor: "#1a1a1a" },
  { name: "ransom", colors: ["#b91c1c","#f5f3ee"], meta: "cutpaste", left: "55%", top: 230, w: 122, rot: 2, pinColor: "#b91c1c" },
  { name: "motion gfx", colors: ["#0c2340","#5cbdb9"], meta: "framebyframe", left: "75%", top: 260, w: 116, rot: -3, pinColor: "#2d8a9e" },
];

function WorkbenchConcept() {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl lowercase tracking-tight">the workbench</h2>
            <p className="mt-2 max-w-xl text-sm text-stone-700 leading-relaxed">
              a split-pane tool: left side is a filterable inventory of all packs, right side is your "workbench" — a staging area where you preview how selected packs look together on a mini board before committing. try before you buy (free).
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            direction 04
          </span>
        </div>
      </div>

      {/* Mock UI — split pane */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="flex flex-col lg:flex-row" style={{ minHeight: 480 }}>
          {/* Left: inventory */}
          <div className="lg:w-80 border-r border-border bg-background p-4 flex flex-col gap-3">
            <div className="h-8 rounded-md border border-border bg-card px-3 flex items-center">
              <span className="text-xs text-muted-foreground">filter packs…</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {["all", "noir", "soft", "loud", "archive", "template"].map((t) => (
                <span key={t} className="rounded border border-border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-stone-600">{t}</span>
              ))}
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {[
                { name: "noir complete kit", tag: "noir", checked: true },
                { name: "csi kit", tag: "noir", checked: true },
                { name: "cottagecore washi", tag: "soft", checked: false },
                { name: "halftone shapes", tag: "loud", checked: false },
                { name: "archive box", tag: "archive", checked: false },
                { name: "summer tour '24", tag: "template", checked: false },
                { name: "ransom note", tag: "loud", checked: false },
                { name: "motion graphics", tag: "soft", checked: false },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${item.checked ? 'border-stone-900 bg-stone-900/5' : 'border-border'}`}>
                  <span className={`w-3 h-3 rounded-sm border ${item.checked ? 'bg-stone-900 border-stone-900' : 'border-stone-400'}`} />
                  <span className="flex-1 lowercase">{item.name}</span>
                  <span className="text-[9px] font-mono uppercase text-stone-500">{item.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: workbench preview */}
          <div className="flex-1 bg-board-cork p-6 relative">
            <div className="absolute top-3 left-3 text-[10px] font-mono text-white/70 uppercase tracking-wider">workbench preview</div>
            {/* Mini board with items from selected packs */}
            <div className="relative mt-6" style={{ height: 360 }}>
              {/* Polaroid */}
              <div className="absolute left-[10%] top-[8%] w-28 bg-[#faf8f5] rounded-sm p-1.5 pb-3 analog-shadow-sm" style={{ transform: 'rotate(-8deg)' }}>
                <div className="h-14 bg-stone-800" />
                <div className="mt-1 text-[9px] font-mono text-stone-500">evidence #4</div>
              </div>
              {/* Sticky */}
              <div className="absolute left-[35%] top-[12%] w-24 h-24 bg-[#fde047] rounded-sm analog-shadow-sm p-2" style={{ transform: 'rotate(4deg)' }}>
                <div className="text-[9px] font-mono text-stone-800 leading-tight">check alibi — 9pm</div>
              </div>
              {/* Red string */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path d="M 140 80 Q 280 150 420 100" stroke="#b91c1c" strokeWidth="2" fill="none" opacity="0.6" />
              </svg>
              {/* Evidence marker */}
              <div className="absolute left-[60%] top-[5%] w-8 h-8 rounded-full bg-[#fde047] border-2 border-[#1a1a1a] flex items-center justify-center font-mono text-xs font-bold" style={{ transform: 'rotate(12deg)' }}>5</div>
              {/* Newspaper clipping */}
              <div className="absolute left-[15%] top-[55%] w-32 bg-[#f5f3ee] border border-stone-300 p-2" style={{ transform: 'rotate(-3deg)' }}>
                <div className="text-[8px] font-mono text-stone-800 leading-tight uppercase">the daily zine</div>
                <div className="mt-1 h-1 w-full bg-stone-800" />
                <div className="mt-1 space-y-0.5">
                  <div className="h-0.5 w-3/4 bg-stone-400" />
                  <div className="h-0.5 w-full bg-stone-400" />
                  <div className="h-0.5 w-5/6 bg-stone-400" />
                </div>
              </div>
              {/* Tape strip */}
              <div className="absolute left-[50%] top-[50%] w-20 h-6 bg-[#fde047]/60 rotate-45" />
              {/* Mugshot frame */}
              <div className="absolute left-[70%] top-[45%] w-24 bg-[#faf8f5] border-4 border-stone-800 p-1" style={{ transform: 'rotate(6deg)' }}>
                <div className="h-16 bg-stone-400" />
                <div className="mt-1 text-center text-[8px] font-mono uppercase text-stone-600">suspect a</div>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/70">2 packs selected · 42 items · drag to arrange</span>
              <span className="rounded-md bg-stone-900 px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-stone-50">install to board →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
