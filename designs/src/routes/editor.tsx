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
  Heart,
  History,
  ChevronLeft,
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
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "../components/ui/context-menu";

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

type RightPanelKey = "pages" | "canvas" | "connections" | "settings";

type SurfaceStyle = { border: number; borderColor: string; borderStyle: "solid" | "dashed" | "double"; radius: number };

type AssetMenuState = { x: number; y: number; ids: string[] } | null;

function Editor({ board, setBoard }: { board: Board; setBoard: (b: Board) => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedId = selectedIds[selectedIds.length - 1] ?? null;
  const [stringFromId, setStringFromId] = useState<string | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelKey | null>("library");
  const [previewMode, setPreviewMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [libraryView, setLibraryView] = useState<LibraryView>({ mode: "index" });
  const [favorites, setFavorites] = useState<string[]>(() => readFavs());
  const [recent, setRecent] = useState<string[]>(() => readRecent());
  const [rightPanel, setRightPanel] = useState<RightPanelKey | null>(null);
  const [frameSize, setFrameSize] = useState({ w: 1000, h: 640 });
  const [addMenu, setAddMenu] = useState<null | "root" | "section">(null);
  const [activeSlug, setActiveSlug] = useState<string>(board.activeSlug || "index");
  const pages = board.pages && board.pages.length > 0 ? board.pages : [{ slug: "index", name: "frame one (index)" }];
  const [sections, setSections] = useState<{ id: string; kind: "header" | "navbar" | "footer" | "blank" }[]>([]);

  function slugify(s: string) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "page";
  }
  function uniqueSlug(base: string) {
    const taken = new Set(pages.map((p) => p.slug));
    if (!taken.has(base)) return base;
    let i = 2;
    while (taken.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }

  function addPage() {
    const n = pages.length + 1;
    const name = `frame ${n}`;
    const slug = uniqueSlug(slugify(`frame-${n}`));
    const newPages = [...pages, { slug, name }];
    const pageAssets = { ...(board.pageAssets || {}) };
    pageAssets[activeSlug] = { assets: board.assets, strings: board.strings };
    pageAssets[slug] = { assets: [], strings: [] };
    update({ pages: newPages, pageAssets, assets: [], strings: [], activeSlug: slug });
    setActiveSlug(slug);
    setAddMenu(null);
  }
  function switchPage(slug: string) {
    if (slug === activeSlug) return;
    const pageAssets = { ...(board.pageAssets || {}) };
    pageAssets[activeSlug] = { assets: board.assets, strings: board.strings };
    const target = pageAssets[slug] || { assets: [], strings: [] };
    update({ pages, pageAssets, assets: target.assets, strings: target.strings, activeSlug: slug }, false);
    setActiveSlug(slug);
    setSelectedIds([]);
  }
  function renamePage(slug: string, name: string) {
    const newPages = pages.map((p) => (p.slug === slug ? { ...p, name } : p));
    update({ pages: newPages }, false);
  }
  function deletePage(slug: string) {
    if (slug === "index" || pages.length <= 1) return;
    const newPages = pages.filter((p) => p.slug !== slug);
    const pageAssets = { ...(board.pageAssets || {}) };
    delete pageAssets[slug];
    if (slug === activeSlug) {
      const target = pageAssets["index"] || { assets: [], strings: [] };
      update({ pages: newPages, pageAssets, assets: target.assets, strings: target.strings, activeSlug: "index" });
      setActiveSlug("index");
    } else {
      update({ pages: newPages, pageAssets });
    }
  }
  function addSection(kind: "header" | "navbar" | "footer" | "blank") {
    setSections((s) => [...s, { id: crypto.randomUUID(), kind }]);
    setAddMenu(null);
  }
  const [surfaceStyle, setSurfaceStyle] = useState<SurfaceStyle>({ border: 0, borderColor: "#3a2b1f", borderStyle: "solid", radius: 2 });
  const [assetMenu, setAssetMenu] = useState<AssetMenuState>(null);
  const [drawWashi, setDrawWashi] = useState<{ tapeColor?: string } | null>(null);

  function setSelectedId(id: string | null) {
    setSelectedIds(id ? [id] : []);
  }
  function toggleSelect(id: string | null, additive?: boolean) {
    if (id === null) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds((prev) => {
      if (!additive) return [id];
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }

  function startFrameResize(e: React.PointerEvent, dir: "r" | "b" | "br") {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const sw = frameSize.w;
    const sh = frameSize.h;
    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setFrameSize({
        w: dir === "b" ? sw : Math.max(360, sw + dx),
        h: dir === "r" ? sh : Math.max(280, sh + dy),
      });
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function toggleFav(setId: string) {
    setFavorites((prev) => {
      const next = prev.includes(setId) ? prev.filter((x) => x !== setId) : [setId, ...prev];
      writeFavs(next);
      return next;
    });
  }
  function bumpRecent(setId: string) {
    setRecent((prev) => {
      const next = [setId, ...prev.filter((x) => x !== setId)].slice(0, 12);
      writeRecent(next);
      return next;
    });
  }

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

  function moveMany(moves: { id: string; x: number; y: number }[]) {
    const byId = new Map(moves.map((m) => [m.id, m]));
    update(
      {
        assets: board.assets.map((a) => {
          const m = byId.get(a.id);
          return m ? { ...a, x: m.x, y: m.y } : a;
        }),
      },
      false,
    );
  }

  function resizeAsset(id: string, w: number, h: number) {
    updateAsset(id, { width: Math.round(w), height: Math.round(h) }, false);
  }

  function duplicateAssets(ids: string[]) {
    const baseZ = nextZ();
    const dups = ids
      .map((id) => board.assets.find((a) => a.id === id))
      .filter((a): a is AssetBase => !!a)
      .map((a, i) => ({
        ...a,
        id: Math.random().toString(36).slice(2, 9),
        x: a.x + 24,
        y: a.y + 24,
        z: baseZ + i,
      }));
    update({ assets: [...board.assets, ...dups] });
    setSelectedIds(dups.map((d) => d.id));
  }

  function toggleLock(ids: string[]) {
    const anyUnlocked = ids.some((id) => !board.assets.find((a) => a.id === id)?.locked);
    update({
      assets: board.assets.map((a) =>
        ids.includes(a.id) ? { ...a, locked: anyUnlocked } : a,
      ),
    });
  }

  function groupAssets(ids: string[]) {
    if (ids.length < 2) return;
    const gid = "g_" + Math.random().toString(36).slice(2, 9);
    update({
      assets: board.assets.map((a) =>
        ids.includes(a.id) ? { ...a, groupId: gid } : a,
      ),
    });
  }

  function ungroupAssets(ids: string[]) {
    const gids = new Set(
      ids
        .map((id) => board.assets.find((a) => a.id === id)?.groupId)
        .filter(Boolean) as string[],
    );
    if (gids.size === 0) return;
    update({
      assets: board.assets.map((a) =>
        a.groupId && gids.has(a.groupId) ? { ...a, groupId: undefined } : a,
      ),
    });
  }

  function handleAssetClickStringMode(id: string) {
    const a = board.assets.find((x) => x.id === id);
    if (!a) return;
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

  function deleteString(sid: string) {
    update({ strings: board.strings.filter((s) => s.id !== sid) });
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
          <aside className="w-[300px] shrink-0 bg-card/95 backdrop-blur-sm border-r border-border/60 overflow-y-auto z-10">
            <PanelHeader
              title={activePanel === "select" ? "surface" : activePanel}
              onClose={() => setActivePanel(null)}
              right={activePanel === "library" ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLibraryView({ mode: "favorites" })}
                    className={`p-1.5 rounded hover:bg-black/5 ${libraryView.mode === "favorites" ? "text-rose-600" : ""}`}
                    title="favorites"
                  >
                    <Heart size={14} />
                  </button>
                  <button
                    onClick={() => setLibraryView({ mode: "recent" })}
                    className={`p-1.5 rounded hover:bg-black/5 ${libraryView.mode === "recent" ? "text-stone-900" : ""}`}
                    title="recent"
                  >
                    <History size={14} />
                  </button>
                </div>
              ) : null}
            />
            <div className="p-3">
              {activePanel === "select" && (
                <SurfacePanel board={board} onPick={(kind) => update({ kind })} onEdit={() => setRightPanel("canvas")} />
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
              {activePanel === "library" && (
                <LibraryPanel
                  view={libraryView}
                  setView={setLibraryView}
                  favorites={favorites}
                  recent={recent}
                  onToggleFav={toggleFav}
                  onAdd={(kind, extra, setId) => {
                    if (kind === "washi") {
                      setDrawWashi({ tapeColor: (extra as { tapeColor?: string } | undefined)?.tapeColor });
                    } else {
                      addAsset(kind, undefined, undefined, extra);
                    }
                    if (setId) bumpRecent(setId);
                  }}
                />
              )}
              {activePanel === "blocks" && <BlocksPanel />}
              {activePanel === "styles" && <StylesPanel boardId={board.id} />}
              {activePanel === "assets" && <AssetsPanel />}
              {activePanel === "shape" && <ShapePanel onAdd={addAsset} />}
              {activePanel === "string" && (
                <StringPanel stringFromId={stringFromId} onClear={() => setStringFromId(null)} />
              )}
            </div>
          </aside>
        )}

        {/* Canvas area — contains a centered, resizable frame */}
        <main className="flex-1 relative overflow-auto bg-editor-canvas">
          <div className="min-w-full min-h-full flex items-center justify-center p-10">
            <div
              className="relative flex shadow-2xl ring-1 ring-stone-900/10 overflow-hidden"
              style={{
                width: frameSize.w,
                height: frameSize.h,
                borderRadius: surfaceStyle.radius,
                border: surfaceStyle.border > 0 ? `${surfaceStyle.border}px ${surfaceStyle.borderStyle} ${surfaceStyle.borderColor}` : undefined,
              }}
            >
              <BoardCanvas
                kind={board.kind}
                assets={board.assets}
                strings={board.strings}
                interactive={!previewMode}
                selectedId={selectedId}
                selectedIds={selectedIds}
                stringMode={stringMode}
                stringFromId={stringFromId}
                onSelect={(id, additive) => {
                  toggleSelect(id, additive);
                  if (id && !additive) setShowSettings(true);
                  setAssetMenu(null);
                }}
                onMove={(id, x, y) => updateAsset(id, { x, y }, false)}
                onMoveMany={moveMany}
                onResize={resizeAsset}
                onAssetClick={handleAssetClickStringMode}
                onAssetContextMenu={(id, x, y) => {
                  const ids = selectedIds.includes(id) && selectedIds.length > 1 ? selectedIds : [id];
                  setAssetMenu({ x, y, ids });
                }}
                onDropAsset={(kind, x, y, extra) => addAsset(kind, x, y, extra)}
                onStringClick={stringMode ? deleteString : undefined}
                drawWashi={drawWashi}
              />

              {/* floating frame label */}
              <div className="absolute top-3 left-3 pointer-events-none">
                <div className="inline-block bg-pink-50/85 backdrop-blur-sm border border-stone-700/20 rounded px-2.5 py-1 font-display text-xs lowercase shadow-sm">
                  frame one (index) · {frameSize.w}×{frameSize.h}
                </div>
              </div>
              {!previewMode && (
                <>
                  {/* resize handles — canva style */}
                  <div
                    onPointerDown={(e) => startFrameResize(e, "r")}
                    className="absolute top-0 right-0 h-full w-1.5 cursor-ew-resize hover:bg-rose-500/40"
                  />
                  <div
                    onPointerDown={(e) => startFrameResize(e, "b")}
                    className="absolute bottom-0 left-0 w-full h-1.5 cursor-ns-resize hover:bg-rose-500/40"
                  />
                  <div
                    onPointerDown={(e) => startFrameResize(e, "br")}
                    className="absolute bottom-0 right-0 size-4 cursor-nwse-resize bg-stone-900/50 hover:bg-rose-600"
                    title="drag to resize frame"
                  />
                </>
              )}
            </div>
          </div>
          {stringMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-md bg-stone-900/85 text-stone-50 px-3 py-2 font-mono text-[10px] lowercase tracking-wider">
              string mode — click an asset, then click another to connect · click a string to remove it
            </div>
          )}
          {drawWashi && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-md bg-stone-900/85 text-stone-50 px-3 py-2 font-mono text-[10px] lowercase tracking-wider flex items-center gap-3">
              draw washi — drag across the canvas to lay tape, release to set length
              <button
                onClick={() => setDrawWashi(null)}
                className="ml-2 rounded bg-stone-50/15 hover:bg-stone-50/25 px-2 py-0.5"
              >
                done
              </button>
            </div>
          )}
          {!previewMode && (
            <div className="sticky bottom-5 left-0 w-full flex justify-center pointer-events-none">
              <button
                onClick={() => setAddMenu("root")}
                className="pointer-events-auto flex items-center justify-center gap-2 rounded-md bg-pink-100/90 hover:bg-pink-100 backdrop-blur-sm border border-stone-700/30 px-5 py-2.5 font-mono text-xs lowercase text-stone-700 shadow-sm"
              >
                add pages or sections
                <ChevronDown size={14} />
              </button>
            </div>
          )}
          {addMenu && !previewMode && (
            <AddPageOrSectionDialog
              mode={addMenu}
              setMode={setAddMenu}
              onAddPage={addPage}
              onAddSection={addSection}
              onClose={() => setAddMenu(null)}
            />
          )}
        </main>

        {/* Right settings drawer (selected asset) */}
        {showSettings && selected && !previewMode && (
          <SettingsPanel
            asset={selected}
            onChange={(patch) => updateAsset(selected.id, patch, false)}
            onDelete={() => deleteAsset(selected.id)}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Right meta panel (pages / canvas / connections / settings) */}
        {rightPanel && !previewMode && (
          <RightMetaPanel
            which={rightPanel}
            board={board}
            onClose={() => setRightPanel(null)}
            onPickSurface={(kind) => update({ kind })}
            onRename={(name) => update({ name }, false)}
            surfaceStyle={surfaceStyle}
            onSurfaceStyleChange={setSurfaceStyle}
            pages={pages}
            activeSlug={activeSlug}
            onSwitchPage={switchPage}
            onAddPage={addPage}
            onRenamePage={renamePage}
            onDeletePage={deletePage}
          />
        )}
      </div>

      {showPublish && (
        <PublishDialog board={board} onClose={() => setShowPublish(false)} onPublish={publish} />
      )}

      {assetMenu && !previewMode && (
        <AssetContextMenu
          state={assetMenu}
          board={board}
          onClose={() => setAssetMenu(null)}
          onReorder={(dir) => assetMenu.ids.forEach((id) => reorder(id, dir))}
          onDuplicate={() => duplicateAssets(assetMenu.ids)}
          onLockToggle={() => toggleLock(assetMenu.ids)}
          onGroup={() => groupAssets(assetMenu.ids)}
          onUngroup={() => ungroupAssets(assetMenu.ids)}
          onDelete={() => {
            assetMenu.ids.forEach((id) => deleteAsset(id));
            setSelectedIds([]);
          }}
        />
      )}


      {/* Bottom status bar */}
      <footer className="bg-editor-header border-t border-stone-900/10 px-5 py-2 flex items-center justify-between font-mono text-[11px] lowercase tracking-wide">
        <div className="flex items-center gap-2">
          <span className="text-rose-600">status:</span>
          <span className="text-stone-700">{board.publishedKey ? "published" : "not published"}</span>
        </div>
        <div className="flex items-center gap-3 text-stone-700">
          {(["pages", "canvas", "connections", "settings"] as RightPanelKey[]).map((k, i) => (
            <span key={k} className="flex items-center gap-3">
              {i > 0 && <span className="text-stone-500/60">|</span>}
              <button
                onClick={() => setRightPanel((cur) => (cur === k ? null : k))}
                className={`hover:text-stone-900 ${rightPanel === k ? "text-stone-900 underline underline-offset-4" : ""}`}
              >
                {k}
              </button>
            </span>
          ))}
          <Info size={14} className="ml-2 text-stone-600" />
        </div>
      </footer>
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

function PanelHeader({ title, onClose, right }: { title: string; onClose: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
      <h2 className="font-display text-base lowercase">{title}</h2>
      <div className="flex items-center gap-1">
        {right}
        <button onClick={onClose} className="p-1 rounded hover:bg-black/5">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function SurfacePanel({ board, onPick, onEdit }: { board: Board; onPick: (k: BoardKind) => void; onEdit: () => void }) {
  // sets of surfaces. only a handful are wired (cork/mat/wall/metal). others are stubs.
  type Surf = { id: string; label: string; kind?: BoardKind; className?: string };
  const SURFACE_SETS: { id: string; label: string; items: Surf[] }[] = [
    {
      id: "boards",
      label: "boards",
      items: [
        { id: "cork-default", label: "corkboard", kind: "cork", className: "bg-board-cork" },
        { id: "pinboard", label: "pinboard" },
        { id: "pegboard", label: "pegboard (ikea)" },
        { id: "blackboard", label: "blackboard" },
        { id: "whiteboard", label: "whiteboard" },
        { id: "metal", label: "metallic", kind: "metal", className: "bg-board-metal" },
      ],
    },
    {
      id: "wood",
      label: "wooden",
      items: [
        { id: "oak", label: "oak" },
        { id: "walnut", label: "walnut" },
        { id: "pine", label: "pine" },
        { id: "birch", label: "birch" },
      ],
    },
    {
      id: "paper",
      label: "paper",
      items: [
        { id: "grid", label: "grid" },
        { id: "dotted", label: "dotted" },
        { id: "plain", label: "plain" },
        { id: "lined", label: "lined" },
      ],
    },
    {
      id: "mats",
      label: "mats",
      items: [
        { id: "mat", label: "cutting mat", kind: "mat", className: "bg-board-mat" },
      ],
    },
    {
      id: "walls",
      label: "walls",
      items: [
        { id: "wall", label: "wall", kind: "wall", className: "bg-board-wall" },
        { id: "wallpaper", label: "wallpaper" },
      ],
    },
    {
      id: "textile",
      label: "textile",
      items: [
        { id: "linen", label: "linen" },
        { id: "felt", label: "felt" },
        { id: "denim", label: "denim" },
        { id: "burlap", label: "burlap" },
      ],
    },
    {
      id: "tiles",
      label: "tiles",
      items: [
        { id: "ceramic", label: "ceramic" },
        { id: "subway", label: "subway" },
        { id: "mosaic", label: "mosaic" },
      ],
    },
    {
      id: "other",
      label: "other",
      items: [
        { id: "upload", label: "upload image" },
      ],
    },
  ];
  const [openSet, setOpenSet] = useState<string | null>("boards");
  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] lowercase text-muted-foreground">surface for this frame</p>
      {SURFACE_SETS.map((s) => {
        const open = openSet === s.id;
        return (
          <div key={s.id} className="rounded-md border border-border bg-card/40">
            <button
              onClick={() => setOpenSet(open ? null : s.id)}
              className="w-full flex items-center justify-between px-3 py-2 font-mono text-[11px] lowercase hover:bg-black/5"
            >
              <span>{s.label}</span>
              <ChevronDown size={12} className={`transition-transform ${open ? "" : "-rotate-90"}`} />
            </button>
            {open && (
              <div className="p-2 grid grid-cols-2 gap-2">
                {s.items.map((it) => {
                  const wired = !!it.kind;
                  const isActive = it.kind && board.kind === it.kind;
                  return (
                    <div
                      key={it.id}
                      className={`relative rounded-md overflow-hidden border ${
                        isActive ? "border-stone-900 ring-2 ring-stone-900/30" : "border-border"
                      } ${!wired ? "opacity-60" : ""}`}
                    >
                      <button
                        disabled={!wired}
                        onClick={() => it.kind && onPick(it.kind)}
                        className={`block w-full text-left ${!wired ? "cursor-not-allowed" : ""}`}
                      >
                        <div className={`h-14 ${it.className ?? "bg-stone-200/60"}`} />
                        <div className="bg-card px-2 py-1 font-mono text-[10px] lowercase flex items-center justify-between">
                          <span>{it.label}</span>
                          {!wired && <span className="text-[8px] text-muted-foreground">soon</span>}
                        </div>
                      </button>
                      {isActive && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(); }}
                          className="absolute top-1 right-1 rounded bg-stone-900/85 text-stone-50 px-1.5 py-0.5 font-mono text-[9px] lowercase tracking-wide hover:bg-stone-900"
                          title="edit surface"
                        >
                          edit
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
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

// ---------- Library sets ----------

type LibraryView =
  | { mode: "index" }
  | { mode: "set"; setId: string }
  | { mode: "element"; setId: string; itemId: string }
  | { mode: "favorites" }
  | { mode: "recent" };

interface LibraryItem {
  id: string;
  label: string;
  kind: AssetKind;
  extra?: Partial<AssetBase>;
}

interface LibrarySet {
  id: string;
  label: string;
  blurb: string;
  items: LibraryItem[];
  available: boolean; // false → placeholder coming soon
}

const LIBRARY_SETS: LibrarySet[] = [
  {
    id: "sticky", label: "sticky notes", available: true,
    blurb: "cardstock squares for marginalia, half-thoughts, and pinned reminders.",
    items: [
      { id: "sticky-yellow", label: "classic yellow", kind: "sticky", extra: { color: "#fff59d" } },
      { id: "sticky-pink", label: "soft pink", kind: "sticky", extra: { color: "#fbcfe8" } },
      { id: "sticky-mint", label: "mint", kind: "sticky", extra: { color: "#bbf7d0" } },
      { id: "sticky-blue", label: "sky", kind: "sticky", extra: { color: "#bfdbfe" } },
      { id: "sticky-lilac", label: "lilac", kind: "sticky", extra: { color: "#e9d5ff" } },
      { id: "sticky-cream", label: "cream", kind: "sticky", extra: { color: "#fef3c7" } },
    ],
  },
  {
    id: "polaroid", label: "polaroid", available: true,
    blurb: "instant photographs with caption strips. flip to reveal hidden notes.",
    items: [
      { id: "polaroid-classic", label: "classic", kind: "polaroid" },
      { id: "polaroid-wide", label: "wide", kind: "polaroid", extra: { width: 240 } },
      { id: "polaroid-mini", label: "mini", kind: "polaroid", extra: { width: 140 } },
    ],
  },
  {
    id: "photostrip", label: "photostrip", available: true,
    blurb: "photo-booth strips. four frames, one story.",
    items: [
      { id: "photostrip-bw", label: "black & white", kind: "photostrip" },
      { id: "photostrip-sepia", label: "sepia", kind: "photostrip" },
    ],
  },
  {
    id: "paper", label: "loose sheets", available: true,
    blurb: "torn papers, receipts, library cards, and clipped documents.",
    items: [
      { id: "paper-torn", label: "torn note", kind: "paper" },
      { id: "paper-receipt", label: "receipt", kind: "paper", extra: { width: 140, color: "#fffaf0" } },
      { id: "paper-card", label: "index card", kind: "paper", extra: { width: 220, color: "#fefce8" } },
    ],
  },
  {
    id: "washi", label: "washi tapes", available: true,
    blurb: "decorative tape strips to anchor and label.",
    items: [
      { id: "washi-lavender", label: "lavender", kind: "washi", extra: { tapeColor: "rgba(180,160,210,0.85)" } },
      { id: "washi-rose", label: "rose", kind: "washi", extra: { tapeColor: "rgba(244,114,182,0.7)" } },
      { id: "washi-mint", label: "mint", kind: "washi", extra: { tapeColor: "rgba(134,239,172,0.75)" } },
      { id: "washi-amber", label: "amber", kind: "washi", extra: { tapeColor: "rgba(251,191,36,0.75)" } },
    ],
  },
  {
    id: "pin", label: "pushpins", available: true,
    blurb: "anchors that connect threads, conspiracy-board style.",
    items: [
      { id: "pin-red", label: "red", kind: "pin" },
      { id: "pin-blue", label: "blue", kind: "pin" },
      { id: "pin-brass", label: "brass", kind: "pin" },
    ],
  },
  { id: "decoration", label: "decoration", available: false, blurb: "stickers, doodles, marginalia.", items: [] },
  { id: "lettering", label: "lettering", available: false, blurb: "stamps, headlines, hand-lettered titles.", items: [] },
  { id: "flags", label: "flags, maps", available: false, blurb: "pennants, cartography, location markers.", items: [] },
  {
    id: "anchoring", label: "anchoring", available: true,
    blurb: "pinboards, magnets, clips, paperclips, fasteners — every way to hold a thing down.",
    items: [
      { id: "anchor-thumbtack-red", label: "thumbtack", kind: "pin", extra: { color: "#b91c1c" } },
      { id: "anchor-thumbtack-brass", label: "brass tack", kind: "pin", extra: { color: "#c9a84c" } },
      { id: "anchor-magnet-red", label: "magnet (red)", kind: "shape", extra: { shape: "circle", width: 28, height: 28, fill: "#b91c1c" } },
      { id: "anchor-magnet-black", label: "magnet (black)", kind: "shape", extra: { shape: "circle", width: 28, height: 28, fill: "#1a1a1a" } },
      { id: "anchor-paperclip", label: "paperclip", kind: "shape", extra: { shape: "rect", width: 48, height: 18, fill: "#9ca3af" } },
      { id: "anchor-bulldog", label: "bulldog clip", kind: "shape", extra: { shape: "rect", width: 56, height: 28, fill: "#2d2d2d" } },
      { id: "anchor-binder", label: "binder clip", kind: "shape", extra: { shape: "triangle", width: 44, height: 36, fill: "#1a1a1a" } },
      { id: "anchor-brad", label: "brass fastener", kind: "shape", extra: { shape: "circle", width: 22, height: 22, fill: "#c9a84c" } },
      { id: "anchor-pinboard", label: "pinboard tile", kind: "paper", extra: { width: 180, color: "#c9a07a" } },
    ],
  },
  { id: "scrapbook", label: "scrapbooking", available: false, blurb: "pressed flowers, ticket stubs, ephemera.", items: [] },
  { id: "charms", label: "charms", available: false, blurb: "small enamel bits, beads, talismans.", items: [] },
];

const SETS_BY_ID = Object.fromEntries(LIBRARY_SETS.map((s) => [s.id, s]));

// ---------- favorites & recents storage ----------
const FAVS_KEY = "boardr:favSets";
const RECENT_KEY = "boardr:recentSets";
function readFavs(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(FAVS_KEY) || "[]"); } catch { return []; }
}
function writeFavs(v: string[]) {
  if (typeof window !== "undefined") localStorage.setItem(FAVS_KEY, JSON.stringify(v));
}
function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function writeRecent(v: string[]) {
  if (typeof window !== "undefined") localStorage.setItem(RECENT_KEY, JSON.stringify(v));
}

// ---------- Library Panel ----------

function LibraryPanel({
  view,
  setView,
  favorites,
  recent,
  onToggleFav,
  onAdd,
}: {
  view: LibraryView;
  setView: (v: LibraryView) => void;
  favorites: string[];
  recent: string[];
  onToggleFav: (setId: string) => void;
  onAdd: (kind: AssetKind, extra: Partial<AssetBase> | undefined, setId?: string) => void;
}) {
  if (view.mode === "favorites" || view.mode === "recent") {
    const ids = view.mode === "favorites" ? favorites : recent;
    const sets = ids.map((id) => SETS_BY_ID[id]).filter(Boolean);
    return (
      <div>
        <button
          onClick={() => setView({ mode: "index" })}
          className="mb-2 flex items-center gap-1 font-mono text-[10px] lowercase text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={12} /> back
        </button>
        <p className="font-mono text-[10px] lowercase text-muted-foreground mb-3">
          {view.mode === "favorites" ? "hearted sets" : "recently used sets"}
        </p>
        {sets.length === 0 ? (
          <p className="font-mono text-[11px] lowercase text-muted-foreground">nothing here yet.</p>
        ) : (
          <SetGrid sets={sets} favorites={favorites} onPick={(s) => setView({ mode: "set", setId: s.id })} onToggleFav={onToggleFav} onView={(s) => s.items[0] && setView({ mode: "element", setId: s.id, itemId: s.items[0].id })} />
        )}
      </div>
    );
  }

  if (view.mode === "set") {
    const set = SETS_BY_ID[view.setId];
    if (!set) return null;
    return (
      <div>
        <button
          onClick={() => setView({ mode: "index" })}
          className="mb-2 flex items-center gap-1 font-mono text-[10px] lowercase text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={12} /> all sets
        </button>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display text-lg lowercase">{set.label}</h3>
          <button onClick={() => onToggleFav(set.id)} className={`p-1 rounded hover:bg-black/5 ${favorites.includes(set.id) ? "text-rose-600" : "text-stone-500"}`}>
            <Heart size={14} fill={favorites.includes(set.id) ? "currentColor" : "none"} />
          </button>
        </div>
        <p className="font-mono text-[10px] lowercase text-muted-foreground mb-3">{set.blurb}</p>
        {!set.available ? (
          <div className="rounded-md border border-dashed border-border p-4 text-center font-mono text-[11px] lowercase text-muted-foreground">
            coming soon
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {set.items.map((it) => (
              <button
                key={it.id}
                onClick={() => onAdd(it.kind, it.extra, set.id)}
                onContextMenu={(e) => { e.preventDefault(); setView({ mode: "element", setId: set.id, itemId: it.id }); }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-boardr-kind", it.kind);
                  if (it.extra) e.dataTransfer.setData("application/x-boardr-extra", JSON.stringify(it.extra));
                }}
                className="group flex flex-col items-center gap-2 rounded-md border border-border bg-card/60 px-2 py-3 hover:bg-accent/30 cursor-grab active:cursor-grabbing"
                title="click to add · right-click to view"
              >
                <div className="h-12 flex items-center justify-center">
                  <LibraryPreview kind={it.kind} extra={it.extra} />
                </div>
                <span className="font-mono text-[10px] lowercase text-center text-muted-foreground leading-tight">{it.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view.mode === "element") {
    const set = SETS_BY_ID[view.setId];
    const item = set?.items.find((i) => i.id === view.itemId);
    if (!set || !item) return null;
    return (
      <div>
        <button
          onClick={() => setView({ mode: "set", setId: set.id })}
          className="mb-3 flex items-center gap-1 font-mono text-[10px] lowercase text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={12} /> back to {set.label}
        </button>
        <div className="rounded-md border border-border bg-card/60 p-5 flex items-center justify-center min-h-[140px]">
          <LibraryPreview kind={item.kind} extra={item.extra} large />
        </div>
        <h3 className="mt-4 font-display text-lg lowercase">{item.label}</h3>
        <p className="font-mono text-[10px] lowercase text-muted-foreground mt-1">from {set.label}</p>
        <dl className="mt-4 space-y-2 font-mono text-[11px] lowercase">
          <div className="flex justify-between"><dt className="text-muted-foreground">kind</dt><dd>{item.kind}</dd></div>
          {item.extra?.color && <div className="flex justify-between"><dt className="text-muted-foreground">color</dt><dd>{item.extra.color}</dd></div>}
          {item.extra?.width && <div className="flex justify-between"><dt className="text-muted-foreground">width</dt><dd>{item.extra.width}px</dd></div>}
        </dl>
        <button
          onClick={() => onAdd(item.kind, item.extra, set.id)}
          className="mt-5 w-full rounded-md bg-stone-900 text-stone-50 py-2 font-mono text-[11px] lowercase tracking-wider hover:bg-stone-800"
        >
          add to board
        </button>
      </div>
    );
  }

  // index
  return (
    <div>
      <p className="font-mono text-[10px] lowercase text-muted-foreground mb-3">tap a set to browse, right-click any element to inspect.</p>
      <SetGrid
        sets={LIBRARY_SETS}
        favorites={favorites}
        onPick={(s) => setView({ mode: "set", setId: s.id })}
        onToggleFav={onToggleFav}
        onView={(s) => s.items[0] && setView({ mode: "element", setId: s.id, itemId: s.items[0].id })}
      />
    </div>
  );
}

function SetGrid({
  sets, favorites, onPick, onToggleFav, onView,
}: {
  sets: LibrarySet[];
  favorites: string[];
  onPick: (s: LibrarySet) => void;
  onToggleFav: (id: string) => void;
  onView: (s: LibrarySet) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {sets.map((set) => (
        <button
          key={set.id}
          onClick={() => onPick(set)}
          onContextMenu={(e) => { e.preventDefault(); onView(set); }}
          className="group relative flex flex-col items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-3 hover:bg-accent/30 text-center"
          title="click to open set · right-click to view first element"
        >
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFav(set.id); }}
            className={`absolute top-1 right-1 p-0.5 rounded ${favorites.includes(set.id) ? "text-rose-600" : "text-stone-400 opacity-0 group-hover:opacity-100"}`}
          >
            <Heart size={10} fill={favorites.includes(set.id) ? "currentColor" : "none"} />
          </button>
          <div className="h-10 flex items-center justify-center">
            {set.items[0]
              ? <LibraryPreview kind={set.items[0].kind} extra={set.items[0].extra} />
              : <div className="size-8 rounded-sm border border-dashed border-border" />}
          </div>
          <span className="font-mono text-[10px] lowercase text-muted-foreground leading-tight">{set.label}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- Right meta panel ----------

function RightMetaPanel({
  which, board, onClose, onPickSurface, onRename, surfaceStyle, onSurfaceStyleChange,
  pages, activeSlug, onSwitchPage, onAddPage, onRenamePage, onDeletePage,
}: {
  which: RightPanelKey;
  board: Board;
  onClose: () => void;
  onPickSurface: (k: BoardKind) => void;
  onRename: (n: string) => void;
  surfaceStyle: SurfaceStyle;
  onSurfaceStyleChange: (s: SurfaceStyle) => void;
  pages: { slug: string; name: string }[];
  activeSlug: string;
  onSwitchPage: (slug: string) => void;
  onAddPage: () => void;
  onRenamePage: (slug: string, name: string) => void;
  onDeletePage: (slug: string) => void;
}) {
  const baseUrl = board.publishedKey ? `/s/${board.publishedKey}` : null;
  return (
    <aside className="w-[300px] shrink-0 bg-card/95 backdrop-blur-sm border-l border-border/60 overflow-y-auto z-10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <h2 className="font-display text-base lowercase">{which}</h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X size={14} /></button>
      </div>
      <div className="p-4 space-y-4 font-mono text-[11px] lowercase">
        {which === "pages" && (
          <div className="space-y-2">
            <p className="text-muted-foreground">frames in this board.</p>
            {pages.map((p) => {
              const isActive = p.slug === activeSlug;
              const url = baseUrl ? (p.slug === "index" ? baseUrl : `${baseUrl}/${p.slug}`) : null;
              return (
                <div key={p.slug} className={`rounded-md border px-3 py-2 ${isActive ? "border-stone-900 bg-accent/40" : "border-border bg-card/60"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => onSwitchPage(p.slug)} className="text-left flex-1 truncate hover:underline">
                      {p.name}
                    </button>
                    {isActive ? (
                      <span className="text-[9px] text-muted-foreground">active</span>
                    ) : (
                      p.slug !== "index" && (
                        <button onClick={() => onDeletePage(p.slug)} className="text-[9px] text-rose-600 hover:underline">delete</button>
                      )
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      value={p.name}
                      onChange={(e) => onRenamePage(p.slug, e.target.value)}
                      className="flex-1 bg-transparent text-[10px] text-muted-foreground border-b border-dashed border-transparent focus:border-stone-700/30 focus:outline-none"
                    />
                  </div>
                  <div className="mt-1 text-[9px] text-muted-foreground/80 truncate">
                    {url ? <a href={url} target="_blank" rel="noreferrer" className="hover:underline">{url}</a> : <span>/s/&lt;key&gt;{p.slug === "index" ? "" : `/${p.slug}`}</span>}
                  </div>
                </div>
              );
            })}
            <button onClick={onAddPage} className="w-full rounded-md border border-dashed border-border py-2 text-muted-foreground hover:bg-black/5">+ new frame</button>
          </div>
        )}
        {which === "canvas" && (
          <div className="space-y-3">
            <p className="text-muted-foreground">surface for this frame</p>
            <div className="grid grid-cols-2 gap-2">
              {(["cork", "mat", "wall", "metal"] as BoardKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => onPickSurface(k)}
                  className={`rounded-md overflow-hidden border ${board.kind === k ? "border-stone-900 ring-2 ring-stone-900/30" : "border-border"}`}
                >
                  <div className={`h-14 bg-board-${k}`} />
                  <div className="bg-card px-2 py-1 text-[10px] text-left">{k}</div>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-border/60 space-y-3">
              <p className="text-muted-foreground">edit surface</p>
              <label className="block space-y-1">
                <span className="text-[10px] text-muted-foreground">border width · {surfaceStyle.border}px</span>
                <input
                  type="range" min={0} max={24} value={surfaceStyle.border}
                  onChange={(e) => onSurfaceStyleChange({ ...surfaceStyle, border: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] text-muted-foreground">border style</span>
                <div className="flex gap-1">
                  {(["solid", "dashed", "double"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => onSurfaceStyleChange({ ...surfaceStyle, borderStyle: s })}
                      className={`flex-1 rounded border px-2 py-1 text-[10px] lowercase ${surfaceStyle.borderStyle === s ? "border-stone-900 bg-accent/40" : "border-border hover:bg-black/5"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">border color</span>
                <input
                  type="color" value={surfaceStyle.borderColor}
                  onChange={(e) => onSurfaceStyleChange({ ...surfaceStyle, borderColor: e.target.value })}
                  className="h-6 w-10 rounded border border-border bg-transparent"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] text-muted-foreground">corner radius · {surfaceStyle.radius}px</span>
                <input
                  type="range" min={0} max={40} value={surfaceStyle.radius}
                  onChange={(e) => onSurfaceStyleChange({ ...surfaceStyle, radius: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
            </div>
          </div>
        )}
        {which === "connections" && (
          <div className="space-y-2">
            <p className="text-muted-foreground">{board.strings.length} thread(s)</p>
            {board.strings.length === 0 && <p className="text-[10px] text-muted-foreground/80">use the string tool to connect pinned assets.</p>}
            {board.strings.map((s) => (
              <div key={s.id} className="rounded border border-border bg-card/60 px-2 py-1.5 text-[10px]">
                {s.from.slice(0, 5)} ↔ {s.to.slice(0, 5)}
              </div>
            ))}
          </div>
        )}
        {which === "settings" && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-muted-foreground">board name</span>
              <input
                value={board.name}
                onChange={(e) => onRename(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-[11px]"
              />
            </label>
            <div className="rounded-md border border-border bg-card/60 px-3 py-2 space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">id</span><span>{board.id.slice(0, 8)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">assets</span><span>{board.assets.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">published</span><span>{board.publishedKey ? board.publishedKey : "—"}</span></div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ---------- Library item draggable (legacy, kept for shape panel) ----------

const LIBRARY_ITEMS: { kind: AssetKind; label: string }[] = [
  { kind: "sticky", label: "sticky" },
];
void LIBRARY_ITEMS;

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

function LibraryPreview({ kind, extra, large }: { kind: AssetKind; extra?: Partial<AssetBase>; large?: boolean }) {
  const scale = large ? 2 : 1;
  const color = extra?.color;
  const tape = extra?.tapeColor;
  switch (kind) {
    case "sticky":
      return <div className="rounded-[2px] analog-shadow-sm" style={{ width: 40 * scale, height: 40 * scale, background: color || "#fff59d" }} />;
    case "polaroid":
      return (
        <div className="bg-white p-1 analog-shadow-sm" style={{ width: 40 * scale, height: 48 * scale }}>
          <div className="size-full" style={{ background: "linear-gradient(135deg,#c9b99a,#8b7355)" }} />
        </div>
      );
    case "photostrip":
      return (
        <div className="bg-stone-900 p-[2px] analog-shadow-sm" style={{ width: 22 * scale, height: 50 * scale }}>
          <div className="grid grid-rows-4 gap-[1px] h-full">{[0,1,2,3].map((i) => <div key={i} style={{ background: "#999" }} />)}</div>
        </div>
      );
    case "photo":
      return (
        <div className="bg-white p-[2px] analog-shadow-sm" style={{ width: 46 * scale, height: 34 * scale }}>
          <div className="size-full" style={{ background: "linear-gradient(135deg,#a8957a,#5c4a36)" }} />
        </div>
      );
    case "paper":
      return <div className="analog-shadow-sm" style={{ width: 46 * scale, height: 36 * scale, background: color || "#fbf7ec", clipPath: "polygon(0 8%, 6% 0, 96% 4%, 100% 8%, 96% 96%, 90% 100%, 8% 96%, 0% 92%)" }} />;
    case "washi":
      return <div style={{ width: 50 * scale, height: 12 * scale, background: tape || "rgba(180,160,210,0.85)", backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0 4px, transparent 4px 8px)", transform: "rotate(-10deg)" }} />;
    case "pin":
      return <div className="rounded-full" style={{ width: 20 * scale, height: 20 * scale, background: "radial-gradient(circle at 30% 30%, #ff8a8a, #c0212a 60%, #6e0a10)", boxShadow: "0 2px 4px rgba(0,0,0,0.4)" }} />;
    case "shape":
      return <div className="rounded-sm" style={{ width: 32 * scale, height: 32 * scale, background: "#c9b99a" }} />;
  }
}

type SavedPalette = { id: string; name: string; colors: string[] };
type SavedFont = { id: string; family: string; tags: string[] };

const PALETTE_PRESETS: SavedPalette[] = [
  { id: "p-noir", name: "noir & gold", colors: ["#0d0d0d", "#1a1a1a", "#c9a84c", "#f0d78c"] },
  { id: "p-cork", name: "cork warmth", colors: ["#f5f0e8", "#c9a576", "#8b6f47", "#3d2817"] },
  { id: "p-mint", name: "neon mint", colors: ["#0d1b2a", "#1b4332", "#2dd4a8", "#73ffb8"] },
];
const FONT_PRESETS: SavedFont[] = [
  { id: "f-space", family: "Space Grotesk", tags: ["display", "modern"] },
  { id: "f-inst", family: "Instrument Serif", tags: ["serif", "editorial"] },
  { id: "f-jet", family: "JetBrains Mono", tags: ["mono", "code"] },
];

function StylesPanel({ boardId }: { boardId: string }) {
  const pKey = `boardr:styles:palettes:${boardId}`;
  const fKey = `boardr:styles:fonts:${boardId}`;
  const [palettes, setPalettes] = useState<SavedPalette[]>([]);
  const [fonts, setFonts] = useState<SavedFont[]>([]);
  const [view, setView] = useState<"home" | "palettes" | "fonts">("home");
  const [tagFilter, setTagFilter] = useState("");

  useEffect(() => {
    try {
      const p = localStorage.getItem(pKey);
      const f = localStorage.getItem(fKey);
      setPalettes(p ? JSON.parse(p) : PALETTE_PRESETS);
      setFonts(f ? JSON.parse(f) : FONT_PRESETS);
    } catch {
      setPalettes(PALETTE_PRESETS);
      setFonts(FONT_PRESETS);
    }
  }, [pKey, fKey]);

  const persistPalettes = (next: SavedPalette[]) => {
    setPalettes(next);
    try { localStorage.setItem(pKey, JSON.stringify(next)); } catch {}
  };
  const persistFonts = (next: SavedFont[]) => {
    setFonts(next);
    try { localStorage.setItem(fKey, JSON.stringify(next)); } catch {}
  };

  const addPalette = () => {
    const name = prompt("palette name");
    if (!name) return;
    const colorsRaw = prompt("colors (comma-separated hex)", "#000000, #ffffff");
    if (!colorsRaw) return;
    const colors = colorsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    persistPalettes([...palettes, { id: `p-${Date.now()}`, name, colors }]);
  };
  const addFont = () => {
    const family = prompt("font family name (e.g. 'Inter')");
    if (!family) return;
    persistFonts([...fonts, { id: `f-${Date.now()}`, family, tags: [] }]);
  };
  const tagFont = (id: string) => {
    const f = fonts.find((x) => x.id === id);
    if (!f) return;
    const t = prompt("tags (comma-separated)", f.tags.join(", "));
    if (t === null) return;
    const tags = t.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    persistFonts(fonts.map((x) => (x.id === id ? { ...x, tags } : x)));
  };
  const removeFont = (id: string) => persistFonts(fonts.filter((x) => x.id !== id));
  const removePalette = (id: string) => persistPalettes(palettes.filter((x) => x.id !== id));

  if (view === "palettes") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setView("home")} className="font-mono text-[10px] lowercase text-muted-foreground hover:text-foreground">← back</button>
          <button onClick={addPalette} className="font-mono text-[10px] lowercase rounded border border-border px-2 py-1 hover:bg-black/5">+ new palette</button>
        </div>
        <p className="font-mono text-[10px] lowercase text-muted-foreground">private to you — not shown to viewers</p>
        <div className="space-y-2">
          {palettes.map((p) => (
            <div key={p.id} className="rounded-md border border-border bg-card/40 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[11px] lowercase">{p.name}</span>
                <button onClick={() => removePalette(p.id)} className="font-mono text-[10px] text-muted-foreground hover:text-destructive">remove</button>
              </div>
              <div className="flex gap-1">
                {p.colors.map((c, i) => (
                  <div key={i} className="h-8 flex-1 rounded-sm border border-border" style={{ background: c }} title={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === "fonts") {
    const q = tagFilter.toLowerCase();
    const filtered = q
      ? fonts.filter((f) => f.tags.some((t) => t.includes(q)) || f.family.toLowerCase().includes(q))
      : fonts;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setView("home")} className="font-mono text-[10px] lowercase text-muted-foreground hover:text-foreground">← back</button>
          <button onClick={addFont} className="font-mono text-[10px] lowercase rounded border border-border px-2 py-1 hover:bg-black/5">+ add font</button>
        </div>
        <input
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          placeholder="filter by tag or name"
          className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-[11px] lowercase"
        />
        <p className="font-mono text-[10px] lowercase text-muted-foreground">right-click a font to tag it</p>
        <div className="space-y-2">
          {filtered.map((f) => (
            <ContextMenu key={f.id}>
              <ContextMenuTrigger asChild>
                <div className="rounded-md border border-border bg-card/40 p-2 cursor-default">
                  <div style={{ fontFamily: f.family }} className="text-lg">{f.family}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {f.tags.length === 0 ? (
                      <span className="font-mono text-[9px] lowercase text-muted-foreground">no tags</span>
                    ) : f.tags.map((t) => (
                      <span key={t} className="font-mono text-[9px] lowercase rounded-sm bg-muted px-1.5 py-0.5">{t}</span>
                    ))}
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => tagFont(f.id)}>edit tags</ContextMenuItem>
                <ContextMenuItem onClick={() => removeFont(f.id)} className="text-destructive">remove</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] lowercase text-muted-foreground">private style library — only you see this.</p>

      <div className="rounded-md border border-border bg-card/40">
        <button onClick={() => setView("palettes")} className="w-full flex items-center justify-between px-3 py-2 font-mono text-[11px] lowercase hover:bg-black/5">
          <span>palettes ({palettes.length})</span>
          <span className="text-muted-foreground">view all →</span>
        </button>
        <div className="p-2 space-y-1.5">
          {palettes.slice(0, 3).map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <div className="flex gap-0.5 flex-1">
                {p.colors.map((c, i) => (
                  <div key={i} className="h-5 flex-1 rounded-sm" style={{ background: c }} />
                ))}
              </div>
              <span className="font-mono text-[9px] lowercase text-muted-foreground w-16 truncate">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card/40">
        <button onClick={() => setView("fonts")} className="w-full flex items-center justify-between px-3 py-2 font-mono text-[11px] lowercase hover:bg-black/5">
          <span>fonts ({fonts.length})</span>
          <span className="text-muted-foreground">view all →</span>
        </button>
        <div className="p-2 space-y-1">
          {fonts.slice(0, 3).map((f) => (
            <div key={f.id} style={{ fontFamily: f.family }} className="text-sm truncate">{f.family}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubheadingGroup({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-md border border-border bg-card/40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 font-mono text-[11px] lowercase hover:bg-black/5"
      >
        <span>{title}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div className="p-2 grid grid-cols-2 gap-2">{children}</div>}
    </div>
  );
}

function StubBlockTile({ label }: { label: string }) {
  return (
    <div
      className="rounded-md border border-dashed border-border bg-card/60 px-2 py-3 flex flex-col items-center gap-2 opacity-90"
      title="coming soon"
    >
      <div className="h-8 w-full rounded-sm bg-stone-200/60 border border-border" />
      <span className="font-mono text-[10px] lowercase text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

function BlocksPanel() {
  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] lowercase text-muted-foreground">prebuilt building pieces</p>
      <SubheadingGroup title="building blocks">
        {["text", "heading", "image", "button", "button list", "icon", "icon grid", "input field"].map((b) => (
          <StubBlockTile key={b} label={b} />
        ))}
      </SubheadingGroup>
      <SubheadingGroup title="layouts" defaultOpen={false}>
        {["hero", "two-up", "gallery", "list", "quote", "footer", "bento grid"].map((b) => (
          <StubBlockTile key={b} label={b} />
        ))}
      </SubheadingGroup>
      <SubheadingGroup title="data & ui" defaultOpen={false}>
        {["table", "chips", "tags", "accordion", "tabs"].map((b) => (
          <StubBlockTile key={b} label={b} />
        ))}
      </SubheadingGroup>
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
  const basic: { variant: NonNullable<AssetBase["shape"]>; preview: React.ReactNode }[] = [
    { variant: "rect", preview: <div className="size-10" style={{ background: "#8b7355" }} /> },
    { variant: "circle", preview: <div className="size-10 rounded-full" style={{ background: "#8b7355" }} /> },
    { variant: "triangle", preview: <svg width={40} height={40} viewBox="0 0 100 100"><polygon points="50,5 95,95 5,95" fill="#8b7355" /></svg> },
    { variant: "diamond", preview: <div className="size-9" style={{ background: "#8b7355", transform: "rotate(45deg)" }} /> },
    { variant: "star", preview: <svg width={40} height={40} viewBox="0 0 100 100"><polygon points="50,5 61,38 96,38 67,59 78,95 50,73 22,95 33,59 4,38 39,38" fill="#8b7355" /></svg> },
  ];
  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] lowercase text-muted-foreground">drag or tap a shape onto the frame</p>
      <SubheadingGroup title="basic">
        {basic.map((s) => (
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
      </SubheadingGroup>
      <SubheadingGroup title="arrows & lines" defaultOpen={false}>
        {["arrow", "line", "double arrow", "bracket"].map((l) => (
          <StubBlockTile key={l} label={l} />
        ))}
      </SubheadingGroup>
      <SubheadingGroup title="callouts" defaultOpen={false}>
        {["speech bubble", "thought bubble", "ribbon", "burst"].map((l) => (
          <StubBlockTile key={l} label={l} />
        ))}
      </SubheadingGroup>
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

function AssetContextMenu({
  state,
  board,
  onClose,
  onReorder,
  onDuplicate,
  onLockToggle,
  onGroup,
  onUngroup,
  onDelete,
}: {
  state: { x: number; y: number; ids: string[] };
  board: Board;
  onClose: () => void;
  onReorder: (dir: "up" | "down" | "top" | "bottom") => void;
  onDuplicate: () => void;
  onLockToggle: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    const onDown = () => onClose();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const ids = state.ids;
  const multi = ids.length > 1;
  const assets = ids.map((id) => board.assets.find((a) => a.id === id)).filter(Boolean) as AssetBase[];
  const anyLocked = assets.some((a) => a.locked);
  const anyGrouped = assets.some((a) => a.groupId);
  const totalAssets = board.assets.length;

  // clamp to viewport
  const x = Math.min(state.x, (typeof window !== "undefined" ? window.innerWidth : 1000) - 200);
  const y = Math.min(state.y, (typeof window !== "undefined" ? window.innerHeight : 1000) - 280);

  return (
    <div
      className="fixed z-50 min-w-[180px] rounded-md border border-border bg-card/95 backdrop-blur-sm shadow-xl py-1 font-mono text-[11px] lowercase"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border/60">
        {multi ? `${ids.length} selected` : "asset"}
      </div>

      {!multi && totalAssets > 1 && (
        <>
          <MenuItem label="move up" onClick={() => { onReorder("up"); onClose(); }} />
          <MenuItem label="move down" onClick={() => { onReorder("down"); onClose(); }} />
          <MenuItem label="bring to front" onClick={() => { onReorder("top"); onClose(); }} />
          <MenuItem label="send to back" onClick={() => { onReorder("bottom"); onClose(); }} />
          <div className="my-1 border-t border-border/60" />
        </>
      )}

      <MenuItem
        label={multi ? `duplicate ${ids.length}` : "duplicate"}
        onClick={() => { onDuplicate(); onClose(); }}
      />
      <MenuItem
        label={anyLocked ? "unlock" : "lock"}
        onClick={() => { onLockToggle(); onClose(); }}
      />

      {multi && (
        <MenuItem label="group selection" onClick={() => { onGroup(); onClose(); }} />
      )}
      {anyGrouped && (
        <MenuItem label="ungroup" onClick={() => { onUngroup(); onClose(); }} />
      )}

      <div className="my-1 border-t border-border/60" />
      <MenuItem
        label="delete"
        danger
        onClick={() => { onDelete(); onClose(); }}
      />
    </div>
  );
}

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-3 py-1.5 hover:bg-accent/40 ${danger ? "text-destructive" : ""}`}
    >
      {label}
    </button>
  );
}

function AddPageOrSectionDialog({
  mode,
  setMode,
  onAddPage,
  onAddSection,
  onClose,
}: {
  mode: "root" | "section";
  setMode: (m: "root" | "section") => void;
  onAddPage: () => void;
  onAddSection: (k: "header" | "navbar" | "footer" | "blank") => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-stone-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[420px] rounded-lg border border-stone-700/30 bg-pink-50 shadow-xl p-5 font-mono lowercase text-stone-800"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs tracking-wider text-stone-600">
            {mode === "root" ? "add to board" : "pick a section"}
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-900">
            <X size={14} />
          </button>
        </div>

        {mode === "root" ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onAddPage}
              className="rounded-md border border-stone-700/30 bg-white hover:bg-pink-100 p-4 text-left"
            >
              <div className="text-sm font-display normal-case">page</div>
              <div className="text-[10px] text-stone-500 mt-1">a new frame to compose on</div>
            </button>
            <button
              onClick={() => setMode("section")}
              className="rounded-md border border-stone-700/30 bg-white hover:bg-pink-100 p-4 text-left"
            >
              <div className="text-sm font-display normal-case">section</div>
              <div className="text-[10px] text-stone-500 mt-1">header, navbar, footer or blank</div>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(["header", "navbar", "footer", "blank"] as const).map((k) => (
              <button
                key={k}
                onClick={() => onAddSection(k)}
                className="rounded-md border border-stone-700/30 bg-white hover:bg-pink-100 p-4 text-left"
              >
                <div className="text-sm font-display normal-case">{k}</div>
                <div className="text-[10px] text-stone-500 mt-1">
                  {k === "header" && "title + intro block"}
                  {k === "navbar" && "links across the top"}
                  {k === "footer" && "credits + small print"}
                  {k === "blank" && "empty section to fill"}
                </div>
              </button>
            ))}
          </div>
        )}

        {mode === "section" && (
          <button
            onClick={() => setMode("root")}
            className="mt-4 text-[10px] text-stone-500 hover:text-stone-900"
          >
            ← back
          </button>
        )}
      </div>
    </div>
  );
}


