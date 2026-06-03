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
      "corkboard (classic + bordered)",
      "wooden boards (oak, walnut, pine)",
      "cutting mat (gridded studio)",
      "paper (grid, dotted, plain, lined, recolorable)",
      "wall + wallpaper",
      "textile + fabric weaves",
      "ceramic tiles",
      "pinboard / pegboard / ikea-style",
      "blackboard + whiteboard",
      "metallic + magnetic boards",
      "texture overlays (paper, denim, leather, concrete, brick — soon)",
      "custom cursors + custom favicons per board (soon)",
      "bring your own (upload image)",
    ],
  },
  {
    title: "tactile objects",
    blurb: "every piece flips, pins, drags, and connects.",
    items: [
      "sticky notes — six colorways, flip for hidden notes",
      "polaroids — classic / wide / mini, captions, back-of-photo notes",
      "polaroids accept uploaded images or pasted image links",
      "photostrips — four-frame booth strips",
      "loose sheets — torn notes, receipts, index cards",
      "washi tape — anchor & label, draggable across the board",
      "pushpins — recolorable svg heads, anchor threads conspiracy-board style",
      "strings attach pin-to-pin and wrap visually beneath the pin head",
      "marquee strips, news tickers, pastel scrollers — fully recolorable",
      "stamps, doodles, marginalia (soon)",
    ],
  },
  {
    title: "blocks",
    blurb: "structured building pieces for layouts and longform.",
    items: [
      "text, headings, longform passages",
      "images & galleries",
      "buttons & button lists",
      "icon & icon grid — upload SVG or import from URL",
      "shapes with an icons subset (basic, callouts, arrows & lines)",
      "tables, chips, tags",
      "bento card grids",
      "accordions, input fields",
      "motion graphics — marquee strips, scrollers, tickers",
    ],
  },
  {
    title: "interactions",
    blurb: "more than static. boards that respond.",
    items: [
      "drag, rotate, layer with z-order",
      "flip cards to reveal back notes — works in preview & published view",
      "string-connect pinned anchors",
      "right-click any element for the full context menu (edit component, tape, pin, layer, lock, group)",
      "in-screen popups for palettes, fonts, tags — no browser prompts",
      "custom hex / palette colors anywhere a color is editable",
      "favorites + recents per set",
      "multi-frame boards (pages & sections)",
      "resizable canvas frame (canva-style)",
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
