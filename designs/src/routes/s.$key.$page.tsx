import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPublished } from "../lib/boardr/storage";
import type { PublishedSnapshot } from "../lib/boardr/types";
import { BoardCanvas } from "../components/boardr/BoardCanvas";

export const Route = createFileRoute("/s/$key/$page")({
  component: PageViewer,
});

function PageViewer() {
  const { key, page } = Route.useParams();
  const [snap, setSnap] = useState<PublishedSnapshot | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getPublished(key).then((s) => { if (!cancelled) setSnap(s); });
    return () => { cancelled = true; };
  }, [key]);

  useEffect(() => {
    if (!snap) return;
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [snap, page]);

  if (snap === undefined) {
    return <div className="min-h-screen grid place-items-center font-mono text-xs lowercase tracking-wider text-muted-foreground">loading…</div>;
  }
  if (!snap) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-4xl">no board here</h1>
          <p className="mt-3 font-mono text-xs text-muted-foreground">/s/{key} isn't available in this browser.</p>
          <Link to="/" className="mt-6 inline-block rounded-md bg-stone-900 px-4 py-2 font-mono text-[11px] lowercase tracking-wider text-stone-50">build your own</Link>
        </div>
      </div>
    );
  }

  const pageMeta = snap.pages?.find((p) => p.slug === page);
  const content = snap.pageAssets?.[page];
  if (!pageMeta || !content) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-4xl">frame not found</h1>
          <p className="mt-3 font-mono text-xs text-muted-foreground">no frame at /s/{key}/{page}.</p>
          <Link to="/s/$key" params={{ key }} className="mt-6 inline-block rounded-md bg-stone-900 px-4 py-2 font-mono text-[11px] lowercase tracking-wider text-stone-50">back to index</Link>
        </div>
      </div>
    );
  }

  const pageHeight = content.height ?? 640;

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-mono text-xs lowercase tracking-[0.18em]">zinegeist</Link>
          <span className="text-muted-foreground">/</span>
          <Link to="/s/$key" params={{ key }} className="font-mono text-sm hover:underline">{snap.name}</Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono text-sm">{pageMeta.name}</span>
        </div>
        <nav className="flex items-center gap-3 font-mono text-[10px] lowercase tracking-wider text-muted-foreground">
          {snap.pages?.map((p) => (
            <Link
              key={p.slug}
              to={p.slug === "index" ? "/s/$key" : "/s/$key/$page"}
              params={p.slug === "index" ? { key } : { key, page: p.slug }}
              className={`hover:text-foreground ${p.slug === page ? "text-foreground underline underline-offset-4" : ""}`}
            >
              {p.name}
            </Link>
          ))}
          {content.sections && content.sections.length > 0 && (
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              {content.sections.map((s) => (
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
            assets={content.assets}
            strings={content.strings}
            sections={content.sections}
          />
        </div>
      </div>
    </div>
  );
}
