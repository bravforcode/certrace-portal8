import type { Lang } from "./i18n";

/* ════════════════════════════════════════════════════════════
   COOKIE CONSENT — the choice, where it is kept, and its copy

   Privacy Policy §14 promises two things this module is what delivers:
   non-essential cookies are opt-in, and the choice can be changed later
   "through the cookie settings on our website". So:

     - nothing non-essential is on until a visitor says yes, and
     - the footer's "Cookie settings" reopens the same panel at any time
       (see `openCookieSettings`).

   The site sets no analytics or marketing cookies today. The categories exist
   so that the first tag added reads `hasConsent("analytics")` before it loads,
   rather than the banner being retrofitted after the fact.

   The record is versioned. Bump CONSENT_VERSION when the categories or their
   meaning change, and every stored choice is treated as absent — consent to
   something the visitor was never shown is not consent.
   ════════════════════════════════════════════════════════════ */

export type ConsentCategory = "analytics" | "marketing";

export type ConsentRecord = {
  version: number;
  /** ISO timestamp of when the visitor made this choice */
  decidedAt: string;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "certrace-cookie-consent";
const CONSENT_VERSION = 1;

/** Fired on window after a choice is saved; `detail` is the new record. */
export const CONSENT_CHANGED_EVENT = "certrace:consent-changed";
/** Fired on window to reopen the banner on its settings view. */
export const OPEN_SETTINGS_EVENT = "certrace:open-cookie-settings";

/* Storage can throw (private mode, blocked site data). A visitor whose choice
   can't be read is treated as not having chosen — the safe default. */
export function readConsent(): ConsentRecord | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (parsed.version !== CONSENT_VERSION) return null;
    return {
      version: CONSENT_VERSION,
      decidedAt: String(parsed.decidedAt ?? ""),
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    return null;
  }
}

export function saveConsent(
  choice: Pick<ConsentRecord, "analytics" | "marketing">,
): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    analytics: choice.analytics,
    marketing: choice.marketing,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* Not persisted — the banner will ask again next visit, which is the
       correct failure mode. The choice still applies to this page view. */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: record }));
  return record;
}

