import { useEffect, useMemo, useRef, useState } from "react";
import type { AssetBase } from "../../lib/boardr/types";

interface Props {
  asset: AssetBase;
  onChange: (patch: Partial<AssetBase>) => void;
  onDelete: () => void;
  onClose: () => void;
  initialFocus?: "content" | "mechanics" | "tape" | "pin";
}

export function SettingsPanel({ asset, onChange, onDelete, onClose, initialFocus }: Props) {
  const isBlock = asset.kind === "block";
  const tabs: ReadonlyArray<"content" | "style" | "mechanics"> = isBlock
    ? (["content", "style", "mechanics"] as const)
    : (["content", "mechanics"] as const);
  type TabId = "content" | "style" | "mechanics";
  const [tab, setTab] = useState<TabId>(
    initialFocus === "mechanics" || initialFocus === "tape" || initialFocus === "pin" ? "mechanics" : "content",
  );

  // when initialFocus changes (user picks "edit tape" or "edit pin"), scroll the section into view
  const tapeRef = useRef<HTMLDivElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (initialFocus === "tape") tapeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (initialFocus === "pin") pinRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [initialFocus, asset.id]);

  return (
    <aside className="w-[300px] shrink-0 bg-sidebar border-l border-sidebar-border flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {asset.kind}
        </h2>
        <button onClick={onClose} className="font-mono text-xs text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>
      <div className={`grid border-b border-sidebar-border`} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors",
              tab === t
                ? "bg-background text-foreground border-b-2 border-amber-700"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === "content" ? (
          <ContentTab asset={asset} onChange={onChange} />
        ) : tab === "style" ? (
          <BlockStyleTab asset={asset} onChange={onChange} />
        ) : (
          <MechanicsTab asset={asset} onChange={onChange} tapeRef={tapeRef} pinRef={pinRef} highlight={initialFocus} />
        )}
      </div>
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {isBlock && (
          <button
            onClick={() => saveBlockAsTemplate(asset)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs uppercase tracking-wider hover:bg-accent"
          >
            Save as template
          </button>
        )}
        <button
          onClick={onDelete}
          className="w-full rounded-md border border-destructive/40 px-3 py-2 font-mono text-xs uppercase tracking-wider text-destructive hover:bg-destructive/10"
        >
          Delete asset
        </button>
      </div>
    </aside>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
      {children}
    </label>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function ImageInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  function pick() {
    fileRef.current?.click();
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ""));
    reader.readAsDataURL(f);
    e.target.value = "";
  }
  return (
    <div className="space-y-2">
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="paste image url https://…"
        className="w-full rounded-md border border-input bg-background p-2 text-xs font-mono"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={pick}
          className="rounded-md border border-input bg-background px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:bg-accent"
        >
          upload image
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-destructive"
          >
            clear
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      </div>
      {value && (
        <div
          className="h-16 rounded border border-input"
          style={{ background: `center/cover no-repeat url(${value})` }}
        />
      )}
    </div>
  );
}

function readSavedPaletteColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const out = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("boardr:styles:palettes:")) continue;
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const arr = JSON.parse(raw) as { colors?: string[] }[];
      arr.forEach((p) => p.colors?.forEach((c) => out.add(c)));
    }
    return Array.from(out);
  } catch {
    return [];
  }
}

