import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const querySchema = z.object({
  url: z.string().url().max(2000).refine((value) => {
    try {
      const hostname = new URL(value).hostname.toLowerCase();
      return hostname === "figma.com" || hostname.endsWith(".figma.com");
    } catch {
      return false;
    }
  }, "A figma.com URL is required"),
});

export const Route = createFileRoute("/api/public/figma-oembed")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const parsed = querySchema.safeParse({ url: new URL(request.url).searchParams.get("url") });
        if (!parsed.success) return Response.json({ error: "Invalid Figma URL" }, { status: 400 });

        const upstream = await fetch(`https://www.figma.com/api/oembed?url=${encodeURIComponent(parsed.data.url)}`, {
          headers: { Accept: "application/json" },
        });
        if (!upstream.ok) {
          return Response.json({ error: "This Figma link is not publicly viewable." }, { status: upstream.status === 404 ? 404 : 502 });
        }

        const data = await upstream.json() as Record<string, unknown>;
        return Response.json({
          title: typeof data.title === "string" ? data.title : "Public Figma frame",
          thumbnailUrl: typeof data.thumbnail_url === "string" ? data.thumbnail_url : null,
          providerName: "Figma",
        }, { headers: { "Cache-Control": "public, max-age=300" } });
      },
    },
  },
});
