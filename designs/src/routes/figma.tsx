import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/boardr/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/figma")({
  head: () => ({
    meta: [
      { title: "figma configurator (lab) — zinegeist" },
      { name: "description", content: "admin lab for turning uploaded figma frames into user-configurable artifacts by tagging layers as locked or customizable." },
      { property: "og:title", content: "figma configurator (lab) — zinegeist" },
      { property: "og:description", content: "tag figma layers as locked or customizable to build configurator packs." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FigmaConfiguratorPage,
});

type LayerRule = {
  id: string;
  name: string;
  kind: "text" | "image" | "shape" | "group" | "other";
  policy: "locked" | "customizable";
  editable?: {
    text?: boolean;
    fill?: boolean;
    image?: boolean;
  };
};

type FigmaConfig = {
  id: string;
  name: string;
  createdAt: number;
  svg: string; // raw SVG markup
  layers: LayerRule[];
};

const LS_KEY = "boardr.figmaConfigs";

function readConfigs(): FigmaConfig[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function writeConfigs(v: FigmaConfig[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(v));
}

function guessKind(el: Element): LayerRule["kind"] {
  const t = el.tagName.toLowerCase();
  if (t === "text" || t === "tspan") return "text";
  if (t === "image") return "image";
  if (t === "g") return "group";
  if (["rect", "circle", "ellipse", "path", "polygon", "polyline", "line"].includes(t)) return "shape";
  return "other";
}

function extractLayers(svg: string): LayerRule[] {
  if (typeof window === "undefined") return [];
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement;
  const layers: LayerRule[] = [];
  const walk = (el: Element) => {
    const id = el.getAttribute("id");
    const name = id || el.getAttribute("data-name") || el.getAttribute("aria-label");
    if (name) {
      const kind = guessKind(el);
      layers.push({
        id: id || `layer-${layers.length}`,
        name,
        kind,
        policy: "locked",
        editable: kind === "text" ? { text: true } : kind === "image" ? { image: true } : { fill: true },
      });
    }
    Array.from(el.children).forEach(walk);
  };
  Array.from(root.children).forEach(walk);
  return layers;
}

function FigmaConfiguratorPage() {
  const [configs, setConfigs] = useState<FigmaConfig[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [svg, setSvg] = useState<string>("");
  const [layers, setLayers] = useState<LayerRule[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setConfigs(readConfigs()); }, []);

  const active = useMemo(() => configs.find((c) => c.id === activeId) || null, [configs, activeId]);

  function loadFile(f: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setSvg(text);
      setLayers(extractLayers(text));
      if (!name) setName(f.name.replace(/\.svg$/i, ""));
    };
    reader.readAsText(f);
  }

  function save() {
    if (!svg || !name.trim()) return;
    const cfg: FigmaConfig = {
      id: activeId || `fig-${Date.now().toString(36)}`,
      name: name.trim(),
      createdAt: Date.now(),
      svg,
      layers,
    };
    const next = activeId
      ? configs.map((c) => (c.id === activeId ? cfg : c))
      : [cfg, ...configs];
    setConfigs(next);
    writeConfigs(next);
    setActiveId(cfg.id);
  }

  function loadConfig(c: FigmaConfig) {
    setActiveId(c.id);
    setName(c.name);
    setSvg(c.svg);
    setLayers(c.layers);
  }

  function reset() {
    setActiveId(null);
    setName("");
    setSvg("");
    setLayers([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function remove(id: string) {
    const next = configs.filter((c) => c.id !== id);
    setConfigs(next);
    writeConfigs(next);
    if (activeId === id) reset();
  }

  function updateLayer(i: number, patch: Partial<LayerRule>) {
    setLayers((cur) => cur.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function updateEditable(i: number, patch: Partial<NonNullable<LayerRule["editable"]>>) {
    setLayers((cur) => cur.map((l, idx) => (idx === i ? { ...l, editable: { ...l.editable, ...patch } } : l)));
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="inline-block rounded-full border border-border bg-card px-3 py-1 font-mono text-[10px] lowercase tracking-wider text-muted-foreground">
          admin lab · figma → configurator
        </div>
        <h1 className="mt-4 font-display text-4xl lowercase tracking-tight">figma configurator</h1>
        <p className="mt-3 max-w-2xl text-sm text-stone-700 leading-relaxed">
          upload a figma frame (export as svg). name each layer in figma before exporting.
          tag each layer as <b>locked</b> or <b>customizable</b>, and pick which properties
          end-users can change. saves to your browser for now — later this pipes into the main app as a configurator pack.
        </p>

        <div className="mt-8 grid lg:grid-cols-[240px_1fr_360px] gap-6">
          {/* saved configs */}
          <aside className="space-y-2">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">saved</h3>
            <button
              onClick={reset}
              className="w-full text-left rounded border border-dashed border-stone-400 px-3 py-2 text-xs hover:bg-stone-50"
            >
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
                <span className="truncate">{c.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(c.id); }}
                  className="text-stone-400 hover:text-rose-600"
                  title="delete"
                >×</button>
              </div>
            ))}
            {configs.length === 0 && (
              <p className="text-[11px] text-muted-foreground">nothing saved yet.</p>
            )}
          </aside>

          {/* preview */}
          <section>
            <div className="flex items-center gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="configurator name" className="max-w-sm" />
              <input
                ref={fileRef}
                type="file"
                accept=".svg,image/svg+xml"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                upload svg
              </Button>
              <Button onClick={save} disabled={!svg || !name.trim()}>
                {activeId ? "update" : "save"}
              </Button>
            </div>

            <div className="mt-4 rounded-md border border-border bg-editor-canvas p-4 min-h-[420px] flex items-center justify-center overflow-auto">
              {svg ? (
                <div
                  className="max-w-full max-h-[560px] [&>svg]:max-w-full [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ) : active ? (
                <div dangerouslySetInnerHTML={{ __html: active.svg }} />
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  upload an svg export from figma to begin.
                  <br />
                  <span className="text-[11px]">tip: give every layer a clear name in figma first.</span>
                </div>
              )}
            </div>
          </section>

          {/* layers */}
          <aside className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">layers ({layers.length})</h3>
              {layers.length > 0 && (
                <button
                  onClick={() => setLayers((cur) => cur.map((l) => ({ ...l, policy: "customizable" })))}
                  className="font-mono text-[10px] uppercase tracking-widest text-stone-600 hover:text-stone-900"
                >
                  unlock all
                </button>
              )}
            </div>
            {layers.length === 0 && (
              <p className="text-[11px] text-muted-foreground">layers with an id or data-name will appear here.</p>
            )}
            <div className="space-y-2 max-h-[560px] overflow-auto no-scrollbar pr-1">
              {layers.map((l, i) => (
                <div key={l.id + i} className="rounded border border-border bg-card p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] truncate">{l.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{l.kind}</p>
                    </div>
                    <label className="flex items-center gap-1 text-[10px] uppercase tracking-widest cursor-pointer">
                      <input
                        type="checkbox"
                        checked={l.policy === "customizable"}
                        onChange={(e) => updateLayer(i, { policy: e.target.checked ? "customizable" : "locked" })}
                      />
                      customizable
                    </label>
                  </div>
                  {l.policy === "customizable" && (
                    <div className="mt-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-widest">
                      {l.kind === "text" && (
                        <label className="flex items-center gap-1">
                          <input type="checkbox" checked={!!l.editable?.text} onChange={(e) => updateEditable(i, { text: e.target.checked })} />
                          text
                        </label>
                      )}
                      {l.kind === "image" && (
                        <label className="flex items-center gap-1">
                          <input type="checkbox" checked={!!l.editable?.image} onChange={(e) => updateEditable(i, { image: e.target.checked })} />
                          image
                        </label>
                      )}
                      <label className="flex items-center gap-1">
                        <input type="checkbox" checked={!!l.editable?.fill} onChange={(e) => updateEditable(i, { fill: e.target.checked })} />
                        color / fill
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
