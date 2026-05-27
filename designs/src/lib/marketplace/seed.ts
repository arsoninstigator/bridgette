export interface SeedPack {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  pack_type: "assets" | "template" | "list";
  item_count: number;
  curator: string;
  swatch: string[]; // hex colors representing the pack
}

export const SEED_PACKS: SeedPack[] = [
  {
    id: "seed-detective",
    name: "detective wall starter",
    description: "polaroids, red string, pushpins, and torn notepaper for your investigation board.",
    category: "investigation",
    tags: ["red-string", "polaroids", "pins", "noir", "true-crime"],
    pack_type: "assets",
    item_count: 24,
    curator: "zinegeist",
    swatch: ["#b91c1c", "#fbf7ec", "#1a1a1a", "#c9a84c"],
  },
  {
    id: "seed-90s-zine",
    name: "90s zine cuts",
    description: "ransom-note type, photocopy halftones, washi tape, and grunge collage bits.",
    category: "zine",
    tags: ["grunge", "collage", "halftone", "ransom", "diy"],
    pack_type: "assets",
    item_count: 41,
    curator: "zinegeist",
    swatch: ["#0d0d0d", "#f5f3ee", "#e85d3a", "#fde047"],
  },
  {
    id: "seed-academia",
    name: "dark academia archive",
    description: "leather journal scraps, brass pins, sepia photos, library card stock.",
    category: "archive",
    tags: ["sepia", "leather", "ephemera", "library", "academia"],
    pack_type: "assets",
    item_count: 33,
    curator: "zinegeist",
    swatch: ["#3b2a1a", "#6b4f2a", "#c9a84c", "#e8d9b8"],
  },
  {
    id: "seed-cozy-cottage",
    name: "cottagecore mood",
    description: "pressed flowers, kraft paper, gingham washi, polaroid frames in warm tones.",
    category: "mood",
    tags: ["floral", "kraft", "warm", "polaroid", "cottage"],
    pack_type: "assets",
    item_count: 28,
    curator: "zinegeist",
    swatch: ["#dce5d4", "#e8c5d0", "#c9a574", "#f5f0e8"],
  },
  {
    id: "seed-conspiracy",
    name: "conspiracy corkboard",
    description: "marker scribbles, sticky notes, evidence tape, red yarn loops.",
    category: "investigation",
    tags: ["red-string", "sticky", "marker", "evidence"],
    pack_type: "template",
    item_count: 1,
    curator: "zinegeist",
    swatch: ["#7a3a2a", "#e7c79a", "#b91c1c", "#1a1a1a"],
  },
  {
    id: "seed-tour-diary",
    name: "tour diary template",
    description: "a pre-built page layout for documenting a trip — multi-page, dated frames.",
    category: "template",
    tags: ["travel", "diary", "polaroid", "multi-page"],
    pack_type: "template",
    item_count: 1,
    curator: "zinegeist",
    swatch: ["#0c2340", "#5cbdb9", "#e8c07a", "#f5f0e8"],
  },
  {
    id: "seed-fanwiki",
    name: "fan wiki relations",
    description: "character cards, ship lines, faction badges, lore notes — for fandom worldbuilding.",
    category: "worldbuilding",
    tags: ["fandom", "characters", "relationships", "lore"],
    pack_type: "assets",
    item_count: 36,
    curator: "zinegeist",
    swatch: ["#4f46e5", "#e85d3a", "#fde047", "#0d0d0d"],
  },
  {
    id: "seed-reading-list",
    name: "books i devoured this year",
    description: "a curator's list — annotated book covers and quote cards.",
    category: "list",
    tags: ["books", "reading", "quotes", "annotated"],
    pack_type: "list",
    item_count: 12,
    curator: "zinegeist",
    swatch: ["#5c2018", "#d4842a", "#e8b84a", "#f5f3ee"],
  },
  {
    id: "seed-motion-graphics",
    name: "motion graphics kit",
    description: "marquees, news tickers, looping gifs, kinetic type, blinking neon signage, scrolling banners, and animated stickers to bring your board to life.",
    category: "motion",
    tags: ["animation", "marquee", "ticker", "kinetic-type", "loop", "gif", "blinking", "neon", "scroll", "lottie"],
    pack_type: "assets",
    item_count: 32,
    curator: "zinegeist",
    swatch: ["#ff3366", "#fde047", "#0d0d0d", "#22d3ee"],
  },
  {
    id: "seed-anchoring",
    name: "anchoring & fasteners",
    description: "pinboards, magnets, bulldog clips, paperclips, brass fasteners, binder clips, thumbtacks, and brads — every way to hold a thing down.",
    category: "anchoring",
    tags: ["pinboard", "magnet", "clip", "paperclip", "bulldog", "binder-clip", "thumbtack", "brad", "fastener", "brass"],
    pack_type: "assets",
    item_count: 28,
    curator: "zinegeist",
    swatch: ["#8b7355", "#c9a84c", "#1a1a1a", "#b91c1c"],
  },
  {
    id: "seed-csi",
    name: "crime scene / csi kit",
    description: "sister pack to the detective wall — unlimited tear-and-stretch crime scene tape, evidence markers and numbered tents, mugshot frames, fingerprint cards, chalk outlines, and newspaper clipping themes.",
    category: "investigation",
    tags: ["crime-scene-tape", "evidence", "numbers", "mugshot", "newspaper", "fingerprint", "chalk-outline", "forensics", "csi", "noir"],
    pack_type: "assets",
    item_count: 38,
    curator: "zinegeist",
    swatch: ["#fde047", "#0d0d0d", "#b91c1c", "#f5f3ee"],
  },
];

export const SEED_CATEGORIES = ["all", "investigation", "anchoring", "zine", "archive", "mood", "motion", "template", "worldbuilding", "list"] as const;
export const SEED_TYPES = ["all", "assets", "template", "list"] as const;

