import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "../components/boardr/SiteChrome";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "features — zinegeist" },
      { name: "description", content: "every tactile object, surface, and interaction zinegeist offers for spatial publishing." },
      { property: "og:title", content: "features — zinegeist" },
      { property: "og:description", content: "every tactile object, surface, and interaction zinegeist offers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeaturesPage,
});

type FeatureItem = {
  label: string;
  chips?: string[];
};

const GROUPS: { title: string; blurb: string; items: FeatureItem[] }[] = [
  {
    title: "surfaces",
    blurb: "the substrate is part of the meaning.",
    items: [
      { label: "corkboard flavors", chips: ["drawn corkboard", "photo corkboard"] },
      { label: "base surfaces", chips: ["cutting mat", "wall", "metallic"] },
      { label: "texture overlays", chips: ["paper", "kraft", "denim", "linen", "burlap", "felt", "leather", "concrete", "brick", "marble", "woodgrain", "grid", "dots"] },
      { label: "build-your-own patterns", chips: ["grid", "stripes", "checker", "dots", "row count", "shade colors", "thickness", "angle"] },
      { label: "upload any image as the surface" },
      { label: "recolor any surface", chips: ["hex base color", "overlay strength"] },
    ],
  },
  {
    title: "tactile objects",
    blurb: "every piece flips, pins, drags, and connects.",
    items: [
      { label: "sticky notes", chips: ["six colorways", "flip for hidden notes"] },
      { label: "polaroids", chips: ["classic", "wide", "mini", "plus-to-upload photo"] },
      { label: "photo frames", chips: ["classic", "ornate", "double-matte", "oval", "scalloped", "polaroid", "plus-to-fill empty svg slots"] },
      { label: "photostrips", chips: ["four-frame booth strips", "plus-to-upload on every frame"] },
      { label: "loose sheets", chips: ["torn notes", "receipts", "index cards"] },
      { label: "washi tape", chips: ["jagged v-edges", "adjustable opacity", "draw-on-canvas length"] },
      { label: "attached tape", chips: ["washi strip across top of any pinned object"] },
      { label: "pushpins", chips: ["recolorable svg heads", "anchor threads conspiracy-board style"] },
      { label: "wooden clips", chips: ["clothespin clips", "hang assets from strings"] },
      { label: "scrollers", chips: ["marquee strips", "news tickers", "pastel scrollers", "fully recolorable"] },
    ],
  },
  {
    title: "strings & hanging mode",
    blurb: "thread, sag, clip, hang — murderboard meets clothesline.",
    items: [
      { label: "textured jute-rope rendering", chips: ["knot anchors", "murderboard style"] },
      { label: "sidebar tabs", chips: ["connect (pin-to-pin)", "edit (defaults)", "hanging (free bunting)"] },
      { label: "right-click any string", chips: ["change color", "thickness slider", "droopiness slider"] },
      { label: "hanging mode", chips: ["multi-point bunting garland", "corner-to-corner"] },
      { label: "hang things up", chips: ["clip polaroids to a hanging string"] },
      { label: "wooden clip", chips: ["exact original svg", "transparent on any surface"] },
      { label: "sag / gravity controls", chips: ["taut wire", "heavy clothesline"] },
    ],
  },
  {
    title: "kits & configurators",
    blurb: "opinionated presets — the good parts of a psd, none of the layer hell.",
    items: [
      { label: "kits tab", chips: ["case file", "redacted", "archivalcore", "vintage ephemera", "paperwork", "signage", "visual diary", "forensic evidence", "analog studio", "junk drawer", "confetti", "blobs", "trinkets", "zine", "charms"] },
      { label: "metal wall grid", chips: ["industrial wire panels", "s-hooks", "mini bulldog clips"] },
      { label: "accessories configurator", chips: ["enamel pins", "die-cut stickers", "iron-on patches", "appliqués", "button pins"] },
      { label: "socialcore configurator", chips: ["punch cards", "tear-away flyers", "tickets", "boarding passes"] },
    ],
  },
  {
    title: "pages & sections",
    blurb: "rooms and the walls inside them.",
    items: [
      { label: "pages = routes", chips: ["each publishes as /pagename under your /s/key"] },
      { label: "sections = anchors", chips: ["each publishes as #section-name on its page"] },
      { label: "continuous canvas", chips: ["same background", "no breaks"] },
      { label: "navigation", chips: ["top tab bar for pages", "jump-link bar for sections"] },
      { label: "manage pages & sections", chips: ["add", "rename", "delete", "meta panel"] },
      { label: "viewer behavior", chips: ["follows hash links", "scrolls to anchors on load"] },
    ],
  },
  {
    title: "interactions",
    blurb: "more than static. boards that respond.",
    items: [
      { label: "transform", chips: ["drag", "rotate", "layer with z-order"] },
      { label: "flip cards", chips: ["reveal back notes", "works in preview & published view"] },
      { label: "plus-to-upload", chips: ["empty photos", "polaroids", "frames"] },
      { label: "string interactions", chips: ["pin-to-pin connect", "hang clipped assets"] },
      { label: "right-click context menu", chips: ["edit", "tape", "pin", "clip", "layer", "lock", "group"] },
      { label: "in-screen popups", chips: ["palettes", "fonts", "tags", "no browser prompts"] },
      { label: "color control", chips: ["custom hex", "palette colors", "any editable color"] },
      { label: "library helpers", chips: ["favorites", "recents per library set"] },
      { label: "resizable canvas frame", chips: ["canva-style", "per-page height grows with sections"] },
      { label: "publish", chips: ["5-digit /s/key url", "publicly viewable"] },
      { label: "private edits", chips: ["edit-key access"] },
    ],
  },
];

function FeatureChip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[11px] lowercase text-stone-700 shadow-sm">
      {children}
    </span>
  );
}

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
              <ul className="space-y-3">
                {g.items.map((it) => (
                  <li key={it.label} className="flex flex-col gap-2">
                    <div className="flex items-start gap-2 font-mono text-[12px] lowercase text-stone-900">
                      <span className="text-rose-600 mt-[2px]">·</span>
                      <span className="font-medium">{it.label}</span>
                    </div>
                    {it.chips && it.chips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-3.5">
                        {it.chips.map((chip) => (
                          <FeatureChip key={chip}>{chip}</FeatureChip>
                        ))}
                      </div>
                    )}
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
