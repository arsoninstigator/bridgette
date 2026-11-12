import { writePsd } from "ag-psd";
import type { LayerNode } from "./parse";
import { writeSketch } from "./sketch";

export type FormatId = "figma" | "psd" | "ai" | "eps" | "svg" | "png" | "json" | "sketch" | "tiff";

export const FORMATS: { id: FormatId; label: string; ext: string; asSource: boolean; asTarget: boolean; note: string }[] = [
  { id: "figma", label: "figma", ext: "svg", asSource: true, asTarget: true, note: "imported through the figma api; written back out as a layered svg you can drag straight into figma." },
  { id: "psd", label: "photoshop (.psd)", ext: "psd", asSource: true, asTarget: true, note: "real layered psd — one raster layer per parsed layer, names and order preserved." },
  { id: "ai", label: "illustrator (.ai)", ext: "svg", asSource: true, asTarget: true, note: "written as illustrator-readable svg (open, then save as .ai)." },
  { id: "eps", label: "eps", ext: "eps", asSource: true, asTarget: true, note: "vector eps with boxes and text placement; effects are approximated." },
  { id: "svg", label: "svg", ext: "svg", asSource: false, asTarget: true, note: "layered svg with groups per layer." },
  { id: "png", label: "png", ext: "png", asSource: false, asTarget: true, note: "flattened raster preview." },
  { id: "json", label: "layer pack (.json)", ext: "json", asSource: false, asTarget: true, note: "the full parsed layer tree with effects, blend modes and geometry." },
  { id: "sketch", label: "sketch (.sketch)", ext: "sketch", asSource: false, asTarget: true, note: "experimental native Sketch archive with a separate raster image per visible drawable layer. Names and placement preserved; text is rasterized and effects are approximated. Desktop compatibility not yet checked." },
  { id: "tiff", label: "tiff (.tiff)", ext: "tiff", asSource: false, asTarget: true, note: "flattened, uncompressed 8-bit RGBA TIFF of the reconstructed artwork; not a layered design file." },
];

export type Doc = {
  name: string;
  layers: LayerNode[];
  rootIds: string[];
  width: number;
  height: number;
  originX: number;
  originY: number;
};

export function measure(layers: LayerNode[]): Pick<Doc, "width" | "height" | "originX" | "originY"> {
  const boxes = layers
    .map((l) => l.meta)
    .filter((m) => m && typeof m.width === "number" && typeof m.height === "number") as NonNullable<LayerNode["meta"]>[];
  if (!boxes.length) return { width: 1200, height: 800, originX: 0, originY: 0 };
  const x0 = Math.min(...boxes.map((b) => b.x ?? 0));
  const y0 = Math.min(...boxes.map((b) => b.y ?? 0));
  const x1 = Math.max(...boxes.map((b) => (b.x ?? 0) + (b.width ?? 0)));
  const y1 = Math.max(...boxes.map((b) => (b.y ?? 0) + (b.height ?? 0)));
  return {
    width: Math.max(1, Math.round(x1 - x0)) || 1200,
    height: Math.max(1, Math.round(y1 - y0)) || 800,
    originX: x0,
    originY: y0,
  };
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function box(doc: Doc, l: LayerNode) {
  const m = l.meta || {};
  return {
    x: Math.round((m.x ?? 0) - doc.originX),
    y: Math.round((m.y ?? 0) - doc.originY),
    w: Math.round(m.width ?? 0),
    h: Math.round(m.height ?? 0),
    fill: m.fills?.[0] || "#d9d2bd",
    opacity: typeof m.opacity === "number" ? m.opacity : 1,
    text: m.text,
  };
}

const drawable = (doc: Doc, l: LayerNode) => {
  const b = box(doc, l);
  return l.visible && b.w > 0 && b.h > 0 ? b : null;
};

export function toSvg(doc: Doc): string {
  const parts = doc.layers
    .map((l) => {
      const b = drawable(doc, l);
      if (!b) return null;
      const inner =
        b.text != null
          ? `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="none"/><text x="${b.x}" y="${b.y + Math.min(b.h, 16)}" font-family="sans-serif" font-size="${Math.max(10, Math.min(b.h, 24))}" fill="${b.fill}">${esc(b.text)}</text>`
          : `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${b.fill}"/>`;
      return `  <g id="${esc(l.id)}" data-name="${esc(l.name)}" opacity="${b.opacity}">${inner}</g>`;
    })
    .filter(Boolean);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${doc.width}" height="${doc.height}" viewBox="0 0 ${doc.width} ${doc.height}">
  <title>${esc(doc.name)}</title>
${parts.join("\n")}
</svg>`;
}

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

export function toEps(doc: Doc): string {
  const lines: string[] = [
    "%!PS-Adobe-3.0 EPSF-3.0",
    `%%Creator: porter crossvert`,
    `%%Title: ${doc.name}`,
    `%%BoundingBox: 0 0 ${doc.width} ${doc.height}`,
    "%%EndComments",
    "/Helvetica findfont 14 scalefont setfont",
  ];
  for (const l of doc.layers) {
    const b = drawable(doc, l);
    if (!b) continue;
    const [r, g, bl] = hexRgb(b.fill);
    const y = doc.height - b.y - b.h;
    lines.push(`%%LayerName: ${l.name}`);
    lines.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(bl / 255).toFixed(3)} setrgbcolor`);
    if (b.text != null) {
      lines.push(`${b.x} ${y + b.h - 14} moveto (${b.text.replace(/([()\\])/g, "\\$1")}) show`);
    } else {
      lines.push(`newpath ${b.x} ${y} moveto ${b.w} 0 rlineto 0 ${b.h} rlineto ${-b.w} 0 rlineto closepath fill`);
    }
  }
  lines.push("showpage", "%%EOF");
  return lines.join("\n");
}

