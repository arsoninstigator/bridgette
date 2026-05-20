import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  MousePointer2,
  Layers,
  Library,
  Blocks as BlocksIcon,
  PaintRoller,
  Paperclip,
  Shapes,
  Spline,
  Pencil,
  SquarePen,
  Undo2,
  Redo2,
  ChevronDown,
  Eye,
  X,
  ArrowUp,
  ArrowDown,
  Trash2,
  Info,
} from "lucide-react";
import {
  createBoard,
  getBoard,
  getBoardByEditKey,
  getLastBoardId,
  publishBoard,
  saveBoard,
} from "../lib/boardr/storage";
import type { AssetBase, AssetKind, Board, BoardKind, StringConn } from "../lib/boardr/types";
import { makeAsset, nextZ } from "../lib/boardr/factories";
import { BoardCanvas } from "../components/boardr/BoardCanvas";
import { SettingsPanel } from "../components/boardr/SettingsPanel";

const search = z.object({
  id: z.string().optional(),
  k: z.string().optional(),
});

export const Route = createFileRoute("/editor")({
  validateSearch: search,
  component: EditorRoute,
});

type PanelKey = "select" | "layers" | "library" | "blocks" | "styles" | "assets" | "shape" | "string";

function EditorRoute() {
  const { id, k } = Route.useSearch();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let b: Board | null = null;
      if (id) b = getBoard(id);
      if (!b && k) b = await getBoardByEditKey(k);
      if (!b) {
        const last = getLastBoardId();
        if (last) b = getBoard(last);
      }
      setBoard(b);
      setLoading(false);
    })();
  }, [id, k]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center font-mono text-xs lowercase tracking-wider text-muted-foreground">loading…</div>;
  }

  if (!board) {
    // Redirect to dashboard if nothing
    if (typeof window !== "undefined") {
      navigate({ to: "/dashboard" });
    }
    return null;
  }

  return <Editor board={board} setBoard={setBoard} />;
}

