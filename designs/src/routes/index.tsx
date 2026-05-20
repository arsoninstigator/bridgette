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
  { label: "polaroids", note: "01" },
  { label: "photostrips", note: "02" },
  { label: "sticky notes", note: "03" },
  { label: "evidence tags", note: "04" },
  { label: "library cards", note: "05" },
  { label: "receipts", note: "06" },
  { label: "stamps", note: "07" },
  { label: "folders", note: "08" },
];

const FEATURES = [
  { n: "nonlinear", d: "thought doesn’t happen in straight lines. zinegeist was built for the way curiosity actually feels." },
  { n: "tactile", d: "pin photographs to corkboards. scatter annotations across wallpaper. flip over polaroids." },
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

          {/* Mini diorama */}
          <div className="md:col-span-5 relative">
            <div className="relative h-72 rounded-md bg-board-cork analog-shadow overflow-hidden border border-stone-900/10">
              <div className="absolute left-6 top-6 w-32 h-32 bg-yellow-200 rotate-[-4deg] analog-shadow-sm p-3 font-display text-xs">
                mess carries meaning.
              </div>
              <div className="absolute right-6 top-10 w-32 bg-stone-50 p-2 pb-6 rotate-[5deg] analog-shadow-sm">
                <div className="h-20 bg-stone-300" />
              </div>
              <div className="absolute left-12 bottom-6 w-40 bg-stone-50 p-2 pb-5 rotate-[-2deg] analog-shadow-sm">
                <div className="h-14 bg-stone-300" />
              </div>
              <div className="absolute right-10 bottom-10 w-20 h-5 bg-pink-300/80 rotate-[20deg]" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path d="M 60 90 Q 150 160 200 60" stroke="#a33" strokeWidth="1.5" fill="none" />
                <path d="M 60 90 Q 120 200 180 240" stroke="#a33" strokeWidth="1.5" fill="none" />
              </svg>
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
              fill your boards with polaroids, photostrips, sticky notes, evidence tags, library cards, and more. 
              everything is interactive. cards unfold. folders expand. photographs flip over.
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
