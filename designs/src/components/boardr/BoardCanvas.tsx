import { useRef, useState } from "react";
import type { AssetBase, AssetKind, BoardKind, StringConn } from "../../lib/boardr/types";
import { AssetItem } from "./AssetItem";

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
  interactive?: boolean;
  selectedId?: string | null;
  selectedIds?: string[];
  stringMode?: boolean;
  stringFromId?: string | null;
  onSelect?: (id: string | null, additive?: boolean) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onMoveMany?: (moves: { id: string; x: number; y: number }[]) => void;
  onResize?: (id: string, w: number, h: number) => void;
  onAssetClick?: (id: string) => void;
  onAssetContextMenu?: (id: string, clientX: number, clientY: number) => void;
  onDropAsset?: (kind: AssetKind, x: number, y: number, extra?: Partial<AssetBase>) => void;
}

export function BoardCanvas({
  kind,
  assets,
  strings,
  interactive,
  selectedId,
  selectedIds,
  stringMode,
  stringFromId,
  onSelect,
  onMove,
  onMoveMany,
  onResize,
  onAssetClick,
  onAssetContextMenu,
  onDropAsset,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const selSet = new Set(selectedIds ?? (selectedId ? [selectedId] : []));

  function startDrag(e: React.PointerEvent, id: string) {
    if (!interactive || stringMode) return;
    const asset = assets.find((a) => a.id === id);
    if (!asset || asset.locked) return;
    e.stopPropagation();
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

  return (
    <div
      ref={ref}
      onPointerDown={() => onSelect?.(null)}
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
      className={`relative flex-1 overflow-hidden ${BG[kind]}`}
    >
      {/* string layer */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      >
        {strings.map((s) => {
          const a = assets.find((x) => x.id === s.from);
          const b = assets.find((x) => x.id === s.to);
          if (!a || !b) return null;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2 + 16;
          return (
            <path
              key={s.id}
              d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
              stroke={s.color || "#a8231a"}
              strokeWidth={2}
              fill="none"
              opacity={0.85}
              style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))" }}
            />
          );
        })}
      </svg>
      {assets.map((a) => (
        <AssetItem
          key={a.id}
          asset={a}
          interactive={interactive}
          selected={selSet.has(a.id)}
          pinHighlight={stringMode && !!a.pinEnabled && (stringFromId === a.id || !stringFromId)}
          onPointerDown={(e) => startDrag(e, a.id)}
          onClick={(e) => {
            e.stopPropagation();
            if (stringMode) onAssetClick?.(a.id);
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
        />
      ))}
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
