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
      { label: "corkboard flavors", chips: ["drawn", "photo"] },
      { label: "base surfaces", chips: ["cutting mat", "wall", "metallic"] },
      { label: "texture overlays", chips: ["paper", "kraft", "denim", "linen", "burlap", "felt", "leather", "concrete", "brick", "marble", "woodgrain", "grid", "dots"] },
      { label: "build-your-own patterns", chips: ["grid", "stripes", "checker", "dots", "rows", "shades", "thickness", "angle"] },
      { label: "upload any image as the surface" },
      { label: "recolor any surface", chips: ["hex", "overlay strength"] },
    ],
  },
  {
    title: "tactile objects",
    blurb: "every piece flips, pins, drags, and connects.",
    items: [
      { label: "sticky notes", chips: ["six colorways", "flippable"] },
      { label: "polaroids", chips: ["classic", "wide", "mini", "plus-to-upload"] },
      { label: "photo frames", chips: ["classic", "ornate", "double-matte", "oval", "scalloped", "polaroid", "fillable svg slots"] },
      { label: "photostrips", chips: ["four-frame booth", "per-frame upload"] },
      { label: "loose sheets", chips: ["torn notes", "receipts", "index cards"] },
      { label: "washi tape", chips: ["jagged v-edges", "opacity", "draw length"] },
      { label: "attached tape", chips: ["strip across top", "any pinned object"] },
      { label: "pushpins", chips: ["recolorable heads", "thread anchors"] },
      { label: "wooden clips", chips: ["clothespin", "string hang"] },
      { label: "scrollers", chips: ["marquee", "ticker", "pastel", "recolorable"] },
    ],
  },
  {
    title: "strings & hanging mode",
    blurb: "thread, sag, clip, hang — murderboard meets clothesline.",
    items: [
      { label: "textured jute-rope rendering", chips: ["knot anchors", "murderboard"] },
      { label: "sidebar tabs", chips: ["connect", "edit", "hanging"] },
      { label: "right-click any string", chips: ["color", "thickness", "droopiness"] },
      { label: "hanging mode", chips: ["multi-point", "bunting garland", "corner-to-corner"] },
      { label: "hang things up", chips: ["clip polaroids", "to string"] },
      { label: "wooden clip", chips: ["original svg", "transparent"] },
      { label: "sag / gravity controls", chips: ["taut wire", "heavy clothesline"] },
    ],
  },
  {
    title: "kits & configurators",
    blurb: "opinionated presets — the good parts of a psd, none of the layer hell.",
    items: [
      { label: "kits tab", chips: ["case file", "redacted", "archivalcore", "vintage ephemera", "paperwork", "signage", "visual diary", "forensic evidence", "analog studio", "junk drawer", "confetti", "blobs", "trinkets", "zine", "charms"] },
      { label: "metal wall grid", chips: ["wire panels", "s-hooks", "bulldog clips"] },
      { label: "accessories configurator", chips: ["enamel pins", "die-cut stickers", "iron-on patches", "appliqués", "button pins"] },
      { label: "socialcore configurator", chips: ["punch cards", "tear-away flyers", "tickets", "boarding passes"] },
    ],
  },
  {
    title: "pages & sections",
    blurb: "rooms and the walls inside them.",
    items: [
      { label: "pages = routes", chips: ["/pagename", "under /s/key"] },
      { label: "sections = anchors", chips: ["#section-name", "same page"] },
      { label: "continuous canvas", chips: ["shared background", "no breaks"] },
      { label: "navigation", chips: ["page tabs", "section jumps"] },
      { label: "manage pages & sections", chips: ["add", "rename", "delete", "meta panel"] },
      { label: "viewer behavior", chips: ["hash links", "scroll-to-anchor"] },
    ],
  },
  {
    title: "interactions",
    blurb: "more than static. boards that respond.",
    items: [
      { label: "transform", chips: ["drag", "rotate", "z-order"] },
      { label: "flip cards", chips: ["back notes", "preview + publish"] },
      { label: "plus-to-upload", chips: ["photos", "polaroids", "frames"] },
      { label: "string interactions", chips: ["pin-to-pin", "clip hang"] },
      { label: "right-click context menu", chips: ["edit", "tape", "pin", "clip", "layer", "lock", "group"] },
      { label: "in-screen popups", chips: ["palettes", "fonts", "tags", "no prompts"] },
      { label: "color control", chips: ["custom hex", "palette", "any element"] },
      { label: "library helpers", chips: ["favorites", "recents"] },
      { label: "resizable canvas frame", chips: ["canva-style", "grows per page"] },
      { label: "publish", chips: ["5-digit /s/key", "public"] },
      { label: "private edits", chips: ["edit-key access"] },
    ],
  },
];

const CHIP_TONES = [
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-sky-100 text-sky-800 border-sky-200",
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
];

function FeatureChip({ children, tone }: { children: string; tone: number }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px] lowercase shadow-sm ${CHIP_TONES[tone % CHIP_TONES.length]}`}>
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
              <ul className="space-y-2">
                {g.items.map((it) => (
                  <li key={it.label} className="grid grid-cols-[140px_1fr] gap-4 items-start">
                    <span className="font-mono text-[12px] lowercase text-stone-900 font-medium leading-5 pt-1.5">
                      {it.label}
                    </span>
                    {it.chips && it.chips.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {it.chips.map((chip, idx) => (
                          <FeatureChip key={chip} tone={idx}>{chip}</FeatureChip>
                        ))}
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] lowercase text-muted-foreground pt-1.5">—</span>
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