function Editor({ board, setBoard }: { board: Board; setBoard: (b: Board) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stringFromId, setStringFromId] = useState<string | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelKey | null>("library");
  const [previewMode, setPreviewMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // history
  const pastRef = useRef<Board[]>([]);
  const futureRef = useRef<Board[]>([]);

  const stringMode = activePanel === "string";

  const selected = useMemo(
    () => board.assets.find((a) => a.id === selectedId) ?? null,
    [board, selectedId],
  );

  function update(patch: Partial<Board>, record = true) {
    if (record) {
      pastRef.current.push(board);
      if (pastRef.current.length > 50) pastRef.current.shift();
      futureRef.current = [];
    }
    const next = { ...board, ...patch, updatedAt: Date.now() };
    saveBoard(next);
    setBoard(next);
  }

  function undo() {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push(board);
    saveBoard(prev);
    setBoard(prev);
  }
  function redo() {
    const nxt = futureRef.current.pop();
    if (!nxt) return;
    pastRef.current.push(board);
    saveBoard(nxt);
    setBoard(nxt);
  }

  function updateAsset(id: string, patch: Partial<AssetBase>, record = true) {
    update({ assets: board.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) }, record);
  }

  function deleteAsset(id: string) {
    update({
      assets: board.assets.filter((a) => a.id !== id),
      strings: board.strings.filter((s) => s.from !== id && s.to !== id),
    });
    setSelectedId(null);
    setShowSettings(false);
  }

  function addAsset(kind: AssetKind, x?: number, y?: number, extra?: Partial<AssetBase>) {
    const base = makeAsset(kind, x ?? 300 + Math.random() * 200, y ?? 250 + Math.random() * 200);
    const a = { ...base, ...(extra || {}) };
    update({ assets: [...board.assets, a] });
    setSelectedId(a.id);
    setShowSettings(true);
  }

  function reorder(id: string, dir: "up" | "down" | "top" | "bottom") {
    const sorted = [...board.assets].sort((a, b) => a.z - b.z);
    const idx = sorted.findIndex((a) => a.id === id);
    if (idx === -1) return;
    if (dir === "top") {
      sorted.splice(idx, 1);
      sorted.push(board.assets.find((a) => a.id === id)!);
    } else if (dir === "bottom") {
      sorted.splice(idx, 1);
      sorted.unshift(board.assets.find((a) => a.id === id)!);
    } else if (dir === "up" && idx < sorted.length - 1) {
      [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
    } else if (dir === "down" && idx > 0) {
      [sorted[idx], sorted[idx - 1]] = [sorted[idx - 1], sorted[idx]];
    }
    const reIndexed = sorted.map((a, i) => ({ ...a, z: 10 + i }));
    update({ assets: reIndexed });
  }

  function handleAssetClickStringMode(id: string) {
    const a = board.assets.find((x) => x.id === id);
    if (!a || !a.pinEnabled) return;
    if (!stringFromId) return setStringFromId(id);
    if (stringFromId === id) return setStringFromId(null);
    const conn: StringConn = {
      id: Math.random().toString(36).slice(2, 9),
      from: stringFromId,
      to: id,
    };
    const exists = board.strings.some(
      (s) => (s.from === conn.from && s.to === conn.to) || (s.from === conn.to && s.to === conn.from),
    );
    if (!exists) update({ strings: [...board.strings, conn] });
    setStringFromId(null);
  }

  function publish() {
    const key = publishBoard(board);
    update({ publishedKey: key }, false);
    setShowPublish(true);
  }

  useEffect(() => {
    if (selectedId) {
      const a = board.assets.find((x) => x.id === selectedId);
      if (a) updateAsset(a.id, { z: nextZ() }, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div className="h-screen flex flex-col bg-editor-canvas overflow-hidden">
      {/* Top bar */}
      <header className="bg-editor-header flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="font-display text-xl lowercase">zinegeist</Link>
          <span className="text-stone-700/40">·</span>
          <input
            value={board.name}
            onChange={(e) => update({ name: e.target.value }, false)}
            placeholder="untitled board name"
            className="bg-transparent font-display text-lg lowercase focus:outline-none border-b border-dashed border-transparent focus:border-stone-700/30 px-1 min-w-0 max-w-[260px]"
          />
          <div className="flex items-center gap-1 ml-2">
            <button onClick={undo} className="p-1.5 rounded hover:bg-black/5" title="undo">
              <Undo2 size={16} />
            </button>
            <button onClick={redo} className="p-1.5 rounded hover:bg-black/5" title="redo">
              <Redo2 size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode((v) => !v)}
            className="flex items-center gap-2 rounded-md border-2 border-stone-700/40 bg-pink-50/60 px-4 py-2 font-mono text-[12px] lowercase tracking-wide text-stone-700 hover:bg-pink-50"
          >
            {previewMode ? "preview mode" : "edit mode"}
            {previewMode ? <Eye size={14} /> : <SquarePen size={14} />}
          </button>
          <button
            onClick={() => setShowPublish(true)}
            className="rounded-md bg-stone-500/80 px-5 py-2 font-mono text-[12px] lowercase tracking-wide text-stone-50 hover:bg-stone-600"
          >
            publish
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Icon sidebar */}
        {!previewMode && (
          <nav className="w-[88px] shrink-0 bg-editor-canvas border-r border-border/60 py-4 flex flex-col gap-2 overflow-y-auto">
            <IconBtn icon={MousePointer2} label="select" k="select" active={activePanel} onClick={setActivePanel} />
            <IconBtn icon={Layers} label="layers" k="layers" active={activePanel} onClick={setActivePanel} />
            <IconBtn icon={Library} label="library" k="library" active={activePanel} onClick={setActivePanel} />
            <IconBtn icon={BlocksIcon} label="blocks" k="blocks" active={activePanel} onClick={setActivePanel} />
            <IconBtn icon={PaintRoller} label="styles" k="styles" active={activePanel} onClick={setActivePanel} />
            <IconBtn icon={Paperclip} label="assets" k="assets" active={activePanel} onClick={setActivePanel} />
            <IconBtn icon={Shapes} label="shape" k="shape" active={activePanel} onClick={setActivePanel} />
            <IconBtn icon={Spline} label="string" k="string" active={activePanel} onClick={setActivePanel} />
          </nav>
        )}

        {/* Slide-out panel */}
        {!previewMode && activePanel && (
          <aside className="w-[280px] shrink-0 bg-card border-r border-border/60 overflow-y-auto">
            <PanelHeader title={activePanel} onClose={() => setActivePanel(null)} />
            <div className="p-3">
              {activePanel === "select" && (
                <SelectPanel board={board} onPick={(kind) => update({ kind })} />
              )}
              {activePanel === "layers" && (
                <LayersPanel
                  board={board}
                  selectedId={selectedId}
                  onSelect={(id) => { setSelectedId(id); setShowSettings(true); }}
                  onReorder={reorder}
                  onDelete={deleteAsset}
                />
              )}
              {activePanel === "library" && <LibraryPanel onAdd={addAsset} />}
              {activePanel === "styles" && <StylesPanel />}
              {activePanel === "assets" && <AssetsPanel />}
              {activePanel === "shape" && <ShapePanel onAdd={addAsset} />}
              {activePanel === "string" && (
                <StringPanel stringFromId={stringFromId} onClear={() => setStringFromId(null)} />
              )}
            </div>
          </aside>
        )}

        {/* Canvas area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-5xl">
              <div className="font-display text-lg lowercase mb-3 px-1">frame one (index)</div>
              <div className="rounded-md overflow-hidden analog-shadow border border-border/60">
                <div className="aspect-[16/9] flex">
                  <BoardCanvas
                    kind={board.kind}
                    assets={board.assets}
                    strings={board.strings}
                    interactive={!previewMode}
                    selectedId={selectedId}
                    stringMode={stringMode}
                    stringFromId={stringFromId}
                    onSelect={(id) => {
                      setSelectedId(id);
                      if (id) setShowSettings(true);
                    }}
                    onMove={(id, x, y) => updateAsset(id, { x, y }, false)}
                    onAssetClick={handleAssetClickStringMode}
                    onDropAsset={(kind, x, y, extra) => addAsset(kind, x, y, extra)}
                  />
                </div>
              </div>
              {stringMode && (
                <div className="mt-3 rounded-md bg-stone-900/85 text-stone-50 px-3 py-2 font-mono text-[10px] lowercase tracking-wider text-center">
                  string mode — click a pinned asset, then click another to connect
                </div>
              )}
            </div>
          </div>
          {!previewMode && (
            <div className="px-6 pb-4">
              <button className="w-full max-w-5xl mx-auto flex items-center justify-center gap-2 rounded-md bg-pink-100/60 hover:bg-pink-100 border border-border/60 py-3 font-mono text-xs lowercase text-muted-foreground">
                add pages or sections
                <ChevronDown size={14} />
              </button>
            </div>
          )}
        </main>

        {/* Right settings drawer */}
        {showSettings && selected && !previewMode && (
          <SettingsPanel
            asset={selected}
            onChange={(patch) => updateAsset(selected.id, patch, false)}
            onDelete={() => deleteAsset(selected.id)}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>

      {showPublish && (
        <PublishDialog board={board} onClose={() => setShowPublish(false)} onPublish={publish} />
      )}
    </div>
  );
}

function IconBtn({
  icon: Icon,
  label,
  k,
  active,
  onClick,
}: {
  icon: typeof MousePointer2;
  label: string;
  k: PanelKey;
  active: PanelKey | null;
  onClick: (k: PanelKey | null) => void;
}) {
  const isActive = active === k;
  return (
    <button
      className="editor-icon-btn"
      data-active={isActive}
      onClick={() => onClick(isActive ? null : k)}
    >
      <Icon size={26} strokeWidth={1.6} />
      <span className="label">{label}</span>
    </button>
  );
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
      <h2 className="font-display text-base lowercase">{title}</h2>
      <button onClick={onClose} className="p-1 rounded hover:bg-black/5">
        <X size={14} />
      </button>
    </div>
  );
}

function SelectPanel({ board, onPick }: { board: Board; onPick: (k: BoardKind) => void }) {
  const surfaces: { kind: BoardKind; label: string; className: string }[] = [
    { kind: "cork", label: "cork", className: "bg-board-cork" },
    { kind: "mat", label: "cutting mat", className: "bg-board-mat" },
    { kind: "wall", label: "wall", className: "bg-board-wall" },
    { kind: "metal", label: "metal", className: "bg-board-metal" },
  ];
  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] lowercase text-muted-foreground mb-2">surface for this frame</p>
      <div className="grid grid-cols-2 gap-2">
        {surfaces.map((s) => (
          <button
            key={s.kind}
            onClick={() => onPick(s.kind)}
            className={`rounded-md overflow-hidden border ${board.kind === s.kind ? "border-stone-900 ring-2 ring-stone-900/30" : "border-border"}`}
          >
            <div className={`h-20 ${s.className}`} />
            <div className="bg-card px-2 py-1 font-mono text-[10px] lowercase text-left">{s.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function LayersPanel({
  board,
  selectedId,
  onSelect,
  onReorder,
  onDelete,
}: {
  board: Board;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (id: string, dir: "up" | "down") => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...board.assets].sort((a, b) => b.z - a.z);
  if (sorted.length === 0)
    return <p className="font-mono text-xs text-muted-foreground lowercase">no layers yet. drop something from the library.</p>;
  return (
    <ul className="space-y-1">
      {sorted.map((a) => (
        <li
          key={a.id}
          className={`flex items-center gap-2 rounded px-2 py-1.5 border ${selectedId === a.id ? "border-stone-900 bg-accent/40" : "border-transparent hover:bg-black/5"}`}
        >
          <button onClick={() => onSelect(a.id)} className="flex-1 text-left font-mono text-[11px] lowercase truncate">
            {a.kind} · {a.id.slice(0, 4)}
          </button>
          <button onClick={() => onReorder(a.id, "up")} className="p-1 hover:bg-black/5 rounded"><ArrowUp size={12} /></button>
          <button onClick={() => onReorder(a.id, "down")} className="p-1 hover:bg-black/5 rounded"><ArrowDown size={12} /></button>
          <button onClick={() => onDelete(a.id)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 size={12} /></button>
        </li>
      ))}
    </ul>
  );
}

const LIBRARY_ITEMS: { kind: AssetKind; label: string }[] = [
  { kind: "sticky", label: "sticky" },
  { kind: "polaroid", label: "polaroid" },
  { kind: "photostrip", label: "photo strip" },
  { kind: "photo", label: "photo" },
  { kind: "paper", label: "paper" },
  { kind: "washi", label: "washi tape" },
  { kind: "pin", label: "push pin" },
];

function LibraryPanel({ onAdd }: { onAdd: (kind: AssetKind) => void }) {
  return (
    <div>
      <p className="font-mono text-[10px] lowercase text-muted-foreground mb-2">drag to canvas, or click to add</p>
      <div className="grid grid-cols-2 gap-2">
        {LIBRARY_ITEMS.map((it) => (
          <DraggableItem key={it.kind} kind={it.kind} label={it.label} onAdd={onAdd}>
            <LibraryPreview kind={it.kind} />
          </DraggableItem>
        ))}
      </div>
    </div>
  );
}

function DraggableItem({
  kind,
  label,
  onAdd,
  children,
  extra,
}: {
  kind: AssetKind;
  label: string;
  onAdd: (k: AssetKind, x?: number, y?: number, extra?: Partial<AssetBase>) => void;
  children: React.ReactNode;
  extra?: Partial<AssetBase>;
}) {
  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-boardr-kind", kind);
        if (extra) e.dataTransfer.setData("application/x-boardr-extra", JSON.stringify(extra));
      }}
      onClick={() => onAdd(kind, undefined, undefined, extra)}
      className="group flex flex-col items-center justify-center gap-2 rounded-md border border-border bg-card/60 px-2 py-3 hover:bg-accent/30 cursor-grab active:cursor-grabbing"
    >
      <div className="h-14 flex items-center justify-center">{children}</div>
      <span className="font-mono text-[10px] lowercase text-muted-foreground">{label}</span>
    </button>
  );
}

function LibraryPreview({ kind }: { kind: AssetKind }) {
  switch (kind) {
    case "sticky":
      return <div className="size-10 rounded-[2px] analog-shadow-sm" style={{ background: "#fff59d" }} />;
    case "polaroid":
      return (
        <div className="bg-white p-1 analog-shadow-sm" style={{ width: 40, height: 48 }}>
          <div className="size-full" style={{ background: "linear-gradient(135deg,#c9b99a,#8b7355)" }} />
        </div>
      );
    case "photostrip":
      return (
        <div className="bg-stone-900 p-[2px] analog-shadow-sm" style={{ width: 22, height: 50 }}>
          <div className="grid grid-rows-4 gap-[1px] h-full">{[0,1,2,3].map((i) => <div key={i} style={{ background: "#999" }} />)}</div>
        </div>
      );
    case "photo":
      return (
        <div className="bg-white p-[2px] analog-shadow-sm" style={{ width: 46, height: 34 }}>
          <div className="size-full" style={{ background: "linear-gradient(135deg,#a8957a,#5c4a36)" }} />
        </div>
      );
    case "paper":
      return <div className="analog-shadow-sm" style={{ width: 46, height: 36, background: "#fbf7ec", clipPath: "polygon(0 8%, 6% 0, 96% 4%, 100% 8%, 96% 96%, 90% 100%, 8% 96%, 0% 92%)" }} />;
    case "washi":
      return <div style={{ width: 50, height: 12, background: "rgba(180,160,210,0.85)", backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0 4px, transparent 4px 8px)", transform: "rotate(-10deg)" }} />;
    case "pin":
      return <div className="size-5 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, #ff8a8a, #c0212a 60%, #6e0a10)", boxShadow: "0 2px 4px rgba(0,0,0,0.4)" }} />;
    case "shape":
      return <div className="size-8 rounded-sm" style={{ background: "#c9b99a" }} />;
  }
}

function StylesPanel() {
  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] lowercase text-muted-foreground">save your fonts, colors, and style presets here.</p>
      <div className="rounded-md border border-dashed border-border p-4 text-center font-mono text-[11px] lowercase text-muted-foreground">
        coming soon
      </div>
    </div>
  );
}

function AssetsPanel() {
  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] lowercase text-muted-foreground">your reusable components and uploaded files.</p>
      <button className="w-full rounded-md border border-dashed border-border py-6 font-mono text-[11px] lowercase text-muted-foreground hover:bg-black/5">
        + upload file
      </button>
    </div>
  );
}

