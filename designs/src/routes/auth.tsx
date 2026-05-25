import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteHeader, SiteFooter } from "@/components/boardr/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "sign in — zinegeist" },
      { name: "description", content: "sign in to zinegeist to save boards, publish, and share asset packs. or skip and use an edit key." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        setError("check your inbox to confirm — or sign in if confirmation is off.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) setError(result.error.message ?? String(result.error));
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-md mx-auto w-full px-6 py-16">
        <h1 className="font-display text-4xl lowercase tracking-tight">{mode === "signup" ? "make an account" : "sign in"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          accounts let you publish, save asset packs, and share to the community. you can still build & publish anonymously with an edit key — just{" "}
          <Link to="/editor" className="underline">open the editor</Link>.
        </p>

        <div className="mt-8 space-y-3">
          <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
            continue with google
          </Button>
          <div className="flex items-center gap-3 my-2">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "…" : mode === "signup" ? "create account" : "sign in"}
            </Button>
          </form>
          <button
            type="button"
            className="w-full font-mono text-[11px] uppercase tracking-[0.18em] text-stone-600 hover:text-foreground"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          >
            {mode === "signup" ? "have an account? sign in" : "new here? make an account"}
          </button>
        </div>

        <div className="mt-10 rounded-md border border-dashed border-border p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">no-login mode</p>
          <p className="mt-2 text-sm">
            prefer no account? boards still publish at <span className="font-mono">/s/[key]</span> and re-open via your edit key.
          </p>
          <Link to="/editor" className="mt-3 inline-block text-sm underline">go to editor →</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
