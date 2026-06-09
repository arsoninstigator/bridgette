import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "../components/boardr/SiteChrome";
import type { BoardKind } from "../lib/boardr/types";

export const Route = createFileRoute("/")({
  component: Index,
});

const SURFACES: { kind: BoardKind; label: string; className: string; blurb: string }[] = [
  { kind: "cork", label: "corkboard", className: "bg-board-cork", blurb: "warm, pinhole-ready, classic" },
  { kind: "mat", label: "cutting mat", className: "bg-board-mat", blurb: "gridded, studio, precise" },
  { kind: "wall", label: "wallpaper", className: "bg-board-wall", blurb: "plaster, soft, neutral" },
  { kind: "metal", label: "metallic board", className: "bg-board-metal", blurb: "brushed, magnetic mood" },
];

const ANALOG_OBJECTS = [
  { label: "polaroids + plus-to-fill", note: "01" },
  { label: "photo frames", note: "02" },
  { label: "photostrips", note: "03" },
  { label: "sticky notes", note: "04" },
  { label: "jagged washi tape", note: "05" },
  { label: "wooden clips", note: "06" },
  { label: "hanging strings", note: "07" },
  { label: "custom patterns", note: "08" },
];

const NEW = [
  { t: "hanging mode", d: "strings sag with real droop. right-click any asset → add wooden clip, and hang polaroids from the rope gallery-style." },
  { t: "pages + sections", d: "pages publish as /routes. sections live as #anchors on one continuous canvas — same background, no breaks." },
  { t: "plus-to-fill", d: "every empty polaroid, photo frame, and photostrip slot has a big plus inside. click to upload — no menus to hunt." },
  { t: "custom patterns", d: "build your own background: grid, stripes, checker, dots. pick rows, shades, thickness, angle. or upload your own surface." },
];

const FEATURES = [
  { n: "nonlinear", d: "thought doesn’t happen in straight lines. zinegeist was built for the way curiosity actually feels." },
  { n: "tactile", d: "pin photographs to cork. drape strings with sag. clip polaroids to the line. flip cards to read the back." },
  { n: "obsessive", d: "part corkboard, part scrapbook, part dossier archive, part evidence wall." },
  { n: "spatial", d: "the board itself becomes part of the meaning. mess carries meaning. arrangement matters." },
];

const USE_CASES = [
  { t: "loreboards", d: "worldbuilding systems, character relationship webs, nested dossiers." },
  { t: "evidence walls", d: "investigation maps, research clusters, visual conspiracies." },
  { t: "rabbit holes", d: "internet archaeology, fandom archives, obsessive scholar workspaces." },
  { t: "visual essays", d: "interactive scrapbooks, digital zines, nonlinear presentations." },
  { t: "field journals", d: "annotated galleries, memory palaces, interconnected archives." },
  { t: "moodboards", d: "visual knowledge systems, junk journals, indie web artifacts." },
];

const VOCAB = [
  "nonlinear", "tactile", "obsessive", "spatial", "archival", "interconnected",
  "dossier", "artifact", "scrapbook", "evidence wall", "rabbit hole", "archive",
];

const FAQ = [
  { q: "do i need an account?", a: "no. zinegeist treats interfaces like environments. boards live in your browser." },
  { q: "where is my data?", a: "localStorage. nothing leaves your machine until you publish a snapshot to /s/[key]." },
  { q: "is it for productivity?", a: "less 'project management,' more detective apartment wall or media studies thesis board." },
  { q: "how does it feel?", a: "like finding something at 2am and opening twelve more tabs because suddenly everything connects." },
];