function ShapePanel({ onAdd }: { onAdd: (kind: AssetKind) => void }) {
  const shapes: { variant: NonNullable<AssetBase["shape"]>; preview: React.ReactNode }[] = [
    { variant: "rect", preview: <div className="size-10" style={{ background: "#8b7355" }} /> },
    { variant: "circle", preview: <div className="size-10 rounded-full" style={{ background: "#8b7355" }} /> },
    { variant: "triangle", preview: <svg width={40} height={40} viewBox="0 0 100 100"><polygon points="50,5 95,95 5,95" fill="#8b7355" /></svg> },
    { variant: "diamond", preview: <div className="size-9" style={{ background: "#8b7355", transform: "rotate(45deg)" }} /> },
    { variant: "star", preview: <svg width={40} height={40} viewBox="0 0 100 100"><polygon points="50,5 61,38 96,38 67,59 78,95 50,73 22,95 33,59 4,38 39,38" fill="#8b7355" /></svg> },
  ];
  return (
    <div>
      <p className="font-mono text-[10px] lowercase text-muted-foreground mb-2">drag a shape onto the frame</p>
      <div className="grid grid-cols-2 gap-2">
        {shapes.map((s) => (
          <DraggableItem
            key={s.variant}
            kind="shape"
            label={s.variant}
            onAdd={onAdd}
            extra={{ shape: s.variant }}
          >
            {s.preview}
          </DraggableItem>
        ))}
      </div>
    </div>
  );
}