function layerCanvas(doc: Doc, l: LayerNode): HTMLCanvasElement | null {
  const b = drawable(doc, l);
  if (!b) return null;
  const c = document.createElement("canvas");
  c.width = Math.max(1, b.w);
  c.height = Math.max(1, b.h);
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.globalAlpha = b.opacity;
  if (b.text != null) {
    ctx.fillStyle = b.fill;
    ctx.font = `${Math.max(10, Math.min(b.h, 24))}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(b.text, 0, 0);
  } else {
    ctx.fillStyle = b.fill;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  return c;
}

export function toPsd(doc: Doc): ArrayBuffer {
  const children = doc.layers
    .map((l) => {
      const b = drawable(doc, l);
      const canvas = layerCanvas(doc, l);
      if (!b || !canvas) return null;
      return {
        name: l.name,
        left: b.x,
        top: b.y,
        right: b.x + b.w,
        bottom: b.y + b.h,
        opacity: Math.round(b.opacity * 255),
        canvas,
      };
    })
    .filter(Boolean) as any[];
  const composite = document.createElement("canvas");
  composite.width = doc.width;
  composite.height = doc.height;
  const cctx = composite.getContext("2d");
  if (cctx) {
    cctx.fillStyle = "#ffffff";
    cctx.fillRect(0, 0, doc.width, doc.height);
    for (const c of children) cctx.drawImage(c.canvas, c.left, c.top);
  }
  return writePsd({ width: doc.width, height: doc.height, children, canvas: composite } as any);
}

export async function toPng(doc: Doc): Promise<Blob> {
  const svg = toSvg(doc);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });
    const c = document.createElement("canvas");
    c.width = doc.width;
    c.height = doc.height;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("could not create an image canvas.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    return await canvasPng(c);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("could not encode PNG.")), "image/png"));
}

async function toTiff(doc: Doc): Promise<Blob> {
  const { encodeImage } = await import("utif");
  const image = await createImageBitmap(await toPng(doc));
  try {
    const canvas = document.createElement("canvas");
    canvas.width = doc.width; canvas.height = doc.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("could not create an image canvas.");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, doc.width, doc.height).data;
    return new Blob([encodeImage(new Uint8Array(pixels), doc.width, doc.height)], { type: "image/tiff" });
  } finally { image.close(); }
}

async function toSketch(doc: Doc): Promise<Blob> {
  const layers = [];
  for (const layer of doc.layers) {
    const b = drawable(doc, layer);
    const canvas = layerCanvas(doc, layer);
    if (!b || !canvas) continue;
    layers.push({ name: layer.name, x: b.x, y: b.y, width: b.w, height: b.h, png: await canvasPng(canvas) });
  }
  return writeSketch(doc.name, doc.width, doc.height, layers);
}

export async function convert(doc: Doc, target: FormatId): Promise<{ blob: Blob; filename: string }> {
  const base = doc.name.replace(/\.[a-z]+$/i, "") || "crossvert";
  if (target !== "json" && !doc.layers.some((layer) => drawable(doc, layer))) {
    throw new Error("this source contains layer names only, not drawable artwork. Export a layer pack, or import a PSD / connected Figma frame for image exports.");
  }
  switch (target) {
    case "sketch":
      return { blob: await toSketch(doc), filename: `${base}.sketch` };
    case "tiff":
      return { blob: await toTiff(doc), filename: `${base}.tiff` };
    case "psd":
      return { blob: new Blob([toPsd(doc)], { type: "image/vnd.adobe.photoshop" }), filename: `${base}.psd` };
    case "eps":
      return { blob: new Blob([toEps(doc)], { type: "application/postscript" }), filename: `${base}.eps` };
    case "png":
      return { blob: await toPng(doc), filename: `${base}.png` };
    case "json":
      return {
        blob: new Blob([JSON.stringify({ name: doc.name, width: doc.width, height: doc.height, rootIds: doc.rootIds, layers: doc.layers }, null, 2)], {
          type: "application/json",
        }),
        filename: `${base}.json`,
      };
    case "figma":
      return { blob: new Blob([toSvg(doc)], { type: "image/svg+xml" }), filename: `${base}.figma.svg` };
    case "ai":
      return { blob: new Blob([toSvg(doc)], { type: "image/svg+xml" }), filename: `${base}.ai.svg` };
    default:
      return { blob: new Blob([toSvg(doc)], { type: "image/svg+xml" }), filename: `${base}.svg` };
  }
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
