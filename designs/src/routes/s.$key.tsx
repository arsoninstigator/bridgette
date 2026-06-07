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
    let cancelled = false;
    getPublished(key).then((s) => { if (!cancelled) setSnap(s); });
    return () => { cancelled = true; };
  }, [key]);

  // After load, honor any #section in the URL by scrolling to it.
  useEffect(() => {
    if (!snap) return;
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [snap]);

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

  const indexContent = snap.pageAssets?.["index"];
  const assets = indexContent?.assets ?? snap.assets;
  const strings = indexContent?.strings ?? snap.strings;
  const sections = indexContent?.sections;
  const pageHeight = indexContent?.height ?? 640;

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-mono text-xs uppercase tracking-[0.18em]">zinegeist</Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono text-sm">{snap.name}</span>
        </div>
        <nav className="flex items-center gap-3 font-mono text-[10px] lowercase tracking-wider text-muted-foreground">
          {(snap.pages && snap.pages.length > 1) && snap.pages.map((p) => (
            <Link
              key={p.slug}
              to={p.slug === "index" ? "/s/$key" : "/s/$key/$page"}
              params={p.slug === "index" ? { key } : { key, page: p.slug }}
              className={`hover:text-foreground ${p.slug === "index" ? "text-foreground underline underline-offset-4" : ""}`}
            >
              /{p.slug === "index" ? "" : p.slug}{p.slug === "index" ? "" : ""} <span className="text-stone-400">·</span> {p.name}
            </Link>
          ))}
          {sections && sections.length > 0 && (
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              {sections.map((s) => (
                <a key={s.slug} href={`#${s.slug}`} className="hover:text-foreground">#{s.name}</a>
              ))}
            </div>
          )}
        </nav>
      </header>
      <div className="flex-1 overflow-auto">
        <div style={{ height: pageHeight }} className="relative">
          <BoardCanvas
            kind={snap.kind}
            surface={snap.surface}
            assets={assets}
            strings={strings}
            sections={sections}
          />
        </div>
      </div>
    </div>
  );
}