function StringPanel({ stringFromId, onClear }: { stringFromId: string | null; onClear: () => void }) {
  return (
    <div className="space-y-3">
      <p className="font-mono text-[11px] lowercase text-muted-foreground">
        click a pinned asset, then click another to connect them, murderboard style.
      </p>
      <div className="rounded-md bg-accent/30 px-3 py-2 font-mono text-[10px] lowercase">
        {stringFromId ? `selected: ${stringFromId.slice(0, 6)}…` : "no anchor yet"}
      </div>
      {stringFromId && (
        <button onClick={onClear} className="w-full rounded border border-border py-2 font-mono text-[11px] lowercase hover:bg-black/5">
          cancel selection
        </button>
      )}
      <p className="font-mono text-[10px] lowercase text-muted-foreground/80">
        only assets with "pin enabled" can be connected. toggle that in the asset settings panel.
      </p>
    </div>
  );
}

function PublishDialog({ board, onClose, onPublish }: { board: Board; onClose: () => void; onPublish: () => void }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const editUrl = `${origin}/editor?k=${board.editKey}`;
  const publicUrl = board.publishedKey ? `${origin}/s/${board.publishedKey}` : null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 grid place-items-center p-6" onClick={onClose}>
      <div className="bg-card border border-border rounded-md p-6 max-w-lg w-full analog-shadow" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl lowercase">your board, your keys</h3>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground lowercase">
          keep these somewhere safe. there's no login.
        </p>
        <div className="mt-5 space-y-4">
          <KeyRow label="edit key (sha256-indexed)" value={board.editKey} />
          <KeyRow label="edit url" value={editUrl} />
          <KeyRow label="published url" value={publicUrl ?? "— not published yet —"} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onPublish} className="rounded-md bg-stone-900 text-stone-50 px-4 py-2 font-mono text-[11px] lowercase tracking-wider">
            {board.publishedKey ? "re-publish" : "publish now"}
          </button>
          <button onClick={onClose} className="rounded-md border border-border px-4 py-2 font-mono text-[11px] lowercase tracking-wider">
            done
          </button>
        </div>
      </div>
    </div>
  );
}

function KeyRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] lowercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="flex gap-2">
        <input readOnly value={value} className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs font-mono" />
        <button
          onClick={() => navigator.clipboard?.writeText(value)}
          className="rounded-md border border-border px-3 py-1.5 font-mono text-[10px] lowercase tracking-wider hover:bg-accent/40"
        >
          copy
        </button>
      </div>
    </div>
  );
}
