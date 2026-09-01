"use client";

/* About Certrace.

   THE ORDER IS THE ARGUMENT. Team first, then why the company exists, then
   what it is trying to do, then the facts. A reader who has just been told
   "we build the proof layer for carbon-priced trade" wants to know who is
   saying it before they want to know why — so the roster sits directly under
   the hero and the story runs after it.

   The Principles and Where-we-are sections were cut rather than restyled:
   four rules about how we build and a paragraph about Bangkok were the two
   places on the page that talked about us to us. Their copy is gone from
   lib/pages-*.ts too, so there is nothing left to render.

   PORTRAITS ARE OPT-IN. `photo` is set for the seats we have a real portrait
   for; the rest fall back to the initial, which is honest about being a
   placeholder in a way a stock face is not. */

import Image from "next/image";
import { PageCta, PageHero, PageShell } from "@/components/page-shell";
import { usePages } from "@/lib/i18n-pages";

export default function AboutPage() {
  const p = usePages();
  const a = p.about;

  return (
    <PageShell>
      <PageHero eyebrow={a.eyebrow} headline={a.headline} intro={a.intro} />

      {/* ── Team ────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35">
              {a.teamHeading}
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-black/45">{a.teamIntro}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {a.team.map((member, i) => (
              <div
                key={`${member.name}-${i}`}
                className="flex flex-col rounded-2xl border border-black/[0.07] bg-white/70 p-6"
              >
                {/* A real portrait where we have one, an initial where we do
                    not. Same 44px circle either way, so a row of cards does
                    not change height when a photo lands. */}
                {member.photo ? (
                  <Image
                    src={member.photo}
                    alt={member.name}
                    width={88}
                    height={88}
                    className="h-11 w-11 shrink-0 rounded-full border border-black/[0.08] object-cover object-top grayscale"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-[#faf9f7] text-sm font-light text-black/35">
                    {member.name.slice(0, 1)}
                  </div>
                )}
                <h3 className="mt-4 text-[15px] font-light leading-snug text-[#111]">
                  {member.name}
                </h3>
                <div className="mt-1 font-pixel text-[10px] uppercase leading-relaxed tracking-[0.14em] text-black/30">
                  {member.role}
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-black/45">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why this exists ─────────────────────────────────── */}
      <section className="border-t border-black/[0.06] px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-[240px_1fr] md:gap-16">
          <h2 className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35">
            {a.storyHeading}
          </h2>
          <div className="max-w-2xl space-y-5">
            {a.story.map((para) => (
              <p key={para} className="text-[15px] leading-[1.8] text-black/60">
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ─────────────────────────────────────────── */}
      <section className="border-t border-black/[0.06] px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-[240px_1fr] md:gap-16">
          <h2 className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35">
            {a.missionHeading}
          </h2>
          <p
            className="max-w-2xl text-xl font-light leading-[1.5] tracking-tight text-[#111] md:text-2xl"
            style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
          >
            {a.mission}
          </p>
        </div>
      </section>

      {/* ── Facts ───────────────────────────────────────────── */}
      <section className="border-t border-black/[0.06] px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-[240px_1fr] md:gap-16">
          <h2 className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35">
            {a.factsHeading}
          </h2>
          <dl className="max-w-2xl divide-y divide-black/[0.06] border-y border-black/[0.06]">
            {a.facts.map((f) => (
              <div key={f.label} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:gap-6">
                <dt className="shrink-0 text-[13px] text-black/35 sm:w-52">{f.label}</dt>
                <dd className="text-[14px] text-[#111]">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <PageCta headline={a.ctaHeadline} body={a.ctaBody} />
    </PageShell>
  );
}
