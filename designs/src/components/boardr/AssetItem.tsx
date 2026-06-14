import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import type { AssetBase } from "../../lib/boardr/types";

function animationProps(a: AssetBase) {
  const d = a.animationDuration ?? 2;
  switch (a.animation) {
    case "fade":
      return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: d } };
    case "float":
      return { animate: { y: [0, -4, 0] }, transition: { duration: d, repeat: Infinity, ease: "easeInOut" as const } };
    case "pulse":
      return { animate: { scale: [1, 1.04, 1] }, transition: { duration: d, repeat: Infinity, ease: "easeInOut" as const } };
    case "wiggle":
      return { animate: { rotate: [0, 1.5, -1.5, 0] }, transition: { duration: d, repeat: Infinity, ease: "easeInOut" as const } };
    case "pop":
      return { initial: { scale: 0.6, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring" as const, stiffness: 260, damping: 18 } };
    default:
      return {};
  }
}
import pushpinAsset from "@/assets/pushpin.svg.asset.json";
import woodenClipAsset from "@/assets/wooden-clip.svg.asset.json";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  gallery?: string[]; // existing image URLs available in this board for quick re-use
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
  gallery,
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
      <motion.div className="relative" {...animationProps(asset)}>
        {renderAssetBody(asset, showBack, interactive, onPatch, gallery)}
        {asset.tapeAttached && <AttachedTape color={asset.tapeAttachColor} />}
        {asset.clipAttached && <AttachedClip color={asset.clipColor} />}
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
    case "block":
      return { w: a.width ?? 280, h: a.height ?? 180 };
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

/** Wooden clothespin / clip — sits above an asset, attached to a hanging string. */
function AttachedClip({ color: _color }: { color?: string }) {
  // Render the user-provided wooden clothespin SVG. The source SVG has a white
  // raster background baked in; multiply blend drops the white so only the
  // clothespin remains visible against the board.
  return (
    <div
      aria-hidden
      className="absolute left-1/2 pointer-events-none"
      style={{
        top: -34,
        transform: "translate(-50%, 0)",
        width: 30,
        height: 50,
        filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.35))",
      }}
    >
      <img
        src={woodenClipAsset.url}
        alt=""
        width={30}
        height={50}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          mixBlendMode: "multiply",
        }}
        draggable={false}
      />
    </div>
  );
}

function PlusOverlay({
  onPick,
  interactive,
  gallery,
}: {
  onPick: (dataUrl: string) => void;
  interactive?: boolean;
  gallery?: string[];
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  if (!interactive) return null;
  const photos = (gallery ?? []).filter(Boolean);
  return (
    <>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (photos.length > 0) setOpen(true);
          else fileRef.current?.click();
        }}
        title={photos.length > 0 ? "choose a photo" : "add a photo"}
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
      </button>
      <input
        ref={fileRef}
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-2xl"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="font-display lowercase">choose a photo</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                fileRef.current?.click();
              }}
              className="aspect-square rounded border border-dashed border-stone-400 grid place-items-center font-mono text-xs lowercase text-stone-600 hover:bg-stone-100"
            >
              + upload new
            </button>
            {photos.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPick(src);
                  setOpen(false);
                }}
                className="aspect-square rounded overflow-hidden border border-stone-300 hover:ring-2 hover:ring-amber-600"
                style={{
                  background: `center/cover no-repeat url(${src})`,
                }}
                aria-label={`photo ${i + 1}`}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


