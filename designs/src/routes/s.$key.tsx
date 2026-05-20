import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPublished } from "../lib/boardr/storage";
import type { PublishedSnapshot } from "../lib/boardr/types";
import { BoardCanvas } from "../components/boardr/BoardCanvas";

export const Route = createFileRoute("/s/$key")({
  component: Viewer,
});

function Viewer() {
  const { key } = Route.useParams();
  const [snap, setSnap] = useState<PublishedSnapshot | null | undefined>(undefined);

  useEffect(() => {
    setSnap(getPublished(key));
  }, [key]);

  if (snap === undefined) {
    return <div className="min-h-screen grid place-items-center font-mono text-xs uppercase tracking-wider text-muted-foreground">Loading…</div>;
  }

  if (!snap) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="text-center max-w-md">
          <h1 className="font-display text-4xl">No board here</h1>
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            The board at <span className="text-foreground">/s/{key}</span> isn't available in this browser. Published boards live in the publisher's browser storage.
          </p>
          <Link to="/" className="mt-6 inline-block rounded-md bg-stone-900 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-stone-50">
            Build your own
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-mono text-xs uppercase tracking-[0.18em]">zinegeist</Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono text-sm">{snap.name}</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          /s/{key}
        </span>
      </header>
      <div className="flex-1 flex">
        <BoardCanvas
          kind={snap.kind}
          assets={snap.assets}
          strings={snap.strings}
        />
      </div>
    </div>
  );
}