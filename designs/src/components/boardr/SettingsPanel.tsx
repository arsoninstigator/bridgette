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
  const [tab, setTab] = useState<"content" | "mechanics">(
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
      <div className="grid grid-cols-2 border-b border-sidebar-border">
        {(["content", "mechanics"] as const).map((t) => (
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
        ) : (
          <MechanicsTab asset={asset} onChange={onChange} tapeRef={tapeRef} pinRef={pinRef} highlight={initialFocus} />
        )}
      </div>
      <div className="p-3 border-t border-sidebar-border">
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
        </>
      )}
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
