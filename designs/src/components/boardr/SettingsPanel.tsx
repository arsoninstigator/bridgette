import { useState } from "react";
import type { AssetBase } from "../../lib/boardr/types";

interface Props {
  asset: AssetBase;
  onChange: (patch: Partial<AssetBase>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function SettingsPanel({ asset, onChange, onDelete, onClose }: Props) {
  const [tab, setTab] = useState<"content" | "mechanics">("content");

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
        {tab === "content" ? <ContentTab asset={asset} onChange={onChange} /> : <MechanicsTab asset={asset} onChange={onChange} />}
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

function ContentTab({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
  const hasFront = ["sticky", "paper"].includes(asset.kind);
  const hasCaption = asset.kind === "polaroid";
  const hasImage = ["polaroid", "photo"].includes(asset.kind);
  const hasStrip = asset.kind === "photostrip";
  const hasColor = ["sticky", "paper"].includes(asset.kind);
  const hasTape = asset.kind === "washi";

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
          <Label>Image URL</Label>
          <input
            value={asset.imageUrl ?? ""}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            placeholder="https://…"
            className="w-full rounded-md border border-input bg-background p-2 text-sm font-mono text-xs"
          />
        </Field>
      )}
      {hasStrip && (
        <>
          {(["imageUrl", "imageUrl2", "imageUrl3", "imageUrl4"] as const).map((k, i) => (
            <Field key={k}>
              <Label>Photo {i + 1} URL</Label>
              <input
                value={(asset[k] as string) ?? ""}
                onChange={(e) => onChange({ [k]: e.target.value } as Partial<AssetBase>)}
                className="w-full rounded-md border border-input bg-background p-2 text-xs font-mono"
              />
            </Field>
          ))}
        </>
      )}
      {hasColor && (
        <Field>
          <Label>Color</Label>
          <div className="flex gap-2 flex-wrap">
            {["#fff59d", "#ffd6a5", "#ffadad", "#caffbf", "#bdb2ff", "#a0c4ff", "#fbf7ec"].map((c) => (
              <button
                key={c}
                onClick={() => onChange({ color: c })}
                className={`size-7 rounded-sm border ${asset.color === c ? "ring-2 ring-amber-700" : "border-stone-300"}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>
      )}
      {hasTape && (
        <Field>
          <Label>Tape color</Label>
          <div className="flex gap-2 flex-wrap">
            {[
              "rgba(180,160,210,0.75)",
              "rgba(120,180,160,0.7)",
              "rgba(220,170,140,0.75)",
              "rgba(210,140,150,0.7)",
              "rgba(230,220,140,0.75)",
            ].map((c) => (
              <button
                key={c}
                onClick={() => onChange({ tapeColor: c })}
                className={`h-5 w-9 ${asset.tapeColor === c ? "ring-2 ring-amber-700" : ""}`}
                style={{ background: c }}
              />
            ))}
          </div>
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

function MechanicsTab({ asset, onChange }: { asset: AssetBase; onChange: (p: Partial<AssetBase>) => void }) {
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
      <Field>
        <Toggle
          label="Pin enabled"
          checked={!!asset.pinEnabled}
          onChange={(v) => onChange({ pinEnabled: v })}
        />
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          Adds a push-pin and lets this asset be connected with string.
        </p>
      </Field>
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