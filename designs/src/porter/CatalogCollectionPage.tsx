import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Lock } from "lucide-react";
import type { CatalogCollection, CatalogPreset } from "@/porter/catalog";
import { PorterStitches } from "@/porter/PorterShell";

function PresetPreview({ preset }: { preset: CatalogPreset }) {
  if (preset.preview === "direct-message" || preset.preview === "group-chat") {
    return <div className="flex h-48 flex-col justify-end gap-2 bg-stone-100 p-5" aria-hidden="true">
      <div className="mb-auto flex items-center gap-2 border-b border-stone-300 pb-3"><div className="h-7 w-7 rounded-full bg-stone-300"/><div className="font-mono text-[9px] uppercase text-stone-500">{preset.preview === "group-chat" ? "studio group · 4" : "alex"}</div></div>
      <div className="max-w-[76%] rounded-2xl rounded-bl-sm bg-stone-300 px-3 py-2 text-[11px]">can you send the final?</div>
      <div className="ml-auto max-w-[72%] rounded-2xl rounded-br-sm bg-[#4b8bea] px-3 py-2 text-[11px] text-white">just dropped it in porter</div>
    </div>;
  }
  if (preset.preview === "album" || preset.preview === "playlist" || preset.preview === "artist") {
    return <div className="grid h-48 grid-cols-[0.82fr_1fr] gap-4 bg-stone-900 p-5 text-stone-50" aria-hidden="true">
      <div className={`p-3 ${preset.preview === "artist" ? "rounded-full bg-[#9ee8cf]" : "bg-[#74b88a]"}`}><div className="flex h-full items-end border border-stone-900/20 bg-[#d8f15a] p-3 font-display text-xl lowercase text-stone-900">{preset.preview}</div></div>
      <div className="flex min-w-0 flex-col justify-end"><span className="mb-auto font-mono text-[8px] uppercase text-stone-400">spotify</span><strong className="truncate font-display text-base lowercase">soft focus</strong><span className="text-[10px] text-stone-400">porter sessions</span><div className="mt-4 h-px bg-stone-600"/><div className="mt-3 space-y-2"><div className="h-1 bg-stone-600"/><div className="h-1 w-4/5 bg-stone-600"/><div className="h-1 w-3/5 bg-stone-600"/></div></div>
    </div>;
  }
  if (preset.preview.startsWith("instagram-")) {
    const isStory = preset.preview === "instagram-story";
    const isProfile = preset.preview === "instagram-profile";
    return <div className={`h-48 bg-stone-50 p-4 text-stone-900 ${isStory ? "flex justify-center bg-rose-100" : ""}`} aria-hidden="true">
      {isStory ? <div className="relative h-full w-24 overflow-hidden rounded-md bg-pink-300 p-2 shadow-sm"><div className="flex gap-1"><span className="h-0.5 flex-1 bg-white"/><span className="h-0.5 flex-1 bg-white/60"/><span className="h-0.5 flex-1 bg-white/60"/></div><div className="mt-3 h-5 w-5 rounded-full border-2 border-white bg-amber-100"/><div className="absolute inset-x-2 bottom-9 bg-white/90 p-1 text-center font-display text-[8px] lowercase">day in the studio</div><div className="absolute inset-x-2 bottom-2 h-4 rounded-full border border-white/80"/></div> : <div className="h-full border border-stone-200 bg-white p-3">
        <div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-300 via-pink-400 to-fuchsia-500 p-0.5"><div className="h-full w-full rounded-full bg-stone-100"/></div><strong className="text-[9px]">porter.studio</strong><span className="ml-auto text-xs">···</span></div>
        {isProfile ? <><div className="mt-4 flex items-center gap-4"><div className="h-14 w-14 rounded-full bg-rose-200"/><div className="grid flex-1 grid-cols-3 text-center text-[8px]"><strong>124<br/><span className="font-normal">posts</span></strong><strong>18k<br/><span className="font-normal">followers</span></strong><strong>302<br/><span className="font-normal">following</span></strong></div></div><div className="mt-3 text-[8px]"><strong>Porter Studio</strong><br/>design files, made configurable</div><div className="mt-3 grid grid-cols-3 gap-1">{[0,1,2].map((item) => <div key={item} className="aspect-square bg-rose-100"/>)}</div></> : <><div className={`mt-3 h-24 ${preset.preview === "instagram-caption" ? "bg-stone-100 p-3" : "bg-gradient-to-br from-sky-200 via-amber-100 to-rose-200"}`}>{preset.preview === "instagram-caption" && <p className="text-[9px] leading-relaxed"><strong>porter.studio</strong> new work, loose edges, good type. #design #process</p>}</div><div className="mt-2 flex justify-between text-xs"><span>♡ ◯ ⤴</span><span>▢</span></div>{preset.preview === "instagram-carousel" && <div className="mt-1 flex justify-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-sky-500"/><span className="h-1.5 w-1.5 rounded-full bg-stone-300"/><span className="h-1.5 w-1.5 rounded-full bg-stone-300"/></div>}</>}
      </div>}
    </div>;
  }
  if (preset.preview.startsWith("twitter-")) {
    const isProfile = preset.preview === "twitter-profile";
    const isThread = preset.preview === "twitter-thread";
    return <div className="h-48 bg-white p-4 text-stone-900" aria-hidden="true">
      {isProfile ? <><div className="h-16 bg-sky-200"/><div className="-mt-5 ml-3 h-12 w-12 rounded-full border-4 border-white bg-sky-500"/><div className="mt-1 font-display text-sm">porter studio</div><div className="font-mono text-[8px] text-stone-500">@porterfiles</div><div className="mt-2 text-[8px]">design files, made configurable.</div><div className="mt-3 border-b border-stone-200 pb-2 text-[8px]">1,204 following&nbsp;&nbsp; 18.2k followers</div></> : <div className="flex gap-3"><div className="relative"><div className="h-8 w-8 rounded-full bg-sky-500"/>{isThread && <div className="absolute left-1/2 top-9 h-24 w-px bg-stone-300"/>}</div><div className="min-w-0 flex-1"><div className="text-[9px]"><strong>Porter Studio</strong> <span className="text-stone-500">@porterfiles · 2h</span></div><p className="mt-2 text-[10px] leading-relaxed">Design files should travel without turning into support tickets.</p>{preset.preview === "twitter-quote" && <div className="mt-3 rounded-md border border-stone-300 p-2 text-[8px]"><strong>Another Designer</strong><p className="mt-1">This changes how we hand work over.</p></div>}<div className="mt-3 flex justify-between text-[9px] text-stone-500"><span>◯ 12</span><span>↻ 34</span><span>♡ 208</span><span>↗</span></div>{isThread && <div className="mt-4 border-t border-stone-200 pt-3 text-[9px]"><strong>Porter Studio</strong><p className="mt-1">So we made every editable choice explicit.</p></div>}</div></div>}
    </div>;
  }
  return <div className="h-48 bg-stone-100 p-5 text-stone-800" aria-hidden="true"><div className="border-b border-stone-400 pb-3 font-display text-xl">W</div><div className="mt-5 font-serif text-2xl">{preset.preview === "article" ? "A very useful article" : "Search Wikipedia"}</div><div className="mt-4 space-y-2"><div className="h-1.5 bg-stone-300"/><div className="h-1.5 w-11/12 bg-stone-300"/><div className="h-1.5 w-4/5 bg-stone-300"/></div></div>;
}

export function CatalogCollectionPage({ collection }: { collection: CatalogCollection }) {
  return <div className="mx-auto max-w-6xl px-6 py-14">
    <Link to="/catalog" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-stone-500"><ArrowLeft size={13}/> catalog</Link>
    <PorterStitches className="mt-8" />
    <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-stone-500">{collection.eyebrow} · preset family</p>
    <h1 className="mt-3 font-display text-5xl lowercase">{collection.name}</h1>
    <p className="mt-4 max-w-2xl leading-relaxed text-stone-700">{collection.description}</p>
    <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {collection.presets.map((preset) => <article key={preset.slug} className="porter-card overflow-hidden">
        <PresetPreview preset={preset}/>
        <div className="p-5">
          <h2 className="font-display text-2xl lowercase">{preset.name}</h2>
          <p className="mt-2 min-h-12 text-sm leading-relaxed text-stone-600">{preset.description}</p>
          <div className="mt-5 space-y-3 border-t border-stone-200 pt-4">
            <div className="flex gap-2 text-xs text-stone-600"><Check className="mt-0.5 shrink-0" size={13}/><span>{preset.editable.slice(0, 3).join(" · ")}</span></div>
            <div className="flex gap-2 text-xs text-stone-500"><Lock className="mt-0.5 shrink-0" size={12}/><span>{preset.locked.slice(0, 2).join(" · ")}</span></div>
          </div>
          {preset.figmaUrl ? <Link to="/lab" search={{ figmaUrl: preset.figmaUrl }} className="porter-btn mt-5 inline-flex items-center gap-2 bg-[#4b53d6] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-stone-50">open frame <ArrowRight size={13}/></Link> : <span className="mt-5 inline-flex font-mono text-[9px] uppercase tracking-widest text-stone-500">source frame needed</span>}
        </div>
      </article>)}
    </div>
  </div>;
}