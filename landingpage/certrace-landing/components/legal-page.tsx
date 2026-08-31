"use client";

import Link from "next/link";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { PixelIcon } from "@/components/pixel-icon";
import { BlurHeading, TagBadge } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { LEGAL, type LegalBlock } from "@/lib/legal";

/* Splits on `**bold**` runs and renders them at medium weight. That's the only
   markup the legal documents use — clause lead-ins such as "**3.1 Account
   Security.**" — so a full markdown parser would be dead weight. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-medium text-black/75">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if ("ul" in block) {
    return (
      <ul className="space-y-3">
        {block.ul.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-1 h-1 rounded-full bg-black/25 shrink-0 mt-[9px]" />
            <span className="text-sm text-black/55 leading-relaxed">
              <RichText text={item} />
            </span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="text-sm text-black/55 leading-relaxed">
      <RichText text={block.p} />
    </p>
  );
}

export function LegalPage({ doc }: { doc: "terms" | "privacy" }) {
  const { lang, c } = useLang();
  const d = LEGAL[lang][doc];

  return (
    <div className="bg-[#F5F4F0] text-[#111] min-h-screen font-sans antialiased">
      <Navbar />

      <section className="pt-40 pb-16 px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <PixelIcon type="doc" size={40} />
          <div className="mt-4">
            <TagBadge>{d.eyebrow}</TagBadge>
          </div>
          <BlurHeading
            as="h1"
            className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]"
          >
            {d.title}
          </BlurHeading>
          <p className="mt-6 text-sm md:text-base text-black/45 leading-relaxed max-w-xl">
            {d.lede}
          </p>
          <div className="mt-7 flex flex-wrap gap-x-8 gap-y-2 font-pixel text-[10px] tracking-[0.18em] text-black/30">
            <span>
              {d.effectiveLabel}: {d.effective}
            </span>
            <span>
              {d.updatedLabel}: {d.updated}
            </span>
          </div>
          {d.languageNote && (
            <p className="mt-6 max-w-xl text-xs text-black/40 leading-relaxed border-l border-black/15 pl-4">
              {d.languageNote}
            </p>
          )}
        </div>
      </section>

      <section className="pb-28 px-6 md:px-12 lg:px-20 border-t border-black/[0.06] pt-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 lg:gap-16 items-start">
          {/* Contents rail. Sticky from lg up, where there's a column to spare;
              below that it collapses into a plain list above the document.
              `top-24` clears the fixed 64px header plus breathing room. */}
          <nav
            aria-label={d.contentsLabel}
            className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto"
          >
            <div className="font-pixel text-[10px] tracking-[0.2em] text-black/30 mb-4">
              {d.contentsLabel}
            </div>
            <ul className="space-y-2 border-l border-black/[0.08] pl-4">
              {d.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block text-xs text-black/35 hover:text-black/70 transition-colors leading-snug"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-12">
            {d.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-xl md:text-2xl font-light tracking-tight leading-snug">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4 max-w-3xl">
                  {section.blocks.map((block, i) => (
                    <Block key={i} block={block} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* The other document, so someone reading the terms can reach the policy
          without going back through the footer. */}
      <section className="py-16 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          <a
            href={doc === "terms" ? "/privacy" : "/terms"}
            className="px-6 py-3 rounded-[10px] border border-black/10 text-sm text-black/60 hover:border-black/25 hover:text-black hover:bg-black/[0.04] transition-all tracking-widest"
          >
            {doc === "terms" ? c.footer.links.privacy : c.footer.links.terms}
          </a>
          <Link
            href="/#demo"
            className="px-7 py-3 rounded-[10px] bg-[#111] text-white text-sm hover:bg-[#333] transition-colors tracking-widest"
          >
            {c.common.bookDemo}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
