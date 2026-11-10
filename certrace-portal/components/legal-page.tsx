"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLegalDocuments } from "@/lib/api/legal";
import { CertraceLogo } from "./logo";
import { Eyebrow } from "./ui";

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const { documents, error, reload } = useLegalDocuments();
  const [language, setLanguage] = React.useState<"en" | "th">("en");
  const document = documents?.find((d) => d.kind === kind);
  const title =
    language === "th"
      ? kind === "terms"
        ? "ข้อกำหนดการใช้บริการ"
        : "นโยบายความเป็นส่วนตัว"
      : kind === "terms"
        ? "Terms & Conditions"
        : "Privacy Policy";
  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <header className="border-b border-black/[0.06] px-6 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <CertraceLogo className="h-5 w-auto" />
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black"
          >
            <ArrowLeft size={13} strokeWidth={1.5} /> Back
          </Link>
        </div>
      </header>
      <main
        lang={language}
        className={`mx-auto max-w-2xl px-6 py-14 ${language === "th" ? "font-[family-name:var(--font-plex-thai)]" : ""}`}
      >
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-3 font-[family-name:var(--font-plex)] text-4xl font-light tracking-tight text-[#111]">
          {title}
        </h1>
        {error && (
          <p role="alert" className="mt-3 text-sm text-[#dc2626]">
            {error}{" "}
            <button className="underline" onClick={() => void reload()}>
              Retry
            </button>
          </p>
        )}
        {!document && !error && (
          <p role="status" className="mt-3 text-sm text-black/40">
            Loading legal document…
          </p>
        )}
        {document && (
          <>
            <p className="mt-3 text-sm text-black/40">
              {language === "th" ? "เผยแพร่" : "Last updated"}{" "}
              {new Date(document.publishedAt).toISOString().slice(0, 10)} ·{" "}
              {language === "th" ? "เวอร์ชัน" : "Version"} {document.version}
            </p>
            <div
              className="mt-3 inline-flex rounded-full border border-black/10 p-0.5"
              role="group"
              aria-label={`${kind === "terms" ? "Terms of Service" : "Privacy Policy"} language`}
            >
              {(["en", "th"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  aria-pressed={language === lang}
                  onClick={() => setLanguage(lang)}
                  className={`rounded-full px-2.5 py-1 text-[11px] ${language === lang ? "bg-[#111] text-white" : "text-black/55 hover:text-black"}`}
                >
                  {lang === "en" ? "EN" : "ไทย"}
                </button>
              ))}
            </div>
            <div
              className="mt-10 space-y-8"
              role="region"
              aria-label={
                language === "th"
                  ? `เอกสาร${title}`
                  : `${kind === "terms" ? "Terms of Service" : "Privacy Policy"} document`
              }
            >
              {document.content[language].map((section, index) => (
                <section key={index}>
                  {section.map((item, itemIndex) =>
                    item.kind === "h2" || item.kind === "h3" ? (
                      <h2 key={itemIndex} className="text-base text-black/85">
                        {item.text}
                      </h2>
                    ) : (
                      <p
                        key={itemIndex}
                        className={`mt-2 text-sm leading-relaxed text-black/50 ${item.kind === "li" ? "pl-3" : ""}`}
                      >
                        {item.kind === "li" ? "• " : ""}
                        {item.text}
                      </p>
                    ),
                  )}
                </section>
              ))}
            </div>
          </>
        )}
        <p className="mt-12 text-xs text-black/30">
          {kind === "terms" ? "Questions? See our " : "See also our "}
          <Link
            href={kind === "terms" ? "/legal/privacy" : "/legal/terms"}
            className="underline-offset-2 hover:text-black hover:underline"
          >
            {kind === "terms" ? "Privacy Policy" : "Terms & Conditions"}
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
