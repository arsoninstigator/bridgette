import { useEffect, useRef, useState } from "react";
import type { AssetBase } from "../../lib/boardr/types";

interface Props {
  asset: AssetBase;
  selected?: boolean;
  interactive?: boolean; // editor only
  previewFlipped?: boolean; // viewer-state when flip toggled
  onPointerDown?: (e: React.PointerEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  pinHighlight?: boolean; // string mode highlight
}

/** Shared analog-feel asset renderer. */
export function AssetItem({
  asset,
  selected,
  interactive,
  previewFlipped,
  onPointerDown,
  onClick,
  pinHighlight,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    if (previewFlipped !== undefined) setFlipped(false);
  }, [previewFlipped, asset.id]);

  const showBack = (asset.flipEnabled && flipped) || false;

  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    left: asset.x,
    top: asset.y,
    transform: `translate(-50%, -50%) rotate(${asset.rotation}deg)`,
    zIndex: asset.z,
    cursor: interactive ? "grab" : "default",
    touchAction: "none",
  };

  return (
    <div
      data-asset-id={asset.id}
      style={wrapperStyle}
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={[
        "select-none transition-transform duration-150",
        interactive ? "hover:scale-[1.02]" : "",
        selected ? "ring-2 ring-offset-2 ring-amber-700/60 rounded-sm" : "",
      ].join(" ")}
    >
      <div className="relative">
        {renderAssetBody(asset, showBack)}
        {asset.pinEnabled && <PushPin highlight={pinHighlight} />}
        {asset.flipEnabled && !interactive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFlipped((f) => !f);
            }}
            className="absolute -bottom-2 -right-2 size-7 rounded-full bg-stone-900/85 text-stone-50 text-[10px] font-mono analog-shadow-sm hover:bg-stone-900"
            title="Flip"
          >
            ⤺
          </button>
        )}
      </div>
    </div>
  );
}

function PushPin({ highlight }: { highlight?: boolean }) {
  return (
    <div
      className="absolute left-1/2 -top-2 -translate-x-1/2"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="size-4 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #ff8a8a, #c0212a 60%, #6e0a10)",
          boxShadow: highlight
            ? "0 0 0 3px rgba(250,204,21,0.7), 0 2px 4px rgba(0,0,0,0.4)"
            : "0 2px 4px rgba(0,0,0,0.4)",
        }}
      />
    </div>
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
            minHeight: 120,
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
  }
}