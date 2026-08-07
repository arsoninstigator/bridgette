import { useRef, useState } from "react";
import type { AssetBase, AssetKind, BoardKind, SectionMark, StringConn, SurfaceOverlay } from "../../lib/boardr/types";
import { AssetItem, PinImage } from "./AssetItem";

const BG: Record<BoardKind, string> = {
  cork: "bg-board-cork",
  mat: "bg-board-mat",
  wall: "bg-board-wall",
  metal: "bg-board-metal",
};

interface Props {
  kind: BoardKind;
  assets: AssetBase[];
  strings: StringConn[];
  surface?: SurfaceOverlay;
  sections?: SectionMark[];
  interactive?: boolean;
  selectedId?: string | null;
  selectedIds?: string[];
  stringMode?: boolean;
  stringFromId?: string | null;
  gallery?: string[];
  onSelect?: (id: string | null, additive?: boolean) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onMoveMany?: (moves: { id: string; x: number; y: number }[]) => void;
  onResize?: (id: string, w: number, h: number) => void;
  onPatchAsset?: (id: string, p: Partial<AssetBase>) => void;
  onAssetClick?: (id: string) => void;
  onAssetContextMenu?: (id: string, clientX: number, clientY: number) => void;
  onDropAsset?: (kind: AssetKind, x: number, y: number, extra?: Partial<AssetBase>) => void;
  onStringClick?: (stringId: string) => void;
  onStringContextMenu?: (stringId: string, clientX: number, clientY: number) => void;
  drawWashi?: { tapeColor?: string; tapePattern?: string; tapeTextColor?: string; imageUrl?: string } | null;
  drawHanging?: { points: { x: number; y: number }[]; color?: string; thickness?: number; sag?: number } | null;
  onHangingPoint?: (x: number, y: number) => void;
}

