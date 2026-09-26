import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, Music2 } from "lucide-react";
import { CATALOG_PRESETS } from "@/porter/catalog";
import { PorterStitches } from "@/porter/PorterShell";

export const Route = createFileRoute("/catalog")({
  head: () => ({ meta: [
    { title: "configurator catalog — porter" },
    { name: "description", content: "Browse ready-to-configure Porter presets for chat mockups, album artwork, and more." },
    { property: "og:title", content: "configurator catalog — porter" },
    { property: "og:description", content: "Start with a preset, then decide which layers people can customize." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CatalogPage,
});

function PresetArt({ accent, type }: { accent: "blue" | "green"; type: string }) {
  if (type === "imessage-chat") return (
    <div className="flex h-56 flex-col justify-end gap-3 bg-stone-100 p-5" aria-hidden="true">
      <div className="mb-auto flex items-center gap-2 border-b border-stone-300 pb-3"><div className="h-8 w-8 rounded-full bg-stone-300"/><div className="h-2 w-24 bg-stone-300"/></div>
      <div className="max-w-[72%] rounded-2xl rounded-bl-sm bg-stone-300 px-4 py-2 text-xs">did you finish the cover?</div>
      <div className="ml-auto max-w-[72%] rounded-2xl rounded-br-sm bg-[#4b8bea] px-4 py-2 text-xs text-white">trying it in porter now</div>
      <div className="ml-auto max-w-[62%] rounded-2xl rounded-br-sm bg-[#4b8bea] px-4 py-2 text-xs text-white">way easier ✦</div>
    </div>
  );
  return (
    <div className="grid h-56 grid-cols-[1fr_0.85fr] gap-4 bg-stone-900 p-5 text-stone-50" aria-hidden="true">
      <div className="bg-[#74b88a] p-4"><div className="h-full border border-stone-900/30 bg-[#d8f15a] p-3"><div className="mt-10 text-3xl font-display lowercase text-stone-900">soft<br/>focus</div></div></div>
      <div className="flex flex-col justify-end"><div className="mb-auto text-[10px] uppercase tracking-widest text-stone-400">now playing</div><div className="font-display text-lg">soft focus</div><div className="text-xs text-stone-400">porter sessions</div><div className="mt-5 h-1 bg-stone-600"><div className="h-full w-2/3 bg-[#74b88a]"/></div><div className="mt-4 flex justify-around"><span>◀</span><span>●</span><span>▶</span></div></div>
    </div>
  );
}

function CatalogPage() {
  return <div className="mx-auto max-w-6xl px-6 py-16">
    <PorterStitches />
    <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">preset shelf · pick a starting point</p>
    <h1 className="mt-3 max-w-3xl font-display text-5xl lowercase leading-tight">good files, already <span className="porter-highlight">set up to change</span>.</h1>
    <p className="mt-5 max-w-2xl text-stone-700">Each preset starts with a real composition and a deliberate set of editable layers. Open one, bring in its source, and make the controls yours.</p>
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      {CATALOG_PRESETS.map((preset) => {
        const Icon = preset.slug === "imessage-chat" ? MessageCircle : Music2;
        return <Link key={preset.slug} to="/catalog/$slug" params={{ slug: preset.slug }} className="group porter-card overflow-hidden">
          <PresetArt accent={preset.accent} type={preset.slug} />
          <div className="p-5">
            <div className="flex items-center justify-between"><span className="porter-chip bg-white px-2 py-1 font-mono text-[9px] uppercase tracking-widest">{preset.category}</span><Icon size={18}/></div>
            <h2 className="mt-4 font-display text-2xl lowercase">{preset.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{preset.description}</p>
            <span className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">open preset <ArrowRight size={13} className="transition-transform group-hover:translate-x-1"/></span>
          </div>
        </Link>;
      })}
    </div>
  </div>;
}
