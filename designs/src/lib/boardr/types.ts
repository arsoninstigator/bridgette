export type BoardKind = "cork" | "mat" | "wall" | "metal";

export type AssetKind =
  | "sticky"
  | "polaroid"
  | "photostrip"
  | "photo"
  | "paper"
  | "washi"
  | "pin"
  | "shape";

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
  shape?: "rect" | "circle" | "triangle" | "diamond" | "star";
  fill?: string;
}

export interface StringConn {
  id: string;
  from: string; // asset id
  to: string;
  color?: string;
}

export interface PageMeta {
  slug: string;
  name: string;
}

export interface PageContent {
  assets: AssetBase[];
  strings: StringConn[];
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
}