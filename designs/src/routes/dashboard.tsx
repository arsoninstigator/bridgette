import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { allBoards, createBoard } from "../lib/boardr/storage";
import type { Board, BoardKind } from "../lib/boardr/types";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const SURFACES: { kind: BoardKind; label: string; className: string }[] = [
  { kind: "cork", label: "cork", className: "bg-board-cork" },
  { kind: "mat", label: "cutting mat", className: "bg-board-mat" },
  { kind: "wall", label: "wall", className: "bg-board-wall" },
  { kind: "metal", label: "metal", className: "bg-board-metal" },
];

function Dashboard() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    const all = Object.values(allBoards()).sort((a, b) => b.updatedAt - a.updatedAt);
    setBoards(all);
  }, []);

  async function create(kind: BoardKind) {
    const b = await createBoard("untitled board", kind);
    navigate({ to: "/editor", search: { id: b.id, k: b.editKey } });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-editor-header px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl lowercase">zinegeist</Link>
        <button
          onClick={() => setPicking(true)}
          className="rounded-md bg-stone-900/80 px-4 py-2 font-mono text-[11px] lowercase tracking-wider text-stone-50 hover:bg-stone-900"
        >
          + new board
        </button>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl lowercase">your boards</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground lowercase">
          saved in this browser. carry them with an edit key.
        </p>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setPicking(true)}
            className="h-44 rounded-md border-2 border-dashed border-border hover:border-foreground/40 flex items-center justify-center font-mono text-[11px] lowercase tracking-wider text-muted-foreground"
          >
            + new board
          </button>
          {boards.map((b) => (
            <Link
              key={b.id}
              to="/editor"
              search={{ id: b.id, k: b.editKey }}
              className="group rounded-md overflow-hidden border border-border analog-shadow-sm hover:-translate-y-[2px] transition-transform"
            >
              <div className={`h-32 bg-board-${b.kind}`} />
              <div className="bg-card px-3 py-2">
                <div className="font-mono text-xs lowercase truncate">{b.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground lowercase">
                  {b.kind} · {new Date(b.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {picking && (
        <div className="fixed inset-0 bg-stone-900/40 grid place-items-center p-6 z-50" onClick={() => setPicking(false)}>
          <div className="bg-card border border-border rounded-md p-6 max-w-2xl w-full analog-shadow" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl lowercase">pick a surface</h2>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {SURFACES.map((s) => (
                <button
                  key={s.kind}
                  onClick={() => create(s.kind)}
                  className="rounded-md border border-border overflow-hidden hover:-translate-y-[2px] transition-transform"
                >
                  <div className={`h-28 ${s.className}`} />
                  <div className="bg-card px-2 py-1.5 font-mono text-[11px] lowercase">{s.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}