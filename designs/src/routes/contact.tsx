import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { SiteHeader, SiteFooter } from "../components/boardr/SiteChrome";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "contact — zinegeist" },
      { name: "description", content: "get in touch with zinegeist — feedback, questions, collaborations, press." },
      { property: "og:title", content: "contact — zinegeist" },
      { property: "og:description", content: "pin a note to the board. we read everything." },
    ],
  }),
  component: Contact,
});

const contactSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(100),
  email: z.string().trim().email("invalid email").max(255),
  topic: z.enum(["feedback", "bug", "collab", "press", "other"]),
  message: z.string().trim().min(5, "say a bit more").max(2000),
});

const CHANNELS = [
  { label: "general", value: "hello@zinegeist.app", tag: "/ inbox" },
  { label: "press", value: "press@zinegeist.app", tag: "/ press" },
  { label: "bugs & feedback", value: "feedback@zinegeist.app", tag: "/ feedback" },
];

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", topic: "feedback" as const, message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errs[String(issue.path[0])] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    // Persist locally; a real send wires up later.
    try {
      const key = "zinegeist.contact.outbox";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.push({ ...parsed.data, at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(prev));
    } catch {}
    setSent(true);
    setForm({ name: "", email: "", topic: "feedback", message: "" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="bg-editor-header border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-700">/ contact</span>
          <h1 className="mt-4 font-display text-5xl md:text-6xl leading-[0.95] lowercase tracking-tight">
            pin a note to the board.
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-stone-700">
            feedback, bug reports, collaborations, press — we read every message.
            no chatbots, no ticket numbers, no autoresponders.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-10">
          <aside className="space-y-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ channels</span>
              <ul className="mt-3 space-y-3">
                {CHANNELS.map((c) => (
                  <li key={c.value} className="bg-card border border-border rounded-md p-3 analog-shadow-sm">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{c.label}</div>
                    <a
                      href={`mailto:${c.value}`}
                      className="mt-1 block font-mono text-xs underline decoration-dotted underline-offset-4 break-all"
                    >
                      {c.value}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">/ response time</span>
              <p className="mt-2 font-mono text-xs text-stone-700 leading-relaxed">
                usually within 2–3 days. weekends rarely. we are a small obsessive crew.
              </p>
            </div>
          </aside>

          <form onSubmit={onSubmit} className="md:col-span-2 bg-card border border-border rounded-md p-6 analog-shadow-sm space-y-4">
            {sent && (
              <div className="border border-amber-700/60 bg-amber-50 text-stone-800 rounded-sm px-3 py-2 font-mono text-xs">
                pinned. we'll reply to the email you provided.
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="name" error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={100}
                  className="w-full bg-background border border-stone-300 rounded-sm px-3 py-2 font-mono text-sm focus:outline-none focus:border-amber-700"
                />
              </Field>
              <Field label="email" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  maxLength={255}
                  className="w-full bg-background border border-stone-300 rounded-sm px-3 py-2 font-mono text-sm focus:outline-none focus:border-amber-700"
                />
              </Field>
            </div>

            <Field label="topic" error={errors.topic}>
              <div className="flex flex-wrap gap-2">
                {(["feedback", "bug", "collab", "press", "other"] as const).map((t) => {
                  const active = form.topic === t;
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setForm({ ...form, topic: t })}
                      className={[
                        "font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full border",
                        active
                          ? "bg-stone-900 text-stone-50 border-stone-900"
                          : "bg-background border-stone-300 text-stone-600 hover:text-foreground",
                      ].join(" ")}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="message" error={errors.message}>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                maxLength={2000}
                rows={7}
                className="w-full bg-background border border-stone-300 rounded-sm px-3 py-2 font-mono text-sm focus:outline-none focus:border-amber-700 resize-y"
                placeholder="say anything. links welcome."
              />
              <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
                {form.message.length}/2000
              </div>
            </Field>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="font-mono text-[10px] text-muted-foreground lowercase">no tracking. no newsletter signup.</span>
              <button
                type="submit"
                className="rounded-md bg-stone-900 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50 hover:bg-stone-800 analog-shadow-sm"
              >
                send →
              </button>
            </div>
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 font-mono text-[10px] text-red-700">{error}</p>}
    </label>
  );
}
