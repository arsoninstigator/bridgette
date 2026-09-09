import { readPsd } from "ag-psd";

export type LayerKind = "text" | "image" | "shape" | "group" | "frame" | "component" | "instance" | "other";
export type EditablePolicy = "locked" | "partial" | "customizable";
export type EditableFlags = {
  text?: boolean; image?: boolean; fill?: boolean; stroke?: boolean;
  borderWidth?: boolean; opacity?: boolean; position?: boolean; size?: boolean;
};
export type LayerNode = {
  id: string; name: string; kind: LayerKind; path: string; depth: number;
  visible: boolean; hasEffects?: boolean; effects?: string[];
  policy: EditablePolicy; editable: EditableFlags;
  meta?: {
    text?: string; fills?: string[]; opacity?: number; blendMode?: string;
    width?: number; height?: number; x?: number; y?: number;
  };
  childrenIds: string[];
};
type Source =
  | { type: "figma"; fileKey: string; nodeId?: string; raw: unknown }
  | { type: "psd"; fileName: string; raw: unknown }
  | { type: "ai"; fileName: string; raw: unknown }
  | { type: "eps"; fileName: string; raw: unknown };
export type SourceKind = "figma" | "psd" | "ai" | "eps";
export type ConfigPack = {
  id: string; name: string; createdAt: number;
  source: Source; layers: LayerNode[]; rootIds: string[];
  previewPngDataUrl?: string;
};

export const LS_KEY = "boardr.figmaConfigs";
export const LS_TOKEN = "boardr.figmaToken";
export const FIGMA_CLIENT_ID = (import.meta as any).env?.VITE_FIGMA_CLIENT_ID as string | undefined;

export function readConfigs(): ConfigPack[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
export function writeConfigs(v: ConfigPack[]) { localStorage.setItem(LS_KEY, JSON.stringify(v)); }

/* ---------- figma api ---------- */
export function parseFigmaUrl(url: string) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/(?:file|design|proto)\/([A-Za-z0-9]+)/);
    if (!m) return null;
    const nodeParam = u.searchParams.get("node-id");
    return { fileKey: m[1], nodeId: nodeParam ? nodeParam.replace(/-/g, ":") : undefined };
  } catch { return null; }
}
function figmaKind(t?: string): LayerKind {
  switch (t) {
    case "TEXT": return "text";
    case "GROUP": return "group";
    case "FRAME": return "frame";
    case "COMPONENT": case "COMPONENT_SET": return "component";
    case "INSTANCE": return "instance";
    case "RECTANGLE": case "ELLIPSE": case "VECTOR": case "LINE":
    case "STAR": case "POLYGON": case "BOOLEAN_OPERATION": return "shape";
    default: return "other";
  }
}
export function rgbaToHex(c: { r: number; g: number; b: number }) {
  const to = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${to(c.r)}${to(c.g)}${to(c.b)}`;
}
function walkFigmaNode(node: any, parentPath: string, depth: number, out: LayerNode[]): string {
  const id = node.id as string;
  const name = (node.name as string) || node.type;
  const path = parentPath ? `${parentPath}/${name}` : name;
  const kind = figmaKind(node.type);
  const fills = Array.isArray(node.fills)
    ? node.fills.filter((f: any) => f.type === "SOLID" && f.color).map((f: any) => rgbaToHex(f.color))
    : [];
  const effects: string[] = Array.isArray(node.effects)
    ? node.effects.map((e: any) => `${e.type}${e.radius ? `(${e.radius})` : ""}`) : [];
  const hasImageFill = Array.isArray(node.fills) && node.fills.some((f: any) => f.type === "IMAGE");
  const layer: LayerNode = {
    id, name, kind: hasImageFill ? "image" : kind, path, depth,
    visible: node.visible !== false, hasEffects: effects.length > 0, effects,
    policy: "locked", editable: {},
    meta: {
      text: node.characters, fills, opacity: node.opacity, blendMode: node.blendMode,
      width: node.absoluteBoundingBox?.width, height: node.absoluteBoundingBox?.height,
      x: node.absoluteBoundingBox?.x, y: node.absoluteBoundingBox?.y,
    },
    childrenIds: [],
  };
  out.push(layer);
  if (Array.isArray(node.children)) for (const c of node.children) layer.childrenIds.push(walkFigmaNode(c, path, depth + 1, out));
  return id;
}
export async function fetchFigmaFrame(url: string, token: string, tokenKind: "pat" | "bearer" = "pat") {
  const parsed = parseFigmaUrl(url);
  if (!parsed) throw new Error("couldn't parse figma url. paste the frame url from figma.");
  const { fileKey, nodeId } = parsed;
  const headers: Record<string, string> = tokenKind === "bearer"
    ? { Authorization: `Bearer ${token}` }
    : { "X-Figma-Token": token };
  let rootNode: any;
  if (nodeId) {
    const r = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`, { headers });
    if (!r.ok) throw new Error(`figma api ${r.status}: ${await r.text()}`);
    const j = await r.json();
    const entry = j.nodes?.[nodeId];
    if (!entry?.document) throw new Error("node not found. ensure the frame is selected in the url.");
    rootNode = entry.document;
  } else {
    const r = await fetch(`https://api.figma.com/v1/files/${fileKey}`, { headers });
    if (!r.ok) throw new Error(`figma api ${r.status}: ${await r.text()}`);
    rootNode = (await r.json()).document;
  }
  const layers: LayerNode[] = [];
  const rootId = walkFigmaNode(rootNode, "", 0, layers);
  let preview: string | undefined;
  try {
    const r = await fetch(`https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(rootNode.id)}&format=png&scale=2`, { headers });
    if (r.ok) preview = (await r.json()).images?.[rootNode.id];
  } catch {}
  return { layers, rootIds: [rootId], source: { type: "figma", fileKey, nodeId, raw: rootNode } as Source, preview };
}

