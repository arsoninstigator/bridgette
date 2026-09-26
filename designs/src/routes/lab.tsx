import { createFileRoute } from "@tanstack/react-router";
import { ConfiguratorMain } from "@/porter/Configurator";

export const Route = createFileRoute("/lab")({
  validateSearch: (search: Record<string, unknown>) => ({
    figmaUrl: typeof search.figmaUrl === "string" ? search.figmaUrl : undefined,
  }),
  head: () => ({
    meta: [
      { title: "porter · lab — design-file configurator" },
      { name: "description", content: "the porter lab: import figma / psd / ai / eps and tag layers as locked, partial or customizable." },
      { property: "og:title", content: "porter · lab" },
      { property: "og:description", content: "the porter lab — turn design files into configurators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ConfiguratorMain
      title="the porter lab"
      subtitle="import a figma frame (oauth or token), or upload a .psd / .ai / .eps. porter walks the full layer tree, preserves effects and blend modes, then hands you a per-layer locked / partial / customizable policy."
    />
  ),
});
