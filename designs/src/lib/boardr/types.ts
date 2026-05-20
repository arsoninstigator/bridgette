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

export interface Board {
  id: string;
  name: string;
  kind: BoardKind;
  assets: AssetBase[];
  strings: StringConn[];
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
  publishedAt: number;
}