function renderAssetBody(
  a: AssetBase,
  back: boolean,
  interactive?: boolean,
  onPatch?: (p: Partial<AssetBase>) => void,
  gallery?: string[],
) {
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
      const inner = w - 24;
      return (
        <div
          className="analog-shadow bg-white"
          style={{ width: w, padding: 12, paddingBottom: 44, borderRadius: 2 }}
        >
          {back ? (
            <div
              className="font-mono text-[12px] text-stone-700 whitespace-pre-wrap"
              style={{ width: inner, minHeight: inner }}
            >
              {a.back}
            </div>
          ) : (
            <div
              className="relative"
              style={{
                width: inner,
                height: inner,
                background: a.imageUrl
                  ? `center/cover no-repeat url(${a.imageUrl})`
                  : "linear-gradient(135deg,#f5efe5,#e8e0d2)",
              }}
            >
              {!a.imageUrl && onPatch && (
                <PlusOverlay interactive={interactive} gallery={gallery} onPick={(d) => onPatch({ imageUrl: d })} />
              )}
            </div>
          )}
          <div
            className="absolute left-0 right-0 text-center text-stone-700"
            style={{ bottom: 10, fontFamily: "Caveat, cursive", fontSize: 18 }}
          >
            {a.caption}
          </div>
        </div>
      );
    }
    case "photostrip": {
      const photos = [a.imageUrl, a.imageUrl2, a.imageUrl3, a.imageUrl4] as (string | undefined)[];
      const keys = ["imageUrl", "imageUrl2", "imageUrl3", "imageUrl4"] as const;
      return (
        <div className="analog-shadow bg-stone-900" style={{ width: 110, padding: 8, borderRadius: 2 }}>
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
                  className="relative"
                  style={{
                    width: 94,
                    height: 80,
                    background: p
                      ? `center/cover no-repeat url(${p})`
                      : "linear-gradient(135deg,#3a3a3a,#1a1a1a)",
                  }}
                >
                  {!p && onPatch && (
                    <PlusOverlay
                      interactive={interactive}
                      gallery={gallery}
                      onPick={(d) => onPatch({ [keys[i]]: d } as Partial<AssetBase>)}
                    />
                  )}
                </div>
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
        <div className="analog-shadow bg-white" style={{ width: w, height: h, padding: 4 }}>
          {back ? (
            <div className="size-full bg-stone-100 p-2 font-mono text-[12px] text-stone-700 whitespace-pre-wrap">
              {a.back}
            </div>
          ) : (
            <div
              className="relative size-full"
              style={{
                background: a.imageUrl
                  ? `center/cover no-repeat url(${a.imageUrl})`
                  : "linear-gradient(135deg,#f5efe5,#e8e0d2)",
              }}
            >
              {!a.imageUrl && onPatch && (
                <PlusOverlay interactive={interactive} gallery={gallery} onPick={(d) => onPatch({ imageUrl: d })} />
              )}
            </div>
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
      const jagged = a.tapeJagged !== false; // default jagged on
      const clip = jagged
        ? "polygon(0 18%, 3% 0, 6% 20%, 9% 0, 12% 20%, 15% 0, 18% 20%, 21% 0, 24% 20%, 27% 0, 30% 20%, 33% 0, 36% 20%, 39% 0, 42% 20%, 45% 0, 48% 20%, 51% 0, 54% 20%, 57% 0, 60% 20%, 63% 0, 66% 20%, 69% 0, 72% 20%, 75% 0, 78% 20%, 81% 0, 84% 20%, 87% 0, 90% 20%, 93% 0, 96% 20%, 99% 0, 100% 18%, 100% 82%, 99% 100%, 96% 80%, 93% 100%, 90% 80%, 87% 100%, 84% 80%, 81% 100%, 78% 80%, 75% 100%, 72% 80%, 69% 100%, 66% 80%, 63% 100%, 60% 80%, 57% 100%, 54% 80%, 51% 100%, 48% 80%, 45% 100%, 42% 80%, 39% 100%, 36% 80%, 33% 100%, 30% 80%, 27% 100%, 24% 80%, 21% 100%, 18% 80%, 15% 100%, 12% 80%, 9% 100%, 6% 80%, 3% 100%, 0 82%)"
        : undefined;
      const h = 28;
      const hasImage = !!a.imageUrl;
      const hasPattern = !!a.tapePattern;
      const textColor = a.tapeTextColor || "#1a1a1a";
      // For pattern text, build a repeated string filling the width.
      const patternRepeats = hasPattern
        ? Math.max(2, Math.ceil(w / Math.max(40, (a.tapePattern!.length * 7))))
        : 0;
      const patternText = hasPattern
        ? Array.from({ length: patternRepeats }, () => a.tapePattern).join(" \u2022 ")
        : "";
      return (
        <div
          style={{
            position: "relative",
            width: w,
            height: h,
            background: a.tapeColor || "rgba(180,160,210,0.7)",
            backgroundImage: hasImage
              ? `url(${a.imageUrl})`
              : "repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px)",
            backgroundSize: hasImage ? "auto 100%" : undefined,
            backgroundRepeat: hasImage ? "repeat-x" : undefined,
            boxShadow: jagged
              ? "0 2px 4px rgba(0,0,0,0.15)"
              : "0 2px 6px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.25)",
            opacity: a.opacity ?? 0.92,
            clipPath: clip,
            overflow: "hidden",
          }}
        >
          {hasPattern && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: textColor,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {patternText}
            </div>
          )}
        </div>
      );
    }
    case "block": {
      return renderBlock(a);
    }
    case "frame": {
      return renderFrame(a, interactive, onPatch, gallery);
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

function parseBlockData<T = unknown>(raw?: string): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

function renderBlock(a: AssetBase): React.ReactNode {
  const w = a.width ?? 280;
  const h = a.height ?? 180;
  const t = a.blockType || "table";
  const s = a.blockStyle || {};
  const padding = s.padding ?? 10;
  const radius = s.radius ?? 3;
  const bg = s.bg ?? "#fbf7ec";
  const fg = s.fg ?? "#1f1a14";
  const bw = s.borderStyle && s.borderStyle !== "none" ? (s.borderWidth ?? 1) : 0;
  const border =
    s.borderStyle && s.borderStyle !== "none"
      ? `${bw}px ${s.borderStyle} ${s.borderColor ?? "#1f1a14"}`
      : "none";
  const shadow =
    s.shadow === false
      ? "none"
      : "0 1px 2px rgba(40,25,10,0.18), 0 6px 14px rgba(40,25,10,0.10)";
  const wrap: React.CSSProperties = {
    width: w,
    minHeight: h,
    background: bg,
    borderRadius: radius,
    padding,
    border,
    boxShadow: shadow,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    color: fg,
  };
  if (t === "table") {
    const raw = parseBlockData<{ headers?: string[]; rows?: string[][] }>(a.blockData) || {};
    const headers = Array.isArray(raw.headers) ? raw.headers : [];
    const rows = Array.isArray(raw.rows) ? raw.rows : [];
    const density = s.tableDensity ?? "cozy";
    const cellPadY = density === "compact" ? 2 : density === "roomy" ? 8 : 4;
    const cellPadX = density === "compact" ? 4 : density === "roomy" ? 10 : 6;
    const divider = s.tableDividers ?? "dashed";
    const cellBorder = divider === "none" ? "none" : `1px ${divider} ${divider === "solid" ? "#1f1a14" : "#c9b99a"}`;
    const headerUnderline = s.tableHeaderUnderline === false ? "none" : `1px solid ${fg}`;
    return (
      <div style={wrap}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr>
              {headers.map((hd, i) => (
                <th key={i} style={{ textAlign: "left", borderBottom: headerUnderline, padding: `${cellPadY}px ${cellPadX}px`, textTransform: "lowercase", letterSpacing: "0.06em" }}>{hd}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {(Array.isArray(row) ? row : []).map((c, ci) => (
                  <td key={ci} style={{ borderBottom: cellBorder, padding: `${cellPadY}px ${cellPadX}px` }}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (t === "chips" || t === "tags") {
    const raw = parseBlockData<{ items?: string[] }>(a.blockData) || {};
    const items = Array.isArray(raw.items) ? raw.items : [];
    const isTag = t === "tags";
    return (
      <div style={{ ...wrap, display: "flex", flexWrap: "wrap", gap: 6, alignContent: "flex-start" }}>
        {items.map((it, i) => (
          <span
            key={i}
            style={{
              fontSize: 11,
              padding: isTag ? "3px 8px" : "4px 10px",
              borderRadius: isTag ? 2 : 999,
              background: isTag ? "transparent" : "#1f1a14",
              color: isTag ? "#1f1a14" : "#fbf7ec",
              border: isTag ? "1px dashed #1f1a14" : "none",
              textTransform: "lowercase",
              letterSpacing: "0.04em",
            }}
          >
            {it}
          </span>
        ))}
      </div>
    );
  }
  if (t === "accordion") {
    const raw = parseBlockData<{ items?: { q: string; a: string }[] }>(a.blockData) || {};
    const items = Array.isArray(raw.items) ? raw.items : [];
    return (
      <div style={wrap}>
        {items.map((it, i) => (
          <div key={i} style={{ borderBottom: "1px solid #c9b99a", padding: "6px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
              <span style={{ textTransform: "lowercase" }}>{it?.q}</span>
              <span>+</span>
            </div>
            <div style={{ fontSize: 11, marginTop: 4, color: "#4b4337" }}>{it?.a}</div>
          </div>
        ))}
      </div>
    );
  }
  if (t === "tabs") {
    const raw = parseBlockData<{ items?: { label: string; body: string }[] }>(a.blockData) || {};
    const items = Array.isArray(raw.items) ? raw.items : [];
    const active = items[0];
    return (
      <div style={wrap}>
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #1f1a14", marginBottom: 8 }}>
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                fontSize: 11,
                padding: "4px 8px",
                background: i === 0 ? "#1f1a14" : "transparent",
                color: i === 0 ? "#fbf7ec" : "#1f1a14",
                borderRadius: "2px 2px 0 0",
                textTransform: "lowercase",
              }}
            >
              {it?.label}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#4b4337" }}>{active?.body}</div>
      </div>
    );
  }
  if (t === "text") {
    const d = parseBlockData<{ text?: string }>(a.blockData) || {};
    return (
      <div style={{ ...wrap, fontFamily: "Georgia, serif", fontSize: 14, lineHeight: 1.55, color: "#1f1a14", whiteSpace: "pre-wrap" }}>
        {d.text || ""}
      </div>
    );
  }
  if (t === "heading") {
    const d = parseBlockData<{ text?: string; level?: number }>(a.blockData) || {};
    const lvl = Math.min(6, Math.max(1, d.level || 2));
    const sizes: Record<number, number> = { 1: 36, 2: 28, 3: 22, 4: 18, 5: 16, 6: 14 };
    return (
      <div style={{ ...wrap, fontFamily: "Georgia, serif", fontWeight: 800, fontSize: sizes[lvl], lineHeight: 1.1, letterSpacing: "-0.01em" }}>
        {d.text || ""}
      </div>
    );
  }
  if (t === "image") {
    const d = parseBlockData<{ caption?: string }>(a.blockData) || {};
    return (
      <div style={{ ...wrap, padding: 6 }}>
        <div
          style={{
            width: w - 12,
            height: h - (d.caption ? 36 : 12),
            background: a.imageUrl
              ? `center/cover no-repeat url(${a.imageUrl})`
              : "linear-gradient(135deg,#f5efe5,#e8e0d2)",
            border: "1px dashed #c9b99a",
            display: "grid",
            placeItems: "center",
            color: "#9b8a73",
            fontSize: 11,
          }}
        >
          {!a.imageUrl && "image — set url in settings"}
        </div>
        {d.caption && (
          <div style={{ marginTop: 6, fontSize: 11, color: "#4b4337", textAlign: "center" }}>{d.caption}</div>
        )}
      </div>
    );
  }
  if (t === "button") {
    const d = parseBlockData<{ label?: string; href?: string }>(a.blockData) || {};
    return (
      <div style={{ ...wrap, display: "grid", placeItems: "center", minHeight: 60 }}>
        <span
          style={{
            background: "#1f1a14",
            color: "#fbf7ec",
            padding: "10px 22px",
            borderRadius: 3,
            fontSize: 13,
            textTransform: "lowercase",
            letterSpacing: "0.04em",
            boxShadow: "0 1px 0 rgba(0,0,0,0.4), 0 4px 10px rgba(40,25,10,0.25)",
          }}
        >
          {d.label || "button"}
        </span>
      </div>
    );
  }
  if (t === "buttonList") {
    const raw = parseBlockData<{ items?: { label: string; href?: string; variant?: string }[] }>(a.blockData) || {};
    const items = Array.isArray(raw.items) ? raw.items : [];
    return (
      <div style={{ ...wrap, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "center", minHeight: 60 }}>
        {items.map((it, i) => {
          const ghost = it?.variant === "ghost";
          return (
            <span
              key={i}
              style={{
                background: ghost ? "transparent" : "#1f1a14",
                color: ghost ? "#1f1a14" : "#fbf7ec",
                border: ghost ? "1px solid #1f1a14" : "none",
                padding: "8px 16px",
                borderRadius: 3,
                fontSize: 12,
                textTransform: "lowercase",
              }}
            >
              {it?.label}
            </span>
          );
        })}
      </div>
    );
  }
  if (t === "iconGrid") {
    const raw = parseBlockData<{ items?: string[] }>(a.blockData) || {};
    const items = Array.isArray(raw.items) ? raw.items : [];
    return (
      <div style={{ ...wrap, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {items.map((it, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "1 / 1",
              display: "grid",
              placeItems: "center",
              border: "1px dashed #c9b99a",
              borderRadius: 3,
              fontSize: 20,
              color: "#1f1a14",
            }}
          >
            {it}
          </div>
        ))}
      </div>
    );
  }
  if (t === "input") {
    const d = parseBlockData<{ label?: string; placeholder?: string; cta?: string }>(a.blockData) || {};
    return (
      <div style={{ ...wrap, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
        {d.label && (
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b4337" }}>
            {d.label}
          </span>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <div
            style={{
              flex: 1,
              background: "#fff",
              border: "1px solid #1f1a14",
              padding: "8px 10px",
              fontSize: 12,
              color: "#9b8a73",
              borderRadius: 2,
            }}
          >
            {d.placeholder || "type here…"}
          </div>
          {d.cta && (
            <span
              style={{
                background: "#1f1a14",
                color: "#fbf7ec",
                padding: "8px 14px",
                borderRadius: 2,
                fontSize: 12,
                textTransform: "lowercase",
              }}
            >
              {d.cta}
            </span>
          )}
        </div>
      </div>
    );
  }
  if (t === "layout") {
    return renderLayout(a, wrap, w, h);
  }
  return <div style={wrap} />;
}

function renderLayout(a: AssetBase, wrap: React.CSSProperties, w: number, h: number): React.ReactNode {
  const d = parseBlockData<Record<string, unknown>>(a.blockData) || {};
  const variant = (d.variant as string) || "hero";
  const pad: React.CSSProperties = { ...wrap, padding: 16, minHeight: h };
  if (variant === "hero") {
    const eyebrow = (d.eyebrow as string) || "";
    const title = (d.title as string) || "headline";
    const body = (d.body as string) || "";
    const cta = (d.cta as string) || "";
    return (
      <div style={{ ...pad, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
        {eyebrow && <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "#4b4337" }}>{eyebrow}</div>}
        <div style={{ fontFamily: "Georgia, serif", fontWeight: 800, fontSize: Math.min(34, w / 10), lineHeight: 1.05, letterSpacing: "-0.01em" }}>{title}</div>
        {body && <div style={{ fontSize: 13, lineHeight: 1.5, color: "#4b4337" }}>{body}</div>}
        {cta && (
          <div>
            <span style={{ background: "#1f1a14", color: "#fbf7ec", padding: "8px 16px", borderRadius: 3, fontSize: 12, textTransform: "lowercase", display: "inline-block", marginTop: 4 }}>{cta}</span>
          </div>
        )}
      </div>
    );
  }
  if (variant === "two-up") {
    const left = (d.left as { title?: string; body?: string }) || {};
    const right = (d.right as { title?: string; body?: string }) || {};
    const col: React.CSSProperties = { flex: 1, display: "flex", flexDirection: "column", gap: 6 };
    return (
      <div style={{ ...pad, display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={col}>
          <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 16 }}>{left.title}</div>
          <div style={{ fontSize: 12, color: "#4b4337", lineHeight: 1.5 }}>{left.body}</div>
        </div>
        <div style={{ width: 1, alignSelf: "stretch", background: "#c9b99a" }} />
        <div style={col}>
          <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 16 }}>{right.title}</div>
          <div style={{ fontSize: 12, color: "#4b4337", lineHeight: 1.5 }}>{right.body}</div>
        </div>
      </div>
    );
  }
  if (variant === "gallery") {
    const items = Array.isArray(d.items) ? (d.items as string[]) : [];
    const caption = (d.caption as string) || "";
    return (
      <div style={{ ...pad, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, flex: 1 }}>
          {items.map((u, i) => (
            <div key={i} style={{
              aspectRatio: "1/1",
              background: u ? `center/cover no-repeat url(${u})` : "linear-gradient(135deg,#f5efe5,#e8e0d2)",
              border: "1px dashed #c9b99a", borderRadius: 2,
              display: "grid", placeItems: "center", color: "#9b8a73", fontSize: 14,
            }}>{!u && "▦"}</div>
          ))}
        </div>
        {caption && <div style={{ fontSize: 11, color: "#4b4337", textAlign: "center" }}>{caption}</div>}
      </div>
    );
  }
  if (variant === "list") {
    const items = Array.isArray(d.items) ? (d.items as string[]) : [];
    const title = (d.title as string) || "";
    return (
      <div style={{ ...pad, display: "flex", flexDirection: "column", gap: 8 }}>
        {title && <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 16 }}>{title}</div>}
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it, i) => (
            <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", borderBottom: "1px dashed #c9b99a", paddingBottom: 6 }}>
              <span style={{ fontFamily: "Georgia, serif", fontWeight: 800, color: "#1f1a14", minWidth: 18 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontSize: 12, color: "#1f1a14", lineHeight: 1.5 }}>{it}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (variant === "quote") {
    const quote = (d.quote as string) || "";
    const author = (d.author as string) || "";
    return (
      <div style={{ ...pad, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, textAlign: "center" }}>
        <div style={{ fontSize: 28, lineHeight: 1, color: "#9b8a73", fontFamily: "Georgia, serif" }}>“</div>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 16, lineHeight: 1.4 }}>{quote}</div>
        {author && <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#4b4337" }}>— {author}</div>}
      </div>
    );
  }
  if (variant === "footer") {
    const brand = (d.brand as string) || "";
    const cols = Array.isArray(d.columns) ? (d.columns as { title?: string; items?: string[] }[]) : [];
    const copyright = (d.copyright as string) || "";
    return (
      <div style={{ ...pad, display: "flex", flexDirection: "column", gap: 12, borderTop: "2px solid #1f1a14" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          {brand && <div style={{ fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 18, flex: "0 0 auto", minWidth: 80 }}>{brand}</div>}
          <div style={{ display: "flex", gap: 16, flex: 1, flexWrap: "wrap" }}>
            {cols.map((c, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 70 }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#4b4337" }}>{c?.title}</div>
                {(Array.isArray(c?.items) ? c.items : []).map((it, j) => (
                  <div key={j} style={{ fontSize: 11, color: "#1f1a14" }}>{it}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {copyright && <div style={{ fontSize: 10, color: "#9b8a73", textTransform: "lowercase" }}>{copyright}</div>}
      </div>
    );
  }
  if (variant === "bento") {
    const items = Array.isArray(d.items) ? (d.items as { title?: string; body?: string }[]) : [];
    return (
      <div style={{ ...pad, display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ border: "1px solid #c9b99a", borderRadius: 3, padding: 10, background: "#fff", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 14 }}>{it?.title}</div>
            <div style={{ fontSize: 11, color: "#4b4337", lineHeight: 1.4 }}>{it?.body}</div>
          </div>
        ))}
      </div>
    );
  }
  return <div style={wrap} />;
}

function renderFrame(
  a: AssetBase,
  interactive?: boolean,
  onPatch?: (p: Partial<AssetBase>) => void,
  gallery?: string[],
) {
  const w = a.width ?? 220;
  const h = a.height ?? 260;
  const style = a.frameStyle ?? "classic";
  const frameColor = a.color || "#3a2a1a";
  // configured inner cutout per style — leaves a hole for the image
  const inset = style === "polaroid"
    ? { top: 16, right: 16, bottom: 56, left: 16 }
    : style === "ornate"
    ? { top: 28, right: 28, bottom: 28, left: 28 }
    : style === "double"
    ? { top: 22, right: 22, bottom: 22, left: 22 }
    : style === "oval"
    ? { top: 18, right: 18, bottom: 18, left: 18 }
    : style === "scalloped"
    ? { top: 22, right: 22, bottom: 22, left: 22 }
    : /* classic */ { top: 18, right: 18, bottom: 18, left: 18 };

  const innerStyle: React.CSSProperties = {
    position: "absolute",
    top: inset.top,
    left: inset.left,
    right: inset.right,
    bottom: inset.bottom,
    background: a.imageUrl
      ? `center/cover no-repeat url(${a.imageUrl})`
      : "linear-gradient(135deg,#f5efe5,#e8e0d2)",
    borderRadius: style === "oval" ? "50%" : 2,
    overflow: "hidden",
  };

  // outer frame visuals
  const baseShadow = "0 6px 14px rgba(40,25,10,0.25), 0 1px 2px rgba(40,25,10,0.2)";
  const outer: React.CSSProperties = { position: "relative", width: w, height: h };
  let outerEl: React.ReactNode;
  if (style === "ornate") {
    outerEl = (
      <div
        style={{
          ...outer,
          background: `linear-gradient(135deg, ${frameColor}, color-mix(in oklab, ${frameColor} 60%, #c9a84c))`,
          boxShadow: baseShadow,
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 2px, transparent 2px 6px)",
          borderRadius: 4,
        }}
      />
    );
  } else if (style === "double") {
    outerEl = (
      <div
        style={{
          ...outer,
          background: frameColor,
          boxShadow: baseShadow,
          borderRadius: 2,
          padding: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 10,
            border: `2px solid color-mix(in oklab, ${frameColor} 50%, #faf8f5)`,
            borderRadius: 2,
          }}
        />
      </div>
    );
  } else if (style === "polaroid") {
    outerEl = (
      <div
        className="analog-shadow"
        style={{ ...outer, background: "#fff", borderRadius: 2 }}
      />
    );
  } else if (style === "oval") {
    outerEl = (
      <div
        style={{
          ...outer,
          background: `radial-gradient(ellipse at center, color-mix(in oklab, ${frameColor} 85%, #faf8f5) 0%, ${frameColor} 70%)`,
          boxShadow: baseShadow,
          borderRadius: "50%",
        }}
      />
    );
  } else if (style === "scalloped") {
    // scalloped border via SVG
    outerEl = (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", filter: "drop-shadow(0 6px 12px rgba(40,25,10,0.25))" }}>
        <ScallopedRect w={w} h={h} fill={frameColor} />
      </svg>
    );
  } else {
    // classic — solid wood frame with subtle inner bevel
    outerEl = (
      <div
        style={{
          ...outer,
          background: frameColor,
          boxShadow: baseShadow,
          borderRadius: 2,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 6,
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 1,
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: w, height: h }}>
      {outerEl}
      <div style={innerStyle}>
        {!a.imageUrl && onPatch && (
          <PlusOverlay interactive={interactive} gallery={gallery} onPick={(d) => onPatch({ imageUrl: d })} />
        )}
      </div>
    </div>
  );
}

function ScallopedRect({ w, h, fill }: { w: number; h: number; fill: string }) {
  // build a path with semicircle scallops along all four edges
  const r = 10;
  const cx = Math.max(2, Math.floor(w / (r * 2)));
  const cy = Math.max(2, Math.floor(h / (r * 2)));
  const dx = w / cx;
  const dy = h / cy;
  let d = `M 0 ${dy / 2}`;
  // top edge
  for (let i = 0; i < cx; i++) {
    const x = (i + 0.5) * dx;
    d += ` A ${dx / 2} ${dx / 2} 0 0 1 ${x + dx / 2} ${dy / 2}`;
  }
  // right edge
  for (let i = 0; i < cy; i++) {
    const y = (i + 0.5) * dy;
    d += ` A ${dy / 2} ${dy / 2} 0 0 1 ${w - dx / 2} ${y + dy / 2}`;
  }
  // bottom edge
  for (let i = cx - 1; i >= 0; i--) {
    const x = (i + 0.5) * dx;
    d += ` A ${dx / 2} ${dx / 2} 0 0 1 ${x - dx / 2} ${h - dy / 2}`;
  }
  // left edge
  for (let i = cy - 1; i >= 0; i--) {
    const y = (i + 0.5) * dy;
    d += ` A ${dy / 2} ${dy / 2} 0 0 1 ${dx / 2} ${y - dy / 2}`;
  }
  d += " Z";
  return <path d={d} fill={fill} />;
}
