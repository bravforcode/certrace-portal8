"use client";

/* Interface language — real, working switcher (not a fake dropdown).
   Two languages ship today; the list is data, so adding a third is one entry,
   same pattern as JURISDICTIONS in config.ts. Coverage: the chrome that's on
   every screen (nav, topbar, account menu) plus the auth flow. Deeper page
   copy stays English in this MVP pass — translating it is content work, not
   plumbing, and the mechanism here is what proves the plumbing works. */

import * as React from "react";

export type LangCode = "en" | "th";
export const LANGUAGES: { code: LangCode; label: string; nativeLabel: string; glyph: string }[] = [
  { code: "en", label: "English", nativeLabel: "English", glyph: "EN" },
  { code: "th", label: "Thai", nativeLabel: "ไทย", glyph: "TH" },
];

const dict = {
  nav_dashboard: { en: "Dashboard", th: "แดชบอร์ด" },
  nav_declarations: { en: "Declarations", th: "รายการยื่นข้อมูล" },
  nav_suppliers: { en: "Suppliers", th: "ซัพพลายเออร์" },
  nav_reports: { en: "Reports", th: "รายงาน" },
  nav_team: { en: "Team & seats", th: "ทีมงานและสิทธิ์ใช้งาน" },
  nav_billing: { en: "Plan & billing", th: "แพ็กเกจและการเรียกเก็บเงิน" },
  nav_settings: { en: "Settings", th: "การตั้งค่า" },
  topbar_notifications: { en: "Notifications", th: "การแจ้งเตือน" },
  topbar_no_new: { en: "You're all caught up.", th: "คุณอ่านครบทุกรายการแล้ว" },
  account_profile: { en: "Profile & account", th: "โปรไฟล์และบัญชี" },
  account_notifications: { en: "Notification settings", th: "ตั้งค่าการแจ้งเตือน" },
  account_billing: { en: "Plan & billing", th: "แพ็กเกจและการเรียกเก็บเงิน" },
  account_signout: { en: "Sign out", th: "ออกจากระบบ" },
  language_label: { en: "Language", th: "ภาษา" },
  seats_used: { en: "seats used", th: "สิทธิ์ที่ใช้ไป" },
} as const;

type Key = keyof typeof dict;

const LangContext = React.createContext<{ lang: LangCode; setLang: (l: LangCode) => void; t: (k: Key) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict[k].en,
});

const STORAGE_KEY = "certrace:lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<LangCode>("en");

  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "th") setLangState(saved);
  }, []);

  const setLang = React.useCallback((l: LangCode) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = React.useCallback((k: Key) => dict[k][lang], [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLanguage() {
  return React.useContext(LangContext);
}
