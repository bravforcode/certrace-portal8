"use client";

/* ── The end of the sign-up flow ────────────────────────────────
   Terminal on purpose: there is no button into the dashboard. The copy says a
   free trial is being prepared and that we will write when it is ready, so a
   door into the product here would contradict it — and the account cannot do
   anything useful until that provisioning lands.

   NO LANGUAGE SWITCHER, deliberately. The wizard carries one; this page reads
   in whatever language the flow was finished in, because a switcher on a page
   with nothing left to fill in only invites re-reading the same paragraph in
   the other language.

   The real action is LINE. It is where the CBAM specialists answer, where the
   release and offer notices go, and where a Thai exporter will actually reply
   — so it is one wide card, and the other four accounts are a quiet row
   underneath it. */

import * as React from "react";
import { ArrowRight, MailCheck } from "lucide-react";
import { Card, Eyebrow } from "@/components/ui";
import { CertraceLogo } from "@/components/logo";
import { SocialIcon, SOCIAL_COLORS, type SocialGlyph } from "@/components/social-icons";
import { useT } from "@/lib/i18n";
import {
  SOCIAL_FACEBOOK_URL,
  SOCIAL_INSTAGRAM_URL,
  SOCIAL_LINE_URL,
  SOCIAL_LINKEDIN_URL,
  SOCIAL_YOUTUBE_URL,
} from "@/lib/links";

const FOLLOW: { glyph: SocialGlyph; label: string; href: string }[] = [
  { glyph: "linkedin", label: "LinkedIn", href: SOCIAL_LINKEDIN_URL },
  { glyph: "facebook", label: "Facebook", href: SOCIAL_FACEBOOK_URL },
  { glyph: "instagram", label: "Instagram", href: SOCIAL_INSTAGRAM_URL },
  { glyph: "youtube", label: "YouTube", href: SOCIAL_YOUTUBE_URL },
];

export default function OnboardingDonePage() {
  const t = useT();

  return (
    <div className="min-h-dvh bg-[#f5f4f0] px-6 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex justify-center">
          <CertraceLogo className="h-5 w-auto" />
        </div>

        <Card className="ct-enter mt-8 p-6 text-center sm:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#ecfdf5] text-[#047857]">
            <MailCheck size={26} strokeWidth={1.5} />
          </span>

          <Eyebrow className="mt-5 block">{t("Setting up your account")}</Eyebrow>
          {/* Broken by hand, not by the text box. Left to wrap naturally the
              line falls after "everything we" and strands "need." alone on
              the second line — a headline that reads as a sentence cut off
              mid-clause. The two halves are held together instead: the phrase
              that has to stay whole is "everything we need." */}
          <h1 className="mt-2 font-[family-name:var(--font-plex)] text-[26px] font-light leading-[1.2] tracking-tight text-[#111] sm:text-3xl">
            <span className="block">{t("Thanks — we've got")}</span>
            <span className="block">{t("everything we need.")}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-black/50">
            {t("We're preparing your free trial now and will email you the moment it's ready. If nothing has arrived, check your spam or junk folder.")}
          </p>

          {/* Honest motion: the queue is real and measured in hours, so the bar
              sweeps rather than claiming a percentage. See .ct-sweep. */}
          <div className="mx-auto mt-6 h-[3px] w-full max-w-xs overflow-hidden rounded-full bg-black/[0.07]">
            <span className="ct-sweep block h-full w-1/3 rounded-full bg-[#111]/60" />
          </div>
        </Card>

        {/* LINE first, and wide — the support channel, not a social profile. */}
        <a
          href={SOCIAL_LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ct-enter mt-4 flex items-center gap-4 rounded-2xl border border-[#06C755]/25 bg-white p-5 transition-colors hover:border-[#06C755]/60 hover:bg-[#06C755]/[0.04]"
        >
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl" style={{ background: SOCIAL_COLORS.line }}>
            <SocialIcon glyph="line" size={26} color="#fff" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-[14px] text-black/85">{t("Add Certrace on LINE OFFICIAL")}</span>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-black/50">
              {t("Get news and offers, and ask our CBAM specialists anything — this is the fastest way to reach us.")}
            </span>
          </span>
          <ArrowRight size={16} strokeWidth={1.5} className="flex-none text-black/30" />
        </a>

        <div className="mt-6">
          <p className="text-center text-[11px] uppercase tracking-[0.12em] text-black/35">{t("Follow Certrace")}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FOLLOW.map((s) => (
              <a
                key={s.glyph}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-4 text-[12px] text-black/60 transition-colors hover:border-black/25 hover:text-black"
              >
                <SocialIcon glyph={s.glyph} size={20} className="text-[#111]" />
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