/** The gate every non-essential script should pass through before loading. */
export function hasConsent(category: ConsentCategory): boolean {
  return readConsent()?.[category] === true;
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

/* ── Copy ─────────────────────────────────────────────────────
   Kept beside the logic rather than in the page dictionaries: it is one small
   component's copy, and a Record<Lang, …> makes a missing language a build
   error just the same. */

export type CookieCopy = {
  title: string;
  body: string;
  policyLink: string;
  acceptAll: string;
  essentialOnly: string;
  customise: string;
  save: string;
  settingsTitle: string;
  alwaysOn: string;
  footerLink: string;
  categories: Record<"essential" | ConsentCategory, { name: string; desc: string }>;
};

export const COOKIE_COPY: Record<Lang, CookieCopy> = {
  en: {
    title: "We use cookies",
    body: "Essential cookies keep this site working and remember your language. With your permission, we'd also like to use analytics and marketing cookies to understand how the site is used. We never use cookies for ad profiling.",
    policyLink: "Cookie Policy",
    acceptAll: "Accept all",
    essentialOnly: "Essential only",
    customise: "Customise",
    save: "Save choices",
    settingsTitle: "Cookie settings",
    alwaysOn: "Always on",
    footerLink: "Cookie Settings",
    categories: {
      essential: {
        name: "Essential",
        desc: "Needed for the site to work — security, your language, and this choice.",
      },
      analytics: {
        name: "Analytics",
        desc: "Anonymous usage statistics that help us improve the site.",
      },
      marketing: {
        name: "Marketing",
        desc: "Measures how our campaigns perform. Never shared with ad networks.",
      },
    },
  },
  th: {
    title: "เว็บไซต์นี้ใช้คุกกี้",
    body: "คุกกี้ที่จำเป็นช่วยให้เว็บไซต์ทำงานได้และจดจำภาษาที่คุณเลือก หากคุณอนุญาต เราจะใช้คุกกี้เพื่อการวิเคราะห์และการตลาดเพื่อทำความเข้าใจการใช้งานเว็บไซต์ด้วย เราไม่ใช้คุกกี้เพื่อสร้างโปรไฟล์โฆษณา",
    policyLink: "นโยบายคุกกี้",
    acceptAll: "ยอมรับทั้งหมด",
    essentialOnly: "เฉพาะที่จำเป็น",
    customise: "ปรับแต่ง",
    save: "บันทึกการตั้งค่า",
    settingsTitle: "ตั้งค่าคุกกี้",
    alwaysOn: "เปิดตลอด",
    footerLink: "ตั้งค่าคุกกี้",
    categories: {
      essential: {
        name: "คุกกี้ที่จำเป็น",
        desc: "จำเป็นต่อการทำงานของเว็บไซต์ — ความปลอดภัย ภาษาที่เลือก และการตั้งค่านี้",
      },
      analytics: {
        name: "คุกกี้เพื่อการวิเคราะห์",
        desc: "สถิติการใช้งานแบบไม่ระบุตัวตน เพื่อช่วยให้เราปรับปรุงเว็บไซต์",
      },
      marketing: {
        name: "คุกกี้เพื่อการตลาด",
        desc: "วัดผลแคมเปญของเรา ไม่แบ่งปันให้เครือข่ายโฆษณา",
      },
    },
  },
  vi: {
    title: "Chúng tôi sử dụng cookie",
    body: "Cookie thiết yếu giúp trang web hoạt động và ghi nhớ ngôn ngữ của bạn. Nếu bạn cho phép, chúng tôi cũng dùng cookie phân tích và tiếp thị để hiểu cách trang web được sử dụng. Chúng tôi không bao giờ dùng cookie để lập hồ sơ quảng cáo.",
    policyLink: "Chính sách cookie",
    acceptAll: "Chấp nhận tất cả",
    essentialOnly: "Chỉ thiết yếu",
    customise: "Tùy chỉnh",
    save: "Lưu lựa chọn",
    settingsTitle: "Cài đặt cookie",
    alwaysOn: "Luôn bật",
    footerLink: "Cài đặt cookie",
    categories: {
      essential: {
        name: "Thiết yếu",
        desc: "Cần thiết để trang web hoạt động — bảo mật, ngôn ngữ và lựa chọn này.",
      },
      analytics: {
        name: "Phân tích",
        desc: "Thống kê sử dụng ẩn danh giúp chúng tôi cải thiện trang web.",
      },
      marketing: {
        name: "Tiếp thị",
        desc: "Đo lường hiệu quả chiến dịch. Không chia sẻ với mạng quảng cáo.",
      },
    },
  },
  tr: {
    title: "Çerez kullanıyoruz",
    body: "Zorunlu çerezler bu sitenin çalışmasını sağlar ve dil tercihinizi hatırlar. İzin verirseniz, sitenin nasıl kullanıldığını anlamak için analitik ve pazarlama çerezleri de kullanırız. Çerezleri asla reklam profili oluşturmak için kullanmayız.",
    policyLink: "Çerez politikası",
    acceptAll: "Tümünü kabul et",
    essentialOnly: "Yalnızca zorunlu",
    customise: "Özelleştir",
    save: "Seçimleri kaydet",
    settingsTitle: "Çerez ayarları",
    alwaysOn: "Her zaman açık",
    footerLink: "Çerez ayarları",
    categories: {
      essential: {
        name: "Zorunlu",
        desc: "Sitenin çalışması için gerekli — güvenlik, dil tercihiniz ve bu seçim.",
      },
      analytics: {
        name: "Analitik",
        desc: "Siteyi geliştirmemize yardımcı olan anonim kullanım istatistikleri.",
      },
      marketing: {
        name: "Pazarlama",
        desc: "Kampanyalarımızın performansını ölçer. Reklam ağlarıyla asla paylaşılmaz.",
      },
    },
  },
  hi: {
    title: "हम कुकीज़ का उपयोग करते हैं",
    body: "आवश्यक कुकीज़ इस साइट को चालू रखती हैं और आपकी भाषा याद रखती हैं। आपकी अनुमति से, हम साइट के उपयोग को समझने के लिए एनालिटिक्स और मार्केटिंग कुकीज़ का भी उपयोग करना चाहेंगे। हम विज्ञापन प्रोफ़ाइल बनाने के लिए कभी कुकीज़ का उपयोग नहीं करते।",
    policyLink: "कुकी नीति",
    acceptAll: "सभी स्वीकार करें",
    essentialOnly: "केवल आवश्यक",
    customise: "अनुकूलित करें",
    save: "विकल्प सहेजें",
    settingsTitle: "कुकी सेटिंग्स",
    alwaysOn: "हमेशा चालू",
    footerLink: "कुकी सेटिंग्स",
    categories: {
      essential: {
        name: "आवश्यक",
        desc: "साइट के काम करने के लिए ज़रूरी — सुरक्षा, आपकी भाषा और यह विकल्प।",
      },
      analytics: {
        name: "एनालिटिक्स",
        desc: "गुमनाम उपयोग आँकड़े जो हमें साइट बेहतर बनाने में मदद करते हैं।",
      },
      marketing: {
        name: "मार्केटिंग",
        desc: "हमारे अभियानों के प्रदर्शन को मापता है। विज्ञापन नेटवर्क के साथ कभी साझा नहीं किया जाता।",
      },
    },
  },
};
