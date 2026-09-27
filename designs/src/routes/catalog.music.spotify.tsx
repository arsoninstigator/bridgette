import { createFileRoute } from "@tanstack/react-router";
import { getCatalogCollection } from "@/porter/catalog";
import { CatalogCollectionPage } from "@/porter/CatalogCollectionPage";

const spotify = getCatalogCollection("spotify");

export const Route = createFileRoute("/catalog/music/spotify")({
  head: () => ({ meta: [
    { title: "Spotify presets — porter" },
    { name: "description", content: "Configure Spotify album, playlist, and artist profile screens from a supplied Figma UI frame." },
    { property: "og:title", content: "Spotify presets — porter" },
    { property: "og:description", content: "Album details, playlist details, and artist profile configurators." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: SpotifyCatalogPage,
});

function SpotifyCatalogPage() {
  if (!spotify) return null;
  return <CatalogCollectionPage collection={spotify} />;
}