import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { readPsd } from "ag-psd";

type LayerKind = "text" | "image" | "shape" | "group" | "frame" | "component" | "instance" | "other";
type EditablePolicy = "locked" | "partial" | "customizable";
type EditableFlags = {
  text?: boolean; image?: boolean; fill?: boolean; stroke?: boolean;
  borderWidth?: boolean; opacity?: boolean; position?: boolean; size?: boolean;
};
type LayerNode = {
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
type SourceKind = "figma" | "psd" | "ai" | "eps";
type ConfigPack = {
  id: string; name: string; createdAt: number;
  source: Source; layers: LayerNode[]; rootIds: string[];
  previewPngDataUrl?: string;
};

const LS_KEY = "boardr.figmaConfigs";
const LS_TOKEN = "boardr.figmaToken";
const FIGMA_CLIENT_ID = (import.meta as any).env?.VITE_FIGMA_CLIENT_ID as string | undefined;

function readConfigs(): ConfigPack[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function writeConfigs(v: ConfigPack[]) { localStorage.setItem(LS_KEY, JSON.stringify(v)); }

/* ---------- figma api ---------- */
function parseFigmaUrl(url: string) {
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
function rgbaToHex(c: { r: number; g: number; b: number }) {
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
async function fetchFigmaFrame(url: string, token: string, tokenKind: "pat" | "bearer" = "pat") {
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
async function parsePsdFile(file: File) {
  const buf = await file.arrayBuffer();
  const psd = readPsd(buf, { skipCompositeImageData: false, skipThumbnail: true });
  const layers: LayerNode[] = []; const rootIds: string[] = []; const idx = { n: 0 };
  for (const c of psd.children || []) rootIds.push(walkPsdLayer(c, "", 0, layers, idx));
  let preview: string | undefined;
  try { if (psd.canvas) preview = (psd.canvas as HTMLCanvasElement).toDataURL("image/png"); } catch {}
  return { layers, rootIds, source: { type: "psd", fileName: file.name, raw: null } as Source, preview };
}

/* ---------- ai / eps (best-effort layer name extraction) ---------- */
async function parseAiOrEps(file: File, kind: "ai" | "eps") {
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

/* ==================== component ==================== */

export function ConfiguratorMain({ title = "figma / psd configurator", subtitle }: { title?: string; subtitle?: string }) {
  const [configs, setConfigs] = useState<ConfigPack[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [layers, setLayers] = useState<LayerNode[]>([]);
  const [rootIds, setRootIds] = useState<string[]>([]);
  const [source, setSource] = useState<Source | null>(null);
  const [preview, setPreview] = useState<string | undefined>();
  const [figmaToken, setFigmaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeSource, setActiveSource] = useState<SourceKind | null>(null);
  const [mode, setMode] = useState<"admin" | "viewer">("admin");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [figmaModalOpen, setFigmaModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"choose" | "token" | "url">("choose");
  const [modalUrl, setModalUrl] = useState("");
  const [modalToken, setModalToken] = useState("");
  const psdRef = useRef<HTMLInputElement>(null);
  const aiRef = useRef<HTMLInputElement>(null);
  const epsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConfigs(readConfigs());
    const t = localStorage.getItem(LS_TOKEN) || "";
    setFigmaToken(t); setModalToken(t);
  }, []);

  const byId = useMemo(() => new Map(layers.map((l) => [l.id, l])), [layers]);
  const selectedLayer = selectedLayerId ? byId.get(selectedLayerId) : null;

  function reset() {
    setActiveId(null); setName(""); setLayers([]); setRootIds([]);
    setSource(null); setPreview(undefined); setErr(null);
    setActiveSource(null); setSelectedLayerId(null);
    [psdRef, aiRef, epsRef].forEach((r) => { if (r.current) r.current.value = ""; });
  }

  function openFigmaFlow() {
    setErr(null);
    setModalStep(figmaToken.trim() ? "url" : "choose");
    setFigmaModalOpen(true);
  }

  function startOAuth() {
    if (!FIGMA_CLIENT_ID) {
      setErr("figma oauth is unconfigured. set VITE_FIGMA_CLIENT_ID and a redirect handler, or use a personal access token.");
      setModalStep("token");
      return;
    }
    const redirect = `${window.location.origin}${window.location.pathname}`;
    const state = Math.random().toString(36).slice(2);
    localStorage.setItem("boardr.figmaOAuthState", state);
    const auth = `https://www.figma.com/oauth?client_id=${encodeURIComponent(FIGMA_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirect)}&scope=file_read&state=${state}&response_type=code`;
    window.location.href = auth;
  }

  async function runFigmaImport(url: string, token: string) {
    setLoading(true); setErr(null);
    try {
      const res = await fetchFigmaFrame(url.trim(), token.trim());
      setLayers(res.layers); setRootIds(res.rootIds); setSource(res.source); setPreview(res.preview);
      setExpanded(new Set(res.layers.filter((l) => l.depth < 2).map((l) => l.id)));
      setActiveSource("figma");
      if (!name) setName(res.layers[0]?.name || "figma import");
      setFigmaModalOpen(false); setModalUrl("");
    } catch (e: any) { setErr(e.message || String(e)); }
    finally { setLoading(false); }
  }

  async function importFile(f: File, kind: "psd" | "ai" | "eps") {
    setErr(null); setLoading(true);
    try {
      const res = kind === "psd" ? await parsePsdFile(f) : await parseAiOrEps(f, kind);
      setLayers(res.layers); setRootIds(res.rootIds); setSource(res.source); setPreview(res.preview);
      setExpanded(new Set(res.layers.filter((l) => l.depth < 2).map((l) => l.id)));
      setActiveSource(kind);
      if (!name) setName(f.name.replace(/\.(psd|ai|eps)$/i, ""));
    } catch (e: any) { setErr(e.message || String(e)); }
    finally { setLoading(false); }
  }

  function save() {
    if (!source || !name.trim()) return;
    const cfg: ConfigPack = {
      id: activeId || `cfg-${Date.now().toString(36)}`,
      name: name.trim(), createdAt: Date.now(),
      source, layers, rootIds,
      previewPngDataUrl: preview?.startsWith("data:") ? preview : undefined,
    };
    const next = activeId ? configs.map((c) => (c.id === activeId ? cfg : c)) : [cfg, ...configs];
    setConfigs(next); writeConfigs(next); setActiveId(cfg.id);
  }
  function loadConfig(c: ConfigPack) {
    setActiveId(c.id); setName(c.name); setLayers(c.layers);
    setRootIds(c.rootIds); setSource(c.source); setPreview(c.previewPngDataUrl);
    setExpanded(new Set(c.layers.filter((l) => l.depth < 2).map((l) => l.id)));
    setActiveSource(c.source.type as SourceKind); setSelectedLayerId(null);
  }
  function remove(id: string) {
    const next = configs.filter((c) => c.id !== id);
    setConfigs(next); writeConfigs(next);
    if (activeId === id) reset();
  }
  function updateEditable(id: string, patch: Partial<EditableFlags>) {
    setLayers((cur) => cur.map((l) => {
      if (l.id !== id) return l;
      const nextEditable = { ...l.editable, ...patch };
      const anyOn = Object.values(nextEditable).some(Boolean);
      const relevant = (["text","image","fill","stroke","borderWidth","opacity","position","size"] as const).filter((k) => {
        if (k === "text") return l.kind === "text";
        if (k === "image") return l.kind === "image";
        return true;
      });
      const allOn = relevant.every((k) => (nextEditable as any)[k]);
      const policy: EditablePolicy = !anyOn ? "locked" : allOn ? "customizable" : "partial";
      return { ...l, editable: nextEditable, policy };
    }));
  }
  function setPolicy(id: string, policy: EditablePolicy) {
    setLayers((cur) => cur.map((l) => {
      if (l.id !== id) return l;
      if (policy === "locked") return { ...l, policy, editable: {} };
      if (policy === "customizable") {
        const full: EditableFlags = { fill: true, stroke: true, borderWidth: true, opacity: true, position: true, size: true };
        if (l.kind === "text") full.text = true;
        if (l.kind === "image") full.image = true;
        return { ...l, policy, editable: full };
      }
      const cur2 = { ...l.editable };
      if (!Object.values(cur2).some(Boolean)) cur2.fill = true;
      return { ...l, policy, editable: cur2 };
    }));
  }
  function toggleExpand(id: string) {
    setExpanded((cur) => { const n = new Set(cur); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }
  function renderTree(ids: string[]): React.ReactNode {
    return ids.map((id) => {
      const l = byId.get(id); if (!l) return null;
      const isOpen = expanded.has(id);
      const hasKids = l.childrenIds.length > 0;
      const isSel = selectedLayerId === id;
      const dot = l.policy === "customizable" ? "bg-emerald-500" : l.policy === "partial" ? "bg-amber-500" : "bg-stone-300";
      return (
        <div key={id} style={{ marginLeft: l.depth === 0 ? 0 : 8 }}>
          <div onClick={() => setSelectedLayerId(id)}
               className={`rounded border p-2 my-1 cursor-pointer ${isSel ? "border-stone-900 bg-stone-50" : "border-border bg-card hover:bg-stone-50"}`}>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); if (hasKids) toggleExpand(id); }}
                      className={`w-4 text-center font-mono text-[10px] ${hasKids ? "text-stone-700" : "text-transparent"}`}>
                {hasKids ? (isOpen ? "▾" : "▸") : "·"}
              </button>
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] truncate">{l.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {l.kind}{l.hasEffects && <span className="ml-2 text-amber-700">fx</span>}
                </p>
              </div>
            </div>
          </div>
          {isOpen && hasKids && <div className="pl-3">{renderTree(l.childrenIds)}</div>}
        </div>
      );
    });
  }

  const stats = useMemo(() => ({
    total: layers.length,
    custom: layers.filter((l) => l.policy === "customizable").length,
    partial: layers.filter((l) => l.policy === "partial").length,
    withFx: layers.filter((l) => l.hasEffects).length,
  }), [layers]);

  const cardBase = "rounded-md border p-4 space-y-2 text-left transition-colors";
  const cardActive = "border-stone-900 bg-stone-50";
  const cardIdle = "border-border bg-card hover:bg-stone-50";

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-12">
      <div className="inline-block rounded-full border border-border bg-card px-3 py-1 font-mono text-[10px] lowercase tracking-wider text-muted-foreground">
        admin lab · design file → configurator
      </div>
      <h1 className="mt-4 font-display text-4xl lowercase tracking-tight">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-stone-700 leading-relaxed">
        {subtitle ?? "import a figma frame (oauth or personal token), or upload a .psd / .ai / .eps. we auto-parse the layer tree, preserve effects & blend modes, then let you tag each layer as locked, partial, or fully customizable."}
      </p>

      {/* source cards */}
      <div className="mt-8 grid md:grid-cols-4 gap-4">
        <button type="button" onClick={openFigmaFlow}
                className={`${cardBase} ${activeSource === "figma" ? cardActive : cardIdle}`}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">source · figma</p>
          <h3 className="font-display text-lg lowercase">import from figma</h3>
          <p className="text-[11px] text-stone-600">authorize your figma account, or paste a personal token, then drop in a frame url.</p>
          {activeSource === "figma" && source?.type === "figma" && (
            <p className="text-[10px] font-mono text-emerald-700">active · {source.fileKey.slice(0, 8)}…</p>
          )}
        </button>

        <button type="button" onClick={() => psdRef.current?.click()}
                className={`${cardBase} ${activeSource === "psd" ? cardActive : cardIdle}`}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">source · psd</p>
          <h3 className="font-display text-lg lowercase">upload .psd</h3>
          <p className="text-[11px] text-stone-600">photoshop — full layer tree with blend modes & effects.</p>
          {activeSource === "psd" && source?.type === "psd" && <p className="text-[10px] font-mono text-emerald-700">active · {source.fileName}</p>}
          <input ref={psdRef} type="file" accept=".psd,image/vnd.adobe.photoshop" className="hidden"
                 onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f, "psd"); }} />
        </button>

        <button type="button" onClick={() => aiRef.current?.click()}
                className={`${cardBase} ${activeSource === "ai" ? cardActive : cardIdle}`}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">source · ai</p>
          <h3 className="font-display text-lg lowercase">upload .ai</h3>
          <p className="text-[11px] text-stone-600">illustrator — layer names & artboards extracted from the file directory.</p>
          {activeSource === "ai" && source?.type === "ai" && <p className="text-[10px] font-mono text-emerald-700">active · {source.fileName}</p>}
          <input ref={aiRef} type="file" accept=".ai,application/postscript,application/illustrator" className="hidden"
                 onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f, "ai"); }} />
        </button>

        <button type="button" onClick={() => epsRef.current?.click()}
                className={`${cardBase} ${activeSource === "eps" ? cardActive : cardIdle}`}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">source · eps</p>
          <h3 className="font-display text-lg lowercase">upload .eps</h3>
          <p className="text-[11px] text-stone-600">encapsulated postscript — title & layer comments parsed.</p>
          {activeSource === "eps" && source?.type === "eps" && <p className="text-[10px] font-mono text-emerald-700">active · {source.fileName}</p>}
          <input ref={epsRef} type="file" accept=".eps,application/postscript" className="hidden"
                 onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f, "eps"); }} />
        </button>
      </div>

      {err && <div className="mt-4 rounded border border-rose-300 bg-rose-50 text-rose-800 text-xs p-3">{err}</div>}
      {loading && <div className="mt-4 text-xs text-stone-600 font-mono">working…</div>}

      {/* saved + mode toggle */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mr-2">saved</h3>
          <button onClick={reset} className="rounded border border-dashed border-stone-400 px-3 py-1 text-xs hover:bg-stone-50">+ new</button>
          {configs.map((c) => (
            <div key={c.id} onClick={() => loadConfig(c)}
                 className={`rounded border px-3 py-1 text-xs cursor-pointer flex items-center gap-2 ${activeId === c.id ? "border-stone-900 bg-stone-50" : "border-border hover:bg-stone-50"}`}>
              <span className="truncate max-w-[120px]">{c.name}</span>
              <span className="text-[10px] text-muted-foreground">{c.source.type}</span>
              <button onClick={(e) => { e.stopPropagation(); remove(c.id); }} className="text-stone-400 hover:text-rose-600">×</button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 shrink-0">
          {(["admin", "viewer"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
                    className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest transition-colors ${mode === m ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"}`}>{m}</button>
          ))}
        </div>
      </div>

      {/* preview 3-col */}
      <div className="mt-6 grid lg:grid-cols-[260px_1fr_320px] gap-4">
        <aside className="rounded-md border border-border bg-card p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">layers ({layers.length})</h3>
            {layers.length > 0 && (
              <button onClick={() => setExpanded(new Set(layers.map((l) => l.id)))}
                      className="font-mono text-[10px] uppercase tracking-widest text-stone-600 hover:text-stone-900">expand</button>
            )}
          </div>
          {layers.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">import a source above to see the layer tree.</p>
          ) : (
            <div className="max-h-[640px] overflow-auto no-scrollbar pr-1">{renderTree(rootIds)}</div>
          )}
        </aside>

        <section className="rounded-md border border-border bg-editor-canvas p-4 min-h-[520px] flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="pack name" className="max-w-xs" />
            <Button onClick={save} disabled={!source || !name.trim()}>{activeId ? "update" : "save pack"}</Button>
            {source && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground ml-auto">
                {stats.total} layers · {stats.custom} custom · {stats.partial} partial · {stats.withFx} fx
              </span>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto">
            {preview ? (
              <img src={preview} alt="frame preview" className="max-w-full max-h-[560px] object-contain" />
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                import a source to preview.<br />
                <span className="text-[11px]">layer tree, effects, and blend modes are preserved.</span>
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-md border border-border bg-card p-3">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            {mode === "admin" ? "layer configurator" : "viewer controls"}
          </h3>
          {!selectedLayer ? (
            <p className="text-[11px] text-muted-foreground">select a layer on the left to configure it.</p>
          ) : mode === "admin" ? (
            <AdminConfigurator layer={selectedLayer} onPolicy={(p) => setPolicy(selectedLayer.id, p)} onFlag={(patch) => updateEditable(selectedLayer.id, patch)} />
          ) : (
            <ViewerControls layer={selectedLayer} />
          )}
        </aside>
      </div>

      {/* figma modal */}
      <Dialog open={figmaModalOpen} onOpenChange={setFigmaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="lowercase">
              {modalStep === "choose" ? "connect figma"
                : modalStep === "token" ? "paste a personal access token"
                : "paste a figma frame url"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {modalStep === "choose" ? "authorize your figma account, or paste a personal token. everything is stored locally."
                : modalStep === "token" ? "we'll call the figma api with this token — never sent anywhere else."
                : "right-click a frame in figma → copy link to selection."}
            </DialogDescription>
          </DialogHeader>

          {modalStep === "choose" && (
            <div className="space-y-3">
              <button onClick={startOAuth}
                      className="w-full rounded border border-stone-900 bg-stone-900 text-white px-3 py-2 text-xs font-mono uppercase tracking-widest hover:bg-stone-800">
                authorize with figma
              </button>
              {!FIGMA_CLIENT_ID && (
                <p className="text-[10px] text-amber-700">oauth requires VITE_FIGMA_CLIENT_ID. fallback to token below.</p>
              )}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <button onClick={() => setModalStep("token")}
                      className="w-full rounded border border-border bg-card px-3 py-2 text-xs hover:bg-stone-50">
                use a personal access token
              </button>
            </div>
          )}

          {modalStep === "token" && (
            <div className="space-y-3">
              <Input type="password" value={modalToken} onChange={(e) => setModalToken(e.target.value)}
                     placeholder="figd_..." autoFocus />
              <p className="text-[11px] text-muted-foreground">get one at figma → settings → security → personal access tokens.</p>
              <DialogFooter>
                <Button onClick={() => {
                  if (!modalToken.trim()) { setErr("token required."); return; }
                  localStorage.setItem(LS_TOKEN, modalToken.trim());
                  setFigmaToken(modalToken.trim());
                  setModalStep("url");
                }}>next</Button>
              </DialogFooter>
            </div>
          )}

          {modalStep === "url" && (
            <div className="space-y-3">
              <Input value={modalUrl} onChange={(e) => setModalUrl(e.target.value)}
                     placeholder="https://www.figma.com/design/…?node-id=…" autoFocus />
              <div className="flex items-center justify-between">
                <button onClick={() => setModalStep("choose")}
                        className="font-mono text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900">← change method</button>
                <Button onClick={() => runFigmaImport(modalUrl, figmaToken)} disabled={loading || !modalUrl.trim()}>
                  {loading ? "importing…" : "import frame"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminConfigurator({
  layer, onPolicy, onFlag,
}: { layer: LayerNode; onPolicy: (p: EditablePolicy) => void; onFlag: (patch: Partial<EditableFlags>) => void }) {
  const flagRows: { key: keyof EditableFlags; label: string; show: boolean }[] = [
    { key: "text", label: "text content", show: layer.kind === "text" },
    { key: "image", label: "image swap", show: layer.kind === "image" },
    { key: "fill", label: "fill / background color", show: true },
    { key: "stroke", label: "stroke color", show: true },
    { key: "borderWidth", label: "border thickness", show: true },
    { key: "opacity", label: "opacity", show: true },
    { key: "position", label: "position (x/y)", show: true },
    { key: "size", label: "size (w/h)", show: true },
  ];
  return (
    <div className="space-y-3">
      <div>
        <p className="font-mono text-[11px] truncate">{layer.name}</p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{layer.kind}{layer.hasEffects ? ` · fx: ${layer.effects?.join(", ")}` : ""}</p>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {(["locked", "partial", "customizable"] as const).map((p) => (
          <button key={p} onClick={() => onPolicy(p)}
                  className={`rounded border px-2 py-1 text-[10px] font-mono uppercase tracking-widest ${layer.policy === p ? "border-stone-900 bg-stone-900 text-white" : "border-border hover:bg-stone-50"}`}>{p}</button>
        ))}
      </div>
      <div className="rounded border border-border p-2 space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">what the end user can edit</p>
        {flagRows.filter((r) => r.show).map((r) => (
          <label key={r.key} className="flex items-center justify-between text-[11px] py-0.5 cursor-pointer">
            <span>{r.label}</span>
            <input type="checkbox" checked={!!layer.editable[r.key]}
                   onChange={(e) => onFlag({ [r.key]: e.target.checked } as Partial<EditableFlags>)} />
          </label>
        ))}
      </div>
      {layer.meta && (
        <div className="rounded border border-dashed border-stone-300 p-2 text-[10px] font-mono text-stone-600 space-y-0.5">
          {layer.meta.width !== undefined && <div>size · {Math.round(layer.meta.width)}×{Math.round(layer.meta.height || 0)}</div>}
          {layer.meta.opacity !== undefined && <div>opacity · {Math.round((layer.meta.opacity || 1) * 100)}%</div>}
          {layer.meta.blendMode && <div>blend · {layer.meta.blendMode}</div>}
          {layer.meta.fills && layer.meta.fills.length > 0 && (
            <div className="flex items-center gap-1">fills ·
              {layer.meta.fills.slice(0, 4).map((f, i) => (
                <span key={i} className="inline-block h-3 w-3 rounded border border-stone-300" style={{ background: f }} title={f} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ViewerControls({ layer }: { layer: LayerNode }) {
  if (layer.policy === "locked") return <p className="text-[11px] text-muted-foreground">this layer is locked by the admin.</p>;
  const e = layer.editable;
  const hasAny = Object.values(e).some(Boolean);
  if (!hasAny) return <p className="text-[11px] text-muted-foreground">no editable properties on this layer.</p>;
  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] truncate">{layer.name}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{layer.policy}</p>
      <div className="space-y-2">
        {e.text && (
          <label className="block text-[11px] space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">text</span>
            <Input defaultValue={layer.meta?.text || ""} />
          </label>
        )}
        {e.image && (
          <label className="block text-[11px] space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">image</span>
            <input type="file" accept="image/*" className="block text-[11px]" />
          </label>
        )}
        {e.fill && (
          <label className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">fill</span>
            <input type="color" defaultValue={layer.meta?.fills?.[0] || "#000000"} />
          </label>
        )}
        {e.stroke && (
          <label className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">stroke</span>
            <input type="color" defaultValue="#000000" />
          </label>
        )}
        {e.borderWidth && (
          <label className="block text-[11px] space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">border width</span>
            <input type="range" min={0} max={20} defaultValue={1} className="w-full" />
          </label>
        )}
        {e.opacity && (
          <label className="block text-[11px] space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">opacity</span>
            <input type="range" min={0} max={100} defaultValue={Math.round((layer.meta?.opacity ?? 1) * 100)} className="w-full" />
          </label>
        )}
        {(e.position || e.size) && (
          <p className="text-[10px] text-muted-foreground font-mono">drag & resize on canvas (coming soon)</p>
        )}
      </div>
    </div>
  );
}
