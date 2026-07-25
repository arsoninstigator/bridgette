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
        <section className="max-w-6xl mx-auto px-6 pb-16 -mt-4">
          <div className="rounded-md border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded bg-stone-900 text-stone-50">configurator</span>
              <h2 className="font-display text-2xl lowercase tracking-tight">what is a configurator pack?</h2>
            </div>
            <p className="mt-3 text-stone-700 leading-relaxed max-w-3xl">
              configurators are premade artifact presets — think of a psd file for a specific aesthetic (an enamel pin, a boarding pass, a press badge), except we already know which layers matter to make it yours. instead of a hellish layer view, you get a small, opinionated set of controls: swap the photo, edit the name, pick the fill color, choose a shape variant. the physics, shadows, textures, and typography stay curated. drag one in, edit only what should change, and the artifact still feels intentional.
            </p>
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-stone-700">
              <li>• opinionated presets, minimal controls, unlimited outputs</li>
              <li>• editable slots only — never a blank canvas of layers</li>
              <li>• every variant ships with correct materials, wear, and shine</li>
              <li>• stackable with regular assets, string mode, and pages</li>
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

