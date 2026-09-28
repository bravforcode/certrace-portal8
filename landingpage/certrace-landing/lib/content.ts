import { buildHi } from "./content-hi";
import { buildTr } from "./content-tr";
import { buildVi } from "./content-vi";
import type { Lang } from "./i18n";

/* Copy for the whole marketing site, in the five languages the site is
   published in: English, Thai, Vietnamese, Turkish and Hindi.

   Every dictionary is typed as `Content` (= the shape of `en`), so a missing or
   renamed key in any language is a build error rather than a silent English
   fallback on a translated page.

   Scope note: prose, labels and headings are translated. The mock product UI
   inside the module visuals and the live supplier table stays in English — it
   depicts console/table output, and Thai script at 8px monospace is unreadable.

   The English left inside a translated dictionary is deliberate and marked
   where it sits, and is the same list in all four: `marquee.rowTwo`
   (regulations and standards under their registered titles),
   `howItWorks.steps[].view` / `.lines` (mock console output), the live table's
   own rows and headers, and `footer.copyright` (the registered entity name).
   Geographic names in the booking dialog's time-zone list are English for the
   same reason — see lib/timezones.ts. */

/* One published contact address for the whole site. Every "email us" route —
   footer, nav, booking dialog, backlog, legal pages — resolves here, so there
   is exactly one inbox to keep alive. */
export const CONTACT_EMAIL = "contact@certrace.co";

/* Gmail's compose window, pre-addressed. A plain `mailto:` opens whatever
   desktop client is registered, which on most machines is nothing; this lands
   people in the webmail they actually use. */
