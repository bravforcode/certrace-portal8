"use client";

/* ── The end of the sign-up flow ────────────────────────────────
   Terminal on purpose: there is no button into the dashboard. The copy says
   we will write when access is ready, so a
   door into the product here would contradict it — and the account cannot do
   anything useful until that provisioning lands.

   NO LANGUAGE SWITCHER, deliberately. The questionnaire carries one;
   this page reads in whatever language the flow was finished in.

   The real action is LINE. It is where the CBAM specialists answer, where the
   release and offer notices go, and where a Thai exporter will actually reply
   — so it is one wide card, and the other four accounts are a quiet row
   underneath it. */

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, MailCheck } from "lucide-react";
import { Button, Card, Eyebrow } from "@/components/ui";
import { CertraceLogo } from "@/components/logo";
import { restoreSession } from "@/lib/api/auth";
import { isSignedIn } from "@/lib/api/session";
import { signInDestination } from "@/lib/auth-flow";
import {
  SocialIcon,
  SOCIAL_COLORS,
  type SocialGlyph,
} from "@/components/social-icons";
import { useT } from "@/lib/i18n";
import {
  onboardingQuestionsComplete,
  useProfile,
  useSessionUser,
} from "@/lib/profile";
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
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const { profile, loaded } = useProfile();
  const user = useSessionUser();
  const complete = loaded && onboardingQuestionsComplete(profile);
  const [checking, setChecking] = React.useState(false);
  const [checkError, setCheckError] = React.useState("");

  const checkStatus = async () => {
    setChecking(true);
    setCheckError("");
    try {
      const session = await restoreSession();
      if (session.user.ready) router.replace(signInDestination(session.user));
    } catch {
      if (!isSignedIn()) router.replace("/login");
      else setCheckError("Could not check your account. Please try again.");
    } finally {
      setChecking(false);
    }
  };

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

          <Eyebrow className="mt-5 block">
            {t(complete ? "Setting up your account" : "Registration received")}
          </Eyebrow>
          <h1 className="mt-2 font-[family-name:var(--font-plex)] text-[26px] font-light leading-[1.2] tracking-tight text-[#111] sm:text-3xl">
            {complete ? (
              <>
                <span className="block">{t("Thanks — we've got")}</span>
                <span className="block">{t("everything we need.")}</span>
              </>
            ) : (
              t("Thanks for registering.")
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-black/50">
            {t(
              complete
                ? "We're preparing your free trial now and will email you the moment it's ready. If nothing has arrived, check your spam or junk folder."
                : "Your account is registered. We'll email you when the dashboard is ready. You can sign in anytime to see this page.",
            )}
          </p>
          {complete && (
            <div className="mx-auto mt-6 h-[3px] w-full max-w-xs overflow-hidden rounded-full bg-black/[0.07]">
              <span className="ct-sweep block h-full w-1/3 rounded-full bg-[#111]/60" />
            </div>
          )}
          {pathname === "/onboarding/done" &&
            loaded &&
            user &&
            !user.onboarded &&
            !complete && (
              <Link
                href="/onboarding"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#111] px-5 py-3 text-sm text-white hover:bg-black/80"
              >
                {t("Finish your questions")}
                <ArrowRight size={15} strokeWidth={1.5} />
              </Link>
            )}
          {loaded && user && !user.ready && (
            <div className="mt-6">
              <Button onClick={() => void checkStatus()} disabled={checking}>
                {checking ? "Checking…" : "Check status"}
              </Button>
              {checkError && (
                <p role="alert" className="mt-3 text-sm text-[#dc2626]">
                  {checkError}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* LINE first, and wide — the support channel, not a social profile. */}
        <a
          href={SOCIAL_LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-4 rounded-2xl border border-[#06C755]/25 bg-white p-5 transition-colors hover:border-[#06C755]/60 hover:bg-[#06C755]/[0.04]"
        >
          <span
            className="grid h-11 w-11 flex-none place-items-center rounded-xl"
            style={{ background: SOCIAL_COLORS.line }}
          >
            <SocialIcon glyph="line" size={26} color="#fff" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-[14px] text-black/85">
              {t("Add Certrace on LINE OFFICIAL")}
            </span>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-black/50">
              {t(
                "Get news and offers, and ask our CBAM specialists anything — this is the fastest way to reach us.",
              )}
            </span>
          </span>
          <ArrowRight
            size={16}
            strokeWidth={1.5}
            className="flex-none text-black/30"
          />
        </a>

        <div className="mt-6">
          <p className="text-center text-[11px] uppercase tracking-[0.12em] text-black/35">
            {t("Follow Certrace")}
          </p>
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
