import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/boardr/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readPsd } from "ag-psd";

export const Route = createFileRoute("/figma")({
  head: () => ({
    meta: [
      { title: "figma / psd configurator (lab) — zinegeist" },
      { name: "description", content: "admin lab: import a figma frame by url or upload a psd — auto-parse the layer tree and tag each layer as locked or user-customizable while preserving effects and hierarchy." },
      { property: "og:title", content: "figma / psd configurator (lab) — zinegeist" },
      { property: "og:description", content: "auto-parse figma frames and psd files into configurator packs without losing layer effects." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FigmaConfiguratorPage,
});

type LayerKind = "text" | "image" | "shape" | "group" | "frame" | "component" | "instance" | "other";

type LayerNode = {
  id: string;
  name: string;
  kind: LayerKind;
  path: string; // "a/b/c"
  depth: number;
  visible: boolean;
  hasEffects?: boolean;
  effects?: string[]; // human labels
  policy: "locked" | "customizable";
  editable: { text?: boolean; fill?: boolean; image?: boolean };
  // Preview payload (kept lossless where possible)
  meta?: {
    text?: string;
    fills?: string[]; // hex
    opacity?: number;
    blendMode?: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
  };
  childrenIds: string[];
};

type Source =
  | { type: "figma"; fileKey: string; nodeId?: string; raw: unknown }
  | { type: "psd"; fileName: string; raw: unknown };

type ConfigPack = {
  id: string;
  name: string;
  createdAt: number;
  source: Source;
  layers: LayerNode[];
  rootIds: string[];
  previewPngDataUrl?: string; // psd composite or figma image
};

const LS_KEY = "boardr.figmaConfigs";
const LS_TOKEN = "boardr.figmaToken";

function readConfigs(): ConfigPack[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function writeConfigs(v: ConfigPack[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(v));
}

/* -------------------- figma api -------------------- */

function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } | null {
  try {
    const u = new URL(url);
    // supports /file/KEY/... and /design/KEY/...
    const m = u.pathname.match(/\/(?:file|design|proto)\/([A-Za-z0-9]+)/);
    if (!m) return null;
    const fileKey = m[1];
    const nodeParam = u.searchParams.get("node-id");
    const nodeId = nodeParam ? nodeParam.replace(/-/g, ":") : undefined;
    return { fileKey, nodeId };
  } catch { return null; }
}

function figmaKind(t?: string): LayerKind {
  switch (t) {
    case "TEXT": return "text";
    case "GROUP": return "group";
    case "FRAME": return "frame";
    case "COMPONENT":
    case "COMPONENT_SET": return "component";
    case "INSTANCE": return "instance";
    case "RECTANGLE":
    case "ELLIPSE":
    case "VECTOR":
    case "LINE":
    case "STAR":
    case "POLYGON":
    case "BOOLEAN_OPERATION": return "shape";
    default: return "other";
  }
}

function rgbaToHex(c: { r: number; g: number; b: number; a?: number }) {
  const to = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${to(c.r)}${to(c.g)}${to(c.b)}`;
}

function walkFigmaNode(node: any, parentPath: string, depth: number, out: LayerNode[]): string {
  const id = node.id as string;
  const name = (node.name as string) || node.type;
  const path = parentPath ? `${parentPath}/${name}` : name;
  const kind = figmaKind(node.type);
  const fills = Array.isArray(node.fills)
    ? node.fills
        .filter((f: any) => f.type === "SOLID" && f.color)
        .map((f: any) => rgbaToHex(f.color))
    : [];
  const effects: string[] = Array.isArray(node.effects)
    ? node.effects.map((e: any) => `${e.type}${e.radius ? `(${e.radius})` : ""}`)
    : [];
  const hasImageFill = Array.isArray(node.fills) && node.fills.some((f: any) => f.type === "IMAGE");

  const layer: LayerNode = {
    id,
    name,
    kind: hasImageFill ? "image" : kind,
    path,
    depth,
    visible: node.visible !== false,
    hasEffects: effects.length > 0,
    effects,
    policy: "locked",
    editable: kind === "text" ? { text: true } : hasImageFill ? { image: true } : { fill: fills.length > 0 },
    meta: {
      text: node.characters,
      fills,
      opacity: node.opacity,
      blendMode: node.blendMode,
      width: node.absoluteBoundingBox?.width,
      height: node.absoluteBoundingBox?.height,
      x: node.absoluteBoundingBox?.x,
      y: node.absoluteBoundingBox?.y,
    },
    childrenIds: [],
  };
  out.push(layer);
  if (Array.isArray(node.children)) {
    for (const c of node.children) {
      layer.childrenIds.push(walkFigmaNode(c, path, depth + 1, out));
    }
  }
  return id;
}

async function fetchFigmaFrame(url: string, token: string) {
  const parsed = parseFigmaUrl(url);
  if (!parsed) throw new Error("couldn't parse figma url. paste the frame url from figma (share → copy link).");
  const { fileKey, nodeId } = parsed;
  const headers = { "X-Figma-Token": token };

  let rootNode: any;
  if (nodeId) {
    const r = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`, { headers });
    if (!r.ok) throw new Error(`figma api ${r.status}: ${await r.text()}`);
    const j = await r.json();
    const entry = j.nodes?.[nodeId];
    if (!entry?.document) throw new Error("node not found in file. make sure the frame is selected in the url.");
    rootNode = entry.document;
  } else {
    const r = await fetch(`https://api.figma.com/v1/files/${fileKey}`, { headers });
    if (!r.ok) throw new Error(`figma api ${r.status}: ${await r.text()}`);
    const j = await r.json();
    rootNode = j.document;
  }

  const layers: LayerNode[] = [];
  const rootId = walkFigmaNode(rootNode, "", 0, layers);

  // preview render
  let preview: string | undefined;
  try {
    const idsQ = encodeURIComponent(rootNode.id);
    const r = await fetch(`https://api.figma.com/v1/images/${fileKey}?ids=${idsQ}&format=png&scale=2`, { headers });
    if (r.ok) {
      const j = await r.json();
      preview = j.images?.[rootNode.id];
    }
  } catch { /* ignore */ }

  return { layers, rootIds: [rootId], source: { type: "figma", fileKey, nodeId, raw: rootNode } as Source, preview };
}

/* -------------------- psd parser -------------------- */

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
  if (l.effects) {
    for (const [k, v] of Object.entries(l.effects)) {
      if (v && (Array.isArray(v) ? v.length : true)) effects.push(k);
    }
  }
  const layer: LayerNode = {
    id,
    name,
    kind,
    path,
    depth,
    visible: !l.hidden,
    hasEffects: effects.length > 0,
    effects,
    policy: "locked",
    editable: kind === "text" ? { text: true } : kind === "image" ? { image: true } : { fill: true },
    meta: {
      text: l.text?.text,
      opacity: typeof l.opacity === "number" ? l.opacity / 255 : undefined,
      blendMode: l.blendMode,
      width: (l.right ?? 0) - (l.left ?? 0),
      height: (l.bottom ?? 0) - (l.top ?? 0),
      x: l.left,
      y: l.top,
    },
    childrenIds: [],
  };
  out.push(layer);
  if (Array.isArray(l.children)) {
    for (const c of l.children) layer.childrenIds.push(walkPsdLayer(c, path, depth + 1, out, idx));
  }
  return id;
}

async function parsePsdFile(file: File) {
  const buf = await file.arrayBuffer();
  const psd = readPsd(buf, { skipCompositeImageData: false, skipThumbnail: true });
  const layers: LayerNode[] = [];
  const rootIds: string[] = [];
  const idx = { n: 0 };
  for (const c of psd.children || []) {
    rootIds.push(walkPsdLayer(c, "", 0, layers, idx));
  }
  let preview: string | undefined;
  try {
    if (psd.canvas) preview = (psd.canvas as HTMLCanvasElement).toDataURL("image/png");
  } catch { /* ignore */ }
  return { layers, rootIds, source: { type: "psd", fileName: file.name, raw: null } as Source, preview };
}

/* -------------------- component -------------------- */

function FigmaConfiguratorPage() {
  const [configs, setConfigs] = useState<ConfigPack[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [layers, setLayers] = useState<LayerNode[]>([]);
  const [rootIds, setRootIds] = useState<string[]>([]);
  const [source, setSource] = useState<Source | null>(null);
  const [preview, setPreview] = useState<string | undefined>();
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaToken, setFigmaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConfigs(readConfigs());
    setFigmaToken(localStorage.getItem(LS_TOKEN) || "");
  }, []);

  useEffect(() => {
    if (figmaToken) localStorage.setItem(LS_TOKEN, figmaToken);
  }, [figmaToken]);

  const active = useMemo(() => configs.find((c) => c.id === activeId) || null, [configs, activeId]);
  const byId = useMemo(() => new Map(layers.map((l) => [l.id, l])), [layers]);

  function reset() {
    setActiveId(null);
    setName("");
    setLayers([]);
    setRootIds([]);
    setSource(null);
    setPreview(undefined);
    setErr(null);
    setFigmaUrl("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function importFromFigma() {
    setErr(null);
    if (!figmaToken.trim()) { setErr("paste a figma personal access token first (figma → settings → security → personal access tokens)."); return; }
    if (!figmaUrl.trim()) { setErr("paste a figma frame url."); return; }
    setLoading(true);
    try {
      const res = await fetchFigmaFrame(figmaUrl.trim(), figmaToken.trim());
      setLayers(res.layers);
      setRootIds(res.rootIds);
      setSource(res.source);
      setPreview(res.preview);
      setExpanded(new Set(res.layers.filter((l) => l.depth < 2).map((l) => l.id)));
      if (!name) setName(res.layers[0]?.name || "figma import");
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function importFromPsd(f: File) {
    setErr(null);
    setLoading(true);
    try {
      const res = await parsePsdFile(f);
      setLayers(res.layers);
      setRootIds(res.rootIds);
      setSource(res.source);
      setPreview(res.preview);
      setExpanded(new Set(res.layers.filter((l) => l.depth < 2).map((l) => l.id)));
      if (!name) setName(f.name.replace(/\.psd$/i, ""));
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!source || !name.trim()) return;
    const cfg: ConfigPack = {
      id: activeId || `cfg-${Date.now().toString(36)}`,
      name: name.trim(),
      createdAt: Date.now(),
      source,
      layers,
      rootIds,
      previewPngDataUrl: preview?.startsWith("data:") ? preview : undefined,
    };
    const next = activeId ? configs.map((c) => (c.id === activeId ? cfg : c)) : [cfg, ...configs];
    setConfigs(next); writeConfigs(next); setActiveId(cfg.id);
  }

  function loadConfig(c: ConfigPack) {
    setActiveId(c.id);
    setName(c.name);
    setLayers(c.layers);
    setRootIds(c.rootIds);
    setSource(c.source);
    setPreview(c.previewPngDataUrl);
    setExpanded(new Set(c.layers.filter((l) => l.depth < 2).map((l) => l.id)));
  }

  function remove(id: string) {
    const next = configs.filter((c) => c.id !== id);
    setConfigs(next); writeConfigs(next);
    if (activeId === id) reset();
  }

  function updateLayer(id: string, patch: Partial<LayerNode>) {
    setLayers((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function updateEditable(id: string, patch: Partial<LayerNode["editable"]>) {
    setLayers((cur) => cur.map((l) => (l.id === id ? { ...l, editable: { ...l.editable, ...patch } } : l)));
  }

  function toggleExpand(id: string) {
    setExpanded((cur) => {
      const n = new Set(cur);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function renderTree(ids: string[]): React.ReactNode {
    return ids.map((id) => {
      const l = byId.get(id);
      if (!l) return null;
      const isOpen = expanded.has(id);
      const hasKids = l.childrenIds.length > 0;
      return (
        <div key={id} className="border-l border-stone-200" style={{ marginLeft: l.depth === 0 ? 0 : 8 }}>
          <div className="rounded border border-border bg-card p-2 my-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => hasKids && toggleExpand(id)}
                className={`w-4 text-center font-mono text-[10px] ${hasKids ? "text-stone-700" : "text-transparent"}`}
              >
                {hasKids ? (isOpen ? "▾" : "▸") : "·"}
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] truncate">{l.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {l.kind}
                  {l.hasEffects && <span className="ml-2 text-amber-700">fx: {l.effects?.join(", ")}</span>}
                  {l.meta?.opacity !== undefined && l.meta.opacity < 1 && (
                    <span className="ml-2">op {Math.round((l.meta.opacity || 0) * 100)}%</span>
                  )}
                </p>
              </div>
              <label className="flex items-center gap-1 text-[10px] uppercase tracking-widest cursor-pointer">
                <input
                  type="checkbox"
                  checked={l.policy === "customizable"}
                  onChange={(e) => updateLayer(id, { policy: e.target.checked ? "customizable" : "locked" })}
                />
                customizable
              </label>
            </div>
            {l.policy === "customizable" && (
              <div className="mt-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-widest pl-6">
                {l.kind === "text" && (
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={!!l.editable.text} onChange={(e) => updateEditable(id, { text: e.target.checked })} />
                    text
                  </label>
                )}
                {(l.kind === "image" || l.kind === "shape") && (
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={!!l.editable.image} onChange={(e) => updateEditable(id, { image: e.target.checked })} />
                    image
                  </label>
                )}
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={!!l.editable.fill} onChange={(e) => updateEditable(id, { fill: e.target.checked })} />
                  color / fill
                </label>
              </div>
            )}
          </div>
          {isOpen && hasKids && <div className="pl-3">{renderTree(l.childrenIds)}</div>}
        </div>
      );
    });
  }

  const stats = useMemo(() => ({
    total: layers.length,
    custom: layers.filter((l) => l.policy === "customizable").length,
    withFx: layers.filter((l) => l.hasEffects).length,
  }), [layers]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="inline-block rounded-full border border-border bg-card px-3 py-1 font-mono text-[10px] lowercase tracking-wider text-muted-foreground">
          admin lab · figma api & psd → configurator
        </div>
        <h1 className="mt-4 font-display text-4xl lowercase tracking-tight">figma / psd configurator</h1>
        <p className="mt-3 max-w-2xl text-sm text-stone-700 leading-relaxed">
          import a figma frame by url (via the figma api) or upload a .psd. we auto-parse the full
          layer tree — preserving hierarchy, effects, blend modes, and opacity — then let you tag
          each layer as locked or user-customizable. no manual svg export, no lost effects.
        </p>

        <div className="mt-8 grid lg:grid-cols-[240px_1fr_400px] gap-6">
          {/* saved */}
          <aside className="space-y-2">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">saved</h3>
            <button onClick={reset} className="w-full text-left rounded border border-dashed border-stone-400 px-3 py-2 text-xs hover:bg-stone-50">
              + new
            </button>
            {configs.map((c) => (
              <div
                key={c.id}
                className={`rounded border px-3 py-2 text-xs cursor-pointer flex items-center justify-between gap-2 ${
                  activeId === c.id ? "border-stone-900 bg-stone-50" : "border-border hover:bg-stone-50"
                }`}
                onClick={() => loadConfig(c)}
              >
                <div className="min-w-0">
                  <p className="truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.source.type}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); remove(c.id); }} className="text-stone-400 hover:text-rose-600" title="delete">×</button>
              </div>
            ))}
            {configs.length === 0 && <p className="text-[11px] text-muted-foreground">nothing saved yet.</p>}
          </aside>

          {/* import + preview */}
          <section className="space-y-4">
            <div className="rounded-md border border-border bg-card p-4 space-y-3">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">import from figma</h3>
              <Input
                type="password"
                value={figmaToken}
                onChange={(e) => setFigmaToken(e.target.value)}
                placeholder="figma personal access token (stored locally)"
              />
              <div className="flex gap-2">
                <Input value={figmaUrl} onChange={(e) => setFigmaUrl(e.target.value)} placeholder="https://www.figma.com/design/…?node-id=…" />
                <Button onClick={importFromFigma} disabled={loading}>{loading ? "importing…" : "import"}</Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                get a token at figma → settings → security → personal access tokens. copy a frame url with{" "}
                <span className="font-mono">right-click → copy link to selection</span>.
              </p>
            </div>

            <div className="rounded-md border border-border bg-card p-4 space-y-3">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">or upload psd</h3>
              <input
                ref={fileRef}
                type="file"
                accept=".psd,image/vnd.adobe.photoshop"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importFromPsd(f); }}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={loading}>
                {loading ? "parsing…" : "choose .psd file"}
              </Button>
            </div>

            {err && <div className="rounded border border-rose-300 bg-rose-50 text-rose-800 text-xs p-3">{err}</div>}

            <div className="flex items-center gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="pack name" className="max-w-sm" />
              <Button onClick={save} disabled={!source || !name.trim()}>{activeId ? "update" : "save pack"}</Button>
              {source && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground ml-auto">
                  {stats.total} layers · {stats.custom} customizable · {stats.withFx} with fx
                </span>
              )}
            </div>

            <div className="rounded-md border border-border bg-editor-canvas p-4 min-h-[420px] flex items-center justify-center overflow-auto">
              {preview ? (
                <img src={preview} alt="frame preview" className="max-w-full max-h-[560px] object-contain" />
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  import a figma frame or upload a psd to preview.
                  <br />
                  <span className="text-[11px]">layer tree, effects, and blend modes are preserved.</span>
                </div>
              )}
            </div>
          </section>

          {/* layer tree */}
          <aside className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">layer tree ({layers.length})</h3>
              {layers.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setLayers((cur) => cur.map((l) => ({ ...l, policy: "customizable" })))}
                    className="font-mono text-[10px] uppercase tracking-widest text-stone-600 hover:text-stone-900"
                  >
                    unlock all
                  </button>
                  <button
                    onClick={() => setExpanded(new Set(layers.map((l) => l.id)))}
                    className="font-mono text-[10px] uppercase tracking-widest text-stone-600 hover:text-stone-900"
                  >
                    expand
                  </button>
                </div>
              )}
            </div>
            {layers.length === 0 && (
              <p className="text-[11px] text-muted-foreground">layers appear here after import. hierarchy, effects, and blend modes are kept intact.</p>
            )}
            <div className="max-h-[720px] overflow-auto no-scrollbar pr-1">
              {renderTree(rootIds)}
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