export function composeHref(subject: string) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT_EMAIL}&su=${encodeURIComponent(
    subject,
  )}`;
}

const en = {
  common: {
    bookDemo: "BOOK A DEMO",
    getStarted: "GET STARTED",
    seeHowItWorks: "SEE HOW IT WORKS",
    requestPricing: "REQUEST PRICING",
    allSolutions: "ALL SOLUTIONS",
    joinWaitlist: "JOIN THE WAITLIST",
    live: "LIVE",
    soon: "SOON",
    /* Solution pages spell it out; the nav badge has no room and uses `soon`. */
    comingSoon: "COMING SOON",
    back: "BACK",
    close: "CLOSE",
  },

  nav: {
    login: "LOG IN",
    language: "Language",
    selectLanguage: "Select language",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    backToTop: "Certrace — back to top",
    primary: "Primary",
    mobile: "Mobile",
    platform: {
      label: "Platform",
      items: [
        {
          label: "Smart Link Supplier Invite",
          desc: "One link per supplier. No emails, no accounts, no chasing.",
        },
        {
          label: "Fill-Once Supplier Profile",
          desc: "Supplier data saves once and reuses itself on every request after.",
        },
        {
          label: "Automatic Quality Check",
          desc: "Missing fields, wrong units and impossible numbers caught on arrival.",
        },
        {
          label: "CBAM Calculation Engine",
          desc: "Raw supplier data converted into the EU's required emissions format.",
        },
        {
          label: "Carbon Benchmark Dashboard",
          desc: "Where you stand against CBAM penalty rates, in plain English.",
        },
        {
          label: "Always-Ready Report Package",
          desc: "Buyer- and auditor-ready in the EU format, current without being rebuilt.",
        },
      ],
      footer: "See all features",
    },
    solutions: {
      label: "Solutions",
      items: [
        {
          label: "For Exporters",
          desc: "Prove your carbon data before the buyer has to ask for it.",
        },
        {
          label: "For Suppliers",
          desc: "A free guided form, in your own language, from any device.",
        },
        {
          label: "For Legal & Compliance",
          desc: "Named sign-offs and a complete audit trail.",
        },
        {
          label: "For Importers",
          desc: "The EU-side declarant workspace for CBAM filings.",
        },
      ],
      footer: "Who Certrace is built for",
    },
    regulations: {
      label: "Regulations",
      items: [
        {
          label: "EU CBAM",
          desc: "Iron, steel and aluminium — 67 CN-coded goods with definitive-period rules built in.",
        },
      ],
      footer: "See what's new",
    },
    pricing: "Pricing",
    resources: {
      label: "Resources",
      items: [
        {
          label: "How It Works",
          desc: "The four steps from supplier invite to audit-ready export.",
        },
        {
          label: "FAQ",
          desc: "Who actually files, what the AI does, how the data is secured.",
        },
        {
          label: "CBAM Timeline",
          desc: "Every deadline from the transitional period to first declaration.",
        },
        {
          label: "Backlog",
          desc: "Everything we've shipped, newest first.",
        },
      ],
      footer: "Book a demo",
    },
    company: {
      label: "Company",
      items: [
        {
          label: "Contact",
          desc: "Anything we can help with — just say hello.",
        },
        {
          label: "About Certrace",
          desc: "Who we are and why we built this. Coming shortly.",
        },
        {
          /* Live, not SOON: there is no careers page to wait for — the row
             opens a pre-addressed email, which is how hiring actually runs
             here today. */
          label: "Careers",
          desc: "Tell us what you'd want to build. We read every one.",
        },
      ],
      footer: "Book a demo",
    },
  },

  hero: {
    badge: "CARBON COMPLIANCE INFRASTRUCTURE",
    headline: "Buyers don't wait.\nThey pick whoever\nproves it first.",
    intro:
      "An AI workflow platform connecting buyers, exporters, and suppliers to automate CBAM carbon data collection — from request to report-ready before buyers even ask.",
    /* Four returns, not four facts about the market: cost, effort, coverage,
       speed. Kept to four or five words each — they sit under the fold line on
       a laptop, and anything longer wraps to a third line and gets cut. */
    stats: [
      "Lower compliance cost per filing",
      "Fewer staff hours chasing suppliers",
      "CBAM goods covered today",
      "Faster from buyer request to proof",
    ],
    videoTitle: "Certrace product walkthrough",
  },

  /* One idea, stated once: the order is lost on proof, not on price. The
     three cost cards and the standalone lost-order card that used to follow
     this rail each restated it — but cutting them outright took the stakes
     out with them, and the section stopped naming what any of this costs.
     `stakes` puts both numbers back in a single strip: the deck's "real risk"
     figure on the left, the deck's "doing it manually today" line on the
     right, one card instead of four. */
  problem: {
    badge: "THE PROBLEM",
    headline: "Four steps.\nThat's all it takes\nto lose the order.",
    intro:
      "Your buyer asks for verified carbon data. You start chasing. Someone else already has it ready — so the order is never rejected. It just moves.",
    /* The pain framework, as a four-step rail: the sequence is the argument —
       nothing here is a failure of price or quality, only of proof arriving
       late. One beat each, so the copy has to stay short. */
    chain: [
      {
        step: "ASK",
        title: "The buyer asks",
        desc: "Your EU importer needs verified emissions data before the next order.",
      },
      {
        step: "DELAY",
        title: "You start chasing",
        desc: "Every supplier, one email at a time. Weeks pass, still incomplete.",
      },
      {
        step: "ALTERNATIVE",
        title: "They find someone else",
        desc: "Another exporter already has clean numbers sitting ready to send.",
      },
      {
        step: "SWITCH",
        title: "The order moves",
        desc: "Not on price. Not on quality. The proof simply arrived second.",
      },
    ],
    /* The two costs, side by side in one strip: what a single order is worth,
       and what carrying this by hand costs every year. `riskFigure` is a real
       loss, not a projection — that is why it is the larger of the two. */
    stakes: {
      riskLabel: "ARE YOU WILLING TO RISK IT?",
      riskTitle: "One order, gone.",
      riskFigure: "$670,000",
      /* Split so the cause carries the same ink weight as the two figures in
         the right-hand column — the caption is 45% black, the highlight is
         `text-[#111]`, exactly like "9–15 weeks" and "$9K–24K". */
      riskCaption: {
        before: "Not to price. Not to quality. To ",
        highlight: "missing carbon data.",
      },
      manualLabel: "DOING IT MANUALLY TODAY",
      manual: [
        { lead: "9–15 weeks", rest: "of manual work, every reporting year" },
        { lead: "$9K–24K", rest: "spent per year — and still often wrong" },
      ],
    },
  },

  /* Dates, a timer, a line. Three blocks, each a different kind of thing.
     The "three forces" cards that used to open this section restated the
     problem rail, the timeline directly below them, and the comparison
     section — three summaries of copy the visitor reads anyway. */
  whyNow: {
    badge: "WHY NOW",
    headline: "CBAM isn't coming.\nIt's already counting.",
    intro:
      "Since January 2026, every shipment carries a real cost — and you can only prove what you measured at the time.",
    milestones: [
      {
        date: "OCT 2023",
        label: "Transitional period begins",
        desc: "Reporting only. No certificates yet.",
      },
      {
        date: "JAN 2026",
        label: "Definitive period begins",
        desc: "Full obligations on every shipment.",
      },
      {
        date: "FEB 2027",
        label: "Certificate sales open",
        desc: "Importers start buying for 2026 emissions.",
      },
      {
        date: "SEP 2027",
        label: "First annual declaration due",
        desc: "Declare and surrender for 2026.",
      },
    ],
    /* The timer is decorative and rests on 00:00:00:00, so the label has to
       stay true against zeros: zero is the honest answer to "how much of last
       month can you still go back and measure". Any future wording here must
       read correctly at zero. */
    countdown: {
      eyebrow: "YOU CAN'T GO BACK",
      title: "Last month's emissions are already unmeasurable.",
      units: ["DAYS", "HRS", "MIN", "SEC"],
    },
    quote:
      "“Exporters who cannot produce a verified carbon report risk losing EU market access — permanently.”",
  },

  live: {
    badge: "LIVE PLATFORM",
    headline: "Your proof, standing by.\nBefore they ask for it.",
    intro:
      "Every supplier, every submission, every deadline — visible the moment it changes. So when the request lands, the answer already exists.",
    suppliersSubmitted: "suppliers submitted\nthis quarter",
    stats: [
      "24 / 30 suppliers approved",
      "94% data completion",
      "6 days to deadline",
    ],
  },

  platform: {
    badge: "THE PLATFORM",
    headline: "Six features.\nOne unbroken chain.",
    intro:
      "No spreadsheets to stitch together, no second tool to reconcile. Invite, reuse, check, calculate, benchmark, report — built so the proof is finished before anyone asks for it.",
    modules: [
      {
        label: "01 / SMART LINK SUPPLIER INVITE",
        title: "No emails, no chasing, no accounts needed.",
        desc: "Send one link. Your supplier fills in only what their product requires, in their own language. Nothing to install, nobody to train.",
        tags: [
          "One link per supplier",
          "No accounts",
          "Their own language",
          "Auto-reminders",
        ],
      },
      {
        label: "02 / FILL-ONCE SUPPLIER PROFILE",
        title: "Suppliers never enter the same data twice.",
        desc: "Answers save once and fill themselves in on every request after — across products, periods and buyers. The first takes an afternoon. The next takes minutes.",
        tags: [
          "Saved once",
          "Reused everywhere",
          "Works across buyers",
          "Minutes, not weeks",
        ],
      },
      {
        label: "03 / AUTOMATIC QUALITY CHECK",
        title: "Bad data gets caught before it reaches you.",
        desc: "Missing fields, wrong units, impossible numbers — flagged the moment a supplier submits. You review a clean submission with a plain-English summary, not a spreadsheet of unknowns.",
        tags: [
          "Missing fields",
          "Wrong units",
          "Impossible values",
          "Plain-English summary",
        ],
      },
      {
        label: "04 / CBAM CALCULATION ENGINE",
        title: "No manual math. No spreadsheet errors.",
        desc: "Raw supplier data becomes the EU's required emissions format automatically, under definitive-period rules — with the calculation trail attached to every figure you file.",
        tags: [
          "EU emissions format",
          "20% default cap",
          "Scope 2 rules",
          "Full calculation trail",
        ],
      },
      {
        label: "05 / CARBON BENCHMARK DASHBOARD",
        title: "See where you stand, and what it's costing you.",
        desc: "Your carbon numbers against CBAM penalty rates, in plain English: where you're exposed, which product lines are dragging, and what to fix. No expertise required.",
        tags: [
          "Against penalty rates",
          "Exposure by product",
          "Plain English",
          "No expertise needed",
        ],
      },
      {
        label: "06 / ALWAYS-READY REPORT PACKAGE",
        title: "Ready before your buyer even asks.",
        desc: "One click turns supplier data into a sealed, buyer- and auditor-ready report in the EU's format. It stays current as data changes, so you never rebuild it.",
        tags: [
          "Buyer-ready",
          "Auditor-ready",
          "Annex IV XML",
          "Stays current",
        ],
      },
    ],
  },

  /* No competitor named, and no count of them. Naming rivals on your own
     comparison table advertises them, dates the copy every time the market
     moves, and publishes which players we benchmark against. The claim is
     about whose side the software is on — that stands without a roll call. */
  comparison: {
    badge: "WHY CERTRACE",
    headline: "Carbon platforms are\nsold to your buyer.\nThis one is yours.",
    intro:
      "The tools in this space are bought by the EU importer — you are the data source they collect from. Certrace sits on your side: your suppliers, your data, your proof, ready before the request.",
    colDiy: "Internally managed",
    colConsultant: "Consultant / buyer-side tool",
    rows: [
      {
        label: "Whose side it's built for",
        diy: "Nobody's — it runs on spare hours",
        consultant: "The buyer's. You're the data source.",
        certrace: "Yours. The exporter's.",
      },
      {
        label: "Time per reporting year",
        diy: "9–15 weeks",
        consultant: "6–10 weeks",
        certrace: "Days, not weeks",
      },
      {
        label: "Cost per year",
        diy: "Hidden internal hours",
        consultant: "$9K–24K, or $50K–250K enterprise",
        certrace: "A fraction of either",
      },
      {
        label: "Supplier data",
        diy: "200+ inconsistent formats",
        consultant: "Reconciled by hand, once",
        certrace: "One guided form, filled once, reused",
      },
      {
        label: "Quality checks",
        diy: "Manual, easy to miss",
        consultant: "Caught after the fact",
        certrace: "Checked the moment it arrives",
      },
      {
        label: "When the buyer asks",
        diy: "You start chasing suppliers",
        consultant: "You commission the next report",
        certrace: "The answer already exists",
      },
      {
        label: "Knowing where you stand",
        diy: "No benchmark at all",
        consultant: "A number, with no context",
        certrace: "Benchmarked against penalty rates",
      },
    ],
  },

  howItWorks: {
    badge: "HOW IT WORKS",
    headline: "Four simple steps.\nNo learning curve.",
    steps: [
      {
        title: "Create",
        desc: "Pick your products. The wizard handles the regulation.",
        view: "declarations / new",
        lines: [
          "# CBAM · Thailand → EU · Q2 2026",
          "→ purpose: CBAM authority dataset",
          "",
          "✓ 3 goods picked from CN catalogue · 7208 39 00 …",
          "✓ scope 2: reported-only (iron & steel)",
          "✓ suppliers matched to products — 6 requests",
          "",
          "→ deadline set · Jul 31",
          "Real CN codes. Real CBAM data points.",
        ],
      },
      {
        title: "Collect",
        desc: "Suppliers fill one form — and only ever once.",
        view: "smart links / collection",
        lines: [
          "# One secure link per supplier — no accounts",
          "✓ 6 Smart Links issued · TH + EN",
          "● thai-metal-pro opened their form",
          "✓ chonburi-fab submitted via mobile",
          "",
          "✓ 4/6 prefilled from saved supplier profile",
          "→ quality check · 2 unit errors caught",
          "✓ resubmitted · v2 · in review",
        ],
      },
      {
        title: "Review",
        desc: "See what it's costing you, and where you're exposed.",
        view: "workspace / review & benchmark",
        lines: [
          "# Deterministic engine · definitive-period rules",
          "✓ default-value cap (20%) — passed",
          "✓ verification records — 6/6",
          "→ CBAM exposure estimate · €41,200",
          "",
          "→ benchmark · 1 product line above penalty rate",
          "● sign-off requested — legal · management",
          "✓ 2/2 confirmed",
        ],
      },
      {
        title: "Always ready",
        desc: "The report is finished before the buyer asks.",
        view: "workspace / report package",
        lines: [
          "# Registry pre-flight — 0 errors",
          "✓ 24-page package sealed · sha256 9f3a…c21d",
          "✓ Annex IV communication template (XML)",
          "",
          "→ package refreshed on every data change",
          "→ sent to buyer's declarant · O3CI pushed",
          "✓ acknowledgements received",
          "They never had to ask. You proved it first.",
        ],
      },
    ],
  },

  stakeholders: {
    badge: "WHO IT'S FOR",
    headline: "One chain. Every side of it.\nStarting with yours.",
    intro:
      "One dataset, shared by buyers, exporters and suppliers. The exporter and supplier sides are live today — the rest open in order.",
    audiences: [
      {
        title: "Exporters",
        desc: "Prove your carbon data before the buyer asks — collection, benchmark and an always-ready report in one workspace.",
        cta: "See the exporter solution",
      },
      {
        title: "Suppliers",
        desc: "One guided form in your own language, on any device. No account, no fee, and never the same question twice.",
        cta: "See the supplier solution",
      },
      {
        title: "Legal & Compliance",
        desc: "Nothing goes out without a named sign-off. Every decision lands in the audit trail.",
        cta: "Join waitlist",
      },
      {
        title: "Importers",
        desc: "Aggregate verified exporter data, calculate certificates, and file the annual declaration from the EU side.",
        cta: "Join waitlist",
      },
    ],
  },

  languages: {
    badge: "LANGUAGE SUPPORT",
    headline: "Built for how your supplier\nnetwork actually works.",
    intro:
      "Guided forms and reports in the language your suppliers already use — with more on the way.",
    statusLive: "LIVE",
    statusSoon: "COMING SOON",
  },

  pricing: {
    badge: "PRICING",
    headline: "Simple, transparent pricing.\nScaled to your operation.",
    intro:
      "Every plan is designed to save you more than it costs from day one. Suppliers are always free.",
    /* The standalone /pricing page has always carried the longer line. */
    introPage:
      "Every plan is designed to save you more than it costs from day one. Suppliers are always free, on every plan.",
    note: "Pricing is tailored to your supplier count and compliance requirements · Annual subscription · Suppliers and buyers always free · Cancel anytime after year one",
    questionsBadge: "QUESTIONS",
    plans: [
      {
        name: "STARTER",
        sub: "Up to 20 suppliers",
        features: [
          "Smart request builder",
          "Works across all your EU buyers",
          "Thai-language support",
          "Live dashboard + reminders",
          "Audit-ready export",
        ],
      },
      {
        name: "STANDARD",
        sub: "Up to 50 suppliers",
        features: [
          "Everything in Starter",
          "Auditor portal seat",
          "Multi-regulation templates",
          "Priority support + onboarding",
        ],
      },
      {
        name: "ENTERPRISE",
        sub: "50+ suppliers",
        features: [
          "Everything in Standard",
          "Multi-entity / multi-site support",
          "Dedicated account manager",
          "Legal-network sign-off access",
        ],
      },
    ],
  },

  faq: {
    badge: "FAQ",
    headline: "Common questions.\nStraight answers.",
    items: [
      {
        q: "Everyone else sells to the importer. Why build for the exporter?",
        a: "Because the exporter is the one who loses the order. Buyer-side platforms treat you as a data source to chase; we treat your data as the thing that wins you the next contract. Same regulation, opposite end of the table.",
      },
      {
        q: "Does Certrace file CBAM with the EU for us?",
        a: "No — no vendor can. Only your EU buyer's Authorised CBAM Declarant may file with the Registry. Certrace gives them everything they need: the Annex IV template, a sealed audit package, and your installation data pushed to O3CI.",
      },
      {
        q: "Do my suppliers need to pay or create an account?",
        a: "No. Each supplier gets one Smart Link — a guided form in Thai or English, on any device. No account, no fee. Their answers are saved to a profile, so the next request is prefilled.",
      },
      {
        q: "What does the AI actually do? Can it change our numbers?",
        a: "It reviews, it never edits. The AI flags gaps, anomalies and weak evidence, then writes a trust score and a plain-English summary so your team reviews faster. Every filed figure comes from the deterministic calculation engine, with its trail attached.",
      },
      {
        q: "What does the benchmark actually tell me?",
        a: "Where your numbers sit against CBAM penalty rates, in plain English — which product lines carry the most exposure, and what a change would be worth. It's the difference between reporting your carbon data and being able to act on it.",
      },
      {
        q: "Is the output really audit-ready?",
        a: "Yes — a ~24-page CBAM Communication & Audit Package: declaration summary, methodology, a chapter per supplier, evidence register, sign-offs and the full audit trail, sealed with a SHA-256 hash. Annex IV XML ships alongside it.",
      },
      {
        q: "Which regulations does Certrace support today?",
        a: "EU CBAM, and only EU CBAM — iron, steel and aluminium, with 67 real CN-coded goods and the definitive-period rules built in. UK CBAM, EUDR and CSRD are on the roadmap; we would rather do one regulation properly than four of them halfway.",
      },
      {
        q: "What happens when the rules change?",
        a: "We update the forms, engine rules and export templates centrally — the 2026 definitive-period rules are already encoded. You rebuild nothing.",
      },
      {
        q: "How secure is our supplier data?",
        a: "Encrypted in transit and at rest. Each Smart Link is scoped to one supplier, so suppliers never see each other's data and your team sees only what their seat allows. Every action is logged, and the final package is hash-sealed so tampering shows.",
      },
    ],
  },

  cta: {
    headline: "Be the one who\nproves it first.",
    intro:
      "See Certrace running on your own supply chain. A 30-minute demo — from supplier invite to a report your buyer can act on.",
    note: "Suppliers are always free · No setup required to start",
  },

  form: {
    firstName: "First name",
    lastName: "Last name",
    email: "Professional email",
    phone: "Phone number",
    company: "Company",
    companyPlaceholder: "Company name",
    jobTitle: "Job title",
    sector: "Sector of activity",
    employees: "Number of employees",
    dialLabel: "Country calling code",
    phonePlaceholder: "81 234 5678",
    selectJobTitle: "Select job title",
    selectSector: "Select sector of activity",
    selectEmployees: "Select number of employees",
    reassurance:
      "Next: four quick questions, then pick your slot. No obligation, and we never share your details.",
    errors: {
      required: "Required",
      emailFormat: "Enter a valid email address",
      emailPersonal: "Use your company email address",
      phoneDigits: "Enter your phone number",
      phoneLength: "Check the number of digits for this country",
    },
    confirmed: {
      badge: "DEMO CONFIRMED",
      detail: "30 minutes, online",
      inviteTo: "A calendar invite with the meeting link is on its way to",
      reschedule: "Need to move it? Reply to the invite, or email",
    },
    jobTitles: [
      "Other",
      "C-Level",
      "Finance",
      "HR/Marketing",
      "Procurement",
      "Sales",
      "Student / Researcher",
      "Sustainability Department",
    ],
    sectors: [
      "Construction & Real Estate",
      "Consulting & Service",
      "Environment & Energy",
      "Event & Tourism",
      "Finance",
      "Food & Beverage",
      "Healthcare",
      "Manufacturing",
      "Insurance",
      "Logistic & Mobility",
      "Media & Communication",
      "Public Service & Education",
      "Retail & E-Commerce",
      "Tech & IT",
    ],
  },

  booking: {
    stepLabels: ["A few questions", "Pick a time", "Confirmation"],
    stepOf: "STEP {n} OF 3",
    yourDemo: "YOUR DEMO",
    duration: "30 MIN · ONLINE",
    close: "Close",
    step1Title: "Four quick questions\nbefore we meet.",
    step1Intro: "They shape what we show you in the 30 minutes.",
    qDecision: "Is this decision yours to make?",
    qBudget: "Is there budget behind it yet?",
    qTiming: "When do you need to be filing-ready?",
    qSource: "How did you find Certrace?",
    decision: [
      "Yes, it's my call",
      "I decide with others",
      "No — I'm gathering options",
    ],
    budget: ["Approved", "Being scoped", "Not yet"],
    timing: [
      "Within a month",
      "1–3 months",
      "3–6 months",
      "6+ months",
      "Not sure yet",
    ],
    source: [
      "Word of mouth",
      "Social media",
      "Search engine",
      "Event or webinar",
      "Email",
      "Press or article",
      "Partner or consultant",
      "Other",
    ],
    sourceOtherPlaceholder: "Where did you come across us?",
    contextLabel: "Anything that would make the call more useful?",
    contextPlaceholder:
      "Your first deadline, the buyer asking for data, the tool you use today, who else should join…",
    chooseTime: "CHOOSE A TIME",
    step2Title: "Pick a time that suits you.",
    step2Intro: "30 minutes, online.",
    /* The zone is a control rather than the tail of this sentence: it starts on
       whatever the browser reports, and someone booking around a colleague's
       or a buyer's working day has to be able to change it. */
    timeZoneLabel: "TIMES SHOWN IN",
    timeZoneHint:
      "Detected from your browser. Change it if you're booking around another region's hours.",
    timeZoneRegions: {
      asiaPacific: "Asia-Pacific",
      europe: "Europe",
      middleEastAfrica: "Middle East & Africa",
      americas: "Americas",
    },
    chooseDay: "CHOOSE A DAY",
    chooseSlot: "CHOOSE A TIME",
    prevWeek: "Previous week",
    nextWeek: "Next week",
    noSlots: "Nothing left on this day. Try another — or email",
    noSlotsTail: "and we'll find a slot outside these hours.",
    confirmPrefix: "CONFIRM",
    selectToConfirm: "SELECT A TIME TO CONFIRM",
    bookedTitle: "You're booked",
    yourSlot: "YOUR SLOT",
    onlineDetail: "30 minutes, online",
    inviteTo: "A calendar invite with the meeting link is on its way to",
    reschedule: "Need to move it? Reply to the invite, or email",
    rescheduleTail: "— no forms involved.",
  },

  marquee: {
    rowOne: [
      "The Only Platform Built for the Exporter",
      "67 Real CN-Coded CBAM Goods Mapped",
      "Iron, Steel & Aluminium — Definitive-Period Ready",
      "Suppliers Fill It Once, Never Again",
      "Benchmarked Against CBAM Penalty Rates",
      "Proof Ready Before the Buyer Asks",
    ],
    /* The regulatory surface the product is built against, in the order the
       band reads best. Implementing and delegated acts carry their EU short
       form (IR / DR) so the row stays scannable at marquee speed; the two
       base regulations are spelled out. GDPR and the two carbon-accounting
       standards close the row. */
    rowTwo: [
      "IR (EU) 2025/2548",
      "IR (EU) 2025/2620",
      "Regulation (EU) 2023/956",
      "Regulation (EU) 2025/2083",
      "IR (EU) 2025/2547",
      "IR (EU) 2023/1773",
      "IR (EU) 2025/2621",
      "IR (EU) 2026/1740",
      "IR (EU) 2025/2546",
      "DR (EU) 2025/2551",
      "GDPR",
      "ISO 14064-1",
      "GHG Protocol",
    ],
    ctaRowOne: [
      "Book a Demo",
      "30-Minute Guided Walkthrough",
      "Your Own Supply Chain, Live",
      "From Supplier Invite to Audit-Ready Report",
      "Suppliers Always Free",
      "No Setup Required to Start",
    ],
    ctaRowTwo: [
      "See It Live",
      "Book Your Slot",
      "Talk to the Team",
      "Prove It First",
      "Start Today",
      "Book a Demo",
    ],
  },

  footer: {
    desc: "An AI workflow platform connecting buyers, exporters, and suppliers to automate CBAM carbon data collection — from request to report-ready before buyers even ask.",
    location: "Bangkok, Thailand",
    columns: {
      platform: "PLATFORM",
      whoItsFor: "WHO IT'S FOR",
      resources: "RESOURCES",
      company: "COMPANY",
    },
    links: {
      smartLink: "Smart Link Invite",
      profile: "Fill-Once Profile",
      aiCheck: "Automatic Quality Check",
      engine: "CBAM Calculation Engine",
      benchmark: "Carbon Benchmark",
      reports: "Always-Ready Reports",
      exporters: "Exporters",
      suppliers: "Suppliers",
      legalCompliance: "Legal & Compliance — soon",
      importers: "Importers — soon",
      howItWorks: "How It Works",
      faq: "FAQ",
      timeline: "CBAM Timeline",
      backlog: "Backlog",
      pricing: "Pricing",
      contact: "Contact",
      bookDemo: "Book a Demo",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      cookies: "Cookie Policy",
      reportIssue: "Report Issue",
    },
    copyright: "© 2026 Certrace Ord. Part. All rights reserved.",
    contactSubject: "Hello Certrace",
    issueSubject: "Report an issue",
    careersSubject: "Careers at Certrace",
  },

  backlog: {
    badge: "PRODUCT BACKLOG",
    headline: "What we've shipped.\nAnd when.",
    intro:
      "CBAM keeps moving, so the product does too. This page is the public record: every item below is in the platform today, dated by the month it went live.",
    updated: "Last updated 30 July 2026",
    shippedBadge: "RECENTLY SHIPPED",
    shippedHeadline: "In the platform today.",
    shippedIntro:
      "Newest first. Every item here is running in production and covered by the demo — ask to see any of it.",
    buildingBadge: "IN PROGRESS",
    buildingHeadline: "Being built right now.",
    nextBadge: "ON THE LIST",
    nextHeadline: "Planned, not scheduled.",
    nextIntro:
      "Committed to the direction, not yet to a date. Customer demand decides the order.",
    chipBuilding: "BUILDING",
    chipNext: "PLANNED",
    ctaHeadline: "Something missing from this list?",
    ctaIntro:
      "What we build next is decided by exporters who tell us what their next filing actually needs. Tell us yours.",
    ctaButton: "REQUEST A FEATURE",
    ctaSubject: "Backlog request",
    shipped: [
      {
        month: "JUL 2026",
        title: "Definitive-period compliance engine",
        desc: "Every rule that changed in January 2026, computed rather than interpreted: the 20% default-value cap, Annex II Scope 2 handling, structured precursor inputs, € exposure per shipment, and a registry pre-flight before anything is dispatched.",
        tag: "COMPLIANCE ENGINE",
      },
      {
        month: "JUL 2026",
        title: "Supplier portal — seats, e-sign, and quality feedback",
        desc: "Suppliers can invite colleagues by department, sign off their own submission, and see the AI quality check before they send. Still no account, still free, still Thai or English.",
        tag: "DATA COLLECTION",
      },
      {
        month: "JUN 2026",
        title: "Real CBAM goods catalogue — 67 CN codes",
        desc: "Iron, steel and aluminium goods mapped to their actual CN codes, so a declaration is built from your real products instead of a free-text guess.",
        tag: "COMPLIANCE ENGINE",
      },
      {
        month: "JUN 2026",
        title: "Sealed audit package and Annex IV export",
        desc: "A 24-page report with a SHA-256 seal, the Annex IV XML your buyer's declarant needs, and a direct O3CI dispatch — one export, three destinations.",
        tag: "REPORTS & HANDOFF",
      },
      {
        month: "MAY 2026",
        title: "Buyer data requests",
        desc: "Scope 3 and CSRD questionnaires from EU buyers answered from the same supplier data you already collected for CBAM, instead of a second round of emails.",
        tag: "DATA COLLECTION",
      },
      {
        month: "MAY 2026",
        title: "Smart Link collection, bilingual",
        desc: "One secure link per supplier, no login and no training, with the whole guided form available in Thai and English.",
        tag: "DATA COLLECTION",
      },
    ],
    building: [
      {
        title: "Importer & declarant workspace",
        desc: "The EU side of the same data: aggregate your exporters' verified emissions, calculate certificates, and prepare the annual CBAM declaration. In internal testing now.",
        when: "TARGET Q4 2026",
      },
      {
        title: "UK CBAM coverage",
        desc: "The UK scheme starts January 2027 with its own rules and goods list. We're building coverage against the published guidance as it firms up.",
        when: "TARGET Q1 2027",
      },
      {
        title: "Verifier handoff",
        desc: "A read-only workspace for third-party verifiers, so a verification pass doesn't turn into a folder of emailed PDFs.",
        when: "TARGET Q4 2026",
      },
      {
        title: "ERP & spreadsheet import",
        desc: "Bulk product and shipment import that maps your own columns once and remembers them, ahead of a full API.",
        when: "TARGET Q4 2026",
      },
    ],
    next: [
      {
        title: "EUDR — deforestation",
        desc: "Geolocation and due-diligence data collected through the same supplier links.",
      },
      {
        title: "CSRD reporting module",
        desc: "Full sustainability reporting, not just the buyer questionnaires we answer today.",
      },
      {
        title: "More supplier languages",
        desc: "Vietnamese, Turkish and Hindi — the next three exporter markets after Thailand.",
      },
      {
        title: "Public API",
        desc: "Programmatic access to declarations, submissions and exports for teams with their own systems.",
      },
    ],
  },

  solutionPage: {
    /* Suppliers is the only persona page with a feature grid now, so this is
       the only label it needs. The "WHAT'S COMING" variant went with the legal
       and importer grids. */
    whatYouGet: "WHAT YOU GET",
    closingHeadline: "See it on your own supply chain.",
    closingIntro:
      "A 30-minute walkthrough — from supplier invite to a report your buyer can act on. Suppliers are always free.",
    closingHeadlineSoon: "Want this the day it opens?",
    closingIntroSoon:
      "Join the waitlist and we'll get in touch before it goes live. In the meantime, the exporter side is running today.",
    /* Frontend-only capture on the two portals that aren't open yet. Wording
       must never imply a stored record or a scheduled date — "we'll email you"
       is the whole promise. */
    waitlist: {
      badge: "EARLY ACCESS",
      headline: "Not open yet.\nGet in line for it.",
      intro:
        "Leave your details and we'll reach out before this side of the platform opens — no newsletter, no drip campaign.",
      /* Field labels come from `form.*`, which the demo form already owns —
         they are the same six questions, so they must not drift apart. */
      submit: "JOIN THE WAITLIST",
      note: "One email when it opens. Nothing else, and never shared.",
      confirmedBadge: "YOU'RE ON THE LIST",
      confirmedTitle: "You're on the list.",
      confirmedBody: "We'll write to",
      confirmedTail:
        "before this opens. If you'd rather see the exporter side running today, book a demo instead.",
      /* Same five rules the demo form enforces — the waitlist now asks for the
         same details, so a mismatch in wording between the two would read as
         two different products. */
      errors: {
        required: "Required",
        emailFormat: "Enter a valid email address",
        emailPersonal: "Use your company email address",
        phoneDigits: "Enter your phone number",
        phoneLength: "Check the number of digits for this country",
      },
    },
    exporters: {
      eyebrow: "FOR EXPORTERS",
      headline: "Prove it first.\nBefore they have to ask.",
      intro:
        "Every competitor in this space sells to your buyer. Certrace is built on your side: collect supplier data once, calculate it into the EU's format, see what it's costing you, and keep a buyer-ready report standing by — so the answer exists before the request does.",
    },
    suppliers: {
      eyebrow: "FOR SUPPLIERS",
      headline: "Fill it once.\nNever fill it again.",
      intro:
        "Receive a Smart Link, fill one guided form in your own language from any device, and get feedback before you submit. Your answers save to a profile and prefill every request after — including requests from a different buyer.",
      /* The supplier is the one person in this chain who never chose to be
         here: their customer sent them a form. So this grid has to answer
         "what does this cost me, and how long will it take" before it sells
         anything — hence the three short guarantees under each card, and
         hence "free, always" being a card of its own rather than fine print. */
      benefitsHeadline: "What you actually have to do.",
      benefitsIntro:
        "One form, once. Everything below is what happens around it so you never fill the same box twice.",
      benefits: [
        {
          title: "One link, any device",
          desc: "Your customer sends a link. Open it on the phone in your pocket and fill it in when you have a moment — there is nothing to download and no account to create.",
          points: [
            "No login, no password",
            "Works on mobile",
            "Stop and come back later",
          ],
        },
        {
          title: "Written in your language",
          desc: "Thai and English today, with more following the markets we open. Every question is asked in plain words, with a note explaining what it means and where to find the answer.",
          points: [
            "Thai and English now",
            "Plain words, not regulation",
            "A hint on every question",
          ],
        },
        {
          title: "Filled once, reused after",
          desc: "What you enter saves to your own profile and fills itself in on the next request — the next reporting period, and every other customer who asks you the same thing.",
          points: [
            "Carries across periods",
            "Carries across customers",
            "Minutes instead of an afternoon",
          ],
        },
        {
          title: "Checked before you send",
          desc: "Missing evidence, the wrong unit, a figure that doesn't line up with the others — caught while you are still filling the form, and explained rather than just flagged.",
          points: [
            "Caught as you type",
            "Told what to fix",
            "No email back-and-forth",
          ],
        },
        {
          title: "Only what changed reopens",
          desc: "If your customer asks for a revision, everything you already got right stays locked. You see exactly which boxes are open and you touch nothing else.",
          points: [
            "The rest stays submitted",
            "One place to see the ask",
            "Never start over",
          ],
        },
        {
          title: "Free, and only theirs to see",
          desc: "Suppliers never pay for Certrace, on any plan. What you submit is visible to the customer who asked for it — and stays yours to reuse with anyone else.",
          points: [
            "No cost, ever",
            "Visible to the requester only",
            "Yours to reuse",
          ],
        },
      ],
    },
    legal: {
      eyebrow: "FOR LEGAL & COMPLIANCE",
      headline: "Named sign-offs.\nA complete audit trail.",
      intro:
        "The dedicated legal and compliance workspace is being built. When it opens, reports will go out only after named sign-offs — with legal review auto-suggested whenever the engine flags a default-value cap breach or an anomaly, and every decision landing in the audit trail.",
    },
    importers: {
      eyebrow: "FOR IMPORTERS",
      headline: "The EU-side declarant\nworkspace. Coming soon.",
      intro:
        "Aggregate the emissions data your exporters already submitted, run the certificate calculation, and file the annual CBAM declaration — the Authorised CBAM Declarant's side of the workflow, built on the same verified dataset your suppliers filled in.",
    },
  },
};

