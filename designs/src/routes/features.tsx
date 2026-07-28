import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "../components/boardr/SiteChrome";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "features — zinegeist" },
      { name: "description", content: "every tactile object, surface, and interaction zinegeist offers for spatial publishing." },
      { property: "og:title", content: "features — zinegeist" },
      { property: "og:description", content: "every tactile object, surface, and interaction zinegeist offers." },
    ],
  }),
  component: FeaturesPage,
});

const GROUPS = [
  {
    title: "surfaces",
    blurb: "the substrate is part of the meaning.",
    items: [
      "corkboard (drawn) + corkboard (photo) — two flavors of the original",
      "cutting mat, wall, metallic — the rest of the originals",
      "texture overlays (paper, kraft, denim, linen, burlap, felt, leather, concrete, brick, marble, woodgrain, grid, dots)",
      "build-your-own patterns: grid, stripes, checker, dots — pick row count, shade colors, thickness, angle",
      "upload any image as the surface",
      "recolor any surface via hex base color + overlay strength",
    ],
  },
  {
    title: "tactile objects",
    blurb: "every piece flips, pins, drags, and connects.",
    items: [
      "sticky notes — six colorways, flip for hidden notes",
      "polaroids — classic / wide / mini, click the big plus inside to upload a photo",
      "photo frames — classic, ornate, double-matte, oval, scalloped, polaroid; plus-to-fill empty slots in any svg",
      "photostrips — four-frame booth strips with plus-to-upload on every frame",
      "loose sheets — torn notes, receipts, index cards",
      "washi tape — jagged v-edges, adjustable opacity, draw-on-canvas to set length",
      "attached tape — washi strip across the top of any pinned object",
      "pushpins — recolorable svg heads, anchor threads conspiracy-board style",
      "wooden clips — clothespin clips attach to assets so they hang from strings",
      "marquee strips, news tickers, pastel scrollers — fully recolorable",
    ],
  },
  {
    title: "strings & hanging mode",
    blurb: "thread, sag, clip, hang — murderboard meets clothesline.",
    items: [
      "textured jute-rope rendering with knot anchors, inspired by real cork-and-thread boards",
      "sidebar tabs: connect (pin-to-pin), edit (defaults for new strings), hanging (free bunting)",
      "right-click any string on the canvas → change color, thickness slider, droopiness slider",
      "hanging mode: click anywhere to lay a multi-point bunting garland corner-to-corner-to-corner",
      "right-click a hanging string → \"hang things up\" to clip polaroids to it",
      "add wooden clip to any asset — the exact original svg, transparent so it reads on any surface",
      "sag / gravity controls per string, from taut wire to heavy clothesline",
    ],
  },
  {
    title: "kits & configurators",
    blurb: "opinionated presets — the good parts of a psd, none of the layer hell.",
    items: [
      "kits tab in the sidebar — case file, redacted, archivalcore, vintage ephemera, paperwork, signage, visual diary, forensic evidence, analog studio, junk drawer, confetti, blobs, trinkets, zine, charms",
      "metal wall grid — industrial wire panels + s-hooks + mini bulldog clips for hanging polaroids and tags",
      "accessories configurator — enamel pins, die-cut stickers, iron-on patches, appliqués, button pins",
      "socialcore configurator — punch cards, tear-away flyers, tickets, boarding passes",
    ],
  },
  {
    title: "pages & sections",
    blurb: "rooms and the walls inside them.",
    items: [
      "pages = routes — each page publishes as /pagename under your /s/key",
      "sections = anchors — each section publishes as #section-name on its page",
      "sections share one continuous canvas with the same background — no breaks",
      "tab bar at the top for pages; jump-link bar for sections within a page",
      "add, rename, delete pages and sections from the meta panel",
      "viewer follows hash links and scrolls to anchors on load",
    ],
  },
  {
    title: "interactions",
    blurb: "more than static. boards that respond.",
    items: [
      "drag, rotate, layer with z-order",
      "flip cards to reveal back notes — works in preview & published view",
      "click the big plus inside any empty photo / polaroid / frame to upload",
      "string-connect pinned anchors or hang clipped assets from a string",
      "right-click any element for the full context menu (edit, tape, pin, clip, layer, lock, group)",
      "in-screen popups for palettes, fonts, tags — no browser prompts",
      "custom hex / palette colors anywhere a color is editable",
      "favorites + recents per library set",
      "resizable canvas frame (canva-style), with per-page height that grows as you add sections",
      "publish to a 5-digit /s/key url — publicly viewable via lovable cloud",
      "edit-key for private edits",
    ],
  },
];

function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        <header className="mb-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">features</p>
          <h1 className="font-display text-5xl lowercase tracking-tight">a complete tactile kit for thinking out loud.</h1>
          <p className="mt-4 max-w-2xl text-stone-700 leading-relaxed">
            zinegeist isn’t a slide deck or a website builder. it’s a workshop of objects, surfaces,
            and ways of arranging them — built for people who think spatially and annotate everything.
          </p>
        </header>
        <div className="grid md:grid-cols-2 gap-8">
          {GROUPS.map((g) => (
            <section key={g.title} className="rounded-md border border-border bg-card/60 p-6">
              <h2 className="font-display text-2xl lowercase">{g.title}</h2>
              <p className="font-mono text-[11px] lowercase text-muted-foreground mt-1 mb-4">{g.blurb}</p>
              <ul className="space-y-2">
                {g.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 font-mono text-[12px] lowercase text-stone-700">
                    <span className="text-rose-600 mt-[2px]">·</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
