import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PorterSquiggle, PorterStitches } from "@/porter/PorterShell";
import { fetchFigmaFrame, parsePsdFile, parseAiOrEps, LS_TOKEN } from "@/porter/parse";
import type { LayerNode } from "@/porter/parse";
import { FORMATS, measure, convert, download } from "@/porter/convert";
import type { Doc, FormatId } from "@/porter/convert";

export const Route = createFileRoute("/crossvert")({
  head: () => ({
    meta: [
      { title: "crossvert — convert figma, psd, ai & eps in any direction" },
      {
        name: "description",
        content:
          "crossvert parses figma frames, psd, ai and eps files into one layer model, then writes them back out as psd, eps, svg, png or a layer pack — any source to any target.",
      },
      { property: "og:title", content: "crossvert — any design file to any other" },
      { property: "og:description", content: "figma ⇄ psd ⇄ ai ⇄ eps, layer tree preserved." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Crossvert,
});

const SOURCES = FORMATS.filter((f) => f.asSource);
const TARGETS = FORMATS.filter((f) => f.asTarget);

function Crossvert() {
  const [source, setSource] = useState<FormatId>("figma");
  const [target, setTarget] = useState<FormatId>("psd");
  const [doc, setDoc] = useState<Doc | null>(null);
  const [preview, setPreview] = useState<string | undefined>();
  const [figmaUrl, setFigmaUrl] = useState("");
  const [token, setToken] = useState(() => (typeof window === "undefined" ? "" : localStorage.getItem(LS_TOKEN) || ""));
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function land(name: string, layers: LayerNode[], rootIds: string[], prev?: string) {
    setDoc({ name, layers, rootIds, ...measure(layers) });
    setPreview(prev);
    setDone(null);
  }

  async function extractFromZip(f: File) {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(await f.arrayBuffer());
    const entries = Object.values(zip.files).filter((e) => !e.dir);
    for (const k of ["psd", "ai", "eps"] as const) {
      const hit = entries.find((e) => new RegExp(`\\.${k}$`, "i").test(e.name));
      if (hit) {
        const blob = await hit.async("blob");
        return { file: new File([blob], hit.name.split("/").pop() || hit.name), kind: k };
      }
    }
    return null;
  }

  async function onFile(f: File) {
    setErr(null);
    setBusy("reading the file…");
    try {
      let file = f;
      let kind = (source === "psd" || source === "ai" || source === "eps" ? source : "psd") as "psd" | "ai" | "eps";
      const m = f.name.match(/\.(psd|ai|eps)$/i);
      if (m) kind = m[1].toLowerCase() as typeof kind;
      if (/\.zip$/i.test(f.name)) {
        const x = await extractFromZip(f);
        if (!x) throw new Error(`no .psd / .ai / .eps found inside ${f.name}`);
        file = x.file;
        kind = x.kind;
      }
      const res = kind === "psd" ? await parsePsdFile(file) : await parseAiOrEps(file, kind);
      setSource(kind);
      land(file.name, res.layers, res.rootIds, res.preview);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(null);
    }
  }

  async function onFigma() {
    setErr(null);
    if (!token.trim()) return setErr("paste a figma personal access token first.");
    if (!figmaUrl.trim()) return setErr("paste the figma frame url.");
    setBusy("talking to figma…");
    try {
      localStorage.setItem(LS_TOKEN, token.trim());
      const res = await fetchFigmaFrame(figmaUrl.trim(), token.trim());
      setSource("figma");
      land(res.layers[0]?.name || "figma frame", res.layers, res.rootIds, res.preview);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(null);
    }
  }

  async function run() {
    if (!doc) return setErr("bring in a source file first.");
    setErr(null);
    setBusy("converting…");
    try {
      const out = await convert(doc, target);
      download(out.blob, out.filename);
      setDone(out.filename);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(null);
    }
  }

  const targetNote = FORMATS.find((f) => f.id === target)?.note;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <PorterStitches />
      <h1 className="mt-2 font-display text-5xl lowercase tracking-tight">
        cross<span className="porter-highlight">vert</span>
      </h1>
      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-stone-700">
        one layer model, every direction. bring in a figma frame, a .psd, an .ai or an .eps (zips work too),
        then write it back out as any of the others — layer names, order, opacity and geometry carried across.
      </p>

      {/* direction picker */}
      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_auto_1fr] items-start">
        <div className="porter-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500">from</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SOURCES.map((f) => (
              <button
                key={f.id}
                onClick={() => setSource(f.id)}
                className={`porter-chip px-3 py-1.5 font-mono text-[11px] lowercase tracking-wide ${
                  source === f.id ? "bg-[#8aa06e] text-stone-50" : "bg-white text-stone-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {source === "figma" ? (
            <div className="mt-5 space-y-3">
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="figma personal access token"
                type="password"
                className="w-full rounded-lg border-2 border-[#d9d2bd] bg-white px-3 py-2 font-mono text-xs outline-none focus:border-[#8aa06e]"
              />
              <input
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                placeholder="https://figma.com/design/…?node-id=4-2"
                className="w-full rounded-lg border-2 border-[#d9d2bd] bg-white px-3 py-2 font-mono text-xs outline-none focus:border-[#8aa06e]"
              />
              <button
                onClick={onFigma}
                className="porter-btn bg-[#4b53d6] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50"
              >
                pull frame
              </button>
            </div>
          ) : (
            <div className="mt-5">
              <input
                ref={fileRef}
                type="file"
                accept=".psd,.ai,.eps,.zip"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) onFile(f);
                }}
                className="cursor-pointer rounded-xl border-2 border-dashed border-[#c9c1a8] bg-white/70 px-4 py-10 text-center"
              >
                <p className="font-display text-lg lowercase">drop a .{source} here</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-stone-500">or click to browse · .zip ok</p>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex h-full items-center justify-center pt-16 font-display text-4xl text-[#7ab0d6]">→</div>

        <div className="porter-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500">to</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TARGETS.map((f) => (
              <button
                key={f.id}
                onClick={() => setTarget(f.id)}
                className={`porter-chip px-3 py-1.5 font-mono text-[11px] lowercase tracking-wide ${
                  target === f.id ? "bg-[#e8a0b4] text-stone-900" : "bg-white text-stone-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-stone-600">{targetNote}</p>
          <button
            onClick={run}
            disabled={!doc || !!busy}
            className="porter-btn mt-5 bg-[#8aa06e] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50 disabled:opacity-40"
          >
            {busy ? busy : `convert → ${FORMATS.find((f) => f.id === target)?.label}`}
          </button>
          {done && <p className="mt-3 font-mono text-[11px] text-[#2b8f76]">downloaded {done}</p>}
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border-2 border-[#e0a2a2] bg-[#fdeeee] px-4 py-3 font-mono text-xs text-stone-700">{err}</div>
      )}

      <PorterSquiggle className="mt-14 h-12 w-full text-[#4b53d6]/60" />

      {/* parsed doc */}
      <div className="mt-10 grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="porter-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500">parsed layers</p>
          {!doc ? (
            <p className="mt-4 text-sm text-stone-600">nothing loaded yet.</p>
          ) : (
            <>
              <p className="mt-2 font-display text-xl lowercase">
                {doc.name} · {doc.width}×{doc.height}
              </p>
              <ul className="mt-3 max-h-80 overflow-auto pr-1">
                {doc.layers.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center gap-2 border-b border-dashed border-[#e2dbc6] py-1.5 text-sm"
                    style={{ paddingLeft: l.depth * 12 }}
                  >
                    <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">{l.kind}</span>
                    <span className="truncate">{l.name}</span>
                    {l.hasEffects && <span className="porter-chip bg-[#e8ff4a] px-1.5 font-mono text-[9px]">fx</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="porter-card flex items-center justify-center p-5">
          {preview ? (
            <img src={preview} alt={`preview of ${doc?.name ?? "source file"}`} className="max-h-80 w-auto" />
          ) : (
            <p className="text-sm text-stone-500">no raster preview for this source.</p>
          )}
        </div>
      </div>

      <div className="mt-14 porter-card p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500">fidelity, honestly</p>
        <ul className="mt-3 grid gap-3 md:grid-cols-2 text-sm text-stone-600">
          {FORMATS.map((f) => (
            <li key={f.id} className="border-l-4 border-[#7ab0d6] pl-3">
              <span className="font-display text-base lowercase text-stone-800">{f.label}</span> — {f.note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