export type Content = typeof en;

const th: Content = {
  common: {
    bookDemo: "นัดชมระบบ",
    getStarted: "เริ่มต้นใช้งาน",
    seeHowItWorks: "ดูวิธีการทำงาน",
    requestPricing: "ขอใบเสนอราคา",
    allSolutions: "ดูโซลูชันทั้งหมด",
    joinWaitlist: "ลงชื่อรอใช้งาน",
    live: "พร้อมใช้",
    soon: "เร็ว ๆ นี้",
    comingSoon: "เร็ว ๆ นี้",
    back: "ย้อนกลับ",
    close: "ปิด",
  },

  nav: {
    login: "เข้าสู่ระบบ",
    language: "ภาษา",
    selectLanguage: "เลือกภาษา",
    openMenu: "เปิดเมนู",
    closeMenu: "ปิดเมนู",
    backToTop: "Certrace — กลับขึ้นด้านบน",
    primary: "เมนูหลัก",
    mobile: "เมนูมือถือ",
    platform: {
      label: "แพลตฟอร์ม",
      items: [
        {
          label: "คำเชิญซัพพลายเออร์ผ่าน Smart Link",
          desc: "หนึ่งลิงก์ต่อซัพพลายเออร์หนึ่งราย ไม่ต้องส่งอีเมล ไม่ต้องสมัครบัญชี ไม่ต้องตามงาน",
        },
        {
          label: "โปรไฟล์ซัพพลายเออร์ กรอกครั้งเดียว",
          desc: "ข้อมูลซัพพลายเออร์บันทึกครั้งเดียว แล้วนำกลับมาใช้เองในทุกคำขอถัดไป",
        },
        {
          label: "ตรวจคุณภาพข้อมูลอัตโนมัติ",
          desc: "ข้อมูลที่ขาด หน่วยที่ผิด และตัวเลขที่เป็นไปไม่ได้ ถูกจับได้ตั้งแต่ตอนส่ง",
        },
        {
          label: "ระบบคำนวณ CBAM",
          desc: "แปลงข้อมูลดิบจากซัพพลายเออร์เป็นรูปแบบการปล่อยคาร์บอนที่สหภาพยุโรปกำหนด",
        },
        {
          label: "แดชบอร์ดเทียบมาตรฐานคาร์บอน",
          desc: "คุณอยู่ตรงไหนเมื่อเทียบกับอัตราค่าปรับ CBAM ด้วยภาษาที่เข้าใจง่าย",
        },
        {
          label: "ชุดรายงานที่พร้อมเสมอ",
          desc: "พร้อมส่งผู้ซื้อและผู้ตรวจสอบในรูปแบบของสหภาพยุโรป อัปเดตเองโดยไม่ต้องทำใหม่",
        },
      ],
      footer: "ดูฟีเจอร์ทั้งหมด",
    },
    solutions: {
      label: "โซลูชัน",
      items: [
        {
          label: "สำหรับผู้ส่งออก",
          desc: "พิสูจน์ข้อมูลคาร์บอนของคุณก่อนที่ผู้ซื้อจะต้องเอ่ยปากขอ",
        },
        {
          label: "สำหรับซัพพลายเออร์",
          desc: "แบบฟอร์มพร้อมคำแนะนำ ใช้ฟรี ในภาษาของคุณเอง จากอุปกรณ์ใดก็ได้",
        },
        {
          label: "สำหรับฝ่ายกฎหมายและกำกับดูแล",
          desc: "การรับรองที่ระบุชื่อผู้อนุมัติ พร้อมร่องรอยการตรวจสอบที่ครบถ้วน",
        },
        {
          label: "สำหรับผู้นำเข้า",
          desc: "พื้นที่ทำงานฝั่งสหภาพยุโรปสำหรับผู้ยื่นรายงาน CBAM",
        },
      ],
      footer: "Certrace สร้างมาเพื่อใคร",
    },
    regulations: {
      label: "กฎระเบียบ",
      items: [
        {
          label: "EU CBAM",
          desc: "เหล็ก เหล็กกล้า และอะลูมิเนียม — สินค้า 67 รายการตามรหัส CN พร้อมกฎช่วงบังคับใช้จริงในระบบ",
        },
      ],
      footer: "ดูสิ่งที่อัปเดตล่าสุด",
    },
    pricing: "ราคา",
    resources: {
      label: "แหล่งข้อมูล",
      items: [
        {
          label: "วิธีการทำงาน",
          desc: "สี่ขั้นตอน ตั้งแต่เชิญซัพพลายเออร์จนถึงไฟล์ส่งออกที่พร้อมตรวจสอบ",
        },
        {
          label: "คำถามที่พบบ่อย",
          desc: "ใครเป็นผู้ยื่นจริง AI ทำอะไร และข้อมูลถูกดูแลอย่างไร",
        },
        {
          label: "ไทม์ไลน์ CBAM",
          desc: "ทุกกำหนดเวลา ตั้งแต่ช่วงเปลี่ยนผ่านจนถึงการยื่นรายงานครั้งแรก",
        },
        {
          label: "แผนพัฒนา",
          desc: "ทุกอย่างที่เราปล่อยแล้ว เรียงจากใหม่ไปเก่า",
        },
      ],
      footer: "นัดชมระบบ",
    },
    company: {
      label: "บริษัท",
      items: [
        {
          label: "ติดต่อเรา",
          desc: "มีอะไรให้เราช่วย ทักมาได้เลย",
        },
        {
          label: "เกี่ยวกับ Certrace",
          desc: "เราคือใคร และทำไมถึงสร้างสิ่งนี้ขึ้นมา เร็ว ๆ นี้",
        },
        {
          label: "ร่วมงานกับเรา",
          desc: "บอกเราว่าคุณอยากสร้างอะไร เราอ่านทุกฉบับ",
        },
      ],
      footer: "นัดชมระบบ",
    },
  },

  hero: {
    badge: "โครงสร้างพื้นฐานด้านข้อมูลคาร์บอน",
    headline: "ผู้ซื้อไม่รอ\nเขาเลือกคนที่\nพิสูจน์ได้ก่อน",
    intro:
      "แพลตฟอร์ม AI ที่เชื่อมผู้ซื้อ ผู้ส่งออก และซัพพลายเออร์เข้าด้วยกัน เพื่อเก็บข้อมูลคาร์บอนตาม CBAM แบบอัตโนมัติ ตั้งแต่คำขอ จนถึงรายงานที่พร้อมส่งก่อนผู้ซื้อจะเอ่ยปาก",
    stats: [
      /* The comparison section reuses these captions in a 109px box at 768px;
         anything past ~15 characters splits ลดลง into ลด / ลง there. */
      "ต้นทุนต่อการยื่น",
      "ชั่วโมงทำงานที่ต้องตามซัพพลายเออร์",
      "รายการสินค้า CBAM ที่รองรับแล้ว",
      /* Has to fit the 140px caption box on one line — anything longer and
         Chrome splits หลักฐาน into หลัก / ฐาน, or เร็วขึ้น into เร็ว / ขึ้น. */
      "พิสูจน์ได้เร็วขึ้น",
    ],
    videoTitle: "วิดีโอแนะนำผลิตภัณฑ์ Certrace",
  },

  problem: {
    badge: "ปัญหา",
    headline: "สี่ขั้นตอน\nแค่นั้นก็พอ\nที่จะเสียออร์เดอร์",
    intro:
      "ผู้ซื้อขอข้อมูลคาร์บอนที่ผ่านการตรวจสอบ คุณเริ่มไล่ตาม อีกรายมีข้อมูลพร้อมอยู่แล้ว ออร์เดอร์จึงไม่ถูกปฏิเสธ แต่ย้ายไปหาเขาแทน",
    chain: [
      {
        step: "คำขอ",
        title: "ผู้ซื้อเอ่ยขอ",
        desc: "ผู้นำเข้าในสหภาพยุโรปต้องการข้อมูลการปล่อยคาร์บอนที่ผ่านการตรวจสอบก่อนออร์เดอร์ถัดไป",
      },
      {
        step: "ความล่าช้า",
        title: "คุณเริ่มไล่ตาม",
        desc: "ไล่ทีละราย ทีละอีเมล ผ่านไปหลายสัปดาห์ก็ยังไม่ครบ",
      },
      {
        step: "ทางเลือกอื่น",
        title: "เขาไปเจอรายอื่น",
        desc: "ผู้ส่งออกอีกรายมีตัวเลขที่สะอาดพร้อมส่งอยู่แล้ว",
      },
      {
        step: "การเปลี่ยนมือ",
        title: "ออร์เดอร์ย้ายมือ",
        desc: "ไม่ใช่เพราะราคา ไม่ใช่เพราะคุณภาพ แต่เพราะหลักฐานมาถึงเป็นรายที่สอง",
      },
    ],
    stakes: {
      riskLabel: "คุณพร้อมเสี่ยงกับเรื่องนี้ไหม",
      riskTitle: "หนึ่งออร์เดอร์ที่หายไป",
      riskFigure: "$670,000",
      riskCaption: {
        before: "ไม่ใช่เพราะราคา ไม่ใช่เพราะคุณภาพ แต่เพราะ",
        highlight: "ข้อมูลคาร์บอนที่หายไป",
      },
      manualLabel: "ถ้ายังทำด้วยมือแบบทุกวันนี้",
      manual: [
        { lead: "9–15 สัปดาห์", rest: "ของงานที่ต้องทำเอง ในทุกปีรายงาน" },
        { lead: "$9K–24K", rest: "ต่อปี และยังผิดพลาดอยู่บ่อยครั้ง" },
      ],
    },
  },

  whyNow: {
    badge: "ทำไมต้องตอนนี้",
    headline: "CBAM ไม่ได้กำลังจะมา\nแต่เริ่มนับแล้ว",
    intro:
      "ตั้งแต่มกราคม 2026 ทุกการส่งออกมีต้นทุนจริง และคุณพิสูจน์ได้เฉพาะสิ่งที่วัดไว้ตอนนั้น",
    milestones: [
      {
        date: "ต.ค. 2023",
        label: "เริ่มช่วงเปลี่ยนผ่าน",
        desc: "รายงานอย่างเดียว ยังไม่ต้องมีใบรับรอง",
      },
      {
        date: "ม.ค. 2026",
        label: "เริ่มช่วงบังคับใช้จริง",
        desc: "ทุกการส่งออกมีภาระผูกพันเต็มรูปแบบ",
      },
      {
        date: "ก.พ. 2027",
        label: "เปิดขายใบรับรอง",
        desc: "ผู้นำเข้าเริ่มซื้อสำหรับการปล่อยคาร์บอนปี 2026",
      },
      {
        date: "ก.ย. 2027",
        label: "กำหนดยื่นรายงานประจำปีครั้งแรก",
        desc: "ยื่นรายงานและส่งคืนใบรับรองของปี 2026",
      },
    ],
    countdown: {
      eyebrow: "ย้อนเวลากลับไม่ได้",
      title: "การปล่อยคาร์บอนของเดือนที่แล้ว วัดย้อนหลังไม่ได้อีกแล้ว",
      units: ["วัน", "ชม.", "นาที", "วินาที"],
    },
    quote:
      "“ผู้ส่งออกที่ไม่สามารถแสดงรายงานคาร์บอนที่ผ่านการตรวจสอบ เสี่ยงต่อการสูญเสียการเข้าถึงตลาดสหภาพยุโรปอย่างถาวร”",
  },

  live: {
    badge: "แพลตฟอร์มที่ใช้งานจริง",
    /* Three lines, not two: at 60px a 20-character Thai line overruns the
       520px column and wraps itself into a fourth. */
    headline: "หลักฐานของคุณ\nพร้อมรออยู่แล้ว\nก่อนเขาจะเอ่ยขอ",
    intro:
      "ทุกซัพพลายเออร์ ทุกการส่งข้อมูล ทุกกำหนดเวลา เห็นได้ทันทีที่เปลี่ยน เมื่อคำขอมาถึง คำตอบจึงมีอยู่แล้ว",
    suppliersSubmitted: "ซัพพลายเออร์ส่งข้อมูลแล้ว\nในไตรมาสนี้",
    stats: [
      "อนุมัติแล้ว 24 / 30 ราย",
      "ข้อมูลครบ 94%",
      "เหลืออีก 6 วันถึงกำหนด",
    ],
  },

  platform: {
    badge: "แพลตฟอร์ม",
    /* Three lines: "ร้อยเป็นสายเดียวไม่ขาดตอน" is 21 characters, which
       overruns the 342px column at 390px and drops "ขาดตอน" onto a widow. */
    headline: "หกฟีเจอร์\nร้อยเป็นสายเดียว\nไม่ขาดตอน",
    intro:
      "ไม่ต้องต่อสเปรดชีต ไม่ต้องกระทบยอดกับอีกเครื่องมือ เชิญ ใช้ซ้ำ ตรวจ คำนวณ เทียบมาตรฐาน และออกรายงาน ออกแบบมาให้หลักฐานเสร็จก่อนที่ใครจะเอ่ยขอ",
    modules: [
      {
        label: "01 / คำเชิญซัพพลายเออร์ผ่าน SMART LINK",
        title: "ไม่ต้องส่งอีเมล ไม่ต้องตามงาน ไม่ต้องสมัครบัญชี",
        desc: "ส่งลิงก์เดียว ซัพพลายเออร์กรอกเฉพาะข้อมูลที่สินค้าของเขาต้องใช้ ในภาษาของเขาเอง ไม่ต้องติดตั้งอะไร ไม่ต้องอบรมใคร",
        tags: [
          "หนึ่งลิงก์ต่อหนึ่งราย",
          "ไม่ต้องสมัครบัญชี",
          "ภาษาของเขาเอง",
          "เตือนอัตโนมัติ",
        ],
      },
      {
        label: "02 / โปรไฟล์ซัพพลายเออร์ กรอกครั้งเดียว",
        title: "ซัพพลายเออร์ไม่ต้องกรอกข้อมูลเดิมซ้ำอีก",
        desc: "คำตอบบันทึกครั้งเดียวแล้วเติมให้เองในทุกคำขอถัดไป ทั้งข้ามสินค้า ข้ามรอบรายงาน และข้ามผู้ซื้อ ครั้งแรกใช้เวลาหนึ่งบ่าย ครั้งต่อไปใช้เวลาไม่กี่นาที",
        tags: [
          "บันทึกครั้งเดียว",
          "ใช้ซ้ำได้ทุกที่",
          "ข้ามผู้ซื้อได้",
          "ไม่กี่นาที ไม่ใช่หลายสัปดาห์",
        ],
      },
      {
        label: "03 / ตรวจคุณภาพข้อมูลอัตโนมัติ",
        title: "ข้อมูลที่ผิดถูกจับได้ก่อนถึงมือคุณ",
        desc: "ข้อมูลที่ขาด หน่วยที่ผิด ตัวเลขที่เป็นไปไม่ได้ ถูกทำเครื่องหมายทันทีที่ซัพพลายเออร์ส่ง คุณจึงตรวจข้อมูลที่สะอาดพร้อมสรุปที่อ่านเข้าใจง่าย ไม่ใช่สเปรดชีตที่เต็มไปด้วยคำถาม",
        tags: [
          "ข้อมูลที่ขาด",
          "หน่วยที่ผิด",
          "ค่าที่เป็นไปไม่ได้",
          "สรุปที่อ่านเข้าใจง่าย",
        ],
      },
      {
        label: "04 / ระบบคำนวณ CBAM",
        title: "ไม่ต้องคำนวณเอง ไม่มีสูตรในสเปรดชีตที่ผิด",
        desc: "ข้อมูลดิบจากซัพพลายเออร์ถูกแปลงเป็นรูปแบบการปล่อยคาร์บอนที่สหภาพยุโรปกำหนดโดยอัตโนมัติ ตามกฎช่วงบังคับใช้จริง พร้อมร่องรอยการคำนวณแนบไปกับทุกตัวเลขที่คุณยื่น",
        tags: [
          "รูปแบบของสหภาพยุโรป",
          "เพดานค่าตั้งต้น 20%",
          "กฎ Scope 2",
          "ร่องรอยการคำนวณครบถ้วน",
        ],
      },
      {
        label: "05 / แดชบอร์ดเทียบมาตรฐานคาร์บอน",
        title: "เห็นว่าคุณอยู่ตรงไหน และมันทำให้คุณเสียเท่าไหร่",
        desc: "ตัวเลขคาร์บอนของคุณเทียบกับอัตราค่าปรับ CBAM ด้วยภาษาที่เข้าใจง่าย ทั้งจุดที่มีความเสี่ยง สายผลิตภัณฑ์ที่ฉุดคุณอยู่ และสิ่งที่ต้องแก้ ไม่ต้องมีความเชี่ยวชาญ",
        tags: [
          "เทียบอัตราค่าปรับ",
          "ความเสี่ยงรายสินค้า",
          "ภาษาที่เข้าใจง่าย",
          "ไม่ต้องมีความเชี่ยวชาญ",
        ],
      },
      {
        label: "06 / ชุดรายงานที่พร้อมเสมอ",
        title: "พร้อมก่อนที่ผู้ซื้อจะเอ่ยขอด้วยซ้ำ",
        desc: "คลิกเดียวเปลี่ยนข้อมูลซัพพลายเออร์เป็นรายงานที่ผนึกแล้ว พร้อมส่งผู้ซื้อและผู้ตรวจสอบในรูปแบบของสหภาพยุโรป และอัปเดตตามข้อมูลที่เปลี่ยน คุณจึงไม่ต้องทำใหม่",
        tags: [
          "พร้อมส่งผู้ซื้อ",
          "พร้อมให้ตรวจสอบ",
          "ไฟล์ XML ตาม Annex IV",
          "อัปเดตอยู่เสมอ",
        ],
      },
    ],
  },

  comparison: {
    badge: "ทำไมต้อง CERTRACE",
    headline: "แพลตฟอร์มคาร์บอนอื่น\nขายให้ผู้ซื้อของคุณ\nแต่ตัวนี้เป็นของคุณ",
    intro:
      "เครื่องมือในตลาดนี้ถูกซื้อโดยผู้นำเข้าในสหภาพยุโรป คุณเป็นเพียงแหล่งข้อมูลที่เขามาเก็บ Certrace อยู่ข้างคุณ ทั้งซัพพลายเออร์ ข้อมูล และหลักฐานของคุณ พร้อมก่อนคำขอจะมาถึง",
    colDiy: "ทำเองภายในองค์กร",
    colConsultant: "ที่ปรึกษา / เครื่องมือฝั่งผู้ซื้อ",
    rows: [
      {
        label: "สร้างมาเพื่อฝั่งไหน",
        diy: "ไม่ใช่ของใคร อาศัยเวลาว่างของคนในทีม",
        consultant: "ฝั่งผู้ซื้อ คุณเป็นแหล่งข้อมูล",
        certrace: "ฝั่งคุณ ฝั่งผู้ส่งออก",
      },
      {
        label: "เวลาที่ใช้ต่อปีรายงาน",
        diy: "9–15 สัปดาห์",
        consultant: "6–10 สัปดาห์",
        certrace: "เป็นวัน ไม่ใช่เป็นสัปดาห์",
      },
      {
        label: "ต้นทุนต่อปี",
        diy: "ชั่วโมงทำงานภายในที่ซ่อนอยู่",
        consultant: "$9K–24K หรือ $50K–250K ระดับองค์กร",
        certrace: "เพียงเศษเสี้ยวของทั้งสองแบบ",
      },
      {
        label: "ข้อมูลซัพพลายเออร์",
        diy: "รูปแบบที่ไม่ตรงกันกว่า 200 แบบ",
        consultant: "กระทบยอดด้วยมือ ครั้งเดียว",
        certrace: "แบบฟอร์มเดียว กรอกครั้งเดียว ใช้ซ้ำได้",
      },
      {
        label: "การตรวจคุณภาพ",
        diy: "ทำเอง พลาดได้ง่าย",
        consultant: "เจอหลังจากเกิดเรื่องแล้ว",
        certrace: "ตรวจทันทีที่ข้อมูลเข้ามา",
      },
      {
        label: "เมื่อผู้ซื้อเอ่ยขอ",
        /* Short enough for the 144px cell at 390px — one character more and
           Chrome breaks ซัพพลายเออร์ into ซัพพลายเอ / อร์. */
        diy: "ไล่ตามซัพพลายเออร์",
        consultant: "คุณสั่งทำรายงานฉบับถัดไป",
        certrace: "คำตอบมีอยู่แล้ว",
      },
      {
        label: "รู้ว่าคุณอยู่ตรงไหน",
        diy: "ไม่มีเกณฑ์เทียบเลย",
        consultant: "ได้ตัวเลข แต่ไม่มีบริบท",
        certrace: "เทียบกับอัตราค่าปรับโดยตรง",
      },
    ],
  },

  /* `view` and `lines` stay English on purpose — they depict the product's
     console output, which the scope note keeps untranslated. */
  howItWorks: {
    badge: "วิธีการทำงาน",
    headline: "สี่ขั้นตอนง่าย ๆ\nไม่ต้องเรียนรู้ใหม่",
    steps: en.howItWorks.steps.map((s, i) => ({
      ...s,
      title: ["สร้าง", "เก็บข้อมูล", "ตรวจสอบ", "พร้อมเสมอ"][i]!,
      desc: [
        /* Both kept short enough to hold one line: the step caption box drops
           กฎ|ระเบียบ and ครั้ง|เดียว onto a widow as soon as they wrap. */
        "เลือกสินค้าของคุณ ตัวช่วยจัดการกฎระเบียบให้",
        "ซัพพลายเออร์กรอกแบบฟอร์มเดียว เพียงครั้งเดียว",
        "ดูว่ามันทำให้คุณเสียเท่าไหร่ และคุณเสี่ยงตรงไหน",
        "รายงานเสร็จก่อนที่ผู้ซื้อจะเอ่ยขอ",
      ][i]!,
    })),
  },

  stakeholders: {
    badge: "เหมาะกับใคร",
    headline: "ห่วงโซ่เดียว ครบทุกฝั่ง\nเริ่มจากฝั่งของคุณ",
    intro:
      "ชุดข้อมูลเดียว ใช้ร่วมกันระหว่างผู้ซื้อ ผู้ส่งออก และซัพพลายเออร์ ฝั่งผู้ส่งออกและซัพพลายเออร์เปิดใช้แล้ววันนี้ ส่วนที่เหลือจะทยอยเปิดตามลำดับ",
    audiences: [
      {
        title: "ผู้ส่งออก",
        desc: "พิสูจน์ข้อมูลคาร์บอนก่อนผู้ซื้อจะขอ ทั้งการเก็บข้อมูล การเทียบมาตรฐาน และรายงานที่พร้อมเสมอ ในพื้นที่ทำงานเดียว",
        cta: "ดูโซลูชันสำหรับผู้ส่งออก",
      },
      {
        title: "ซัพพลายเออร์",
        desc: "แบบฟอร์มเดียวพร้อมคำแนะนำ ในภาษาของคุณเอง บนอุปกรณ์ใดก็ได้ ไม่ต้องสมัครบัญชี ไม่มีค่าใช้จ่าย และไม่ต้องตอบคำถามเดิมซ้ำ",
        cta: "ดูโซลูชันสำหรับซัพพลายเออร์",
      },
      {
        title: "ฝ่ายกฎหมายและกำกับดูแล",
        desc: "ไม่มีอะไรถูกส่งออกไปโดยไม่มีการรับรองที่ระบุชื่อ ทุกการตัดสินใจถูกบันทึกไว้ในร่องรอยการตรวจสอบ",
        cta: "ลงชื่อรอใช้งาน",
      },
      {
        title: "ผู้นำเข้า",
        /* Ends on ฝั่งยุโรป, not ฝั่งสหภาพยุโรป: at this card width the latter
           lands on the wrap and leaves ยุโรป alone on a fourth line. */
        desc: "รวบรวมข้อมูลที่ผ่านการตรวจสอบจากผู้ส่งออก คำนวณใบรับรอง และยื่นรายงาน CBAM ประจำปีในฝั่งยุโรป",
        cta: "ลงชื่อรอใช้งาน",
      },
    ],
  },

  languages: {
    badge: "ภาษาที่รองรับ",
    headline: "ออกแบบมาให้เข้ากับ\nการทำงานจริงของเครือข่ายคุณ",
    intro:
      "แบบฟอร์มและรายงานในภาษาที่ซัพพลายเออร์ของคุณใช้อยู่แล้ว และกำลังจะมีเพิ่มอีก",
    statusLive: "พร้อมใช้",
    statusSoon: "เร็ว ๆ นี้",
  },

  pricing: {
    badge: "ราคา",
    headline: "ราคาที่เข้าใจง่ายและโปร่งใส\nปรับตามขนาดการดำเนินงาน",
    intro:
      "ทุกแพ็กเกจออกแบบมาให้คุ้มค่ากว่าที่จ่ายตั้งแต่วันแรก และซัพพลายเออร์ใช้ฟรีเสมอ",
    introPage:
      "ทุกแพ็กเกจออกแบบมาให้คุ้มค่ากว่าที่จ่ายตั้งแต่วันแรก และซัพพลายเออร์ใช้ฟรีเสมอในทุกแพ็กเกจ",
    note: "ราคาปรับตามจำนวนซัพพลายเออร์และข้อกำหนดด้านการปฏิบัติตามกฎ · แบบรายปี · ซัพพลายเออร์และผู้ซื้อใช้ฟรีเสมอ · ยกเลิกได้ทุกเมื่อหลังปีแรก",
    questionsBadge: "คำถามที่พบบ่อย",
    plans: [
      {
        name: "STARTER",
        sub: "สูงสุด 20 ซัพพลายเออร์",
        features: [
          "ตัวช่วยสร้างคำขอข้อมูล",
          "ใช้ได้กับผู้ซื้อในสหภาพยุโรปทุกราย",
          "รองรับภาษาไทย",
          "แดชบอร์ดเรียลไทม์ พร้อมระบบเตือน",
          "ไฟล์ส่งออกที่พร้อมตรวจสอบ",
        ],
      },
      {
        name: "STANDARD",
        sub: "สูงสุด 50 ซัพพลายเออร์",
        features: [
          "ทุกอย่างในแพ็กเกจ Starter",
          "สิทธิ์ผู้ใช้สำหรับผู้ตรวจสอบ",
          "เทมเพลตรองรับหลายกฎระเบียบ",
          "การสนับสนุนแบบเร่งด่วน พร้อมทีมช่วยเริ่มใช้งาน",
        ],
      },
      {
        name: "ENTERPRISE",
        sub: "มากกว่า 50 ซัพพลายเออร์",
        features: [
          "ทุกอย่างในแพ็กเกจ Standard",
          "รองรับหลายนิติบุคคลและหลายโรงงาน",
          "ผู้ดูแลบัญชีลูกค้าโดยเฉพาะ",
          "เข้าถึงเครือข่ายที่ปรึกษากฎหมายสำหรับการรับรอง",
        ],
      },
    ],
  },

  /* The heading avoids ตรงไปตรงมา — real Chrome breaks that compound in half
     at this size (see the 2026-07-31 line-break pass). */
  faq: {
    badge: "คำถามที่พบบ่อย",
    headline: "ข้อสงสัยที่พบบ่อย\nคำตอบที่ชัดเจน",
    items: [
      {
        q: "ทำไมเจ้าอื่นขายให้ผู้นำเข้า แต่ Certrace สร้างเพื่อผู้ส่งออก",
        a: "เพราะผู้ส่งออกคือคนที่เสียออร์เดอร์ แพลตฟอร์มฝั่งผู้ซื้อมองคุณเป็นแหล่งข้อมูลที่ต้องตามเก็บ ส่วนเรามองข้อมูลของคุณเป็นสิ่งที่ทำให้คุณได้สัญญาฉบับถัดไป กฎเดียวกัน แต่คนละฝั่งของโต๊ะ",
      },
      {
        q: "Certrace ยื่นรายงาน CBAM กับสหภาพยุโรปแทนเราได้ไหม",
        a: "ไม่ได้ และไม่มีผู้ให้บริการรายใดทำได้ มีเพียงผู้ยื่นรายงาน CBAM ที่ได้รับอนุญาต (Authorised CBAM Declarant) ของผู้ซื้อในสหภาพยุโรปเท่านั้นที่ยื่นกับ Registry ได้ Certrace เตรียมทุกอย่างที่เขาต้องใช้ให้ครบ ทั้งเทมเพลตตาม Annex IV ชุดเอกสารตรวจสอบที่ผนึกแล้ว และข้อมูลโรงงานของคุณที่ส่งเข้า O3CI",
      },
      {
        q: "ซัพพลายเออร์ของเราต้องจ่ายเงินหรือสมัครบัญชีไหม",
        a: "ไม่ต้อง ซัพพลายเออร์แต่ละรายจะได้รับ Smart Link หนึ่งลิงก์ เป็นแบบฟอร์มพร้อมคำแนะนำทั้งภาษาไทยและอังกฤษ ใช้ได้บนทุกอุปกรณ์ ไม่ต้องสมัครบัญชี ไม่มีค่าใช้จ่าย คำตอบจะถูกบันทึกไว้ในโปรไฟล์ คำขอครั้งถัดไปจึงถูกเติมให้ล่วงหน้า",
      },
      {
        q: "AI ทำอะไรบ้าง แล้วมันแก้ตัวเลขของเราได้ไหม",
        a: "AI ตรวจอย่างเดียว ไม่แก้ไขอะไรทั้งสิ้น หน้าที่ของมันคือชี้จุดที่ข้อมูลขาด จุดที่ผิดปกติ และหลักฐานที่อ่อน แล้วให้คะแนนความน่าเชื่อถือพร้อมคำสรุปที่อ่านเข้าใจง่าย เพื่อให้ทีมของคุณตรวจได้เร็วขึ้น ทุกตัวเลขที่ยื่นมาจากระบบคำนวณที่ให้ผลแน่นอน พร้อมร่องรอยการคำนวณแนบไว้",
      },
      {
        q: "การเทียบมาตรฐานบอกอะไรกับเราจริง ๆ",
        a: "บอกว่าตัวเลขของคุณอยู่ตรงไหนเมื่อเทียบกับอัตราค่าปรับ CBAM ด้วยภาษาที่เข้าใจง่าย ทั้งสายผลิตภัณฑ์ที่มีความเสี่ยงสูงสุด และการเปลี่ยนแปลงหนึ่งอย่างจะมีค่าเท่าไหร่ นี่คือความต่างระหว่างการรายงานข้อมูลคาร์บอน กับการนำมันไปใช้ตัดสินใจได้จริง",
      },
      {
        q: "ผลลัพธ์พร้อมให้ตรวจสอบได้จริงหรือไม่",
        a: "จริง เป็นชุดเอกสาร CBAM Communication & Audit Package ราว 24 หน้า ประกอบด้วยสรุปการยื่นรายงาน วิธีการคำนวณ บทแยกรายซัพพลายเออร์ ทะเบียนหลักฐาน การรับรอง และร่องรอยการตรวจสอบทั้งหมด ผนึกด้วยแฮช SHA-256 พร้อมไฟล์ XML ตาม Annex IV แนบไปด้วย",
      },
      {
        q: "วันนี้ Certrace รองรับกฎระเบียบใดบ้าง",
        a: "EU CBAM และเฉพาะ EU CBAM เท่านั้น ครอบคลุมเหล็ก เหล็กกล้า และอะลูมิเนียม ด้วยสินค้าตามรหัส CN จริง 67 รายการ พร้อมกฎช่วงบังคับใช้จริงในระบบ ส่วน UK CBAM, EUDR และ CSRD อยู่ในแผน เราเลือกทำกฎเดียวให้ดีจริง ดีกว่าทำสี่กฎแบบครึ่ง ๆ กลาง ๆ",
      },
      {
        q: "ถ้ากฎเปลี่ยนจะเกิดอะไรขึ้น",
        a: "เราอัปเดตแบบฟอร์ม กฎในระบบคำนวณ และเทมเพลตไฟล์ส่งออกจากส่วนกลาง กฎช่วงบังคับใช้จริงปี 2026 อยู่ในระบบเรียบร้อยแล้ว คุณไม่ต้องสร้างอะไรใหม่เลย",
      },
      {
        q: "ข้อมูลซัพพลายเออร์ของเราปลอดภัยแค่ไหน",
        a: "เข้ารหัสทั้งระหว่างส่งและขณะจัดเก็บ Smart Link แต่ละลิงก์จำกัดอยู่ที่ซัพพลายเออร์รายเดียว ซัพพลายเออร์จึงไม่เห็นข้อมูลของกันและกัน และทีมของคุณเห็นเท่าที่สิทธิ์ของแต่ละคนอนุญาต ทุกการกระทำถูกบันทึกไว้ และชุดเอกสารฉบับสุดท้ายถูกผนึกด้วยแฮช การแก้ไขใด ๆ จึงตรวจพบได้",
      },
    ],
  },

  cta: {
    headline: "เป็นคนที่\nพิสูจน์ได้ก่อน",
    intro:
      "ดู Certrace ทำงานจริงกับซัพพลายเชนของคุณเอง การสาธิต 30 นาที ตั้งแต่การเชิญซัพพลายเออร์จนถึงรายงานที่ผู้ซื้อนำไปใช้ได้จริง",
    note: "ซัพพลายเออร์ใช้ฟรีเสมอ · เริ่มได้โดยไม่ต้องตั้งค่าอะไร",
  },

  form: {
    firstName: "ชื่อ",
    lastName: "นามสกุล",
    email: "อีเมลที่ทำงาน",
    phone: "เบอร์โทรศัพท์",
    company: "บริษัท",
    companyPlaceholder: "ชื่อบริษัท",
    jobTitle: "ตำแหน่งงาน",
    sector: "กลุ่มธุรกิจ",
    employees: "จำนวนพนักงาน",
    dialLabel: "รหัสโทรศัพท์ประเทศ",
    phonePlaceholder: "81 234 5678",
    selectJobTitle: "เลือกตำแหน่งงาน",
    selectSector: "เลือกกลุ่มธุรกิจ",
    selectEmployees: "เลือกจำนวนพนักงาน",
    reassurance:
      "ขั้นถัดไป: ตอบคำถามสั้น ๆ สี่ข้อ แล้วเลือกเวลาที่สะดวก ไม่มีข้อผูกมัด และเราไม่เปิดเผยข้อมูลของคุณ",
    errors: {
      required: "กรุณากรอกข้อมูล",
      emailFormat: "กรุณากรอกอีเมลให้ถูกต้อง",
      emailPersonal: "กรุณาใช้อีเมลของบริษัท",
      phoneDigits: "กรุณากรอกเบอร์โทรศัพท์",
      phoneLength: "กรุณาตรวจสอบจำนวนหลักของเบอร์โทรในประเทศนี้",
    },
    confirmed: {
      badge: "ยืนยันการสาธิตแล้ว",
      detail: "30 นาที ผ่านออนไลน์",
      inviteTo: "คำเชิญพร้อมลิงก์ประชุมกำลังส่งไปที่",
      reschedule: "ต้องการเลื่อนเวลา ตอบกลับคำเชิญ หรืออีเมลถึง",
    },
    jobTitles: [
      "อื่น ๆ",
      "ผู้บริหารระดับสูง",
      "การเงิน",
      "ทรัพยากรบุคคล/การตลาด",
      "จัดซื้อ",
      "ฝ่ายขาย",
      "นักศึกษา / นักวิจัย",
      "ฝ่ายความยั่งยืน",
    ],
    sectors: [
      "ก่อสร้างและอสังหาริมทรัพย์",
      "ที่ปรึกษาและบริการ",
      "สิ่งแวดล้อมและพลังงาน",
      "อีเวนต์และการท่องเที่ยว",
      "การเงิน",
      "อาหารและเครื่องดื่ม",
      "สุขภาพ",
      "การผลิต",
      "ประกันภัย",
      "โลจิสติกส์และการขนส่ง",
      "สื่อและการสื่อสาร",
      "บริการภาครัฐและการศึกษา",
      "ค้าปลีกและอีคอมเมิร์ซ",
      "เทคโนโลยีและไอที",
    ],
  },

  booking: {
    stepLabels: ["คำถามสั้น ๆ", "เลือกเวลา", "ยืนยัน"],
    stepOf: "ขั้นที่ {n} จาก 3",
    yourDemo: "การสาธิตของคุณ",
    duration: "30 นาที · ออนไลน์",
    close: "ปิด",
    step1Title: "คำถามสั้น ๆ สี่ข้อ\nก่อนเราจะได้คุยกัน",
    step1Intro: "คำตอบของคุณกำหนดว่าเราจะนำเสนออะไรใน 30 นาทีนั้น",
    qDecision: "การตัดสินใจเรื่องนี้อยู่ที่คุณหรือไม่",
    qBudget: "มีงบประมาณรองรับแล้วหรือยัง",
    qTiming: "คุณต้องพร้อมยื่นรายงานเมื่อไหร่",
    qSource: "คุณรู้จัก Certrace ได้อย่างไร",
    decision: [
      "ใช่ ฉันตัดสินใจเอง",
      "ตัดสินใจร่วมกับคนอื่น",
      "ยังไม่ใช่ กำลังหาข้อมูล",
    ],
    budget: ["อนุมัติแล้ว", "กำลังประเมิน", "ยังไม่มี"],
    timing: [
      "ภายในหนึ่งเดือน",
      "1–3 เดือน",
      "3–6 เดือน",
      "มากกว่า 6 เดือน",
      "ยังไม่แน่ใจ",
    ],
    source: [
      "คนบอกต่อ",
      "โซเชียลมีเดีย",
      "เสิร์ชเอนจิน",
      "งานอีเวนต์หรือสัมมนา",
      "อีเมล",
      "ข่าวหรือบทความ",
      "พาร์ตเนอร์หรือที่ปรึกษา",
      "อื่น ๆ",
    ],
    sourceOtherPlaceholder: "คุณพบเราจากช่องทางใด",
    contextLabel: "มีอะไรที่จะช่วยให้การพูดคุยเป็นประโยชน์ขึ้นไหม",
    contextPlaceholder:
      "เส้นตายแรกของคุณ ผู้ซื้อที่กำลังขอข้อมูล เครื่องมือที่ใช้อยู่ หรือใครที่ควรเข้าร่วมด้วย…",
    chooseTime: "เลือกเวลา",
    step2Title: "เลือกเวลาที่คุณสะดวก",
    step2Intro: "30 นาที ผ่านออนไลน์",
    timeZoneLabel: "เวลาที่แสดงอ้างอิงตาม",
    timeZoneHint:
      "ตรวจจับจากเบราว์เซอร์ของคุณ เปลี่ยนได้หากคุณนัดตามเวลาทำการของภูมิภาคอื่น",
    timeZoneRegions: {
      asiaPacific: "เอเชีย–แปซิฟิก",
      europe: "ยุโรป",
      middleEastAfrica: "ตะวันออกกลางและแอฟริกา",
      americas: "อเมริกา",
    },
    chooseDay: "เลือกวัน",
    chooseSlot: "เลือกเวลา",
    prevWeek: "สัปดาห์ก่อนหน้า",
    nextWeek: "สัปดาห์ถัดไป",
    noSlots: "วันนี้ไม่มีเวลาว่างแล้ว ลองเลือกวันอื่น หรืออีเมลถึง",
    noSlotsTail: "แล้วเราจะหาเวลานอกช่วงนี้ให้",
    confirmPrefix: "ยืนยัน",
    selectToConfirm: "เลือกเวลาเพื่อยืนยัน",
    bookedTitle: "จองเรียบร้อยแล้ว",
    yourSlot: "เวลาที่คุณเลือก",
    onlineDetail: "30 นาที ผ่านออนไลน์",
    inviteTo: "คำเชิญพร้อมลิงก์ประชุมกำลังส่งไปที่",
    reschedule: "ต้องการเลื่อนเวลา ตอบกลับคำเชิญ หรืออีเมลถึง",
    rescheduleTail: "ไม่ต้องกรอกแบบฟอร์มใด ๆ",
  },

  /* `rowTwo` stays English — those are the regulations' and standards' own
     registered titles, not prose. */
  marquee: {
    rowOne: [
      "แพลตฟอร์มเดียวที่สร้างเพื่อผู้ส่งออก",
      "สินค้า CBAM 67 รายการ ตามรหัส CN จริง",
      "เหล็ก เหล็กกล้า และอะลูมิเนียม พร้อมสำหรับช่วงบังคับใช้จริง",
      "ซัพพลายเออร์กรอกครั้งเดียว ไม่ต้องกรอกซ้ำ",
      "เทียบกับอัตราค่าปรับ CBAM โดยตรง",
      "หลักฐานพร้อมก่อนผู้ซื้อเอ่ยขอ",
    ],
    rowTwo: en.marquee.rowTwo,
    ctaRowOne: [
      "นัดชมระบบ",
      "พาชมแบบมีผู้แนะนำ 30 นาที",
      "ซัพพลายเชนของคุณเอง แบบสด",
      "ตั้งแต่เชิญซัพพลายเออร์จนถึงรายงานที่พร้อมตรวจสอบ",
      "ซัพพลายเออร์ใช้ฟรีเสมอ",
      "เริ่มได้โดยไม่ต้องตั้งค่า",
    ],
    ctaRowTwo: [
      "ดูของจริง",
      "จองเวลาของคุณ",
      "คุยกับทีมงาน",
      "พิสูจน์ให้ได้ก่อน",
      "เริ่มวันนี้",
      "นัดชมระบบ",
    ],
  },

  footer: {
    desc: "แพลตฟอร์ม AI ที่เชื่อมผู้ซื้อ ผู้ส่งออก และซัพพลายเออร์เข้าด้วยกัน เพื่อเก็บข้อมูลคาร์บอนตาม CBAM แบบอัตโนมัติ ตั้งแต่คำขอ จนถึงรายงานที่พร้อมส่งก่อนผู้ซื้อจะเอ่ยปาก",
    location: "กรุงเทพมหานคร ประเทศไทย",
    columns: {
      platform: "แพลตฟอร์ม",
      whoItsFor: "เหมาะกับใคร",
      resources: "แหล่งข้อมูล",
      company: "บริษัท",
    },
    links: {
      smartLink: "คำเชิญผ่าน Smart Link",
      profile: "โปรไฟล์กรอกครั้งเดียว",
      aiCheck: "ตรวจคุณภาพอัตโนมัติ",
      engine: "ระบบคำนวณ CBAM",
      benchmark: "เทียบมาตรฐานคาร์บอน",
      reports: "รายงานที่พร้อมเสมอ",
      exporters: "ผู้ส่งออก",
      suppliers: "ซัพพลายเออร์",
      legalCompliance: "ฝ่ายกฎหมายและกำกับดูแล — เร็ว ๆ นี้",
      importers: "ผู้นำเข้า — เร็ว ๆ นี้",
      howItWorks: "วิธีการทำงาน",
      faq: "คำถามที่พบบ่อย",
      timeline: "ไทม์ไลน์ CBAM",
      backlog: "แผนพัฒนา",
      pricing: "ราคา",
      contact: "ติดต่อเรา",
      bookDemo: "นัดชมระบบ",
      terms: "ข้อกำหนดการใช้งาน",
      privacy: "นโยบายความเป็นส่วนตัว",
      cookies: "นโยบายคุกกี้",
      reportIssue: "แจ้งปัญหา",
    },
    /* The legal entity name stays in English on the Thai site too — it is how
       the company is registered and how it signs contracts, so translating it
       would name an entity that does not exist on paper. */
    copyright: "© 2026 Certrace Ord. Part. All rights reserved.",
    contactSubject: "สวัสดี Certrace",
    issueSubject: "แจ้งปัญหาการใช้งาน",
    careersSubject: "ร่วมงานกับ Certrace",
  },

  backlog: {
    badge: "แผนพัฒนาผลิตภัณฑ์",
    headline: "สิ่งที่เราปล่อยแล้ว\nและปล่อยเมื่อไหร่",
    intro:
      "CBAM เปลี่ยนแปลงอยู่ตลอด ผลิตภัณฑ์ของเราจึงเปลี่ยนตาม หน้านี้คือบันทึกสาธารณะ ทุกรายการด้านล่างมีอยู่ในแพลตฟอร์มวันนี้ พร้อมระบุเดือนที่เริ่มใช้งานจริง",
    updated: "อัปเดตล่าสุด 30 กรกฎาคม 2026",
    shippedBadge: "ปล่อยล่าสุด",
    shippedHeadline: "มีอยู่ในแพลตฟอร์มวันนี้",
    shippedIntro:
      "เรียงจากใหม่ไปเก่า ทุกรายการที่นี่ใช้งานจริงอยู่แล้ว และอยู่ในการสาธิต ขอดูรายการไหนก็ได้",
    buildingBadge: "กำลังดำเนินการ",
    buildingHeadline: "กำลังสร้างอยู่ตอนนี้",
    nextBadge: "อยู่ในแผน",
    nextHeadline: "วางแผนไว้ แต่ยังไม่กำหนดวัน",
    nextIntro:
      "เรามุ่งไปในทิศทางนี้ แต่ยังไม่ระบุวัน ความต้องการของลูกค้าจะเป็นตัวกำหนดลำดับ",
    chipBuilding: "กำลังสร้าง",
    chipNext: "อยู่ในแผน",
    ctaHeadline: "มีสิ่งที่ยังขาดไปจากรายการนี้ไหม",
    ctaIntro:
      "สิ่งที่เราจะสร้างต่อไปมาจากผู้ส่งออกที่บอกเราว่าการยื่นครั้งถัดไปของเขาต้องการอะไรจริง ๆ บอกเราได้เลย",
    ctaButton: "เสนอฟีเจอร์",
    ctaSubject: "ข้อเสนอสำหรับแผนพัฒนา",
    shipped: [
      {
        month: "ก.ค. 2026",
        title: "ระบบตรวจกฎช่วงบังคับใช้จริง",
        desc: "ทุกกฎที่เปลี่ยนไปเมื่อมกราคม 2026 ถูกคำนวณแทนการตีความ ทั้งเพดานค่าตั้งต้น 20% การจัดการ Scope 2 ตาม Annex II ข้อมูลวัตถุดิบต้นน้ำแบบมีโครงสร้าง ภาระต้นทุนเป็นยูโรต่อการส่งออก และการตรวจก่อนยื่นทะเบียนก่อนส่งออกไป",
        tag: "COMPLIANCE ENGINE",
      },
      {
        month: "ก.ค. 2026",
        title: "พอร์ทัลซัพพลายเออร์ — สิทธิ์ผู้ใช้ ลงนามอิเล็กทรอนิกส์ และผลตรวจคุณภาพ",
        desc: "ซัพพลายเออร์เชิญเพื่อนร่วมงานแยกตามแผนกได้ ลงนามรับรองข้อมูลของตัวเองได้ และเห็นผลตรวจคุณภาพจาก AI ก่อนส่ง ยังคงไม่ต้องสมัครบัญชี ใช้ฟรี และมีทั้งไทยและอังกฤษ",
        tag: "DATA COLLECTION",
      },
      {
        month: "มิ.ย. 2026",
        title: "แคตตาล็อกสินค้า CBAM จริง — 67 รหัส CN",
        desc: "สินค้ากลุ่มเหล็ก เหล็กกล้า และอะลูมิเนียม จับคู่กับรหัส CN จริง การยื่นรายงานจึงสร้างจากสินค้าจริงของคุณ ไม่ใช่การกรอกข้อความเดา",
        tag: "COMPLIANCE ENGINE",
      },
      {
        month: "มิ.ย. 2026",
        title: "ชุดเอกสารตรวจสอบที่ผนึกแล้วและไฟล์ส่งออก Annex IV",
        desc: "รายงาน 24 หน้าผนึกด้วย SHA-256 พร้อมไฟล์ XML ตาม Annex IV ที่ผู้ยื่นของผู้ซื้อต้องใช้ และการส่งเข้า O3CI โดยตรง ส่งออกครั้งเดียว ถึงสามปลายทาง",
        tag: "REPORTS & HANDOFF",
      },
      {
        month: "พ.ค. 2026",
        title: "คำขอข้อมูลจากผู้ซื้อ",
        desc: "แบบสอบถาม Scope 3 และ CSRD จากผู้ซื้อในสหภาพยุโรป ตอบได้จากข้อมูลซัพพลายเออร์ชุดเดียวกับที่เก็บไว้สำหรับ CBAM ไม่ต้องส่งอีเมลตามอีกรอบ",
        tag: "DATA COLLECTION",
      },
      {
        month: "พ.ค. 2026",
        title: "การเก็บข้อมูลผ่าน Smart Link สองภาษา",
        desc: "ลิงก์ปลอดภัยหนึ่งลิงก์ต่อซัพพลายเออร์หนึ่งราย ไม่ต้องเข้าสู่ระบบ ไม่ต้องอบรม พร้อมแบบฟอร์มที่มีคำแนะนำครบทั้งภาษาไทยและอังกฤษ",
        tag: "DATA COLLECTION",
      },
    ],
    building: [
      {
        title: "พื้นที่ทำงานสำหรับผู้นำเข้าและผู้ยื่นรายงาน",
        desc: "ฝั่งสหภาพยุโรปของข้อมูลชุดเดียวกัน รวบรวมข้อมูลการปล่อยคาร์บอนที่ผ่านการตรวจสอบจากผู้ส่งออก คำนวณใบรับรอง และจัดเตรียมการยื่นรายงาน CBAM ประจำปี ขณะนี้อยู่ระหว่างทดสอบภายใน",
        when: "เป้าหมาย ไตรมาส 4/2026",
      },
      {
        title: "รองรับ UK CBAM",
        desc: "ระบบของสหราชอาณาจักรเริ่มมกราคม 2027 โดยมีกฎและรายการสินค้าของตัวเอง เรากำลังพัฒนาให้ครอบคลุมตามแนวปฏิบัติที่ประกาศออกมา",
        when: "เป้าหมาย ไตรมาส 1/2027",
      },
      {
        title: "การส่งต่อให้ผู้ทวนสอบ",
        desc: "พื้นที่ทำงานแบบอ่านอย่างเดียวสำหรับผู้ทวนสอบภายนอก การทวนสอบจะได้ไม่กลายเป็นกองไฟล์ PDF ที่ส่งกันทางอีเมล",
        when: "เป้าหมาย ไตรมาส 4/2026",
      },
      {
        title: "นำเข้าข้อมูลจาก ERP และสเปรดชีต",
        desc: "นำเข้าข้อมูลสินค้าและการส่งออกทีละมาก ๆ จับคู่คอลัมน์ของคุณครั้งเดียวแล้วระบบจำไว้ ก่อนที่ API เต็มรูปแบบจะพร้อม",
        when: "เป้าหมาย ไตรมาส 4/2026",
      },
    ],
    next: [
      {
        title: "EUDR — การตัดไม้ทำลายป่า",
        desc: "เก็บข้อมูลพิกัดและการตรวจสอบสถานะผ่านลิงก์ซัพพลายเออร์ชุดเดียวกัน",
      },
      {
        title: "โมดูลรายงาน CSRD",
        desc: "การรายงานความยั่งยืนเต็มรูปแบบ ไม่ใช่เพียงแบบสอบถามจากผู้ซื้อที่เราตอบได้อยู่แล้ว",
      },
      {
        title: "เพิ่มภาษาสำหรับซัพพลายเออร์",
        desc: "เวียดนาม ตุรกี และฮินดี สามตลาดผู้ส่งออกถัดไปหลังจากไทย",
      },
      {
        title: "API สาธารณะ",
        desc: "เข้าถึงข้อมูลการยื่นรายงาน การส่งข้อมูล และไฟล์ส่งออกผ่านโปรแกรม สำหรับทีมที่มีระบบของตัวเอง",
      },
    ],
  },

  solutionPage: {
    whatYouGet: "สิ่งที่คุณจะได้",
    closingHeadline: "ดูมันทำงานกับซัพพลายเชนของคุณเอง",
    closingIntro:
      "พาชม 30 นาที ตั้งแต่การเชิญซัพพลายเออร์จนถึงรายงานที่ผู้ซื้อนำไปใช้ได้จริง ซัพพลายเออร์ใช้ฟรีเสมอ",
    closingHeadlineSoon: "อยากใช้ตั้งแต่วันแรกที่เปิดไหม",
    closingIntroSoon:
      "ลงชื่อไว้ แล้วเราจะติดต่อกลับก่อนเปิดใช้งานจริง ระหว่างนี้ ฝั่งผู้ส่งออกใช้งานได้แล้ววันนี้",
    waitlist: {
      badge: "สิทธิ์เข้าใช้ก่อนใคร",
      headline: "ยังไม่เปิดใช้งาน\nแต่จองคิวไว้ได้",
      intro:
        "ทิ้งข้อมูลติดต่อไว้ แล้วเราจะติดต่อกลับก่อนที่ส่วนนี้ของแพลตฟอร์มจะเปิด ไม่มีจดหมายข่าว ไม่มีอีเมลตามรบกวน",
      submit: "ลงชื่อรอใช้งาน",
      note: "อีเมลฉบับเดียวตอนเปิดใช้งาน ไม่มีอย่างอื่น และไม่เปิดเผยให้ใคร",
      confirmedBadge: "คุณอยู่ในรายชื่อแล้ว",
      confirmedTitle: "คุณอยู่ในรายชื่อแล้ว",
      confirmedBody: "เราจะเขียนถึง",
      confirmedTail:
        "ก่อนที่ส่วนนี้จะเปิดใช้งาน หากอยากเห็นฝั่งผู้ส่งออกที่ใช้งานได้แล้ววันนี้ นัดชมระบบได้เลย",
      errors: {
        required: "กรุณากรอกข้อมูล",
        emailFormat: "กรุณากรอกอีเมลให้ถูกต้อง",
        emailPersonal: "กรุณาใช้อีเมลของบริษัท",
        phoneDigits: "กรุณากรอกเบอร์โทรศัพท์",
        phoneLength: "กรุณาตรวจสอบจำนวนหลักของเบอร์โทรในประเทศนี้",
      },
    },
    exporters: {
      eyebrow: "สำหรับผู้ส่งออก",
      headline: "พิสูจน์ให้ได้ก่อน\nก่อนที่เขาจะต้องเอ่ยขอ",
      intro:
        "คู่แข่งทุกรายในตลาดนี้ขายให้ผู้ซื้อของคุณ แต่ Certrace สร้างขึ้นเพื่อฝั่งคุณ เก็บข้อมูลซัพพลายเออร์ครั้งเดียว คำนวณให้เป็นรูปแบบของสหภาพยุโรป เห็นว่ามันทำให้คุณเสียเท่าไหร่ และมีรายงานที่พร้อมส่งผู้ซื้อรออยู่เสมอ คำตอบจึงมีอยู่ก่อนที่คำขอจะมาถึง",
    },
    suppliers: {
      eyebrow: "สำหรับซัพพลายเออร์",
      headline: "กรอกครั้งเดียว\nไม่ต้องกรอกอีก",
      intro:
        "รับ Smart Link กรอกแบบฟอร์มเดียวที่มีคำแนะนำในภาษาของคุณเอง จากอุปกรณ์ใดก็ได้ และเห็นผลตรวจก่อนกดส่ง คำตอบของคุณถูกบันทึกไว้ในโปรไฟล์ และเติมให้เองในทุกคำขอถัดไป รวมถึงคำขอจากผู้ซื้อรายอื่น",
      benefitsHeadline: "สิ่งที่คุณต้องทำจริง ๆ",
      benefitsIntro:
        "แบบฟอร์มเดียว ครั้งเดียว ทุกอย่างข้างล่างนี้คือสิ่งที่เกิดขึ้นรอบ ๆ มัน เพื่อให้คุณไม่ต้องกรอกช่องเดิมซ้ำสองครั้ง",
      benefits: [
        {
          title: "ลิงก์เดียว ทุกอุปกรณ์",
          desc: "ลูกค้าส่งลิงก์มาให้ เปิดบนมือถือในกระเป๋าแล้วกรอกตอนที่คุณว่างได้เลย ไม่มีอะไรต้องดาวน์โหลด และไม่ต้องสมัครบัญชี",
          points: [
            "ไม่ต้องเข้าสู่ระบบ ไม่ต้องมีรหัสผ่าน",
            "ใช้บนมือถือได้",
            "หยุดไว้แล้วกลับมาทำต่อได้",
          ],
        },
        {
          title: "เขียนในภาษาของคุณ",
          desc: "วันนี้มีไทยและอังกฤษ และจะเพิ่มตามตลาดที่เราเปิด ทุกคำถามใช้คำง่าย ๆ พร้อมคำอธิบายว่าหมายถึงอะไร และหาคำตอบได้จากที่ไหน",
          points: [
            "ไทยและอังกฤษแล้ววันนี้",
            "คำง่าย ๆ ไม่ใช่ภาษากฎหมาย",
            "มีคำใบ้ในทุกคำถาม",
          ],
        },
        {
          title: "กรอกครั้งเดียว ใช้ซ้ำได้",
          desc: "สิ่งที่คุณกรอกจะถูกบันทึกไว้ในโปรไฟล์ของคุณเอง และเติมให้เองในคำขอครั้งถัดไป ทั้งรอบรายงานถัดไป และลูกค้ารายอื่นที่ถามเรื่องเดียวกัน",
          points: [
            "ใช้ต่อได้ข้ามรอบรายงาน",
            "ใช้ต่อได้ข้ามลูกค้า",
            "ไม่กี่นาที แทนที่จะเป็นทั้งบ่าย",
          ],
        },
        {
          title: "ตรวจให้ก่อนคุณกดส่ง",
          desc: "หลักฐานที่ขาด หน่วยที่ผิด ตัวเลขที่ไม่สอดคล้องกับข้ออื่น ถูกจับได้ตั้งแต่ตอนที่คุณยังกรอกอยู่ และอธิบายให้ฟัง ไม่ใช่แค่ขึ้นเตือน",
          points: [
            "จับได้ตั้งแต่ตอนกรอก",
            "บอกว่าต้องแก้อะไร",
            "ไม่ต้องส่งอีเมลไปมา",
          ],
        },
        {
          title: "เปิดให้แก้เฉพาะจุดที่เปลี่ยน",
          desc: "ถ้าลูกค้าขอให้แก้ไข ส่วนที่คุณกรอกถูกแล้วจะถูกล็อกไว้ คุณจะเห็นชัดว่าช่องไหนเปิดให้แก้ และไม่ต้องไปยุ่งกับส่วนอื่นเลย",
          points: [
            "ส่วนที่เหลือยังส่งไว้เหมือนเดิม",
            "ดูสิ่งที่ถูกขอได้ในที่เดียว",
            "ไม่ต้องเริ่มใหม่ทั้งหมด",
          ],
        },
        {
          title: "ใช้ฟรี และเห็นเฉพาะคนที่ขอ",
          desc: "ซัพพลายเออร์ไม่ต้องจ่ายค่า Certrace ในทุกแพ็กเกจ สิ่งที่คุณส่งจะเห็นได้เฉพาะลูกค้าที่เป็นคนขอ และยังเป็นของคุณที่จะนำไปใช้กับรายอื่นได้",
          points: [
            "ไม่มีค่าใช้จ่าย ตลอดไป",
            "เห็นได้เฉพาะผู้ที่ขอ",
            "เป็นของคุณ นำไปใช้ซ้ำได้",
          ],
        },
      ],
    },
    legal: {
      eyebrow: "สำหรับฝ่ายกฎหมายและกำกับดูแล",
      headline: "การรับรองที่ระบุชื่อ\nร่องรอยตรวจสอบที่ครบถ้วน",
      intro:
        "พื้นที่ทำงานเฉพาะสำหรับฝ่ายกฎหมายและกำกับดูแลกำลังถูกสร้างอยู่ เมื่อเปิดใช้งาน รายงานจะถูกส่งออกก็ต่อเมื่อมีการรับรองที่ระบุชื่อผู้อนุมัติแล้วเท่านั้น พร้อมการเสนอให้ฝ่ายกฎหมายตรวจโดยอัตโนมัติทุกครั้งที่ระบบพบการเกินเพดานค่าตั้งต้นหรือความผิดปกติ และทุกการตัดสินใจจะถูกบันทึกไว้ในร่องรอยการตรวจสอบ",
    },
    importers: {
      eyebrow: "สำหรับผู้นำเข้า",
      headline: "พื้นที่ทำงานของผู้ยื่นรายงาน\nฝั่งสหภาพยุโรป เร็ว ๆ นี้",
      intro:
        "รวบรวมข้อมูลการปล่อยคาร์บอนที่ผู้ส่งออกของคุณส่งไว้แล้ว คำนวณใบรับรอง และยื่นรายงาน CBAM ประจำปี นี่คือฝั่งของผู้ยื่นรายงาน CBAM ที่ได้รับอนุญาต สร้างบนชุดข้อมูลที่ผ่านการตรวจสอบชุดเดียวกับที่ซัพพลายเออร์กรอกไว้",
    },
  },
};

/* The three newest languages live in their own modules — five dictionaries in
   one file would be about five thousand lines, and each language is edited on
   its own. They are built from a function taking `en` rather than importing it,
   which is what keeps this from being an initialisation cycle: see the note at
   the top of content-vi.ts. `en` and `th` stay here, where they have always
   been. */
export const CONTENT: Record<Lang, Content> = {
  en,
  th,
  vi: buildVi(en),
  tr: buildTr(en),
  hi: buildHi(en),
};
