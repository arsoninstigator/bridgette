import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import type { AssetBase } from "../../lib/boardr/types";
import pushpinAsset from "@/assets/pushpin.svg.asset.json";

// Hue-rotate mapping for recoloring the (raster-inside-svg) pushpin which is
// natively red. Values are approximate so the pin still reads as a tack.
const PIN_HUE: Record<string, number> = {
  "#c0212a": 0,        // red (default)
  "#1e6bbf": 210,      // blue
  "#c9a84c": 35,       // brass/gold (also lower saturation via filter)
  "#1d8a4f": 120,      // green
  "#3a2a1a": 0,        // dark brown (use saturate 0)
  "#e8e4dd": 0,        // ivory (use saturate 0 + brightness)
};
function pinFilter(color?: string, highlight?: boolean): string {
  const c = color || "#c0212a";
  let f = "";
  if (c === "#3a2a1a") f = "saturate(0) brightness(0.55)";
  else if (c === "#e8e4dd") f = "saturate(0) brightness(1.6)";
  else if (c === "#c9a84c") f = `hue-rotate(${PIN_HUE[c]}deg) saturate(0.7) brightness(1.1)`;
  else f = `hue-rotate(${PIN_HUE[c] ?? 0}deg)`;
  f += highlight
    ? " drop-shadow(0 0 5px rgba(250,204,21,0.95))"
    : " drop-shadow(0 2px 2px rgba(0,0,0,0.45))";
  return f;
}

interface Props {
  asset: AssetBase;
  selected?: boolean;
  interactive?: boolean; // editor only
  previewFlipped?: boolean; // viewer-state when flip toggled
  onPointerDown?: (e: React.PointerEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onResize?: (w: number, h: number) => void;
  onPatch?: (p: Partial<AssetBase>) => void; // partial update from inside the asset (e.g. inline image upload)
  pinHighlight?: boolean; // string mode highlight
  hidePin?: boolean; // when true, AssetItem skips drawing the pin overlay (canvas draws it on top)
}

/** Shared analog-feel asset renderer. */
export function AssetItem({
  asset,
  selected,
  interactive,
  previewFlipped,
  onPointerDown,
  onClick,
  onContextMenu,
  onResize,
  onPatch,
  pinHighlight,
  hidePin,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    if (previewFlipped !== undefined) setFlipped(false);
  }, [previewFlipped, asset.id]);

  const showBack = (asset.flipEnabled && flipped) || false;
  const resizable = interactive && !asset.locked && onResize && asset.kind !== "pin";

  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    left: asset.x,
    top: asset.y,
    transform: `translate(-50%, -50%) rotate(${asset.rotation}deg)`,
    zIndex: asset.z,
    cursor: interactive ? (asset.locked ? "not-allowed" : "grab") : "default",
    touchAction: "none",
  };

  function startResize(e: React.PointerEvent) {
    if (!onResize) return;
    e.stopPropagation();
    e.preventDefault();
    const d = defaultSize(asset);
    const startX = e.clientX;
    const startY = e.clientY;
    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      onResize!(Math.max(40, d.w + dx), Math.max(20, d.h + dy));
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div
      data-asset-id={asset.id}
      style={wrapperStyle}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={[
        "select-none transition-transform duration-150",
        interactive && !asset.locked ? "hover:scale-[1.02]" : "",
        selected ? "ring-2 ring-offset-2 ring-amber-700/60 rounded-sm" : "",
      ].join(" ")}
    >
      <div className="relative">
        {renderAssetBody(asset, showBack, interactive, onPatch)}
        {asset.tapeAttached && <AttachedTape color={asset.tapeAttachColor} />}
        {asset.pinEnabled && !hidePin && <PushPin color={asset.pinColor || asset.color} highlight={pinHighlight} />}
        {asset.locked && interactive && (
          <div
            className="absolute -top-2 -left-2 size-5 rounded-full bg-stone-900/85 text-stone-50 grid place-items-center"
            style={{ pointerEvents: "none" }}
            title="locked"
          >
            <Lock size={10} />
          </div>
        )}
        {asset.flipEnabled && !interactive && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setFlipped((f) => !f);
            }}
            aria-label="flip"
            className="absolute inset-0 bg-transparent border-0 p-0 m-0 cursor-pointer"
            style={{ zIndex: 40 }}
            title="tap to flip"
          />
        )}
        {resizable && selected && (
          <div
            onPointerDown={startResize}
            onClick={(e) => e.stopPropagation()}
            className="absolute -bottom-1 -right-1 size-3 bg-amber-700 border border-white rounded-sm cursor-nwse-resize"
            style={{ zIndex: 50 }}
            title="drag to resize"
          />
        )}
      </div>
    </div>
  );
}

