import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/boardr/SiteChrome";
import { ConfiguratorMain } from "@/porter/Configurator";

export const Route = createFileRoute("/figma")({
  head: () => ({
    meta: [
      { title: "figma / psd configurator (lab) — zinegeist" },
      { name: "description", content: "admin lab: import a figma frame (oauth or token) or upload .psd / .ai / .eps — auto-parse the layer tree and tag each layer as locked, partial, or customizable while preserving effects and hierarchy." },
      { property: "og:title", content: "figma / psd configurator (lab) — zinegeist" },
      { property: "og:description", content: "auto-parse design files into configurator packs without losing layer effects." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <ConfiguratorMain />
      <SiteFooter />
    </div>
  ),
});
