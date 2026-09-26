import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Lock } from "lucide-react";
import { getCatalogPreset } from "@/porter/catalog";
import { PorterStitches } from "@/porter/PorterShell";

export const Route = createFileRoute("/catalog/$slug")({
  loader: ({ params }) => {
    const preset = getCatalogPreset(params.slug);
    if (!preset) throw notFound();
    return preset;
  },
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `${loaderData.name} preset — porter` : "Preset not found — porter" },
    { name: "description", content: loaderData?.description ?? "This Porter preset is unavailable." },
    { property: "og:title", content: loaderData ? `${loaderData.name} preset — porter` : "Preset unavailable — porter" },
    { property: "og:description", content: loaderData?.description ?? "This Porter preset is unavailable." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PresetPage,
});

function PresetPage() {
  const preset = Route.useLoaderData();
  return <div className="mx-auto max-w-5xl px-6 py-14">
    <Link to="/catalog" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-stone-500"><ArrowLeft size={13}/> catalog</Link>
    <div className="mt-8 grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
      <section>
        <PorterStitches />
        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-stone-500">{preset.category}</p>
        <h1 className="mt-3 font-display text-5xl lowercase">{preset.name}</h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-700">{preset.description}</p>
        {preset.figmaUrl ? <Link to="/lab" search={{ figmaUrl: preset.figmaUrl }} className="porter-btn mt-8 inline-flex items-center gap-2 bg-[#4b53d6] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50">use this preset <ArrowRight size={14}/></Link> : <Link to="/lab" className="porter-btn mt-8 inline-flex items-center gap-2 bg-[#4b53d6] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50">bring your own frame <ArrowRight size={14}/></Link>}
        {!preset.figmaUrl && <p className="mt-3 text-xs text-stone-500">A public source frame is being prepared. You can already recreate the preset from your own frame.</p>}
      </section>
      <aside className="porter-card p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500">suggested controls</p>
        <div className="mt-5 space-y-5">
          <div><h2 className="flex items-center gap-2 font-display text-lg lowercase"><Check size={16}/> editable</h2><div className="mt-3 flex flex-wrap gap-2">{preset.editable.map((item) => <span key={item} className="porter-chip bg-[#9ee8cf] px-2 py-1 text-xs">{item}</span>)}</div></div>
          <div><h2 className="flex items-center gap-2 font-display text-lg lowercase"><Lock size={15}/> locked</h2><div className="mt-3 flex flex-wrap gap-2">{preset.locked.map((item) => <span key={item} className="porter-chip bg-white px-2 py-1 text-xs">{item}</span>)}</div></div>
        </div>
      </aside>
    </div>
  </div>;
}