function defaultSize(a: AssetBase): { w: number; h: number } {
  switch (a.kind) {
    case "sticky":
      return { w: a.width ?? 180, h: a.height ?? 180 };
    case "polaroid": {
      const w = a.width ?? 200;
      return { w, h: w + 32 };
    }
    case "photostrip":
      return { w: a.width ?? 110, h: a.height ?? 372 };
    case "photo":
      return { w: a.width ?? 220, h: a.height ?? 160 };
    case "paper":
      return { w: a.width ?? 220, h: a.height ?? 140 };
    case "washi":
      return { w: a.width ?? 200, h: 28 };
    case "shape":
      return { w: a.width ?? 140, h: a.height ?? 140 };
    case "pin":
      return { w: 18, h: 18 };
    case "icon":
      return { w: a.width ?? 64, h: a.height ?? 64 };
    case "marquee":
      return { w: a.width ?? 320, h: a.height ?? 40 };
    case "frame":
      return { w: a.width ?? 220, h: a.height ?? 260 };
  }
}

function PushPin({ highlight, color }: { highlight?: boolean; color?: string }) {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2"
      style={{ top: -20, pointerEvents: "none" }}
    >
      <PinImage color={color} highlight={highlight} size={28} />
    </div>
  );
}

/** Standalone pin image — also used in the canvas's top "pins" layer that
 * sits above the string layer so strings appear to wrap under the pin. */
export function PinImage({
  color,
  highlight,
  size = 28,
}: {
  color?: string;
  highlight?: boolean;
  size?: number;
}) {
  return (
    <img
      src={pushpinAsset.url}
      alt=""
      width={size}
      height={size}
      draggable={false}
      style={{
        display: "block",
        filter: pinFilter(color, highlight),
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}

function AttachedTape({ color }: { color?: string }) {
  const c = color || "rgba(86,142,160,0.85)";
  // jagged V-shape edge clip (same as washi for visual consistency)
  const clip =
    "polygon(0 20%, 4% 0, 8% 22%, 12% 0, 16% 22%, 20% 0, 24% 22%, 28% 0, 32% 22%, 36% 0, 40% 22%, 44% 0, 48% 22%, 52% 0, 56% 22%, 60% 0, 64% 22%, 68% 0, 72% 22%, 76% 0, 80% 22%, 84% 0, 88% 22%, 92% 0, 96% 22%, 100% 0, 100% 80%, 96% 100%, 92% 78%, 88% 100%, 84% 78%, 80% 100%, 76% 78%, 72% 100%, 68% 78%, 64% 100%, 60% 78%, 56% 100%, 52% 78%, 48% 100%, 44% 78%, 40% 100%, 36% 78%, 32% 100%, 28% 78%, 24% 100%, 20% 78%, 16% 100%, 12% 78%, 8% 100%, 4% 78%, 0 100%)";
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2"
      style={{
        top: -14,
        width: 96,
        height: 28,
        background: c,
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.22) 0 5px, transparent 5px 10px)",
        boxShadow:
          "0 2px 6px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.25)",
        opacity: 0.92,
        transform: "translate(-50%, 0) rotate(-3deg)",
        pointerEvents: "none",
        clipPath: clip,
      }}
    />
  );
}

function PlusOverlay({
  onPick,
  interactive,
}: {
  onPick: (dataUrl: string) => void;
  interactive?: boolean;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  if (!interactive) return null;
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        ref.current?.click();
      }}
      title="add a photo"
      className="absolute inset-0 grid place-items-center cursor-pointer bg-transparent border-0 m-0 p-0"
      style={{ zIndex: 5 }}
    >
      <div
        className="grid place-items-center rounded-full"
        style={{
          width: 56,
          height: 56,
          background: "rgba(255,255,255,0.85)",
          color: "rgba(120,100,90,0.7)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          fontSize: 36,
          fontWeight: 200,
          lineHeight: 1,
        }}
      >
        +
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const fr = new FileReader();
          fr.onload = () => onPick(String(fr.result || ""));
          fr.readAsDataURL(f);
          e.target.value = "";
        }}
      />
    </button>
  );
}


