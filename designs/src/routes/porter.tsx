import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PorterShell } from "@/porter/PorterShell";

export const Route = createFileRoute("/porter")({
  component: () => (
    <PorterShell>
      <Outlet />
    </PorterShell>
  ),
});