function ColorField({
  label,
  value,
  presets,
  onChange,
  swatchClass = "size-7 rounded-sm border border-stone-300",
}: {
  label: string;
  value?: string;
  presets: string[];
  onChange: (c: string) => void;
  swatchClass?: string;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [hex, setHex] = useState(value && /^#/.test(value) ? value : "#888888");
  const savedColors = useMemo<string[]>(() => readSavedPaletteColors(), []);
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 flex-wrap items-center">
        {presets.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`${swatchClass} ${value === c ? "ring-2 ring-amber-700" : ""}`}
            style={{ background: c }}
            title={c}
          />
        ))}
        <button
          onClick={() => setShowCustom((v) => !v)}
          className={`size-7 rounded-sm border border-dashed border-stone-400 grid place-items-center font-mono text-[10px] text-stone-600 hover:bg-black/5 ${showCustom ? "ring-2 ring-amber-700" : ""}`}
          title="use custom color"
        >
          +
        </button>
      </div>
      {showCustom && (
        <div className="mt-2 rounded-md border border-amber-700/40 bg-amber-50/40 p-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : "#888888"}
              onChange={(e) => { setHex(e.target.value); onChange(e.target.value); }}
              className="h-7 w-9 rounded border border-border bg-transparent"
            />
            <input
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              onBlur={() => onChange(hex)}
              onKeyDown={(e) => e.key === "Enter" && onChange(hex)}
              placeholder="#hex or rgba(…)"
              className="flex-1 rounded border border-border bg-background px-2 py-1 font-mono text-[10px]"
            />
          </div>
          {savedColors.length > 0 && (
            <div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">from your palettes</div>
              <div className="flex gap-1.5 flex-wrap">
                {savedColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setHex(c); onChange(c); }}
                    className={`size-5 rounded-sm border border-stone-300 ${value === c ? "ring-2 ring-amber-700" : ""}`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const STICKY_COLORS = ["#fff59d", "#ffd6a5", "#ffadad", "#caffbf", "#bdb2ff", "#a0c4ff", "#fbf7ec"];
const TAPE_CONTENT_COLORS = [
  "rgba(180,160,210,0.75)",
  "rgba(120,180,160,0.7)",
  "rgba(220,170,140,0.75)",
  "rgba(210,140,150,0.7)",
  "rgba(230,220,140,0.75)",
];

function ContentTab({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
  const hasFront = ["sticky", "paper"].includes(asset.kind);
  const hasCaption = asset.kind === "polaroid";
  const hasImage = ["polaroid", "photo", "icon"].includes(asset.kind);
  const hasStrip = asset.kind === "photostrip";
  const hasColor = ["sticky", "paper"].includes(asset.kind);
  const hasTape = asset.kind === "washi";
  const isMarquee = asset.kind === "marquee";

  return (
    <>
      {hasFront && (
        <Field>
          <Label>Front text</Label>
          <textarea
            value={asset.front ?? ""}
            onChange={(e) => onChange({ front: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-input bg-background p-2 text-sm font-mono"
          />
        </Field>
      )}
      {hasCaption && (
        <Field>
          <Label>Caption</Label>
          <input
            value={asset.caption ?? ""}
            onChange={(e) => onChange({ caption: e.target.value })}
            className="w-full rounded-md border border-input bg-background p-2 text-sm"
          />
        </Field>
      )}
      {hasImage && (
        <Field>
          <Label>Image (url or upload)</Label>
          <ImageInput value={asset.imageUrl} onChange={(v) => onChange({ imageUrl: v })} />
        </Field>
      )}
      {hasStrip && (
        <>
          {(["imageUrl", "imageUrl2", "imageUrl3", "imageUrl4"] as const).map((k, i) => (
            <Field key={k}>
              <Label>Photo {i + 1} (url or upload)</Label>
              <ImageInput
                value={asset[k] as string | undefined}
                onChange={(v) => onChange({ [k]: v } as Partial<AssetBase>)}
              />
            </Field>
          ))}
        </>
      )}
      {hasColor && (
        <Field>
          <ColorField
            label="Color"
            value={asset.color}
            presets={STICKY_COLORS}
            onChange={(c) => onChange({ color: c })}
          />
        </Field>
      )}
      {hasTape && (
        <>
          <Field>
            <ColorField
              label="Tape color"
              value={asset.tapeColor}
              presets={TAPE_CONTENT_COLORS}
              onChange={(c) => onChange({ tapeColor: c })}
              swatchClass="h-5 w-9 rounded-sm border border-stone-300"
            />
          </Field>
          <Field>
            <Label>Opacity ({Math.round((asset.opacity ?? 0.92) * 100)}%)</Label>
            <input
              type="range" min={10} max={100}
              value={Math.round((asset.opacity ?? 0.92) * 100)}
              onChange={(e) => onChange({ opacity: Number(e.target.value) / 100 })}
              className="w-full"
            />
          </Field>
          <Field>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">jagged edges</span>
              <input
                type="checkbox"
                checked={asset.tapeJagged !== false}
                onChange={(e) => onChange({ tapeJagged: e.target.checked })}
              />
            </label>
          </Field>
          <Field>
            <Label>Repeating text (overlay)</Label>
            <input
              value={asset.tapePattern ?? ""}
              onChange={(e) => onChange({ tapePattern: e.target.value })}
              placeholder="e.g. CRIME SCENE DO NOT CROSS"
              className="w-full rounded-md border border-input bg-background p-2 text-xs font-mono"
            />
          </Field>
          {asset.tapePattern && (
            <Field>
              <ColorField
                label="Text color"
                value={asset.tapeTextColor}
                presets={["#0a0a0a", "#fef3c7", "#ffffff", "#b91c1c", "#1e3a8a"]}
                onChange={(c) => onChange({ tapeTextColor: c })}
              />
            </Field>
          )}
          <Field>
            <Label>Pattern image (tiles horizontally)</Label>
            <ImageInput value={asset.imageUrl} onChange={(v) => onChange({ imageUrl: v })} />
          </Field>
        </>
      )}
      {asset.kind === "block" && <BlockContent asset={asset} onChange={onChange} />}
      {asset.kind === "frame" && (
        <>
          <Field>
            <Label>Frame style</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["classic", "ornate", "double", "oval", "scalloped", "polaroid"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ frameStyle: s })}
                  className={`rounded border px-2 py-1.5 font-mono text-[10px] lowercase ${
                    (asset.frameStyle || "classic") === s ? "border-stone-900 bg-accent/40" : "border-border hover:bg-black/5"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Field>
            <ColorField
              label="Frame color"
              value={asset.color}
              presets={["#3a2a1a", "#5b3a22", "#7a5a1a", "#2d2d2d", "#ffffff", "#c9a576"]}
              onChange={(c) => onChange({ color: c })}
            />
          </Field>
          <Field>
            <Label>Inner image (url or upload)</Label>
            <ImageInput value={asset.imageUrl} onChange={(v) => onChange({ imageUrl: v })} />
          </Field>
        </>
      )}
      {isMarquee && (
        <>
          <Field>
            <Label>Marquee text</Label>
            <input
              value={asset.iconText ?? ""}
              onChange={(e) => onChange({ iconText: e.target.value })}
              className="w-full rounded-md border border-input bg-background p-2 text-sm font-mono"
            />
          </Field>
          <Field>
            <Label>Speed ({asset.iconSpeed ?? 18}s per loop)</Label>
            <input
              type="range" min={4} max={60}
              value={asset.iconSpeed ?? 18}
              onChange={(e) => onChange({ iconSpeed: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
          <Field>
            <ColorField
              label="Background"
              value={asset.iconBg}
              presets={["#fef3c7", "#1a1a1a", "#fce7f3", "#dbeafe", "#dcfce7"]}
              onChange={(c) => onChange({ iconBg: c })}
            />
          </Field>
          <Field>
            <ColorField
              label="Text color"
              value={asset.iconFg}
              presets={["#1a1a1a", "#fef3c7", "#9d174d", "#1e3a8a", "#166534"]}
              onChange={(c) => onChange({ iconFg: c })}
            />
          </Field>
        </>
      )}
      {asset.kind === "icon" && (
        <Field>
          <ColorField
            label="Tint (used when no image)"
            value={asset.fill}
            presets={["#1a1a1a", "#b91c1c", "#1e6bbf", "#1d8a4f", "#c9a84c", "#ffffff"]}
            onChange={(c) => onChange({ fill: c })}
          />
        </Field>
      )}
      {asset.flipEnabled && (
        <Field>
          <Label>Back content (flip side)</Label>
          <textarea
            value={asset.back ?? ""}
            onChange={(e) => onChange({ back: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-input bg-background p-2 text-sm font-mono"
          />
        </Field>
      )}
    </>
  );
}

const PIN_COLORS = ["#c0212a", "#1e6bbf", "#c9a84c", "#1d8a4f", "#3a2a1a", "#e8e4dd"];
const TAPE_COLORS = [
  "rgba(86,142,160,0.85)",
  "rgba(180,160,210,0.85)",
  "rgba(220,170,140,0.85)",
  "rgba(210,140,150,0.85)",
  "rgba(230,220,140,0.85)",
  "rgba(120,180,160,0.85)",
];

function MechanicsTab({
  asset,
  onChange,
  tapeRef,
  pinRef,
  highlight,
}: {
  asset: AssetBase;
  onChange: (p: Partial<AssetBase>) => void;
  tapeRef: React.RefObject<HTMLDivElement | null>;
  pinRef: React.RefObject<HTMLDivElement | null>;
  highlight?: "content" | "mechanics" | "tape" | "pin";
}) {
  const canFlip = ["sticky", "polaroid", "photostrip", "photo", "paper"].includes(asset.kind);
  return (
    <>
      {canFlip && (
        <Field>
          <Toggle
            label="Flip side enabled"
            checked={!!asset.flipEnabled}
            onChange={(v) => onChange({ flipEnabled: v })}
          />
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            Viewers see a flip button on the bottom-right corner.
          </p>
        </Field>
      )}

      <div
        ref={pinRef}
        className={`rounded-md p-2 -mx-2 ${highlight === "pin" ? "ring-2 ring-amber-600 bg-amber-50/40" : ""}`}
      >
        <Toggle
          label="Pin enabled"
          checked={!!asset.pinEnabled}
          onChange={(v) => onChange({ pinEnabled: v })}
        />
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          Adds a push-pin; strings only attach pin-to-pin.
        </p>
        {asset.pinEnabled && (
          <div className="mt-2">
            <Label>Pin color</Label>
            <div className="flex gap-2 flex-wrap">
              {PIN_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ pinColor: c })}
                  className={`size-6 rounded-full border border-stone-400 ${(asset.pinColor || asset.color) === c ? "ring-2 ring-amber-700" : ""}`}
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        ref={tapeRef}
        className={`rounded-md p-2 -mx-2 ${highlight === "tape" ? "ring-2 ring-amber-600 bg-amber-50/40" : ""}`}
      >
        <Toggle
          label="Tape attached"
          checked={!!asset.tapeAttached}
          onChange={(v) => onChange({ tapeAttached: v })}
        />
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          Decorative washi strip across the top.
        </p>
        {asset.tapeAttached && (
          <div className="mt-2">
            <Label>Tape color</Label>
            <div className="flex gap-2 flex-wrap">
              {TAPE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ tapeAttachColor: c })}
                  className={`h-5 w-9 ${asset.tapeAttachColor === c ? "ring-2 ring-amber-700" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Field>
        <Label>Rotation ({Math.round(asset.rotation)}°)</Label>
        <input
          type="range"
          min={-45}
          max={45}
          value={asset.rotation}
          onChange={(e) => onChange({ rotation: Number(e.target.value) })}
          className="w-full"
        />
      </Field>
      {asset.width !== undefined && (
        <Field>
          <Label>Width ({asset.width}px)</Label>
          <input
            type="range"
            min={80}
            max={400}
            value={asset.width}
            onChange={(e) => onChange({ width: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      )}
      {asset.height !== undefined && (
        <Field>
          <Label>Height ({asset.height}px)</Label>
          <input
            type="range"
            min={80}
            max={400}
            value={asset.height}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      )}
    </>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="font-mono text-xs uppercase tracking-wider">{label}</span>
      <span
        onClick={() => onChange(!checked)}
        className={`relative inline-block w-10 h-5 rounded-full transition-colors ${checked ? "bg-amber-700" : "bg-stone-300"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`}
        />
      </span>
    </label>
  );
}

function BlockContent({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
  const t = asset.blockType || "table";
  const types: NonNullable<AssetBase["blockType"]>[] = [
    "table", "chips", "tags", "accordion", "tabs",
    "text", "heading", "image", "button", "buttonList", "iconGrid", "input", "layout",
  ];
  return (
    <>
      <Field>
        <Label>Block type</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {types.map((bt) => (
            <button
              key={bt}
              onClick={() => onChange({ blockType: bt })}
              className={`rounded border px-2 py-1.5 font-mono text-[10px] lowercase ${
                t === bt ? "border-stone-900 bg-accent/40" : "border-border hover:bg-black/5"
              }`}
            >
              {bt}
            </button>
          ))}
        </div>
      </Field>
      <BlockDataEditor asset={asset} onChange={onChange} />
    </>
  );
}

// ============ Block data editors (visual, no JSON) ============

function readData<T extends Record<string, unknown>>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return { ...fallback, ...(parsed as object) } as T;
  } catch {
    return fallback;
  }
}
function writeData(onChange: (p: Partial<AssetBase>) => void, data: Record<string, unknown>) {
  onChange({ blockData: JSON.stringify(data) });
}

const inputCls = "w-full rounded border border-input bg-background px-2 py-1 text-xs font-mono";
const btnCls = "rounded border border-input bg-background px-2 py-1 font-mono text-[10px] lowercase hover:bg-accent";
const removeCls = "rounded border border-input bg-background px-1.5 font-mono text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive";

function BlockDataEditor({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
  const t = asset.blockType || "table";
  if (t === "table") return <TableEditor asset={asset} onChange={onChange} />;
  if (t === "chips" || t === "tags") return <ItemListEditor asset={asset} onChange={onChange} placeholder={t === "tags" ? "#tag" : "chip"} />;
  if (t === "accordion") return <AccordionEditor asset={asset} onChange={onChange} />;
  if (t === "tabs") return <TabsEditor asset={asset} onChange={onChange} />;
  if (t === "text") return <SimpleTextEditor asset={asset} onChange={onChange} field="text" multiline label="Body" />;
  if (t === "heading") return <HeadingEditor asset={asset} onChange={onChange} />;
  if (t === "image") return <SimpleTextEditor asset={asset} onChange={onChange} field="caption" label="Caption" />;
  if (t === "button") return <ButtonEditor asset={asset} onChange={onChange} />;
  if (t === "buttonList") return <ButtonListEditor asset={asset} onChange={onChange} />;
  if (t === "iconGrid") return <ItemListEditor asset={asset} onChange={onChange} placeholder="★" />;
  if (t === "input") return <InputBlockEditor asset={asset} onChange={onChange} />;
  if (t === "layout") return <LayoutEditor asset={asset} onChange={onChange} />;
  return null;
}

function TableEditor({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
  const d = readData<{ headers: string[]; rows: string[][] }>(asset.blockData, { headers: ["col 1", "col 2"], rows: [["", ""]] });
  const headers = Array.isArray(d.headers) ? d.headers : [];
  const rows = Array.isArray(d.rows) ? d.rows.map((r) => (Array.isArray(r) ? r : [])) : [];
  const cols = headers.length;

  function update(next: { headers: string[]; rows: string[][] }) {
    writeData(onChange, next);
  }
  function setHeader(i: number, v: string) {
    const h = [...headers]; h[i] = v; update({ headers: h, rows });
  }
  function setCell(ri: number, ci: number, v: string) {
    const next = rows.map((r) => [...r]);
    while (next[ri].length < cols) next[ri].push("");
    next[ri][ci] = v;
    update({ headers, rows: next });
  }
  function addRow() {
    update({ headers, rows: [...rows, Array(cols).fill("")] });
  }
  function removeRow(i: number) {
    update({ headers, rows: rows.filter((_, idx) => idx !== i) });
  }
  function addCol() {
    update({ headers: [...headers, `col ${cols + 1}`], rows: rows.map((r) => [...r, ""]) });
  }
  function removeCol(i: number) {
    update({ headers: headers.filter((_, idx) => idx !== i), rows: rows.map((r) => r.filter((_, idx) => idx !== i)) });
  }

  return (
    <Field>
      <Label>Table</Label>
      <div className="overflow-x-auto rounded border border-input">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="bg-muted/40">
              {headers.map((h, i) => (
                <th key={i} className="p-1 border-b border-input">
                  <div className="flex items-center gap-1">
                    <input value={h} onChange={(e) => setHeader(i, e.target.value)} className="w-full rounded bg-transparent px-1 py-0.5 text-[11px] font-semibold lowercase" />
                    <button onClick={() => removeCol(i)} className={removeCls} title="remove column">×</button>
                  </div>
                </th>
              ))}
              <th className="p-1 border-b border-input w-8">
                <button onClick={addCol} className={btnCls} title="add column">+col</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => (
                  <td key={ci} className="p-1 border-b border-dashed border-input">
                    <input value={row[ci] ?? ""} onChange={(e) => setCell(ri, ci, e.target.value)} className="w-full rounded bg-transparent px-1 py-0.5 text-[11px]" />
                  </td>
                ))}
                <td className="p-1 border-b border-dashed border-input text-center">
                  <button onClick={() => removeRow(ri)} className={removeCls} title="remove row">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className={`${btnCls} mt-2 w-full`}>+ add row</button>
    </Field>
  );
}

function ItemListEditor({ asset, onChange, placeholder }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void; placeholder: string }) {
  const d = readData<{ items: string[] }>(asset.blockData, { items: [] });
  const items = Array.isArray(d.items) ? d.items : [];
  const update = (items: string[]) => writeData(onChange, { items });
  return (
    <Field>
      <Label>Items</Label>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-muted-foreground w-5 text-right">{i + 1}.</span>
            <input value={it} onChange={(e) => update(items.map((x, idx) => (idx === i ? e.target.value : x)))} placeholder={placeholder} className={inputCls} />
            <button onClick={() => update(items.filter((_, idx) => idx !== i))} className={removeCls}>×</button>
          </div>
        ))}
      </div>
      <button onClick={() => update([...items, ""])} className={`${btnCls} mt-2 w-full`}>+ add item</button>
    </Field>
  );
}

function AccordionEditor({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
  const d = readData<{ items: { q: string; a: string }[] }>(asset.blockData, { items: [] });
  const items = Array.isArray(d.items) ? d.items : [];
  const update = (items: { q: string; a: string }[]) => writeData(onChange, { items });
  return (
    <Field>
      <Label>Accordion items</Label>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="rounded border border-input p-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">Q{i + 1}</span>
              <input value={it.q ?? ""} onChange={(e) => update(items.map((x, idx) => (idx === i ? { ...x, q: e.target.value } : x)))} placeholder="question" className={inputCls} />
              <button onClick={() => update(items.filter((_, idx) => idx !== i))} className={removeCls}>×</button>
            </div>
            <textarea value={it.a ?? ""} onChange={(e) => update(items.map((x, idx) => (idx === i ? { ...x, a: e.target.value } : x)))} placeholder="answer" rows={2} className={inputCls} />
          </div>
        ))}
      </div>
      <button onClick={() => update([...items, { q: "", a: "" }])} className={`${btnCls} mt-2 w-full`}>+ add item</button>
    </Field>
  );
}

function TabsEditor({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
  const d = readData<{ items: { label: string; body: string }[] }>(asset.blockData, { items: [] });
  const items = Array.isArray(d.items) ? d.items : [];
  const update = (items: { label: string; body: string }[]) => writeData(onChange, { items });
  return (
    <Field>
      <Label>Tabs</Label>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="rounded border border-input p-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">#{i + 1}</span>
              <input value={it.label ?? ""} onChange={(e) => update(items.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))} placeholder="tab label" className={inputCls} />
              <button onClick={() => update(items.filter((_, idx) => idx !== i))} className={removeCls}>×</button>
            </div>
            <textarea value={it.body ?? ""} onChange={(e) => update(items.map((x, idx) => (idx === i ? { ...x, body: e.target.value } : x)))} placeholder="tab body" rows={2} className={inputCls} />
          </div>
        ))}
      </div>
      <button onClick={() => update([...items, { label: "", body: "" }])} className={`${btnCls} mt-2 w-full`}>+ add tab</button>
    </Field>
  );
}

function SimpleTextEditor({ asset, onChange, field, label, multiline }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void; field: string; label: string; multiline?: boolean }) {
  const d = readData<Record<string, unknown>>(asset.blockData, {});
  const value = typeof d[field] === "string" ? (d[field] as string) : "";
  const set = (v: string) => writeData(onChange, { ...d, [field]: v });
  return (
    <Field>
      <Label>{label}</Label>
      {multiline ? (
        <textarea value={value} onChange={(e) => set(e.target.value)} rows={5} className={inputCls} />
      ) : (
        <input value={value} onChange={(e) => set(e.target.value)} className={inputCls} />
      )}
    </Field>
  );
}

function HeadingEditor({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
  const d = readData<{ text: string; level: number }>(asset.blockData, { text: "", level: 2 });
  return (
    <>
      <Field>
        <Label>Heading text</Label>
        <input value={d.text} onChange={(e) => writeData(onChange, { ...d, text: e.target.value })} className={inputCls} />
      </Field>
      <Field>
        <Label>Level</Label>
        <div className="grid grid-cols-6 gap-1">
          {[1, 2, 3, 4, 5, 6].map((l) => (
            <button key={l} onClick={() => writeData(onChange, { ...d, level: l })} className={`rounded border px-2 py-1 font-mono text-[10px] ${d.level === l ? "border-stone-900 bg-accent/40" : "border-border hover:bg-black/5"}`}>h{l}</button>
          ))}
        </div>
      </Field>
    </>
  );
}

function ButtonEditor({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
  const d = readData<{ label: string; href: string }>(asset.blockData, { label: "", href: "" });
  return (
    <>
      <Field><Label>Label</Label><input value={d.label} onChange={(e) => writeData(onChange, { ...d, label: e.target.value })} className={inputCls} /></Field>
      <Field><Label>Link (href)</Label><input value={d.href} onChange={(e) => writeData(onChange, { ...d, href: e.target.value })} placeholder="#" className={inputCls} /></Field>
    </>
  );
}

function ButtonListEditor({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
  const d = readData<{ items: { label: string; href: string; variant: string }[] }>(asset.blockData, { items: [] });
  const items = Array.isArray(d.items) ? d.items : [];
  const update = (items: { label: string; href: string; variant: string }[]) => writeData(onChange, { items });
  return (
    <Field>
      <Label>Buttons</Label>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="rounded border border-input p-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <input value={it.label ?? ""} onChange={(e) => update(items.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))} placeholder="label" className={inputCls} />
              <button onClick={() => update(items.filter((_, idx) => idx !== i))} className={removeCls}>×</button>
            </div>
            <input value={it.href ?? ""} onChange={(e) => update(items.map((x, idx) => (idx === i ? { ...x, href: e.target.value } : x)))} placeholder="href" className={inputCls} />
            <div className="flex gap-1">
              {(["solid", "ghost"] as const).map((v) => (
                <button key={v} onClick={() => update(items.map((x, idx) => (idx === i ? { ...x, variant: v } : x)))} className={`flex-1 rounded border px-2 py-1 font-mono text-[10px] lowercase ${it.variant === v ? "border-stone-900 bg-accent/40" : "border-border hover:bg-black/5"}`}>{v}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => update([...items, { label: "", href: "", variant: "solid" }])} className={`${btnCls} mt-2 w-full`}>+ add button</button>
    </Field>
  );
}

function InputBlockEditor({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
  const d = readData<{ label: string; placeholder: string; cta: string }>(asset.blockData, { label: "", placeholder: "", cta: "" });
  return (
    <>
      <Field><Label>Field label</Label><input value={d.label} onChange={(e) => writeData(onChange, { ...d, label: e.target.value })} className={inputCls} /></Field>
      <Field><Label>Placeholder</Label><input value={d.placeholder} onChange={(e) => writeData(onChange, { ...d, placeholder: e.target.value })} className={inputCls} /></Field>
      <Field><Label>Button text</Label><input value={d.cta} onChange={(e) => writeData(onChange, { ...d, cta: e.target.value })} className={inputCls} /></Field>
    </>
  );
}

function LayoutEditor({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
  const d = readData<Record<string, unknown>>(asset.blockData, { variant: "hero" });
  const variant = (d.variant as string) || "hero";
  const set = (patch: Record<string, unknown>) => writeData(onChange, { ...d, ...patch });
  const variants = ["hero", "two-up", "gallery", "list", "quote", "footer", "bento"];
  return (
    <>
      <Field>
        <Label>Layout variant</Label>
        <div className="grid grid-cols-3 gap-1">
          {variants.map((v) => (
            <button key={v} onClick={() => set({ variant: v })} className={`rounded border px-2 py-1 font-mono text-[10px] lowercase ${variant === v ? "border-stone-900 bg-accent/40" : "border-border hover:bg-black/5"}`}>{v}</button>
          ))}
        </div>
      </Field>
      {variant === "hero" && (
        <>
          <Field><Label>Eyebrow</Label><input value={(d.eyebrow as string) || ""} onChange={(e) => set({ eyebrow: e.target.value })} className={inputCls} /></Field>
          <Field><Label>Title</Label><input value={(d.title as string) || ""} onChange={(e) => set({ title: e.target.value })} className={inputCls} /></Field>
          <Field><Label>Body</Label><textarea value={(d.body as string) || ""} onChange={(e) => set({ body: e.target.value })} rows={3} className={inputCls} /></Field>
          <Field><Label>CTA</Label><input value={(d.cta as string) || ""} onChange={(e) => set({ cta: e.target.value })} className={inputCls} /></Field>
        </>
      )}
      {variant === "two-up" && (
        <>
          {(["left", "right"] as const).map((side) => {
            const col = (d[side] as { title?: string; body?: string }) || {};
            return (
              <div key={side} className="rounded border border-input p-2 space-y-1.5 mb-2">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{side} column</div>
                <input value={col.title ?? ""} onChange={(e) => set({ [side]: { ...col, title: e.target.value } })} placeholder="title" className={inputCls} />
                <textarea value={col.body ?? ""} onChange={(e) => set({ [side]: { ...col, body: e.target.value } })} placeholder="body" rows={3} className={inputCls} />
              </div>
            );
          })}
        </>
      )}
      {variant === "gallery" && (
        <>
          <Field>
            <Label>Image URLs</Label>
            <div className="space-y-1.5">
              {(Array.isArray(d.items) ? (d.items as string[]) : []).map((u, i, arr) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground w-5">{i + 1}</span>
                  <input value={u} onChange={(e) => set({ items: arr.map((x, idx) => (idx === i ? e.target.value : x)) })} placeholder="https://…" className={inputCls} />
                  <button onClick={() => set({ items: arr.filter((_, idx) => idx !== i) })} className={removeCls}>×</button>
                </div>
              ))}
            </div>
            <button onClick={() => set({ items: [...(Array.isArray(d.items) ? (d.items as string[]) : []), ""] })} className={`${btnCls} mt-2 w-full`}>+ add image</button>
          </Field>
          <Field><Label>Caption</Label><input value={(d.caption as string) || ""} onChange={(e) => set({ caption: e.target.value })} className={inputCls} /></Field>
        </>
      )}
      {variant === "list" && (
        <>
          <Field><Label>Title</Label><input value={(d.title as string) || ""} onChange={(e) => set({ title: e.target.value })} className={inputCls} /></Field>
          <Field>
            <Label>List items</Label>
            <div className="space-y-1.5">
              {(Array.isArray(d.items) ? (d.items as string[]) : []).map((it, i, arr) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground w-5">{i + 1}</span>
                  <input value={it} onChange={(e) => set({ items: arr.map((x, idx) => (idx === i ? e.target.value : x)) })} className={inputCls} />
                  <button onClick={() => set({ items: arr.filter((_, idx) => idx !== i) })} className={removeCls}>×</button>
                </div>
              ))}
            </div>
            <button onClick={() => set({ items: [...(Array.isArray(d.items) ? (d.items as string[]) : []), ""] })} className={`${btnCls} mt-2 w-full`}>+ add item</button>
          </Field>
        </>
      )}
      {variant === "quote" && (
        <>
          <Field><Label>Quote</Label><textarea value={(d.quote as string) || ""} onChange={(e) => set({ quote: e.target.value })} rows={3} className={inputCls} /></Field>
          <Field><Label>Author</Label><input value={(d.author as string) || ""} onChange={(e) => set({ author: e.target.value })} className={inputCls} /></Field>
        </>
      )}
      {variant === "footer" && (
        <>
          <Field><Label>Brand</Label><input value={(d.brand as string) || ""} onChange={(e) => set({ brand: e.target.value })} className={inputCls} /></Field>
          <Field>
            <Label>Columns</Label>
            <div className="space-y-2">
              {(Array.isArray(d.columns) ? (d.columns as { title: string; items: string[] }[]) : []).map((col, ci, cols) => (
                <div key={ci} className="rounded border border-input p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input value={col.title ?? ""} onChange={(e) => set({ columns: cols.map((x, idx) => (idx === ci ? { ...x, title: e.target.value } : x)) })} placeholder="column title" className={inputCls} />
                    <button onClick={() => set({ columns: cols.filter((_, idx) => idx !== ci) })} className={removeCls}>×</button>
                  </div>
                  {(Array.isArray(col.items) ? col.items : []).map((it, ii, its) => (
                    <div key={ii} className="flex items-center gap-1.5 pl-3">
                      <input value={it} onChange={(e) => set({ columns: cols.map((x, idx) => (idx === ci ? { ...x, items: its.map((y, j) => (j === ii ? e.target.value : y)) } : x)) })} className={inputCls} />
                      <button onClick={() => set({ columns: cols.map((x, idx) => (idx === ci ? { ...x, items: its.filter((_, j) => j !== ii) } : x)) })} className={removeCls}>×</button>
                    </div>
                  ))}
                  <button onClick={() => set({ columns: cols.map((x, idx) => (idx === ci ? { ...x, items: [...(Array.isArray(x.items) ? x.items : []), ""] } : x)) })} className={`${btnCls} w-full`}>+ add link</button>
                </div>
              ))}
            </div>
            <button onClick={() => set({ columns: [...(Array.isArray(d.columns) ? (d.columns as unknown[]) : []), { title: "", items: [] }] })} className={`${btnCls} mt-2 w-full`}>+ add column</button>
          </Field>
          <Field><Label>Copyright</Label><input value={(d.copyright as string) || ""} onChange={(e) => set({ copyright: e.target.value })} className={inputCls} /></Field>
        </>
      )}
      {variant === "bento" && (
        <Field>
          <Label>Bento cells</Label>
          <div className="space-y-2">
            {(Array.isArray(d.items) ? (d.items as { title: string; body: string }[]) : []).map((it, i, arr) => (
              <div key={i} className="rounded border border-input p-2 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input value={it.title ?? ""} onChange={(e) => set({ items: arr.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)) })} placeholder="title" className={inputCls} />
                  <button onClick={() => set({ items: arr.filter((_, idx) => idx !== i) })} className={removeCls}>×</button>
                </div>
                <textarea value={it.body ?? ""} onChange={(e) => set({ items: arr.map((x, idx) => (idx === i ? { ...x, body: e.target.value } : x)) })} placeholder="body" rows={2} className={inputCls} />
              </div>
            ))}
          </div>
          <button onClick={() => set({ items: [...(Array.isArray(d.items) ? (d.items as unknown[]) : []), { title: "", body: "" }] })} className={`${btnCls} mt-2 w-full`}>+ add cell</button>
        </Field>
      )}
    </>
  );
}

// ============ Style tab (blocks only) ============

function BlockStyleTab({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
  const s = asset.blockStyle || {};
  const setS = (patch: Partial<NonNullable<AssetBase["blockStyle"]>>) =>
    onChange({ blockStyle: { ...s, ...patch } });
  const t = asset.blockType || "table";

  return (
    <>
      <Field>
        <Label>Padding ({s.padding ?? 10}px)</Label>
        <input
          type="range" min={0} max={32} value={s.padding ?? 10}
          onChange={(e) => setS({ padding: parseInt(e.target.value, 10) })}
          className="w-full"
        />
      </Field>
      <Field>
        <Label>Corner radius ({s.radius ?? 3}px)</Label>
        <input
          type="range" min={0} max={24} value={s.radius ?? 3}
          onChange={(e) => setS({ radius: parseInt(e.target.value, 10) })}
          className="w-full"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field>
          <Label>Background</Label>
          <input type="color" value={s.bg ?? "#fbf7ec"} onChange={(e) => setS({ bg: e.target.value })} className="h-8 w-full rounded border border-input bg-background" />
        </Field>
        <Field>
          <Label>Text</Label>
          <input type="color" value={s.fg ?? "#1f1a14"} onChange={(e) => setS({ fg: e.target.value })} className="h-8 w-full rounded border border-input bg-background" />
        </Field>
      </div>
      <Field>
        <Label>Border</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {(["none", "solid", "dashed", "dotted"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setS({ borderStyle: b })}
              className={`rounded border px-2 py-1.5 font-mono text-[10px] lowercase ${
                (s.borderStyle ?? "none") === b ? "border-stone-900 bg-accent/40" : "border-border hover:bg-black/5"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </Field>
      {s.borderStyle && s.borderStyle !== "none" && (
        <div className="grid grid-cols-2 gap-2">
          <Field>
            <Label>Border color</Label>
            <input type="color" value={s.borderColor ?? "#1f1a14"} onChange={(e) => setS({ borderColor: e.target.value })} className="h-8 w-full rounded border border-input bg-background" />
          </Field>
          <Field>
            <Label>Width ({s.borderWidth ?? 1}px)</Label>
            <input type="range" min={1} max={6} value={s.borderWidth ?? 1} onChange={(e) => setS({ borderWidth: parseInt(e.target.value, 10) })} className="w-full" />
          </Field>
        </div>
      )}
      <Field>
        <label className="flex items-center gap-2 font-mono text-[11px] lowercase text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={s.shadow !== false}
            onChange={(e) => setS({ shadow: e.target.checked })}
          />
          drop shadow
        </label>
      </Field>

      {t === "table" && (
        <>
          <div className="h-px bg-sidebar-border my-1" />
          <Field>
            <Label>Row density</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["compact", "cozy", "roomy"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setS({ tableDensity: d })}
                  className={`rounded border px-2 py-1.5 font-mono text-[10px] lowercase ${
                    (s.tableDensity ?? "cozy") === d ? "border-stone-900 bg-accent/40" : "border-border hover:bg-black/5"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Field>
            <Label>Row dividers</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["solid", "dashed", "none"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setS({ tableDividers: d })}
                  className={`rounded border px-2 py-1.5 font-mono text-[10px] lowercase ${
                    (s.tableDividers ?? "dashed") === d ? "border-stone-900 bg-accent/40" : "border-border hover:bg-black/5"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Field>
            <label className="flex items-center gap-2 font-mono text-[11px] lowercase text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={s.tableHeaderUnderline !== false}
                onChange={(e) => setS({ tableHeaderUnderline: e.target.checked })}
              />
              header underline
            </label>
          </Field>
        </>
      )}
    </>
  );
}
