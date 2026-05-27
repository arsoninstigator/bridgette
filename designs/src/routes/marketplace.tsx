import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/boardr/SiteChrome";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "marketplace (upcoming) — zinegeist" },
      { name: "description", content: "a future home for community-published asset packs. creators will post packs, others will install them with one click." },
      { property: "og:title", content: "marketplace (upcoming) — zinegeist" },
      { property: "og:description", content: "community-published asset packs. coming once user accounts are solidified." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20">
        <div className="inline-block rounded-full border border-border bg-card px-3 py-1 font-mono text-[10px] lowercase tracking-wider text-muted-foreground">
          upcoming
        </div>
        <h1 className="mt-4 font-display text-4xl lowercase">marketplace</h1>
        <p className="mt-3 font-mono text-sm text-muted-foreground lowercase max-w-2xl">
          once user accounts are solidified, this is where the community will post asset packs, templates, and curated lists for others to install into their boards with one click.
        </p>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-border bg-card p-5">
            <div className="font-mono text-[11px] lowercase tracking-wider text-muted-foreground">for creators</div>
            <h2 className="mt-1 font-display text-xl lowercase">publish a pack</h2>
            <p className="mt-2 font-mono text-xs text-muted-foreground lowercase leading-relaxed">
              package your favorite stickies, polaroids, washi sets, or whole templates. tag them semantically. let other zinegeists drop them straight into their boards.
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-5">
            <div className="font-mono text-[11px] lowercase tracking-wider text-muted-foreground">for collectors</div>
            <h2 className="mt-1 font-display text-xl lowercase">install with one click</h2>
            <p className="mt-2 font-mono text-xs text-muted-foreground lowercase leading-relaxed">
              browse by vibe — noir, cottagecore, ransom-note, csi. add a pack and every asset shows up in your library, ready to drag.
            </p>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/assets" className="rounded-md bg-stone-900/90 px-4 py-2 font-mono text-[11px] lowercase tracking-wider text-stone-50 hover:bg-stone-900">
            browse the current asset library →
          </Link>
          <Link to="/roadmap" className="rounded-md border border-border bg-card px-4 py-2 font-mono text-[11px] lowercase tracking-wider hover:bg-accent">
            see the roadmap
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
