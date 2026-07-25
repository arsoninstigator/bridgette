import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SEED_PACKS, SEED_CATEGORIES, type SeedPack } from "@/lib/marketplace/seed";

type PackType = "assets" | "template" | "list" | "configurator";

interface DbPack {
  id: string;
  name: string;
  description: string | null;
  category: string;
  tags: string[];
  pack_type: PackType;
  item_count: number;
  owner_id: string;
  cover_url: string | null;
}

interface Props {
  /** Restrict pack_type — undefined shows all */
  packType?: PackType;
  title: string;
  intro: string;
}


export function MarketplaceBrowser({ packType, title, intro }: Props) {
  const { user } = useAuth();
  const [dbPacks, setDbPacks] = useState<DbPack[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    let q = supabase.from("asset_packs").select("*").eq("is_public", true).order("created_at", { ascending: false });
    if (packType) q = q.eq("pack_type", packType);
    q.limit(200).then(({ data }) => {
      if (data) setDbPacks(data as unknown as DbPack[]);
    });
  }, [packType]);

  const seeds = useMemo(() => packType ? SEED_PACKS.filter((p) => p.pack_type === packType) : SEED_PACKS, [packType]);

  const all = useMemo(() => {
    const dbAsSeed: SeedPack[] = dbPacks.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      category: p.category,
      tags: p.tags ?? [],
      pack_type: p.pack_type,
      item_count: p.item_count,
      curator: "community",
      swatch: ["#c9a84c", "#1a1a1a", "#fbf7ec", "#b91c1c"],
    }));
    return [...dbAsSeed, ...seeds];
  }, [dbPacks, seeds]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    all.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [all]);

  const filtered = useMemo(() => {
    return all.filter((p) => {
      if (activeCat !== "all" && p.category !== activeCat) return false;
      if (activeTags.length && !activeTags.every((t) => p.tags.includes(t))) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${p.name} ${p.description} ${p.tags.join(" ")} ${p.category}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [all, activeCat, activeTags, search]);

  function toggleTag(t: string) {
    setActiveTags((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-5xl lowercase tracking-tight">{title}</h1>
          <p className="mt-3 text-stone-700 leading-relaxed">{intro}</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          {user ? "+ upload pack" : "sign in to upload"}
        </Button>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Input
          placeholder="search by name, tag, or vibe…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-1.5">
          {SEED_CATEGORIES.filter((c) => c !== "template" || !packType).map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`font-mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded border transition ${
                activeCat === c ? "bg-stone-900 text-stone-50 border-stone-900" : "border-border text-stone-600 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground self-center mr-1">tags</span>
            {allTags.slice(0, 30).map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
                  activeTags.includes(t) ? "bg-stone-900 text-stone-50 border-stone-900" : "border-border text-stone-700 hover:border-stone-400"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <PackCard key={p.id} pack={p} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground text-sm">
            no packs match. try clearing filters.
          </div>
        )}
      </div>

      {showUpload && <UploadDialog onClose={() => setShowUpload(false)} defaultType={packType ?? "assets"} />}
    </div>
  );
}

function PackCard({ pack }: { pack: SeedPack }) {
  return (
    <article className="group rounded-md border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-32 grid grid-cols-4">
        {pack.swatch.map((c, i) => (
          <div key={i} style={{ background: c }} />
        ))}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg lowercase tracking-tight">{pack.name}</h3>
          <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-[0.18em]">{pack.pack_type}</Badge>
        </div>
        <p className="mt-1 text-sm text-stone-700 line-clamp-2">{pack.description}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {pack.tags.slice(0, 5).map((t) => (
            <span key={t} className="text-[10px] text-stone-600">#{t}</span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {pack.item_count} {pack.pack_type === "template" ? "page" : "items"} · {pack.curator}
          </span>
          <button
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-600 hover:text-foreground"
            disabled
            title="coming soon"
          >
            add to project →
          </button>
        </div>
      </div>
    </article>
  );
}

function UploadDialog({ onClose, defaultType }: { onClose: () => void; defaultType: "assets" | "template" | "list" }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("mixed");
  const [packType, setPackType] = useState<"assets" | "template" | "list">(defaultType);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!user) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.from("asset_packs").insert({
      owner_id: user.id,
      name: name.trim(),
      description: description.trim(),
      category: category.trim() || "mixed",
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      pack_type: packType,
      is_public: true,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onClose();
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-md max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl lowercase tracking-tight">upload pack</h2>
        {!user ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-stone-700">you need an account to publish packs to the community marketplace.</p>
            <Link to="/auth" className="block">
              <Button className="w-full">sign in / create account</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Input placeholder="pack name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="short description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Input placeholder="category (e.g. mood, zine, archive)" value={category} onChange={(e) => setCategory(e.target.value)} />
            <Input placeholder="comma-separated tags (e.g. red-string, polaroid, noir)" value={tags} onChange={(e) => setTags(e.target.value)} />
            <div className="flex gap-2">
              {(["assets", "template", "list"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPackType(t)}
                  className={`flex-1 font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-2 rounded border ${
                    packType === t ? "bg-stone-900 text-stone-50 border-stone-900" : "border-border text-stone-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              note: item upload (drag in your stickies, polaroids, washi, etc) is the next step — pack metadata is saved now and items can be added later.
            </p>
            {err && <p className="text-xs text-destructive">{err}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">cancel</Button>
              <Button onClick={submit} disabled={busy || !name.trim()} className="flex-1">
                {busy ? "…" : "publish"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