function Index() {
  const navigate = useNavigate();
  const [openKey, setOpenKey] = useState(false);
  const [keyVal, setKeyVal] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="bg-editor-header border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-7">
            <span className="inline-block font-mono text-[10px] uppercase tracking-[0.25em] text-stone-700 bg-stone-50/70 border border-stone-300/60 rounded-full px-3 py-1">
              v1 · spatial publishing
            </span>
            <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[0.92] tracking-tight lowercase">
              zinegeist.<br />
              <span className="text-stone-700/70">build places for thought to live.</span>
            </h1>
            <p className="mt-6 max-w-xl font-mono text-sm leading-relaxed text-stone-700">
              a tactile spatial publishing platform for rabbit holes, archives, investigations,
              nonlinear storytelling, and obsessive curation. part corkboard, part scrapbook,
              part dossier archive, part evidence wall, part indie web artifact.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="rounded-md bg-stone-900 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50 hover:bg-stone-800 analog-shadow-sm"
              >
                open dashboard →
              </Link>
              <button
                onClick={() => setOpenKey((v) => !v)}
                className="rounded-md border border-stone-400/60 bg-stone-50/60 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-stone-50"
              >
                open with edit key
              </button>
            </div>

            {openKey && (
              <div className="mt-6 max-w-md">
                <div className="flex gap-2">
                  <input
                    value={keyVal}
                    onChange={(e) => setKeyVal(e.target.value)}
                    placeholder="paste edit key"
                    className="flex-1 rounded-md border border-input bg-card px-3 py-2 font-mono text-xs"
                  />
                  <button
                    onClick={() => keyVal && navigate({ to: "/editor", search: { k: keyVal } })}
                    className="rounded-md bg-stone-900 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-stone-50"
                  >
                    open
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mini diorama — tactile scrapboard */}
          <div className="md:col-span-5 relative">
            <div
              className="relative w-full max-w-[520px] mx-auto aspect-[560/380] rounded-xl bg-board-cork overflow-hidden border-[12px] border-[#8d6a4a] ring-1 ring-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
            >
              {/* sagging strings */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 560 380" fill="none" preserveAspectRatio="none">
                <path d="M80 120 Q 280 240 480 100" stroke="#7c2d12" strokeWidth="1.5" fill="none" opacity="0.6" />
                <path d="M480 100 Q 520 280 340 330" stroke="#7c2d12" strokeWidth="1.2" fill="none" opacity="0.5" />
              </svg>

              {/* hanging polaroid (left) with wooden clip */}
              <div className="absolute top-[14%] left-[10%] rotate-[-5deg] z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-3 h-9 bg-[#d2b48c] border border-black/10 shadow-sm rounded-sm z-30">
                  <div className="absolute top-2 inset-x-0.5 h-px bg-black/20" />
                  <div className="absolute bottom-2 inset-x-0.5 h-px bg-black/20" />
                  <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-1.5 bg-black/10" />
                </div>
                <div className="bg-[#f9f9f9] p-2 pb-7 shadow-[5px_10px_15px_rgba(0,0,0,0.2)] border border-black/5">
                  <div className="w-24 h-24 bg-gradient-to-br from-stone-400 via-stone-500 to-stone-700 grayscale" />
                </div>
              </div>

              {/* sticky note */}
              <div className="absolute top-[10%] right-[18%] rotate-[3deg] z-10">
                <div className="bg-[#ffff88] w-32 h-32 p-4 shadow-[4px_4px_10px_rgba(0,0,0,0.15)] flex items-center justify-center text-center relative">
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-black/5 rounded-tl-lg" />
                  <p className="font-display text-base leading-snug text-[#5d5a2d] lowercase">mess carries meaning.</p>
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3 h-3">
                    <div className="w-full h-full bg-red-600 rounded-full shadow-inner ring-1 ring-red-800" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-white/60 rounded-full" />
                  </div>
                </div>
              </div>

              {/* taped polaroid (bottom) */}
              <div className="absolute bottom-[6%] left-[22%] rotate-[8deg] z-20">
                <div className="bg-white p-2 pb-7 shadow-[8px_12px_20px_rgba(0,0,0,0.25)] border border-black/5">
                  <div className="w-32 h-20 bg-gradient-to-tr from-stone-300 via-stone-400 to-stone-500" />
                </div>
                {/* jagged pink washi tape */}
                <div
                  className="absolute -top-2 -left-5 w-16 h-5 bg-[#f472b6]/80 rotate-[-35deg] shadow-sm mix-blend-multiply"
                  style={{
                    clipPath:
                      "polygon(0% 10%, 4% 0%, 12% 12%, 18% 2%, 25% 15%, 32% 0%, 40% 10%, 48% 2%, 55% 18%, 62% 0%, 70% 12%, 78% 2%, 85% 15%, 92% 0%, 100% 10%, 100% 90%, 94% 100%, 86% 88%, 79% 98%, 72% 85%, 65% 100%, 58% 88%, 51% 98%, 44% 82%, 36% 100%, 28% 88%, 20% 98%, 12% 82%, 5% 100%, 0% 90%)",
                  }}
                />
              </div>

              {/* torn paper scrap */}
              <div className="absolute bottom-[18%] right-[8%] rotate-[-12deg] z-10">
                <div
                  className="bg-[#ebe7e0] w-24 h-16 p-2 shadow-md border-l-2 border-black/5"
                  style={{
                    clipPath:
                      "polygon(2% 2%, 98% 0%, 100% 98%, 85% 100%, 72% 95%, 58% 100%, 45% 92%, 30% 98%, 15% 90%, 0% 100%)",
                  }}
                >
                  <div className="space-y-1 opacity-40">
                    <div className="h-1 w-full bg-black/20 rounded-full" />
                    <div className="h-1 w-4/5 bg-black/20 rounded-full" />
                    <div className="h-1 w-full bg-black/20 rounded-full" />
                  </div>
                </div>
              </div>

              {/* clipped artifact ticket */}
              <div className="absolute top-[20%] right-[4%] rotate-[15deg] z-10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2.5 h-7 bg-[#c19a6b] border border-black/10 shadow-sm rounded-sm z-30" />
                <div className="bg-[#f3f4f6] w-20 h-20 p-1.5 shadow-lg border-t-4 border-[#e5e7eb]">
                  <div className="w-full h-full border border-black/5 flex flex-col items-center justify-center">
                    <span className="font-mono text-[7px] text-black/40 tracking-widest uppercase">artifact</span>
                    <div className="w-8 h-px bg-black/10 my-1" />
                    <span className="font-mono text-[6px] text-black/30">00429-A</span>
                  </div>
                </div>
              </div>

              {/* scuff specks */}
              <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-black/10 rounded-full blur-[1px]" />
              <div className="absolute bottom-1/3 left-1/2 w-2 h-0.5 bg-black/5 rotate-45" />
            </div>
          </div>
        </div>
      </section>

      {/* SURFACES */}
      <section className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ surfaces</span>
              <h2 className="mt-2 font-display text-3xl md:text-4xl lowercase">physical surfaces for thought</h2>
            </div>
            <Link to="/dashboard" className="font-mono text-[11px] uppercase tracking-wider underline underline-offset-4">browse all →</Link>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {SURFACES.map((b) => (
              <div key={b.kind} className="rounded-md overflow-hidden border border-border analog-shadow-sm">
                <div className={`h-36 ${b.className}`} />
                <div className="bg-card px-3 py-3">
                  <div className="font-mono text-xs lowercase tracking-wider">{b.label}</div>
                  <div className="font-mono text-[10px] text-muted-foreground lowercase mt-1">{b.blurb}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ASSETS LIBRARY */}
      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ library</span>
            <h2 className="mt-2 font-display text-3xl md:text-4xl lowercase">curated analog-inspired objects</h2>
            <p className="mt-4 font-mono text-sm text-muted-foreground leading-relaxed">
              fill your boards with polaroids, photo frames, photostrips, sticky notes, washi tape with jagged edges,
              loose sheets, and multi-frame pages. every photo holder has a giant plus inside — click to upload.
              cards unfold. folders expand. photographs flip over.
            </p>
          </div>
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ANALOG_OBJECTS.map((a) => (
              <div key={a.label} className="bg-card rounded-md border border-border p-4 analog-shadow-sm">
                <div className="font-mono text-[10px] text-muted-foreground">{a.note}</div>
                <div className="mt-2 font-mono text-xs lowercase">{a.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S NEW */}
      <section className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ newly shipped</span>
              <h2 className="mt-2 font-display text-3xl md:text-4xl lowercase">fresh off the wall</h2>
            </div>
            <Link to="/roadmap" className="font-mono text-[11px] uppercase tracking-wider underline underline-offset-4">full roadmap →</Link>
          </div>
          <div className="mt-10 grid md:grid-cols-4 gap-4">
            {NEW.map((n, i) => (
              <div
                key={n.t}
                className="bg-card rounded-md border border-border p-5 analog-shadow-sm"
                style={{ transform: `rotate(${((i % 4) - 1.5) * 0.4}deg)` }}
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-700">new</div>
                <div className="mt-2 font-display text-xl lowercase">{n.t}</div>
                <p className="mt-2 font-mono text-xs text-muted-foreground leading-relaxed lowercase">{n.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORE FEEL */}
      <section className="border-b border-border/60">

        <div className="max-w-6xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ the feel</span>
          <h2 className="mt-2 font-display text-3xl md:text-4xl lowercase">how curiosity actually feels</h2>
          <div className="mt-10 grid md:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div key={f.n} className="bg-card rounded-md border border-border p-5 analog-shadow-sm">
                <div className="font-display text-xl lowercase">{f.n}</div>
                <p className="mt-2 font-mono text-xs text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="bg-secondary/40 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ artifacts</span>
          <h2 className="mt-2 font-display text-3xl md:text-4xl lowercase">what you can create</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {USE_CASES.map((u, i) => (
              <div
                key={u.t}
                className="bg-card rounded-md border border-border p-5 analog-shadow-sm"
                style={{ transform: `rotate(${((i % 3) - 1) * 0.5}deg)` }}
              >
                <div className="font-display text-xl lowercase">{u.t}</div>
                <p className="mt-2 font-mono text-xs text-muted-foreground leading-relaxed lowercase">{u.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POSITIONING TEASER */}
      <section className="bg-board-cork border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-100/80">/ positioning</span>
            <h2 className="mt-2 font-display text-3xl md:text-5xl lowercase text-stone-50">
              interfaces like environments,<br />
              <span className="text-stone-200/80">not software.</span>
            </h2>
            <p className="mt-5 max-w-xl font-mono text-sm leading-relaxed text-stone-100/85">
              mess carries meaning. texture matters. overlap matters. zinegeist preserves 
              the feeling of building living spaces for thought.
            </p>
            <Link
              to="/positioning"
              className="mt-8 inline-block rounded-md bg-stone-50 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-900 hover:bg-white analog-shadow-sm"
            >
              read the positioning →
            </Link>
          </div>
          <div className="md:col-span-5 flex flex-wrap gap-2">
            {VOCAB.map((w, i) => (
              <span
                key={w}
                className="font-mono text-[11px] lowercase tracking-wide rounded-sm border border-stone-50/30 bg-stone-50/10 text-stone-50 px-3 py-1.5 backdrop-blur-sm"
                style={{ transform: `rotate(${((i % 5) - 2) * 0.8}deg)` }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <p className="font-display text-3xl md:text-4xl leading-snug lowercase text-stone-800">
            “it’s not about organizing your thoughts perfectly.
            <br className="hidden md:block" /> it’s about building places for them to live.”
          </p>
          <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            — zinegeist
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
