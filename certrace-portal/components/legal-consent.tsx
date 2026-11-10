"use client";

import * as React from "react";
import type { LegalDocuments } from "@/lib/api/legal";

type DocumentKind = "terms" | "privacy";

export function DocumentConsent({
  document,
  readOnly = false,
  kind,
  title,
  checked,
  onChange,
}: {
  document: LegalDocuments[number];
  readOnly?: boolean;
  kind: DocumentKind;
  title: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const [read, setRead] = React.useState(checked);
  const [documentLang, setDocumentLang] = React.useState<"en" | "th">("en");
  const isThai = documentLang === "th";
  const thaiTitle =
    kind === "terms" ? "ข้อกำหนดการใช้บริการ" : "นโยบายความเป็นส่วนตัว";
  const displayTitle = isThai ? thaiTitle : title;
  const sections = document.content[documentLang];
  const url = `/legal/${kind}`;
  const scrollId = `${kind}-document`;

  const checkScroll = (element: HTMLDivElement) => {
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 4)
      setRead(true);
  };

  return (
    <section
      lang={isThai ? "th" : "en"}
      className={`rounded-xl border border-black/10 bg-white p-3 ${isThai ? "font-[family-name:var(--font-plex-thai)]" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-[#111]">{displayTitle}</h3>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[11px] text-black/55 underline underline-offset-2 hover:text-black"
        >
          {isThai ? "เปิดฉบับเผยแพร่" : "Open published version"}
        </a>
      </div>
      <div
        className="mb-2 inline-flex rounded-full border border-black/10 p-0.5"
        role="group"
        aria-label={`${title} language`}
      >
        {(["en", "th"] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            aria-pressed={documentLang === lang}
            onClick={() => {
              setDocumentLang(lang);
              if (!checked) setRead(false);
            }}
            className={`rounded-full px-2.5 py-1 text-[11px] ${documentLang === lang ? "bg-[#111] text-white" : "text-black/55 hover:text-black"}`}
          >
            {lang === "en" ? "EN" : "ไทย"}
          </button>
        ))}
      </div>
      <p className="mb-2 text-[10px] text-black/40">
        {isThai ? "เวอร์ชัน" : "Version"} {document.version} ·{" "}
        {isThai ? "เผยแพร่" : "Published"}{" "}
        {new Date(document.publishedAt).toISOString().slice(0, 10)}
      </p>
      <div
        key={documentLang}
        id={scrollId}
        role="region"
        aria-label={isThai ? `เอกสาร${thaiTitle}` : `${title} document`}
        tabIndex={0}
        onScroll={(event) => checkScroll(event.currentTarget)}
        className={`${readOnly ? "" : "h-44 overflow-y-auto"} overscroll-contain rounded-lg border border-black/10 bg-[#f5f4f0] px-3 py-2 text-sm leading-relaxed text-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30`}
      >
        {sections.map((section, index) => (
          <section key={index} className="mb-5 space-y-2">
            {section.map((item, itemIndex) =>
              item.kind === "h2" || item.kind === "h3" ? (
                <h4 key={itemIndex} className="font-semibold text-black/85">
                  {item.text}
                </h4>
              ) : (
                <p key={itemIndex} className={item.kind === "li" ? "pl-3" : ""}>
                  {item.kind === "li" ? "• " : ""}
                  {item.text}
                </p>
              ),
            )}
          </section>
        ))}
      </div>
      {!readOnly && (
        <>
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-black/70">
            <input
              type="checkbox"
              checked={checked}
              disabled={!read}
              onChange={(event) => onChange(event.target.checked)}
              aria-describedby={`${kind}-read-hint`}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#111] disabled:cursor-not-allowed"
            />
            <span>
              {isThai
                ? `ฉันได้อ่านและยอมรับ${thaiTitle}`
                : `I have read and agree to the ${title}.`}
            </span>
          </label>
          <p
            id={`${kind}-read-hint`}
            className="mt-1 pl-6 text-[11px] text-black/45"
          >
            {read
              ? isThai
                ? "พร้อมให้ความยินยอม"
                : "Ready to accept."
              : isThai
                ? "เลื่อนอ่านเอกสารจนจบเพื่อให้ความยินยอม"
                : "Scroll to the end of the document to accept."}
          </p>
        </>
      )}
    </section>
  );
}

export function LegalConsent({
  documents,
  termsAccepted,
  onTermsChange,
  privacyAccepted,
  onPrivacyChange,
  marketingOptIn,
  onMarketingChange,
}: {
  documents: LegalDocuments;
  termsAccepted: boolean;
  onTermsChange: (checked: boolean) => void;
  privacyAccepted: boolean;
  onPrivacyChange: (checked: boolean) => void;
  marketingOptIn?: boolean;
  onMarketingChange?: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <DocumentConsent
        key={documents.find((d) => d.kind === "terms")!.id}
        document={documents.find((d) => d.kind === "terms")!}
        kind="terms"
        title="Terms of Service"
        checked={termsAccepted}
        onChange={onTermsChange}
      />
      <DocumentConsent
        key={documents.find((d) => d.kind === "privacy")!.id}
        document={documents.find((d) => d.kind === "privacy")!}
        kind="privacy"
        title="Privacy Policy"
        checked={privacyAccepted}
        onChange={onPrivacyChange}
      />
      {onMarketingChange && (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-black/10 bg-white p-3 text-xs leading-relaxed text-black/70">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(event) => onMarketingChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#111]"
          />
          <span>
            Yes, send me insider perks, expert tips, and early updates to get
            the most out of my experience.
            <span className="mt-1 block text-[11px] text-black/45">
              Optional
            </span>
          </span>
        </label>
      )}
    </div>
  );
}
