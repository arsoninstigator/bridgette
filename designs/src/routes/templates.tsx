import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/boardr/SiteChrome";
import { MarketplaceBrowser } from "@/components/marketplace/MarketplaceBrowser";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "templates — zinegeist" },
      { name: "description", content: "browse pre-built board templates — detective walls, tour diaries, fan wikis. fork one to your project and customize." },
      { property: "og:title", content: "templates — zinegeist" },
      { property: "og:description", content: "browse pre-built board templates for your tactile spatial boards." },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <MarketplaceBrowser
          packType="template"
          title="templates"
          intro="full pre-built boards you can fork as a starting point. detective walls, tour diaries, character webs, archive layouts. each template ships with its own assets and string connections — modify freely."
        />
      </main>
      <SiteFooter />
    </div>
  );
}
