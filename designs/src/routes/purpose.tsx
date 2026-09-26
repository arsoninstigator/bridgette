import { createFileRoute, Link } from "@tanstack/react-router";
import { PorterSquiggle, PorterStitches } from "@/porter/PorterShell";

export const Route = createFileRoute("/purpose")({
  head: () => ({
    meta: [
      { title: "porter · purpose — who porter is for" },
      { name: "description", content: "porter is for the freelancer, the illustrator, the merch studio, the type designer — anyone who ships design files but keeps rebuilding the same 'change this bit' handoff. porter turns that handoff into a configurator." },
      { property: "og:title", content: "porter · purpose" },
      { property: "og:description", content: "who porter is for — freelancers, illustrators, merch studios, type designers, brand kits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PurposePage,
});

const USES = [
  {
    who: "the freelance illustrator",
    scene: "you sell a name-plate print on etsy in 40 name variants.",
    without: "you keep a photoshop file with 40 smart-object swaps, or you redraw each order by hand.",
    with: "one .psd → porter. the customer types their name, picks the palette you already approved, downloads print-ready art. nothing else in the file is editable.",
  },
  {
    who: "the merch / apparel studio",
    scene: "you drop a tee design and every reseller wants their own colorway.",
    without: "you email .ai files, they open them in canva, canva mangles the pantone, you fix it.",
    with: "porter parses the .ai, you mark the two shirt fills as customizable and the wordmark as locked. resellers get a page, not a file.",
  },
  {
    who: "the wedding / event stationery designer",
    scene: "same invite, 200 couples, 200 different names, venues, dates.",
    without: "google-doc name lists and a spreadsheet-to-indesign macro that breaks every third batch.",
    with: "porter unlocks only the guest name, the venue line, and the rsvp url. everything else — kerning, foil placement, the little sprig — stays exactly as you drew it.",
  },
  {
    who: "the type / lettering designer",
    scene: "you sell custom monogram commissions.",
    without: "back-and-forth on 'can you make the C a little taller', which is a whole new file.",
    with: "you expose stroke weight and letter spacing sliders on the customer side; the ligatures and the ornament stay locked.",
  },
  {
    who: "the brand / identity studio",
    scene: "you ship a logo kit and the client immediately puts it on a coral background you never approved.",
    without: "a 40-page pdf guideline nobody reads.",
    with: "porter turns the master file into a configurator — background colors are constrained to the six the brand ships, the mark can't stretch, the lockup padding is locked. the guideline enforces itself.",
  },
  {
    who: "the packaging / label designer",
    scene: "a small-batch food brand needs 12 flavor variants of the same jar wrap.",
    without: "12 versions of the same illustrator file, each one drifting from the last.",
    with: "the flavor name and the color band are customizable, the illustration and the nutrition panel are locked. the client edits, porter exports print-ready pdfs.",
  },
];

function PurposePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-14">
      <PorterStitches />
      <p className="mt-2 porter-chip inline-block bg-[#e8ff4a] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-stone-900">purpose</p>
      <h1 className="mt-4 font-display text-4xl lowercase text-stone-900">
        porter is for the designer who has <span className="porter-highlight">already shipped the file</span>.
      </h1>
      <p className="mt-4 font-body text-stone-700 leading-relaxed">
        every case below already exists in your work: the same file, sent again and again, with one tiny thing changed each
        time. porter is the layer between your file and that "one tiny thing" — so the tiny thing is the only thing the
        customer can touch, and the rest of your craft stays exactly as you drew it.
      </p>

      <div className="mt-10 space-y-6">
        {USES.map((u, i) => (
          <article key={u.who} className="porter-card p-6" style={{ transform: `rotate(${i % 2 ? 0.4 : -0.4}deg)` }}>
            <h2 className="font-display text-xl lowercase text-stone-900">{u.who}</h2>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-stone-500">{u.scene}</p>
            <div className="mt-4 grid md:grid-cols-2 gap-4 text-[14px] font-body">
              <div className="border-[1.5px] border-stone-900/25 bg-stone-50/70 p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">without porter</p>
                <p className="mt-1 text-stone-700 leading-relaxed">{u.without}</p>
              </div>
              <div className="border-[1.5px] border-stone-900 bg-[#4b53d6] text-stone-50 p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-200">with porter</p>
                <p className="mt-1 leading-relaxed">{u.with}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <PorterSquiggle className="mt-12 h-10 w-full text-[#4b53d6]/70" />

      <div className="mt-8 flex items-center gap-4">
        <Link
          to="/lab"
          className="porter-btn bg-[#4b53d6] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-50"
        >
          open the lab
        </Link>
        <Link
          to="/features"
          className="porter-btn bg-white px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em]"
        >
          see the features
        </Link>
      </div>
    </div>
  );
}
