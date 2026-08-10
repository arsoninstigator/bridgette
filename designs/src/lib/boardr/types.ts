export type BoardKind = "cork" | "mat" | "wall" | "metal";

export type AssetKind =
  | "sticky"
  | "polaroid"
  | "photostrip"
  | "photo"
  | "paper"
  | "washi"
  | "pin"
  | "shape"
  | "icon"
  | "marquee"
  | "frame"
  | "block";

export interface AssetBase {
  id: string;
  kind: AssetKind;
  x: number;
  y: number;
  rotation: number;
  z: number;
  // Mechanics
  flipEnabled?: boolean;
  pinEnabled?: boolean; // shows a pushpin on top + becomes a string anchor
  tapeAttached?: boolean; // shows a washi tape strip across the top
  tapeAttachColor?: string; // color of attached tape
  pinColor?: string; // color of pushpin head (when pinEnabled)
  clipAttached?: boolean; // wooden clothespin clip on top (for hanging on strings)
  clipColor?: string; // wood tint of the clothespin
  locked?: boolean; // when true, cannot be dragged or resized
  groupId?: string; // assets sharing groupId move together
  // Content (per kind, loose)
  front?: string;
  back?: string;
  color?: string;
  imageUrl?: string;
  imageUrl2?: string;
  imageUrl3?: string;
  imageUrl4?: string;
  caption?: string;
  width?: number;
  height?: number;
  tapeColor?: string;
  tapeJagged?: boolean; // jagged V-shape edges on washi tape
  tapePattern?: string; // repeating text overlay (e.g. CRIME SCENE DO NOT CROSS)
  tapeTextColor?: string; // color for tapePattern text
  opacity?: number; // 0..1, applied per-asset (e.g. tape translucency)
  // data & ui blocks
  blockType?:
    | "table"
    | "chips"
    | "tags"
    | "accordion"
    | "tabs"
    | "text"
    | "heading"
    | "image"
    | "button"
    | "buttonList"
    | "iconGrid"
    | "input"
    | "layout";
  blockData?: string; // JSON payload for the block
  blockStyle?: {
    padding?: number;
    radius?: number;
    bg?: string;
    fg?: string;
    borderStyle?: "none" | "solid" | "dashed" | "dotted";
    borderColor?: string;
    borderWidth?: number;
    shadow?: boolean;
    // table extras
    tableDensity?: "compact" | "cozy" | "roomy";
    tableDividers?: "solid" | "dashed" | "none";
    tableHeaderUnderline?: boolean;
    tableGrid?: "all" | "horizontal" | "vertical" | "outer" | "none";
    tableLineColor?: string;
    tableLineWidth?: number;
    tableZebra?: boolean;
    tableZebraColor?: string;
    tableHeaderBg?: string;
    tableShowHeader?: boolean;
    tableFirstColBold?: boolean;
  };
  frameStyle?: "classic" | "ornate" | "polaroid" | "oval" | "scalloped" | "double"; // for kind: frame
  shape?: "rect" | "square" | "circle" | "oval" | "triangle" | "diamond" | "star" | "polygon";
  sides?: number; // for shape: polygon (3+)
  fill?: string;
  // icon / marquee
  iconText?: string; // marquee scrolling text
  iconSpeed?: number; // marquee speed (s per loop)
  iconBg?: string; // marquee background
  iconFg?: string; // marquee text color
  // Optional motion (framer-motion) for assets
  animation?: "none" | "fade" | "float" | "pulse" | "wiggle" | "pop";
  animationDuration?: number; // seconds
}

export interface StringConn {
  id: string;
  // pin-to-pin mode: both ids present
  from?: string; // asset id
  to?: string;
  // free-hanging bunting mode: an ordered list of anchor points on the canvas
  points?: { x: number; y: number }[];
  color?: string;
  hanging?: boolean; // sags as a clothesline (heavier droop, thicker)
  thickness?: number; // px stroke width override (1..10)
  sag?: number; // 0..1 sag factor (fraction of segment length). default 0.18 hanging, 0.04 taut
  hungIds?: string[]; // asset ids clipped to this string
  bunting?: BuntingConfig; // garland flags strung along the path
}

export type BuntingShape =
  | "triangle"
  | "swallowtail"
  | "rect"
  | "scallop"
  | "pennant";

export type BuntingPattern = "none" | "dots" | "stripes" | "chevron" | "waves";

export interface BuntingFlagOverride {
  color?: string;
  pattern?: BuntingPattern;
}

export interface BuntingConfig {
  shape: BuntingShape;
  count: number; // number of flags along the whole path
  size: number; // flag height in px
  width?: number; // flag width in px
  spacing?: number; // 0..1 extra gap factor between flags
  colors?: string[]; // repeating palette
  pattern?: BuntingPattern; // default pattern for all flags
  outline?: string; // stroke color
  flags?: Record<number, BuntingFlagOverride>; // per-flag overrides by index
}

export interface PageMeta {
  slug: string;
  name: string;
}

export interface SectionMark {
  slug: string; // becomes #slug on the published page
  name: string;
  y: number; // vertical position on the page canvas
}

export interface PageContent {
  assets: AssetBase[];
  strings: StringConn[];
  sections?: SectionMark[];
  height?: number; // per-page canvas height (extends as sections are added)
}

export interface SurfacePattern {
  type: "grid" | "stripes" | "checker" | "dots" | "bands";
  size: number; // px
  color1: string;
  color2: string; // background color
  thickness?: number; // px for grid/stripes
  angle?: number; // deg for stripes
  // ----- "bands" multi-color stripe options -----
  colors?: string[]; // ordered alternating colors (2..8)
  stripeWidth?: number; // px width of each colored stripe
  gap?: number; // px spacing between stripes (uses color2 as gap color)
  direction?: "horizontal" | "vertical" | "diagonal" | "diagonal-reverse";
  repeat?: number; // how many times the colors sequence repeats before looping (>=1)
}

export interface SurfaceOverlay {
  textureId?: string; // matches a .bg-texture-* css class
  baseColor?: string; // hex / rgba — fills under the texture
  imageUrl?: string; // uploaded / pasted image used as the surface
  opacity?: number; // 0..1 — strength of the texture overlay
  pattern?: SurfacePattern; // user-defined grid/stripe/checker overlay
}

export interface Board {
  id: string;
  name: string;
  kind: BoardKind;
  assets: AssetBase[]; // active page assets
  strings: StringConn[]; // active page strings
  pages?: PageMeta[]; // list including index; default [{slug:'index', name:'frame one (index)'}]
  pageAssets?: Record<string, PageContent>; // content for non-active pages
  activeSlug?: string; // currently edited page slug
  editKey: string; // plaintext key shown to user
  editKeyHash: string; // sha256 of key — index lookup
  publishedKey?: string; // 5-digit
  updatedAt: number;
  createdAt: number;
  surface?: SurfaceOverlay;
}

export interface PublishedSnapshot {
  boardId: string;
  kind: BoardKind;
  name: string;
  assets: AssetBase[];
  strings: StringConn[];
  pages?: PageMeta[];
  pageAssets?: Record<string, PageContent>;
  publishedAt: number;
  surface?: SurfaceOverlay;
}