import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "../components/boardr/SiteChrome";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "roadmap — zinegeist" },
      { name: "description", content: "what's shipped, what's in progress, and what's pinned to the wall next." },
      { property: "og:title", content: "roadmap — zinegeist" },
      { property: "og:description", content: "what's shipped, what's in progress, and what's pinned to the wall next." },
    ],
  }),
  component: RoadmapPage,
});

type Status = "shipped" | "in-progress" | "next" | "later";

const MILESTONES: { date: string; status: Status; title: string; bullets: string[] }[] = [
  {
    date: "shipped · q1",
    status: "shipped",
    title: "first board, first pinhole",
    bullets: [
      "corkboard, mat, wall, metal surfaces",
      "sticky notes, polaroids, photostrips, paper, washi, pins",
      "drag · rotate · z-order layering",
      "string connections between pinned anchors",
      "publish to 5-digit /s/key urls",
    ],
  },
  {
    date: "shipped · q2",
    status: "shipped",
    title: "library, sets, and inspection",
    bullets: [
      "library reorganized into sets (sticky notes, polaroid, washi…)",
      "right-click any element to inspect",
      "favorites + recently used sets",
      "edit-mode / preview-mode toggle",
    ],
  },
  {
    date: "in progress",
    status: "in-progress",
    title: "tactile surface kit",
    bullets: [
      "wooden boards (oak, walnut, pine)",
      "paper variants (grid, dotted, lined) — recolorable",
      "textile, tiles, pegboard, blackboard, whiteboard",
      "bring-your-own surface (upload image)",
    ],
  },
  {
    date: "in progress",
    status: "in-progress",
    title: "blocks + structured content",
    bullets: [
      "building blocks: text, images, buttons, icons",
      "bento grids, accordions, tables, chips, tags",
      "input fields & forms (read-only previews first)",
    ],
  },
  {
    date: "next",
    status: "next",
    title: "resizable frames + multi-page boards",
    bullets: [
      "drag the frame edge to resize, canva-style",
      "multiple frames per board (pages & sections)",
      "navigation between frames at publish time",
    ],
  },
  {
    date: "next",
    status: "next",
    title: "decoration, lettering, ephemera",
    bullets: [
      "stamps, doodles, marginalia",
      "pennants, maps, location markers",
      "paperclips, binder clips, fasteners",
      "pressed flowers, ticket stubs, charms",
    ],
  },
  {
    date: "later",
    status: "later",
    title: "co-authoring & live boards",
    bullets: [
      "shareable edit-keys with cursors",
      "comment pins from viewers",
      "version history per frame",
    ],
  },
];

const STATUS_COLOR: Record<Status, string> = {
  shipped: "bg-emerald-600",
  "in-progress": "bg-amber-500",
  next: "bg-rose-600",
  later: "bg-stone-400",
};

function RoadmapPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <header className="mb-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">roadmap</p>
          <h1 className="font-display text-5xl lowercase tracking-tight">pinned to the wall, in order.</h1>
          <p className="mt-4 max-w-xl text-stone-700 leading-relaxed">
            a timeline of what zinegeist has shipped and what’s coming next. dates are loose on purpose —
            this is a craft tool, not a sprint board.
          </p>
        </header>

        <ol className="relative border-l-2 border-dashed border-stone-300 ml-3 space-y-10">
          {MILESTONES.map((m) => (
            <li key={m.title} className="pl-8 relative">
              <span className={`absolute -left-[9px] top-1 size-4 rounded-full ring-4 ring-background ${STATUS_COLOR[m.status]}`} />
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{m.date}</p>
              <h3 className="mt-1 font-display text-2xl lowercase">{m.title}</h3>
              <ul className="mt-3 space-y-1.5">
                {m.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 font-mono text-[12px] lowercase text-stone-700">
                    <span className="text-rose-600 mt-[2px]">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