/* ---------- psd ---------- */
function psdKind(l: any): LayerKind {
  if (l.text) return "text";
  if (l.children && l.children.length) return "group";
  if (l.canvas || l.imageData) return "image";
  return "shape";
}
function walkPsdLayer(l: any, parentPath: string, depth: number, out: LayerNode[], idx: { n: number }): string {
  const id = `psd-${idx.n++}`;
  const name = l.name || "layer";
  const path = parentPath ? `${parentPath}/${name}` : name;
  const kind = psdKind(l);
  const effects: string[] = [];
  if (l.effects) for (const [k, v] of Object.entries(l.effects)) if (v && (Array.isArray(v) ? v.length : true)) effects.push(k);
  const layer: LayerNode = {
    id, name, kind, path, depth, visible: !l.hidden,
    hasEffects: effects.length > 0, effects, policy: "locked", editable: {},
    meta: {
      text: l.text?.text,
      opacity: typeof l.opacity === "number" ? l.opacity / 255 : undefined,
      blendMode: l.blendMode,
      width: (l.right ?? 0) - (l.left ?? 0), height: (l.bottom ?? 0) - (l.top ?? 0),
      x: l.left, y: l.top,
    },
    childrenIds: [],
  };
  out.push(layer);
  if (Array.isArray(l.children)) for (const c of l.children) layer.childrenIds.push(walkPsdLayer(c, path, depth + 1, out, idx));
  return id;
}
export async function parsePsdFile(file: File) {
  const buf = await file.arrayBuffer();
  const psd = readPsd(buf, { skipCompositeImageData: false, skipThumbnail: true });
  const layers: LayerNode[] = []; const rootIds: string[] = []; const idx = { n: 0 };
  for (const c of psd.children || []) rootIds.push(walkPsdLayer(c, "", 0, layers, idx));
  let preview: string | undefined;
  try { if (psd.canvas) preview = (psd.canvas as HTMLCanvasElement).toDataURL("image/png"); } catch {}
  return { layers, rootIds, source: { type: "psd", fileName: file.name, raw: null } as Source, preview };
}

/* ---------- ai / eps (best-effort layer name extraction) ---------- */
export async function parseAiOrEps(file: File, kind: "ai" | "eps") {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const slice = bytes.slice(0, Math.min(bytes.length, 3_000_000));
  const text = new TextDecoder("latin1").decode(slice);
  const found: string[] = [];
  const push = (n: string) => { const t = n.trim(); if (t && !found.includes(t)) found.push(t); };
  const patterns = [
    /%%LayerNames?:\s*([^\r\n]+)/gi,
    /%_?%(?:AI\d+_BeginLayer|Layer)[^\n:]*:\s*([^\r\n]+)/gi,
    /%%Title:\s*([^\r\n]+)/gi,
    /\/Title\s*\(([^)]{1,120})\)/g,
    /\/T\s*\(([^)]{1,120})\)/g,
  ];
  for (const re of patterns) { let m; while ((m = re.exec(text))) push(m[1].replace(/[()]/g, "")); }
  if (found.length === 0) push(file.name);
  const layers: LayerNode[] = []; const rootIds: string[] = [];
  found.forEach((name, i) => {
    const id = `${kind}-${i}`;
    layers.push({
      id, name, kind: "other", path: name, depth: 0, visible: true,
      hasEffects: false, effects: [], policy: "locked", editable: {},
      meta: {}, childrenIds: [],
    });
    rootIds.push(id);
  });
  return { layers, rootIds, source: { type: kind, fileName: file.name, raw: null } as Source, preview: undefined as string | undefined };
}

