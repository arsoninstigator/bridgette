import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCatalogCollection } from "@/porter/catalog";
import { CatalogCollectionPage } from "@/porter/CatalogCollectionPage";

export const Route = createFileRoute("/catalog/$slug")({
  loader: ({ params }) => {
    const collection = getCatalogCollection(params.slug);
    if (!collection || collection.slug === "spotify") throw notFound();
    return collection;
  },
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `${loaderData.name} presets — porter` : "Catalog collection not found — porter" },
    { name: "description", content: loaderData?.description ?? "This Porter catalog collection is unavailable." },
    { property: "og:title", content: loaderData ? `${loaderData.name} presets — porter` : "Catalog collection unavailable — porter" },
    { property: "og:description", content: loaderData?.description ?? "This Porter catalog collection is unavailable." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PresetPage,
});

function PresetPage() {
  return <CatalogCollectionPage collection={Route.useLoaderData()} />;
}
