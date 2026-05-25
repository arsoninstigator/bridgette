import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/boardr/SiteChrome";
import { MarketplaceBrowser } from "@/components/marketplace/MarketplaceBrowser";

export const Route = createFileRoute("/assets")({
  head: () => ({
    meta: [
      { title: "asset library — zinegeist" },
      { name: "description", content: "browse asset packs — polaroids, washi tape, pins, paper, shapes — uploaded by zinegeist and the community. filter by semantic tags." },
      { property: "og:title", content: "asset library — zinegeist" },
      { property: "og:description", content: "browse and contribute asset packs for your tactile spatial boards." },
    ],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <MarketplaceBrowser
          title="asset library"
          intro="curated and community-uploaded asset packs. drag a pack into your board to spawn its contents. filter by semantic tags — noir, sepia, ransom-note, floral, halftone — to find a vibe fast."
        />
      </main>
      <SiteFooter />
    </div>
  );
}