export function BoardCanvas({
  kind,
  assets,
  strings,
  surface,
  sections,
  interactive,
  selectedId,
  selectedIds,
  stringMode,
  stringFromId,
  gallery,
  onSelect,
  onMove,
  onMoveMany,
  onResize,
  onPatchAsset,
  onAssetClick,
  onAssetContextMenu,
  onDropAsset,
  onStringClick,
  onStringContextMenu,
  drawWashi,
  drawHanging,
  onHangingPoint,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const selSet = new Set(selectedIds ?? (selectedId ? [selectedId] : []));
  const [drawPreview, setDrawPreview] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);

  function startDrag(e: React.PointerEvent, id: string) {
    if (!interactive || stringMode) return;
    const asset = assets.find((a) => a.id === id);
    if (!asset || asset.locked) return;
    // Always stop propagation so the board background doesn't clear selection
    e.stopPropagation();
    // Only initiate drag on primary mouse button — never on right-click,
    // otherwise pointer capture interferes with the contextmenu event.
    if (e.button !== 0) return;
    const target = e.currentTarget as HTMLElement;
    const board = ref.current!;
    target.setPointerCapture(e.pointerId);
    const rect = board.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const additive = e.shiftKey;

    // gather group members (move together) — locked siblings stay put
    const groupMembers = asset.groupId
      ? assets.filter((a) => a.groupId === asset.groupId && !a.locked)
      : [asset];
    const origins = groupMembers.map((a) => ({ id: a.id, x: a.x, y: a.y }));

    let moved = false;
    function onMoveEv(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      const moves = origins.map((o) => ({
        id: o.id,
        x: clamp(o.x + dx, 20, rect.width - 20),
        y: clamp(o.y + dy, 20, rect.height - 20),
      }));
      if (moves.length > 1 && onMoveMany) onMoveMany(moves);
      else moves.forEach((m) => onMove?.(m.id, m.x, m.y));
    }
    function onUp() {
      target.releasePointerCapture(e.pointerId);
      window.removeEventListener("pointermove", onMoveEv);
      window.removeEventListener("pointerup", onUp);
      if (!moved) onSelect?.(id, additive);
    }
    window.addEventListener("pointermove", onMoveEv);
    window.addEventListener("pointerup", onUp);
  }

  function startWashiDraw(e: React.PointerEvent) {
    if (!drawWashi || !onDropAsset) return;
    e.stopPropagation();
    const board = ref.current!;
    const rect = board.getBoundingClientRect();
    const x1 = e.clientX - rect.left;
    const y1 = e.clientY - rect.top;
    setDrawPreview({ x1, y1, x2: x1, y2: y1 });
    function onMove(ev: PointerEvent) {
      setDrawPreview({ x1, y1, x2: ev.clientX - rect.left, y2: ev.clientY - rect.top });
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const x2 = ev.clientX - rect.left;
      const y2 = ev.clientY - rect.top;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.max(40, Math.hypot(dx, dy));
      const rot = (Math.atan2(dy, dx) * 180) / Math.PI;
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      setDrawPreview(null);
      onDropAsset!("washi", mx, my, {
        width: Math.round(len),
        rotation: rot,
        tapeColor: drawWashi?.tapeColor,
        tapePattern: drawWashi?.tapePattern,
        tapeTextColor: drawWashi?.tapeTextColor,
        imageUrl: drawWashi?.imageUrl,
        tapeJagged: drawWashi?.tapePattern || drawWashi?.imageUrl ? false : undefined,
        opacity: drawWashi?.tapePattern || drawWashi?.imageUrl ? 1 : undefined,
      });
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        if (drawWashi) return startWashiDraw(e);
        if (drawHanging && onHangingPoint) {
          const rect = ref.current!.getBoundingClientRect();
          onHangingPoint(e.clientX - rect.left, e.clientY - rect.top);
          return;
        }
        onSelect?.(null);
      }}
      onPointerMove={(e) => {
        if (!drawHanging) return;
        const rect = ref.current!.getBoundingClientRect();
        setHoverPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onPointerLeave={() => setHoverPoint(null)}
      onDragOver={(e) => {
        if (!onDropAsset) return;
        e.preventDefault();
      }}
      onDrop={(e) => {
        if (!onDropAsset) return;
        e.preventDefault();
        const kind = e.dataTransfer.getData("application/x-boardr-kind") as AssetKind;
        if (!kind) return;
        const extraRaw = e.dataTransfer.getData("application/x-boardr-extra");
        let extra: Partial<AssetBase> | undefined;
        if (extraRaw) {
          try { extra = JSON.parse(extraRaw); } catch { /* ignore */ }
        }
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onDropAsset(kind, e.clientX - rect.left, e.clientY - rect.top, extra);
      }}
      className={`relative flex-1 overflow-hidden ${surface?.baseColor || surface?.imageUrl ? "" : BG[kind]} ${drawWashi || drawHanging ? "cursor-crosshair" : ""}`}
      style={
        surface?.baseColor || surface?.imageUrl
          ? {
              backgroundColor: surface.baseColor || undefined,
              backgroundImage: surface.imageUrl ? `url(${surface.imageUrl})` : undefined,
              backgroundSize: surface.imageUrl ? "cover" : undefined,
              backgroundPosition: surface.imageUrl ? "center" : undefined,
            }
          : undefined
      }
    >
      {/* Texture overlay layer — sits above the base but below all assets. */}
      {surface?.textureId && (
        <div
          aria-hidden
          className={`absolute inset-0 pointer-events-none bg-texture-${surface.textureId}`}
          style={{ opacity: surface.opacity ?? 1 }}
        />
      )}
      {/* Pattern overlay layer (user-defined grid/stripe/checker/dots) */}
      {surface?.pattern && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={patternStyle(surface.pattern)}
        />
      )}
      {/* asset bodies (pins are hidden here and rendered above the string layer) */}
      {assets.map((a) => (
        <AssetItem
          gallery={gallery}
          key={a.id}
          asset={a}
          interactive={interactive}
          selected={selSet.has(a.id)}
          hidePin
          pinHighlight={!!stringMode && !!a.pinEnabled && (stringFromId === a.id || !stringFromId)}
          onPointerDown={(e) => startDrag(e, a.id)}
          onClick={(e) => {
            e.stopPropagation();
            if (stringMode) {
              if (!a.pinEnabled) return; // strings only attach pin-to-pin
              onAssetClick?.(a.id);
            }
          }}
          onContextMenu={(e) => {
            if (!interactive) return;
            e.preventDefault();
            e.stopPropagation();
            // if right-clicking an asset not in current selection, select it first
            if (!selSet.has(a.id)) onSelect?.(a.id, false);
            onAssetContextMenu?.(a.id, e.clientX, e.clientY);
          }}
          onResize={onResize ? (w, h) => onResize(a.id, w, h) : undefined}
          onPatch={onPatchAsset ? (p) => onPatchAsset(a.id, p) : undefined}
        />
      ))}

      {/* string layer — above asset bodies, below pin overlay */}
      <svg
        className="absolute inset-0"
        style={{ width: "100%", height: "100%", pointerEvents: "none", zIndex: 9000 }}
      >
        {/* twine texture — a subtle repeating filament to give strings fiber */}
        <defs>
          <pattern id="twine-fibers" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
            <line x1="3" y1="0" x2="3" y2="6" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
          </pattern>
        </defs>
        {strings.map((s) => {
          const path = buildStringPath(s, assets);
          if (!path) return null;
          const { d, points } = path;
          const stroke = s.color || (s.hanging ? "#8a6a3a" : "#a8231a");
          const width = s.thickness ?? (s.hanging ? 3.5 : 2.6);
          return (
            <g key={s.id} style={{ pointerEvents: (onStringClick || onStringContextMenu) ? "auto" : "none" }}>
              {(onStringClick || onStringContextMenu) && (
                <path
                  d={d}
                  stroke="transparent"
                  strokeWidth={Math.max(14, width + 10)}
                  fill="none"
                  style={{ cursor: "pointer" }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onStringClick?.(s.id); }}
                  onContextMenu={(e) => {
                    if (!onStringContextMenu) return;
                    e.preventDefault();
                    e.stopPropagation();
                    onStringContextMenu(s.id, e.clientX, e.clientY);
                  }}
                />
              )}
              {/* base rope — darker underlayer */}
              <path
                d={d}
                stroke={darken(stroke, 0.35)}
                strokeWidth={width}
                strokeLinecap="round"
                fill="none"
                opacity={0.95}
                style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.45))", pointerEvents: "none" }}
              />
              {/* highlight thread — lighter, offset slightly for twist */}
              <path
                d={d}
                stroke={lighten(stroke, 0.25)}
                strokeWidth={Math.max(0.6, width * 0.35)}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(1.5, width * 0.6)} ${Math.max(2, width * 0.9)}`}
                fill="none"
                opacity={0.55}
                style={{ pointerEvents: "none" }}
              />
              {/* fiber texture overlay clipped to the rope */}
              <path
                d={d}
                stroke="url(#twine-fibers)"
                strokeWidth={width}
                fill="none"
                opacity={0.35}
                style={{ pointerEvents: "none", mixBlendMode: "multiply" }}
              />
              {/* anchor knots at each bunting point */}
              {s.points && points.map((p: { x: number; y: number }, i: number) => (
                <circle key={i} cx={p.x} cy={p.y} r={Math.max(3, width * 1.1)}
                  fill={darken(stroke, 0.4)} opacity={0.85}
                  style={{ pointerEvents: "none" }} />
              ))}
              {s.bunting && s.bunting.count > 0 && (
                <BuntingFlags cfg={s.bunting} quads={path.quads} sid={s.id} />
              )}
            </g>
          );
        })}
        {drawPreview && (() => {
          const { x1, y1, x2, y2 } = drawPreview;
          return (
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={drawWashi?.tapeColor || "rgba(180,160,210,0.85)"}
              strokeWidth={24}
              strokeLinecap="butt"
              opacity={0.7}
            />
          );
        })()}
        {drawHanging && drawHanging.points.length > 0 && (() => {
          const pts = [...drawHanging.points, ...(hoverPoint ? [hoverPoint] : [])];
          const d = quadsToPath(quadChain(pts, drawHanging.sag ?? 0.18));
          return (
            <g>
              <path d={d} stroke={drawHanging.color || "#8a6a3a"} strokeWidth={drawHanging.thickness ?? 3.5}
                fill="none" strokeLinecap="round" opacity={0.85} strokeDasharray="6 4" />
              {drawHanging.points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={5} fill="#3a2a1a" opacity={0.9} />
              ))}
            </g>
          );
        })()}
      </svg>


      {/* pin overlay layer — drawn on top of the string layer so strings appear
          to wrap around / pass under the pin head */}
      <div className="absolute inset-0" style={{ pointerEvents: "none", zIndex: 9100 }}>
        {assets.filter((a) => a.pinEnabled).map((a) => {
          const p = pinPoint(a);
          const highlight = !!stringMode && (stringFromId === a.id || !stringFromId);
          return (
            <div
              key={a.id}
              style={{
                position: "absolute",
                left: p.x,
                top: p.y,
                transform: "translate(-50%, -50%)",
              }}
            >
              <PinImage color={a.pinColor || a.color} highlight={highlight} size={28} />
            </div>
          );
        })}
      </div>

      {/* section anchors — invisible scroll targets that make #slug navigate
          within the same page while keeping the background continuous */}
      {sections?.map((s) => (
        <div
          key={s.slug}
          id={s.slug}
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: s.y, height: 1, scrollMarginTop: 80 }}
        />
      ))}

    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function pinPoint(a: AssetBase): { x: number; y: number } {
  // approximate pin head location: above center, accounting for rotation.
  // For polaroid, the rendered height is always width + 32 (image + padding + caption),
  // regardless of a.height (which the renderer ignores), so derive from width.
  const h = a.kind === "polaroid"
    ? (a.width ?? 200) + 32
    : (a.height ?? 140);
  const dy = -h / 2 - 4;
  const rad = ((a.rotation || 0) * Math.PI) / 180;
  const rx = -Math.sin(rad) * dy;
  const ry = Math.cos(rad) * dy;
  return { x: a.x + rx, y: a.y + ry };
}

type Pt = { x: number; y: number };
type Quad = { a: Pt; c: Pt; b: Pt };

function quadChain(pts: Pt[], sagFactor: number, minSag = 20): Quad[] {
  const out: Quad[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const sag = Math.max(minSag, dist * sagFactor);
    out.push({ a, b, c: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + sag } });
  }
  return out;
}

function quadPointAt(q: Quad, t: number): { p: Pt; angle: number } {
  const mt = 1 - t;
  const p = {
    x: mt * mt * q.a.x + 2 * mt * t * q.c.x + t * t * q.b.x,
    y: mt * mt * q.a.y + 2 * mt * t * q.c.y + t * t * q.b.y,
  };
  const dx = 2 * mt * (q.c.x - q.a.x) + 2 * t * (q.b.x - q.c.x);
  const dy = 2 * mt * (q.c.y - q.a.y) + 2 * t * (q.b.y - q.c.y);
  return { p, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

function quadsToPath(qs: Quad[]): string {
  if (!qs.length) return "";
  const segs = [`M ${qs[0].a.x} ${qs[0].a.y}`];
  for (const q of qs) segs.push(`Q ${q.c.x} ${q.c.y} ${q.b.x} ${q.b.y}`);
  return segs.join(" ");
}

function buildStringPath(
  s: StringConn,
  assets: AssetBase[],
): { d: string; points: Pt[]; quads: Quad[] } | null {
  if (s.points && s.points.length >= 2) {
    const quads = quadChain(s.points, s.sag ?? 0.18);
    return { d: quadsToPath(quads), points: s.points, quads };
  }
  if (s.from && s.to) {
    const a = assets.find((x) => x.id === s.from);
    const b = assets.find((x) => x.id === s.to);
    if (!a || !b) return null;
    const pa = pinPoint(a);
    const pb = pinPoint(b);
    const sagFactor = s.sag ?? (s.hanging ? 0.18 : 0.03);
    const quads = quadChain([pa, pb], sagFactor, s.hanging ? 30 : 6);
    return { d: quadsToPath(quads), points: [pa, pb], quads };
  }
  return null;
}


function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function darken(hex: string, k: number): string {
  const c = hexToRgb(hex);
  if (!c) return hex;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - k))));
  return `rgb(${f(c.r)}, ${f(c.g)}, ${f(c.b)})`;
}
function lighten(hex: string, k: number): string {
  const c = hexToRgb(hex);
  if (!c) return hex;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (255 - v) * k)));
  return `rgb(${f(c.r)}, ${f(c.g)}, ${f(c.b)})`;
}

function patternStyle(p: NonNullable<SurfaceOverlay["pattern"]>): React.CSSProperties {
  const size = Math.max(4, p.size || 24);
  const t = Math.max(1, p.thickness || 1);
  const c1 = p.color1;
  const c2 = p.color2;
  if (p.type === "bands") {
    const colors = (p.colors && p.colors.length > 0 ? p.colors : [c1, c2]);
    const w = Math.max(1, p.stripeWidth ?? 24);
    const gap = Math.max(0, p.gap ?? 0);
    const repeat = Math.max(1, Math.floor(p.repeat ?? 1));
    const dirDeg = p.direction === "horizontal" ? 0
      : p.direction === "diagonal" ? 45
      : p.direction === "diagonal-reverse" ? -45
      : 90; // vertical default
    const stops: string[] = [];
    let off = 0;
    for (let r = 0; r < repeat; r++) {
      for (const col of colors) {
        stops.push(`${col} ${off}px ${off + w}px`);
        off += w;
        if (gap > 0) {
          stops.push(`${c2} ${off}px ${off + gap}px`);
          off += gap;
        }
      }
    }
    return {
      backgroundImage: `repeating-linear-gradient(${dirDeg}deg, ${stops.join(", ")})`,
    };
  }
  if (p.type === "stripes") {
    const angle = p.angle ?? 45;
    return {
      backgroundImage: `repeating-linear-gradient(${angle}deg, ${c1} 0 ${t}px, ${c2} ${t}px ${size}px)`,
    };
  }
  if (p.type === "checker") {
    const half = size / 2;
    return {
      backgroundColor: c2,
      backgroundImage: `linear-gradient(45deg, ${c1} 25%, transparent 25%, transparent 75%, ${c1} 75%), linear-gradient(45deg, ${c1} 25%, transparent 25%, transparent 75%, ${c1} 75%)`,
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: `0 0, ${half}px ${half}px`,
    };
  }
  if (p.type === "dots") {
    return {
      backgroundColor: c2,
      backgroundImage: `radial-gradient(${c1} ${t}px, transparent ${t + 0.5}px)`,
      backgroundSize: `${size}px ${size}px`,
    };
  }
  // grid (default)
  return {
    backgroundColor: c2,
    backgroundImage: `linear-gradient(${c1} ${t}px, transparent ${t}px), linear-gradient(90deg, ${c1} ${t}px, transparent ${t}px)`,
    backgroundSize: `${size}px ${size}px`,
  };
}

// ---------- bunting garland flags ----------
const BUNTING_DEFAULT_COLORS = ["#e4572e", "#f4c95d", "#4d9de0", "#7fb069", "#e07a9c"];

function flagPath(shape: string, w: number, h: number): string {
  const hw = w / 2;
  switch (shape) {
    case "rect":
      return `M ${-hw} 0 L ${hw} 0 L ${hw} ${h} L ${-hw} ${h} Z`;
    case "swallowtail":
      return `M ${-hw} 0 L ${hw} 0 L ${hw} ${h} L 0 ${h * 0.62} L ${-hw} ${h} Z`;
    case "scallop":
      return `M ${-hw} 0 L ${hw} 0 L ${hw} ${h * 0.6} Q 0 ${h * 1.25} ${-hw} ${h * 0.6} Z`;
    case "pennant":
      return `M ${-hw} 0 L ${hw} 0 L ${-hw * 0.15} ${h} Z`;
    case "triangle":
    default:
      return `M ${-hw} 0 L ${hw} 0 L 0 ${h} Z`;
  }
}

function patternFill(kind: string | undefined, w: number, h: number, ink: string) {
  if (!kind || kind === "none") return null;
  const els: React.ReactNode[] = [];
  if (kind === "dots") {
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++)
        els.push(<circle key={`${r}-${c}`} cx={-w / 2 + (c + 0.5) * (w / 5)} cy={(r + 0.5) * (h / 5)} r={Math.max(1, w * 0.035)} fill={ink} />);
  } else if (kind === "stripes") {
    for (let i = 0; i < 7; i++)
      els.push(<rect key={i} x={-w / 2 + i * (w / 7)} y={0} width={w / 14} height={h} fill={ink} />);
  } else if (kind === "chevron") {
    for (let i = 0; i < 6; i++)
      els.push(<path key={i} d={`M ${-w / 2} ${i * (h / 6)} L 0 ${i * (h / 6) + h / 12} L ${w / 2} ${i * (h / 6)}`} stroke={ink} strokeWidth={Math.max(1, h * 0.03)} fill="none" />);
  } else if (kind === "waves") {
    for (let i = 0; i < 6; i++)
      els.push(<path key={i} d={`M ${-w / 2} ${i * (h / 6) + h * 0.06} q ${w / 4} ${-h * 0.05} ${w / 2} 0 q ${w / 4} ${h * 0.05} ${w / 2} 0`} stroke={ink} strokeWidth={Math.max(1, h * 0.028)} fill="none" />);
  }
  return <>{els}</>;
}

function BuntingFlags({ cfg, quads, sid }: { cfg: NonNullable<StringConn["bunting"]>; quads: Quad[]; sid: string }) {
  if (!quads.length) return null;
  const count = Math.max(1, Math.min(60, Math.round(cfg.count)));
  const h = cfg.size || 46;
  const w = cfg.width || h * 0.8;
  const colors = cfg.colors && cfg.colors.length ? cfg.colors : BUNTING_DEFAULT_COLORS;
  const spread = Math.min(0.98, Math.max(0.2, 1 - (cfg.spacing ?? 0.12)));
  const outline = cfg.outline || "rgba(0,0,0,0.35)";
  const out: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    // global t across the whole chain, inset from the knots
    const gt = count === 1 ? 0.5 : 0.5 - spread / 2 + (spread * i) / (count - 1);
    const scaled = gt * quads.length;
    const qi = Math.min(quads.length - 1, Math.floor(scaled));
    const { p, angle } = quadPointAt(quads[qi], scaled - qi);
    const ov = cfg.flags?.[i] || {};
    const fill = ov.color || colors[i % colors.length];
    const pat = ov.pattern ?? cfg.pattern;
    out.push(
      <g key={`${sid}-f-${i}`} transform={`translate(${p.x} ${p.y}) rotate(${angle})`} style={{ pointerEvents: "none" }}>
        <path d={flagPath(cfg.shape, w, h)} fill={fill} stroke={outline} strokeWidth={1}
          style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.28))" }} />
        <g clipPath={`url(#bclip-${sid}-${i})`} opacity={0.55}>
          {patternFill(pat, w, h, "rgba(0,0,0,0.55)")}
        </g>
        <clipPath id={`bclip-${sid}-${i}`}>
          <path d={flagPath(cfg.shape, w, h)} />
        </clipPath>
      </g>,
    );
  }
  return <>{out}</>;
}
