import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/catalog")({
  component: CatalogLayout,
});

function CatalogLayout() {
  return <Outlet />;
}
