/* ════════════════════════════════════════════════════════════
   SITE CONSTANTS — the handful of facts that are not copy

   Everything here is language-independent: URLs, handles, dates. Copy for the
   same things lives in the dictionaries, so a link can never be translated
   into a broken address.
   ════════════════════════════════════════════════════════════ */

/* ── The product ────────────────────────────────────────────
   The marketing site and the exporter portal are two deployments. LOG IN goes
   to the portal's sign-in screen; FREE TRIAL goes to its create-account screen
   — a visitor who has no account yet must not land on a password field.

   Overridable at build time so a staging site can point at a staging portal
   without a code change.

   THE DEFAULT HAS TO BE THE REAL PORTAL. It used to be app.certrace.dev, a
   domain nobody ever registered — it answers NXDOMAIN — and with no env var
   setting it anywhere in this repo, every LOG IN and every FREE TRIAL button
   on the site led to a browser error page. The portal is deployed at
   portal.certrace.co (certrace-portal/playwright.config.ts, TESTING.md), and
   /login and /register are its real routes. */
const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "") ?? "https://portal.certrace.co";

export const LOGIN_URL = `${APP_ORIGIN}/login`;
export const SIGNUP_URL = `${APP_ORIGIN}/register`;

/* ── Reach us ───────────────────────────────────────────────
   One published inbox for the whole site — see lib/content.ts. LINE is the
   channel Thai exporters actually answer on, which is why it is not filed
   with the other social accounts anywhere it appears. */
export const LINE_URL = "https://lin.ee/P76yqsw";
export const LINE_ID = "@104lkswh";

/* ── Social accounts ────────────────────────────────────────
   SIX FEED ACCOUNTS, TWO MARKETS. Facebook and Instagram each run twice: a
   global brand page, and a Thailand-market page that posts in Thai. Only the
   Thai ones carry a region tag — an untagged account is the global one, which
   is the convention the footer, the contact page and the nav all read from
   this list rather than restating.

   The tag lives in the data, not in the label, so no surface can invent its
   own way of saying "this one is the Thai channel".

   `line: true` marks the one account that is a support channel rather than a
   feed — the footer gives it a labelled button instead of an icon square.

   `icon` names the mark to draw, so the two Facebook rows can share one glyph
   without the icon table having to know about markets.

   THE ORDER IS LOAD-BEARING. The global accounts come first and the two
   Thailand ones last, so the footer's icon row reads LinkedIn · YouTube ·
   Facebook · Instagram, then the tagged pair Facebook TH · Instagram TH — the
   TH badges sit together at the end of the row rather than interrupting it
   twice. The contact page lays the same list out three across, which makes it
   two rows: LinkedIn · YouTube · Facebook, then Instagram · Facebook TH ·
   Instagram TH. Reordering this array moves both surfaces at once. */
export type Social = {
  key: string;
  label: string;
  /** the market this account serves, when it serves one market */
  region?: string;
  href: string;
  /** the handle a reader can search for, shown on the contact page */
  handle: string;
  /** which mark to draw — several accounts share one */
  icon?: string;
  line?: boolean;
};

export const SOCIALS: Social[] = [
  {
    key: "line",
    label: "LINE Official",
    region: "TH",
    href: LINE_URL,
    handle: LINE_ID,
    line: true,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/certrace-co",
    handle: "Certrace",
    icon: "linkedin",
  },
  {
    key: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@Certrace",
    handle: "Certrace",
    icon: "youtube",
  },
  {
    key: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/certrace",
    handle: "Certrace",
    icon: "facebook",
  },
  {
    key: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/certrace",
    handle: "Certrace",
    icon: "instagram",
  },
  {
    key: "facebook-th",
    label: "Facebook",
    region: "TH",
    href: "https://web.facebook.com/profile.php?id=61593480104266",
    handle: "Certrace Thailand Official",
    icon: "facebook",
  },
  {
    key: "instagram-th",
    label: "Instagram",
    region: "TH",
    href: "https://www.instagram.com/certrace_thailand/",
    handle: "Certrace_thailand",
    icon: "instagram",
  },
];

/** Everything except LINE — the icon row in the footer and the grid on the
    contact page both draw from this, so LINE can never be duplicated into the
    row it was deliberately pulled out of. */
export const FEED_SOCIALS = SOCIALS.filter((s) => !s.line);

/* ── Where this site lives ──────────────────────────────────
   THE ONE PLACE THE PUBLIC ORIGIN IS WRITTEN. robots.txt, the sitemap, every
   canonical link, the Open Graph URLs and the JSON-LD @ids all resolve from
   this constant, so the site can never tell a crawler two different stories
   about which address is the real one — which is exactly what it used to do:
   robots.ts and sitemap.ts said certrace.co while the root layout's
   `openGraph.url` said certrace.com, a domain this project does not serve.

   It is also what `metadataBase` in app/layout.tsx is set from. Without that,
   Next resolves a relative `alternates.canonical` against http://localhost:3000
   and the production HTML shipped `<link rel="canonical" href="/about-cbam">`
   — a relative canonical most crawlers do resolve, but nothing that reads Open
   Graph does the same for an image path. */
export const SITE_URL = "https://certrace.co";

/** Absolute URL for a site path — JSON-LD `@id`s and anything else that has to
    be an absolute address rather than a Next-resolved relative one. */
export const siteUrl = (path = "") => `${SITE_URL}${path}`;

/** The Open Graph card, 1200×630, shipped as a real file rather than generated
    per request: every document this site serves is rendered by a Cloudflare
    Worker, and a static asset costs that Worker nothing. */
export const OG_IMAGE = "/brand/og-cover.png";
