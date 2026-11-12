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
import type { LayerNode, EditablePolicy, EditableFlags, Source, SourceKind, ConfigPack } from "./parse";
import { fetchFigmaFrame, parsePsdFile, parseAiOrEps, readConfigs, writeConfigs, LS_TOKEN, FIGMA_CLIENT_ID } from "./parse";

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
  const [publicOnly, setPublicOnly] = useState(false);
  const psdRef = useRef<HTMLInputElement>(null);
  const aiRef = useRef<HTMLInputElement>(null);
  const epsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConfigs(readConfigs());
    const t = localStorage.getItem(LS_TOKEN) || "";
    setFigmaToken(t); setModalToken(t);
    const presetUrl = new URLSearchParams(window.location.search).get("figmaUrl");
    if (presetUrl) {
      setModalUrl(presetUrl);
      setModalStep("url");
      setFigmaModalOpen(true);
    }
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
    setModalStep("url");
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
      setPublicOnly(false);
      if (!name) setName(res.layers[0]?.name || "figma import");
      setFigmaModalOpen(false); setModalUrl("");
    } catch (e: any) { setErr(e.message || String(e)); }
    finally { setLoading(false); }
  }

  async function previewPublicFigma(url: string) {
    const cleanUrl = url.trim();
    if (!cleanUrl) return setErr("paste or drop a figma frame url.");
    setLoading(true); setErr(null);
    try {
      const response = await fetch(`/api/public/figma-oembed?url=${encodeURIComponent(cleanUrl)}`);
      const data = await response.json() as { title?: string; thumbnailUrl?: string | null; error?: string };
      if (!response.ok) throw new Error(data.error || "this figma link could not be previewed.");
      setName(data.title || "public figma frame");
      setPreview(data.thumbnailUrl || undefined);
      setLayers([]); setRootIds([]); setSource(null); setActiveSource("figma"); setPublicOnly(true);
      setFigmaModalOpen(false);
    } catch (e: any) { setErr(e.message || String(e)); }
    finally { setLoading(false); }
  }

  async function importFile(f: File, kind: "psd" | "ai" | "eps") {
    setErr(null); setLoading(true);
    try {
      let file = f;
      let effectiveKind = kind;
      // if the user drops a .zip on any card, extract the first supported file inside.
      if (/\.zip$/i.test(f.name)) {
        const extracted = await extractFromZip(f, kind);
        if (!extracted) throw new Error(`no .psd / .ai / .eps found inside ${f.name}`);
        file = extracted.file;
        effectiveKind = extracted.kind;
      }
      const res = effectiveKind === "psd" ? await parsePsdFile(file) : await parseAiOrEps(file, effectiveKind);
      setLayers(res.layers); setRootIds(res.rootIds); setSource(res.source); setPreview(res.preview);
      setExpanded(new Set(res.layers.filter((l) => l.depth < 2).map((l) => l.id)));
      setActiveSource(effectiveKind);
      if (!name) setName(file.name.replace(/\.(psd|ai|eps)$/i, ""));
    } catch (e: any) { setErr(e.message || String(e)); }
    finally { setLoading(false); }
  }

  async function extractFromZip(
    f: File,
    preferred: "psd" | "ai" | "eps",
  ): Promise<{ file: File; kind: "psd" | "ai" | "eps" } | null> {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(await f.arrayBuffer());
    const entries = Object.values(zip.files).filter((e) => !e.dir);
    const order: ("psd" | "ai" | "eps")[] = [preferred, "psd", "ai", "eps"].filter(
      (v, i, a) => a.indexOf(v) === i,
    ) as ("psd" | "ai" | "eps")[];
    for (const k of order) {
      const hit = entries.find((e) => new RegExp(`\\.${k}$`, "i").test(e.name));
      if (hit) {
        const blob = await hit.async("blob");
        return { file: new File([blob], hit.name.split("/").pop() || hit.name), kind: k };
      }
    }
    return null;
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
          <p className="text-[11px] text-stone-600">paste or drop a public frame link. no account needed to preview it.</p>
          {activeSource === "figma" && source?.type === "figma" && (
            <p className="text-[10px] font-mono text-emerald-700">active · {source.fileKey.slice(0, 8)}…</p>
          )}
        </button>

        <Button variant="outline" type="button" onClick={() => psdRef.current?.click()}
                disabled={loading}
                className={`${cardBase} ${activeSource === "psd" ? cardActive : cardIdle} h-auto block whitespace-normal`}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">source · psd</p>
          <h3 className="font-display text-lg lowercase">upload .psd</h3>
          <p className="text-[11px] text-stone-600">photoshop — full layer tree with blend modes & effects.</p>
          {activeSource === "psd" && source?.type === "psd" && <p className="text-[10px] font-mono text-emerald-700">active · {source.fileName}</p>}
        </Button>
        {(["ai", "eps"] as const).map((kind) => (
          <Button key={kind} variant="outline" type="button" disabled={loading}
            onClick={() => (kind === "ai" ? aiRef : epsRef).current?.click()}
            className={`${cardBase} ${activeSource === kind ? cardActive : cardIdle} h-auto block whitespace-normal`}>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">source · {kind}</p>
            <h3 className="font-display text-lg lowercase">upload .{kind}</h3>
            <p className="text-[11px] text-muted-foreground">{kind === "ai" ? "illustrator" : "encapsulated postscript"} — layer names only; artwork is not decoded.</p>
            {activeSource === kind && source && "fileName" in source && <p className="text-[10px] font-mono">active · {source.fileName}</p>}
          </Button>
        ))}
      </div>
      <input ref={psdRef} type="file" accept=".psd,.zip,image/vnd.adobe.photoshop,application/zip" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importFile(f, "psd"); }} />
      <input ref={aiRef} type="file" accept=".ai,.zip,application/pdf,application/postscript,application/illustrator,application/zip" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importFile(f, "ai"); }} />
      <input ref={epsRef} type="file" accept=".eps,.zip,application/postscript,application/zip" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importFile(f, "eps"); }} />

      {err && <div className="mt-4 rounded border border-rose-300 bg-rose-50 text-rose-800 text-xs p-3">{err}</div>}
      {loading && <div className="mt-4 text-xs text-stone-600 font-mono">working…</div>}
      {publicOnly && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-[#d9d2bd] bg-white/75 p-3 text-xs text-stone-700">
          <span>Public preview loaded. Connect Figma or use a token to read and configure its individual layers.</span>
          <button onClick={() => { setModalStep(figmaToken ? "url" : "choose"); setFigmaModalOpen(true); }} className="porter-btn bg-[#4b53d6] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-stone-50">import editable layers</button>
        </div>
      )}

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
                : "paste or drop a figma frame url"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {modalStep === "choose" ? "authorize your figma account, or paste a personal token. everything is stored locally."
                : modalStep === "token" ? "we'll call the figma api with this token — never sent anywhere else."
                : "public links preview without an account. full layer controls require figma authorization."}
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
            <div className="space-y-3" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
              event.preventDefault();
              const dropped = event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain");
              if (dropped) setModalUrl(dropped.trim());
            }}>
              <Input value={modalUrl} onChange={(e) => setModalUrl(e.target.value)}
                     placeholder="https://www.figma.com/design/…?node-id=…" autoFocus />
              <div className="rounded border border-dashed border-[#c9c1a8] bg-stone-50/70 px-4 py-5 text-center font-mono text-[10px] uppercase tracking-widest text-stone-500">drop frame link here</div>
              <div className="flex items-center justify-between">
                <button onClick={() => setModalStep("choose")}
                        className="font-mono text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900">connect for layers</button>
                <div className="flex gap-2">
                  {figmaToken && <Button variant="outline" onClick={() => runFigmaImport(modalUrl, figmaToken)} disabled={loading || !modalUrl.trim()}>full import</Button>}
                  <Button onClick={() => previewPublicFigma(modalUrl)} disabled={loading || !modalUrl.trim()}>
                    {loading ? "loading…" : "open public frame"}
                  </Button>
                </div>
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