function renderAssetBody(a: AssetBase, back: boolean) {
  switch (a.kind) {
    case "sticky": {
      const color = a.color || "#fff59d";
      return (
        <div
          className="analog-shadow font-mono text-[13px] leading-snug text-stone-800 whitespace-pre-wrap"
          style={{
            width: a.width ?? 180,
            height: a.height ?? 180,
            background: color,
            padding: 14,
            borderRadius: 2,
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.4), rgba(0,0,0,0.04))",
          }}
        >
          {back ? a.back : a.front}
        </div>
      );
    }
    case "polaroid": {
      const w = a.width ?? 200;
      return (
        <div
          className="analog-shadow bg-white"
          style={{ width: w, padding: 12, paddingBottom: 44, borderRadius: 2 }}
        >
          {back ? (
            <div
              className="font-mono text-[12px] text-stone-700 whitespace-pre-wrap"
              style={{ width: w - 24, minHeight: w - 24 }}
            >
              {a.back}
            </div>
          ) : (
            <div
              style={{
                width: w - 24,
                height: w - 24,
                background: a.imageUrl
                  ? `center/cover no-repeat url(${a.imageUrl})`
                  : "linear-gradient(135deg,#e8e4dd,#c9b99a)",
              }}
            />
          )}
          <div
            className="absolute left-0 right-0 text-center text-stone-700"
            style={{
              bottom: 10,
              fontFamily: "Caveat, cursive",
              fontSize: 18,
            }}
          >
            {a.caption}
          </div>
        </div>
      );
    }
    case "photostrip": {
      const photos = [a.imageUrl, a.imageUrl2, a.imageUrl3, a.imageUrl4];
      return (
        <div
          className="analog-shadow bg-stone-900"
          style={{ width: 110, padding: 8, borderRadius: 2 }}
        >
          {back ? (
            <div
              className="bg-white p-2 font-mono text-[11px] text-stone-700 whitespace-pre-wrap"
              style={{ minHeight: 360 }}
            >
              {a.back}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {photos.map((p, i) => (
                <div
                  key={i}
                  style={{
                    width: 94,
                    height: 80,
                    background: p
                      ? `center/cover no-repeat url(${p})`
                      : "linear-gradient(135deg,#3a3a3a,#1a1a1a)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      );
    }
    case "photo": {
      const w = a.width ?? 220;
      const h = a.height ?? 160;
      return (
        <div
          className="analog-shadow bg-white"
          style={{ width: w, height: h, padding: 4 }}
        >
          {back ? (
            <div className="size-full bg-stone-100 p-2 font-mono text-[12px] text-stone-700 whitespace-pre-wrap">
              {a.back}
            </div>
          ) : (
            <div
              className="size-full"
              style={{
                background: a.imageUrl
                  ? `center/cover no-repeat url(${a.imageUrl})`
                  : "linear-gradient(135deg,#e8e4dd,#a8957a)",
              }}
            />
          )}
        </div>
      );
    }
    case "paper": {
      return (
        <div
          className="analog-shadow font-mono text-[13px] text-stone-700 whitespace-pre-wrap"
          style={{
            width: a.width ?? 220,
            minHeight: a.height ?? 120,
            background: a.color || "#fbf7ec",
            padding: 18,
            borderRadius: 1,
            clipPath:
              "polygon(0 4%, 4% 0, 96% 2%, 100% 6%, 98% 96%, 94% 100%, 5% 98%, 0% 95%)",
          }}
        >
          {back ? a.back : a.front}
        </div>
      );
    }
    case "washi": {
      const w = a.width ?? 200;
      return (
        <div
          style={{
            width: w,
            height: 28,
            background: a.tapeColor || "rgba(180,160,210,0.7)",
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px)",
            boxShadow:
              "0 2px 6px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.25)",
            opacity: 0.92,
          }}
        />
      );
    }
    case "pin": {
      return <div style={{ width: 18, height: 18 }} />;
    }
    case "shape": {
      const w = a.width ?? 140;
      const h = a.height ?? 140;
      const fill = a.fill || "#c9b99a";
      const shape = a.shape || "rect";
      const common: React.CSSProperties = { width: w, height: h };
      if (shape === "circle")
        return <div className="analog-shadow-sm" style={{ ...common, background: fill, borderRadius: "50%" }} />;
      if (shape === "diamond")
        return <div className="analog-shadow-sm" style={{ ...common, background: fill, transform: "rotate(45deg)" }} />;
      if (shape === "triangle")
        return (
          <svg width={w} height={h} viewBox="0 0 100 100">
            <polygon points="50,5 95,95 5,95" fill={fill} />
          </svg>
        );
      if (shape === "star")
        return (
          <svg width={w} height={h} viewBox="0 0 100 100">
            <polygon points="50,5 61,38 96,38 67,59 78,95 50,73 22,95 33,59 4,38 39,38" fill={fill} />
          </svg>
        );
      return <div className="analog-shadow-sm" style={{ ...common, background: fill, borderRadius: 4 }} />;
    }
    case "icon": {
      const w = a.width ?? 64;
      const h = a.height ?? 64;
      const fill = a.fill || "#1a1a1a";
      if (a.imageUrl) {
        return (
          <img
            src={a.imageUrl}
            alt=""
            width={w}
            height={h}
            draggable={false}
            style={{ display: "block", userSelect: "none", filter: fill !== "#1a1a1a" ? undefined : undefined }}
          />
        );
      }
      return (
        <div
          className="grid place-items-center rounded-md border border-dashed border-stone-400 text-stone-500 font-mono text-[10px] lowercase"
          style={{ width: w, height: h }}
        >
          icon
        </div>
      );
    }
    case "marquee": {
      const w = a.width ?? 320;
      const h = a.height ?? 40;
      const text = a.iconText || "marquee";
      const speed = a.iconSpeed ?? 18;
      const bg = a.iconBg || "#fef3c7";
      const fg = a.iconFg || "#1a1a1a";
      const repeated = `${text}\u00a0\u00a0`.repeat(6);
      return (
        <div
          className="overflow-hidden analog-shadow-sm flex items-center"
          style={{ width: w, height: h, background: bg, color: fg, borderRadius: 2 }}
        >
          <div
            className="whitespace-nowrap font-mono text-sm tracking-wider"
            style={{
              animation: `boardr-marquee ${speed}s linear infinite`,
              paddingLeft: "100%",
            }}
          >
            {repeated}
          </div>
        </div>
      );
    }
  }
}
