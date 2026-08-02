/* Bilingual copy for the whole marketing site.
   `th` is typed as `Content` (= the shape of `en`), so a missing or renamed key
   in either language is a build error rather than a silent English fallback on
   a Thai page.

   Scope note: prose, labels and headings are translated. The mock product UI
   inside the module visuals and the live supplier table stays in English — it
   depicts console/table output, and Thai script at 8px monospace is unreadable.
   Thai dates use the Buddhist Era, matching how Thai business copy is written. */

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
          label: "Smart Link Collection",
          desc: "One secure link per supplier. No accounts, no training.",
        },
        {
          label: "AI Quality Check",
          desc: "Trust scores and plain-English summaries on every submission.",
        },
        {
          label: "Compliance Engine",
          desc: "Definitive-period CBAM rules, computed deterministically.",
        },
        {
          label: "Reports & Handoff",
          desc: "Sealed audit package, Annex IV XML, O3CI dispatch.",
        },
      ],
      footer: "See all features",
    },
    solutions: {
      label: "Solutions",
      items: [
        {
          label: "For Exporters",
          desc: "Run the whole declaration from one guided workspace.",
        },
        {
          label: "For Suppliers",
          desc: "A free guided form, in Thai or English, from any device.",
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
        {
          label: "Buyer Data Requests",
          desc: "Scope 3 and CSRD questionnaires from your EU buyers, answered from the same data.",
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
          label: "Careers",
          desc: "Roles will be posted here as the team grows.",
        },
      ],
      footer: "Book a demo",
    },
  },

  hero: {
    badge: "CARBON COMPLIANCE INFRASTRUCTURE",
    headline: "Supply chain\ncarbon compliance.\nWithout the chaos.",
    intro:
      "An AI workflow platform connecting exporters and suppliers to automate CBAM carbon data collection — from request to audit-ready reports.",
    stats: [
      "Real CN-coded CBAM goods covered",
      "Lower compliance cost per filing",
      "Fewer staff hours chasing suppliers",
      "Faster carbon accounting turnaround",
    ],
    videoTitle: "Certrace product walkthrough",
  },

  problem: {
    badge: "THE PROBLEM",
    headline: "CBAM compliance today\nis slow, costly, and fragile.",
    intro:
      "Every quarter, exporters spend months chasing suppliers over email, paying consultants to consolidate inconsistent data, and still submitting reports that get rejected.",
    cards: [
      {
        eyebrow: "TIME",
        title: "Filing takes months, not days.",
        unit: " wks",
        caption: "per filing, start to dispatch",
      },
      {
        eyebrow: "MONEY",
        title: "Every quarter costs more than it should.",
        unit: "K",
        caption: "spent per filing, all-in",
      },
      {
        eyebrow: "RISK",
        title: "One mistake, and the report bounces.",
        unit: "%",
        caption: "of manual filings get sent back",
      },
    ],
    costLabel: "The true annual cost of CBAM compliance without Certrace",
    costPer: "per year",
  },

  whyNow: {
    badge: "WHY NOW",
    headline: "Get ready.\nCBAM is already here.",
    intro:
      "The definitive period began in January 2026 — every shipment now counts. From February 2027, certificates are priced on exactly what you report.",
    milestones: [
      {
        date: "OCT 2023",
        label: "Transitional period begins",
        desc: "Reporting only — no certificates required yet.",
      },
      {
        date: "JAN 2026",
        label: "Definitive period begins",
        desc: "Full CBAM obligations apply to every shipment.",
      },
      {
        date: "FEB 2027",
        label: "Certificate sales open",
        desc: "Importers start buying CBAM certificates for 2026 emissions.",
      },
      {
        date: "SEP 2027",
        label: "First annual declaration due",
        desc: "Deadline to declare and surrender certificates for 2026.",
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
    headline: "Everything in one place.\nAlways up to date.",
    intro:
      "Every supplier, every submission, every deadline — visible the moment it changes. No status-update meetings. No version confusion.",
    suppliersSubmitted: "suppliers submitted\nthis quarter",
    stats: [
      "24 / 30 suppliers approved",
      "94% data completion",
      "6 days to deadline",
    ],
  },

  platform: {
    badge: "THE PLATFORM",
    headline: "Four modules.\nOne seamless system.",
    intro:
      "No spreadsheets to stitch together, no separate tools to reconcile. Every step — collect, check, approve, dispatch — is built to pass verification the first time.",
    modules: [
      {
        label: "01 / SMART LINK COLLECTION",
        title: "One link per supplier. Zero chasing.",
        desc: "Each supplier receives a secure Smart Link — a guided, bilingual questionnaire covering exactly the CBAM data points their products require. No supplier accounts, no training, automatic reminders. When something needs fixing, only those fields reopen.",
        tags: [
          "Guided questionnaire",
          "Per-product data points",
          "Auto-reminders",
          "No supplier accounts",
        ],
      },
      {
        label: "02 / AI QUALITY CHECK",
        title: "Every submission screened before it reaches you.",
        desc: "As suppliers submit, Certrace runs an AI quality check — completeness against the required CBAM fields, unit and range anomalies, weak evidence — and writes a plain-English executive summary with a trust score. Advisory only: your filed figures stay deterministic.",
        tags: [
          "Trust score",
          "Executive summary",
          "Anomaly flags",
          "Evidence review",
        ],
      },
      {
        label: "03 / COMPLIANCE ENGINE",
        title: "Definitive-period rules, enforced before anything leaves.",
        desc: "Deterministic checks aligned to the 2026 definitive period: default-value caps for complex goods, Scope 2 treatment by category, verification gating, and a CBAM cost-exposure estimate. A registry pre-flight blocks dispatch until every hard error is resolved.",
        tags: [
          "20% default cap",
          "Scope 2 rules",
          "€ exposure",
          "Registry pre-flight",
        ],
      },
      {
        label: "04 / REPORTS & HANDOFF",
        title: "An audit package your buyer's declarant can file on.",
        desc: "Generate the full CBAM Communication & Audit Package — sealed with a SHA-256 hash, a chapter per supplier — plus Annex IV-structured XML. Push installation data to the EU's O3CI portal and send the communication template to your buyer's declarant, straight from the platform.",
        tags: [
          "24-page audit package",
          "Annex IV template",
          "O3CI push",
          "SHA-256 sealed",
        ],
      },
    ],
  },

  comparison: {
    badge: "WHY CERTRACE",
    headline: "Same deadline. Three very\ndifferent ways to get there.",
    intro:
      "However you handle compliance today, here's how it stacks up against a platform built for exactly this job.",
    colDiy: "Internally managed",
    colConsultant: "Consultant",
    rows: [
      {
        label: "Time per filing",
        diy: "10–19 weeks",
        consultant: "6–10 weeks",
        certrace: "Days, not weeks",
      },
      {
        label: "Cost per filing",
        diy: "Hidden internal hours",
        consultant: "฿370K–770K",
        certrace: "A fraction of consultant fees",
      },
      {
        label: "Supplier data",
        diy: "200+ inconsistent formats",
        consultant: "Manually reconciled by hand",
        certrace: "One guided form, every supplier",
      },
      {
        label: "Quality checks",
        diy: "Manual, easy to miss",
        consultant: "Caught after the fact",
        certrace: "AI-checked the moment it arrives",
      },
      {
        label: "Audit-readiness",
        diy: "Assembled last minute",
        consultant: "Delivered as a static report",
        certrace: "Sealed, versioned, always ready",
      },
      {
        label: "Scales with suppliers",
        diy: "Breaks down past a handful",
        consultant: "Re-billed every quarter",
        certrace: "Built to grow with your network",
      },
    ],
  },

  howItWorks: {
    badge: "HOW IT WORKS",
    headline: "Four simple steps.\nNo learning curve.",
    steps: [
      {
        title: "Create",
        desc: "Pick your products. The wizard handles the rest.",
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
        desc: "Suppliers fill one simple form. No training needed.",
        view: "smart links / collection",
        lines: [
          "# One secure link per supplier — no accounts",
          "✓ 6 Smart Links issued · TH + EN",
          "● thai-metal-pro opened their form",
          "✓ chonburi-fab submitted via mobile",
          "",
          "→ AI quality check · trust score 87/100",
          "● changes requested → 2 fields reopened",
          "✓ resubmitted · v2 · in review",
        ],
      },
      {
        title: "Review",
        desc: "Approve with confidence — errors get caught automatically.",
        view: "workspace / review & sign-off",
        lines: [
          "# Deterministic engine · definitive-period rules",
          "✓ default-value cap (20%) — passed",
          "✓ verification records — 6/6",
          "→ CBAM exposure estimate · €41,200",
          "",
          "✓ all suppliers approved → report generated",
          "● sign-off requested — legal · management",
          "✓ 2/2 confirmed",
        ],
      },
      {
        title: "Send & export",
        desc: "One click sends everything, everywhere it needs to go.",
        view: "workspace / send & export",
        lines: [
          "# Registry pre-flight — 0 errors",
          "✓ 24-page package sealed · sha256 9f3a…c21d",
          "✓ Annex IV communication template (XML)",
          "",
          "→ pushed to O3CI portal",
          "→ template sent to buyer's declarant",
          "✓ acknowledgements received",
          "You never chase the registry. Your buyer files.",
        ],
      },
    ],
  },

  stakeholders: {
    badge: "WHO IT'S FOR",
    headline: "Built for every stakeholder\nin the compliance chain.",
    audiences: [
      {
        title: "Exporters",
        desc: "Run the whole declaration from one workspace — guided wizard, live Smart Link tracking, approvals, and dispatch.",
        cta: "See the exporter solution",
      },
      {
        title: "Suppliers",
        desc: "One guided form in Thai or English, from any device. No account, no fee, and AI feedback before you submit.",
        cta: "See the supplier solution",
      },
      {
        title: "Legal & Compliance",
        desc: "Nothing dispatches without a named sign-off, and anomalies escalate automatically. Every decision lands in the audit trail.",
        cta: "See the legal solution",
      },
      {
        title: "Importers",
        desc: "Aggregate your exporters' verified data, calculate certificates, and file the annual CBAM declaration from the EU side.",
        cta: "See the importer solution",
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
    note: "Pricing is tailored to your supplier count and compliance requirements · Annual subscription · Suppliers always free · Cancel anytime after year one",
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
        q: "Does Certrace file CBAM with the EU for us?",
        a: "No — no vendor can. Only your EU buyer's Authorised CBAM Declarant may file with the Registry. Certrace gives them everything they need: the Annex IV template, a sealed audit package, and your installation data pushed to O3CI.",
      },
      {
        q: "Do my suppliers need to pay or create an account?",
        a: "No. Each supplier gets one Smart Link — a guided form in Thai or English, on any device. No account, no fee. If something needs fixing, only the flagged fields reopen.",
      },
      {
        q: "What does the AI actually do? Can it change our numbers?",
        a: "It reviews, it never edits. The AI flags gaps, anomalies and weak evidence, then writes a trust score and a plain-English summary so your team reviews faster. Every filed figure comes from the deterministic engine, with its calculation trail attached.",
      },
      {
        q: "Is the output really audit-ready?",
        a: "Yes — a ~24-page CBAM Communication & Audit Package: declaration summary, methodology, a chapter per supplier, evidence register, sign-offs and the full audit trail, sealed with a SHA-256 hash. Annex IV XML ships alongside it.",
      },
      {
        q: "Which regulations does Certrace support today?",
        a: "EU CBAM for iron, steel and aluminium is live, with real CN-coded goods and definitive-period rules built in. Buyer data requests (Scope 3 / CSRD) are live too. UK CBAM, EUDR and full CSRD are in development.",
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
    headline: "Your next filing,\nwithout the chaos.",
    intro:
      "See Certrace running on your own supply chain. A 30-minute demo — from supplier invite to audit-ready export.",
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
    step2Intro: "30 minutes, online. All times in",
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
      "Built for Thailand → EU Exporters",
      "67 Real CN-Coded CBAM Goods Mapped",
      "Iron, Steel & Aluminium — Definitive-Period Ready",
      "SHA-256 Sealed Audit Packages",
      "Annex IV & O3CI-Ready Exports",
      "Bilingual Supplier Workflow — Thai & English",
    ],
    rowTwo: [
      "EU CBAM Regulation 2023/956",
      "CBAM Implementing Regulation (EU) 2023/1773",
      "GHG Protocol",
      "ISO 14064-1",
      "ISO 14067",
      "GDPR",
    ],
    ctaRowOne: [
      "Book a Demo",
      "30-Minute Guided Walkthrough",
      "Your Own Supply Chain, Live",
      "From Supplier Invite to Audit-Ready Export",
      "Suppliers Always Free",
      "No Setup Required to Start",
    ],
    ctaRowTwo: [
      "See It Live",
      "Book Your Slot",
      "Talk to the Team",
      "Get Your Filing Timeline",
      "Start Today",
      "Book a Demo",
    ],
  },

  footer: {
    desc: "An AI workflow platform connecting exporters and suppliers to automate CBAM carbon data collection — from request to audit-ready reports.",
    location: "Bangkok, Thailand",
    columns: {
      platform: "PLATFORM",
      whoItsFor: "WHO IT'S FOR",
      resources: "RESOURCES",
      company: "COMPANY",
    },
    links: {
      smartLink: "Smart Link Collection",
      aiCheck: "AI Quality Check",
      engine: "Compliance Engine",
      reports: "Reports & Handoff",
      exporters: "Exporters",
      suppliers: "Suppliers",
      legalCompliance: "Legal & Compliance",
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
    copyright: "© 2026 Certrace Co., Ltd. All rights reserved.",
    contactSubject: "Hello Certrace",
    issueSubject: "Report an issue",
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
    whatYouGet: "WHAT YOU GET",
    closingHeadline: "See it on your own supply chain.",
    closingIntro:
      "A 30-minute walkthrough — from supplier invite to audit-ready export. Suppliers are always free.",
    exporters: {
      eyebrow: "FOR EXPORTERS",
      headline: "Run the whole declaration\nfrom one guided workspace.",
      intro:
        "Create the declaration in a guided wizard, watch Smart Links fill in real time, approve each submission, and dispatch — one workspace that always shows your next action, from first request to buyer acknowledgement.",
      benefits: [
        {
          title: "Guided declaration wizard",
          desc: "Step through CN codes, installations, and reporting periods without needing to know the regulation by heart — the wizard encodes the definitive-period rules.",
        },
        {
          title: "Smart Links, tracked live",
          desc: "Send one link per supplier and watch submissions, revisions, and AI quality checks land in real time — no more chasing status by email.",
        },
        {
          title: "Approve and dispatch in one place",
          desc: "Review AI-flagged anomalies, request revisions on just the affected fields, and sign off — all from the same workspace.",
        },
        {
          title: "Audit-ready output",
          desc: "A sealed, SHA-256-hashed package plus Annex IV XML, ready for your buyer's Authorised CBAM Declarant to file on.",
        },
      ],
    },
    suppliers: {
      eyebrow: "FOR SUPPLIERS",
      headline: "A free guided form.\nNo account, no fee.",
      intro:
        "Receive a Smart Link, fill one guided form in Thai or English from any device, and get AI feedback before submitting. If a revision is requested, only those fields reopen — everything else stays locked.",
      benefits: [
        {
          title: "One Smart Link, any device",
          desc: "No login, no software to install. Open the link on your phone or desktop and fill in your data at your own pace.",
        },
        {
          title: "Bilingual, Thai or English",
          desc: "Every question and instruction is written in plain language in both Thai and English — switch anytime.",
        },
        {
          title: "AI feedback before you submit",
          desc: "Catch missing evidence or inconsistent figures before your exporter even sees them, with plain-English guidance.",
        },
        {
          title: "Only the flagged fields reopen",
          desc: "If your exporter requests a revision, the rest of your submission stays locked — you only touch what changed.",
        },
      ],
    },
    legal: {
      eyebrow: "FOR LEGAL & COMPLIANCE",
      headline: "Named sign-offs.\nA complete audit trail.",
      intro:
        "Reports go out only after named sign-offs — and legal review is auto-suggested whenever the engine flags a default-value cap breach or anomaly. Every decision lands in the audit trail.",
      benefits: [
        {
          title: "Sign-off, not rubber-stamping",
          desc: "Every declaration requires a named reviewer before it dispatches — no report leaves without accountability attached.",
        },
        {
          title: "Anomalies auto-escalate",
          desc: "When the compliance engine flags a default-value cap breach or an outlier submission, legal review is suggested automatically.",
        },
        {
          title: "Definitive-period rules, encoded",
          desc: "Default-value caps, Scope 2 treatment by category, and verification requirements are built into the engine — not left to interpretation.",
        },
        {
          title: "A sealed, versioned record",
          desc: "The full calculation trail, evidence register, and sign-off history ship in a SHA-256-hashed package — provable, not just filed.",
        },
      ],
    },
    importers: {
      eyebrow: "FOR IMPORTERS",
      headline: "The EU-side declarant\nworkspace. Coming soon.",
      intro:
        "Aggregate the emissions data your exporters already submitted, run the certificate calculation, and file the annual CBAM declaration — the Authorised CBAM Declarant's side of the workflow, built on the same verified dataset your suppliers filled in.",
      ctaLabel: "JOIN THE WAITLIST",
      benefits: [
        {
          title: "One dataset, both sides",
          desc: "No re-entering data your exporters already collected — the importer workspace reads from the same verified Smart Link submissions.",
        },
        {
          title: "Certificate calculation",
          desc: "Turn aggregated embedded emissions into the certificate volumes and cost exposure you need to plan for, before the annual deadline.",
        },
        {
          title: "Annual declaration filing",
          desc: "Prepare and submit the CBAM annual declaration with the same audit-ready discipline as the exporter side.",
        },
        {
          title: "Built, not hypothetical",
          desc: "The importer workspace already exists as a standalone product — this is a landing page ahead of its public launch, not a roadmap promise.",
        },
      ],
    },
  },
};

export type Content = typeof en;

const th: Content = {
  common: {
    bookDemo: "จองการสาธิต",
    getStarted: "เริ่มต้นใช้งาน",
    seeHowItWorks: "ดูวิธีการทำงาน",
    requestPricing: "ขอใบเสนอราคา",
    allSolutions: "ดูโซลูชันทั้งหมด",
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
    backToTop: "Certrace — กลับสู่ด้านบน",
    primary: "เมนูหลัก",
    mobile: "เมนูมือถือ",
    platform: {
      label: "แพลตฟอร์ม",
      items: [
        {
          label: "Smart Link Collection",
          desc: "ลิงก์ปลอดภัยหนึ่งลิงก์ต่อซัพพลายเออร์หนึ่งราย ไม่ต้องสมัครบัญชี ไม่ต้องอบรม",
        },
        {
          label: "AI Quality Check",
          desc: "คะแนนความน่าเชื่อถือและบทสรุปที่อ่านเข้าใจง่ายในทุกการส่งข้อมูล",
        },
        {
          label: "Compliance Engine",
          desc: "กฎ CBAM ช่วงบังคับใช้จริง คำนวณอย่างแม่นยำและตรวจสอบย้อนกลับได้",
        },
        {
          label: "Reports & Handoff",
          desc: "ชุดเอกสารตรวจสอบที่ผนึกแล้ว ไฟล์ XML ตาม Annex IV และการส่งเข้า O3CI",
        },
      ],
      footer: "ดูฟีเจอร์ทั้งหมด",
    },
    solutions: {
      label: "โซลูชัน",
      items: [
        {
          label: "สำหรับผู้ส่งออก",
          desc: "จัดการการยื่นรายงานทั้งหมดจากพื้นที่ทำงานเดียวที่มีคำแนะนำทุกขั้นตอน",
        },
        {
          label: "สำหรับซัพพลายเออร์",
          desc: "แบบฟอร์มพร้อมคำแนะนำ ใช้ฟรี ทั้งภาษาไทยและอังกฤษ จากอุปกรณ์ใดก็ได้",
        },
        {
          label: "สำหรับฝ่ายกฎหมายและกำกับดูแล",
          desc: "การอนุมัติที่ระบุชื่อผู้รับผิดชอบ พร้อมร่องรอยการตรวจสอบครบถ้วน",
        },
        {
          label: "สำหรับผู้นำเข้า",
          desc: "พื้นที่ทำงานฝั่งผู้ยื่นรายงานในสหภาพยุโรปสำหรับการยื่น CBAM",
        },
      ],
      footer: "Certrace สร้างมาเพื่อใคร",
    },
    regulations: {
      label: "กฎระเบียบ",
      items: [
        {
          label: "EU CBAM",
          desc: "เหล็ก เหล็กกล้า และอะลูมิเนียม — สินค้า 67 รายการตามรหัส CN พร้อมกฎช่วงบังคับใช้จริง",
        },
        {
          label: "คำขอข้อมูลจากผู้ซื้อ",
          desc: "แบบสอบถาม Scope 3 และ CSRD จากผู้ซื้อในสหภาพยุโรป ตอบได้จากชุดข้อมูลเดียวกัน",
        },
      ],
      footer: "ดูสิ่งที่เพิ่งอัปเดต",
    },
    pricing: "ราคา",
    resources: {
      label: "แหล่งข้อมูล",
      items: [
        {
          label: "วิธีการทำงาน",
          desc: "สี่ขั้นตอน ตั้งแต่เชิญซัพพลายเออร์จนถึงไฟล์ที่พร้อมตรวจสอบ",
        },
        {
          label: "คำถามที่พบบ่อย",
          desc: "ใครเป็นผู้ยื่นจริง AI ทำอะไรบ้าง และข้อมูลถูกปกป้องอย่างไร",
        },
        {
          label: "ไทม์ไลน์ CBAM",
          desc: "ทุกกำหนดเวลา ตั้งแต่ช่วงเปลี่ยนผ่านจนถึงการยื่นรายงานประจำปีครั้งแรก",
        },
        {
          label: "แผนพัฒนา",
          desc: "ทุกอย่างที่เราปล่อยแล้ว เรียงจากใหม่ไปเก่า",
        },
      ],
      footer: "จองการสาธิต",
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
          desc: "เราคือใคร และทำไมเราจึงสร้างสิ่งนี้ เร็ว ๆ นี้",
        },
        {
          label: "ร่วมงานกับเรา",
          desc: "ตำแหน่งงานจะประกาศที่นี่เมื่อทีมเติบโตขึ้น",
        },
      ],
      footer: "จองการสาธิต",
    },
  },

  hero: {
    badge: "โครงสร้างพื้นฐานด้านการปฏิบัติตามกฎคาร์บอน",
    headline: "การจัดการคาร์บอน\nตลอดห่วงโซ่อุปทาน\nโดยไม่วุ่นวาย",
    intro:
      "แพลตฟอร์ม AI ที่เชื่อมผู้ส่งออกกับซัพพลายเออร์ เพื่อรวบรวมข้อมูลคาร์บอนตามข้อกำหนด CBAM แบบอัตโนมัติ ตั้งแต่การร้องขอจนถึงรายงานที่พร้อมตรวจสอบ",
    stats: [
      "รายการสินค้า CBAM ตามรหัส CN จริง",
      "ต้นทุนการปฏิบัติตามกฎต่อการยื่นหนึ่งครั้ง",
      "ชั่วโมงทำงานที่ต้องตามซัพพลายเออร์",
      "ความเร็วในการจัดทำบัญชีคาร์บอน",
    ],
    videoTitle: "แนะนำการใช้งาน Certrace",
  },

  problem: {
    badge: "ปัญหาที่เกิดขึ้น",
    headline: "วันนี้การทำ CBAM\nช้า แพง และเปราะบาง",
    intro:
      "ทุกไตรมาส ผู้ส่งออกต้องใช้เวลาหลายเดือนไล่ตามซัพพลายเออร์ทางอีเมล จ่ายค่าที่ปรึกษาเพื่อรวบรวมข้อมูลที่ไม่สอดคล้องกัน และสุดท้ายรายงานก็ยังถูกตีกลับ",
    cards: [
      {
        eyebrow: "เวลา",
        title: "การยื่นรายงานใช้เวลาเป็นเดือน ไม่ใช่เป็นวัน",
        unit: " สัปดาห์",
        caption: "ต่อการยื่นหนึ่งครั้ง ตั้งแต่เริ่มจนส่ง",
      },
      {
        eyebrow: "ต้นทุน",
        title: "ทุกไตรมาสมีค่าใช้จ่ายสูงเกินความจำเป็น",
        unit: "K",
        caption: "ต่อการยื่นหนึ่งครั้ง รวมทุกค่าใช้จ่าย",
      },
      {
        eyebrow: "ความเสี่ยง",
        title: "พลาดเพียงจุดเดียว รายงานก็ถูกตีกลับ",
        unit: "%",
        caption: "ของการยื่นที่ทำด้วยมือถูกตีกลับ",
      },
    ],
    costLabel: "ต้นทุนที่แท้จริงต่อปีของการทำ CBAM โดยไม่มี Certrace",
    costPer: "ต่อปี",
  },

  whyNow: {
    badge: "ทำไมต้องตอนนี้",
    headline: "เตรียมพร้อมไว้\nCBAM มาถึงแล้ว",
    intro:
      "ช่วงบังคับใช้จริงเริ่มตั้งแต่มกราคม 2026 ทุกการส่งออกมีผลแล้ว และตั้งแต่กุมภาพันธ์ 2027 ใบรับรองจะคิดราคาจากสิ่งที่คุณรายงาน",
    milestones: [
      {
        date: "ต.ค. 2023",
        label: "เริ่มช่วงเปลี่ยนผ่าน",
        desc: "รายงานอย่างเดียว ยังไม่ต้องใช้ใบรับรอง",
      },
      {
        date: "ม.ค. 2026",
        label: "เริ่มช่วงบังคับใช้จริง",
        desc: "ภาระผูกพัน CBAM มีผลเต็มรูปแบบกับทุกการส่งออก",
      },
      {
        date: "ก.พ. 2027",
        label: "เริ่มขายใบรับรอง",
        desc: "ผู้นำเข้าเริ่มซื้อใบรับรอง CBAM สำหรับการปล่อยคาร์บอนปี 2026",
      },
      {
        date: "ก.ย. 2027",
        label: "กำหนดยื่นรายงานประจำปีครั้งแรก",
        desc: "เส้นตายในการยื่นรายงานและส่งมอบใบรับรองของปี 2026",
      },
    ],
    countdown: {
      eyebrow: "ย้อนเวลากลับไม่ได้",
      title: "การปล่อยคาร์บอนของเดือนที่ผ่านมา วัดย้อนหลังไม่ได้อีกแล้ว",
      units: ["วัน", "ชม.", "นาที", "วินาที"],
    },
    quote:
      "“ผู้ส่งออกที่ไม่สามารถจัดทำรายงานคาร์บอนที่ผ่านการตรวจสอบได้ เสี่ยงต่อการสูญเสียการเข้าถึงตลาดยุโรปอย่างถาวร”",
  },

  live: {
    badge: "แพลตฟอร์มที่ทำงานจริง",
    headline: "ทุกอย่างอยู่ในที่เดียว\nอัปเดตตลอดเวลา",
    intro:
      "ทุกซัพพลายเออร์ ทุกการส่งข้อมูล ทุกเส้นตาย มองเห็นได้ทันทีที่มีการเปลี่ยนแปลง ไม่ต้องประชุมอัปเดตสถานะ ไม่ต้องสับสนเรื่องเวอร์ชัน",
    suppliersSubmitted: "ซัพพลายเออร์ส่งข้อมูลแล้ว\nในไตรมาสนี้",
    stats: [
      "อนุมัติแล้ว 24 จาก 30 ซัพพลายเออร์",
      "ข้อมูลครบถ้วน 94%",
      "เหลืออีก 6 วันถึงเส้นตาย",
    ],
  },

  platform: {
    badge: "แพลตฟอร์ม",
    headline: "สี่โมดูล\nทำงานร่วมกันอย่างไร้รอยต่อ",
    intro:
      "ไม่ต้องนำสเปรดชีตมาต่อกันเอง ไม่ต้องกระทบยอดข้ามเครื่องมือ ทุกขั้นตอน ทั้งการเก็บ ตรวจ อนุมัติ และส่ง ถูกออกแบบให้ผ่านการตรวจสอบตั้งแต่ครั้งแรก",
    modules: [
      {
        label: "01 / SMART LINK COLLECTION",
        title: "หนึ่งลิงก์ต่อซัพพลายเออร์ ไม่ต้องตามงาน",
        desc: "ซัพพลายเออร์แต่ละรายจะได้รับ Smart Link ที่ปลอดภัย เป็นแบบสอบถามสองภาษาพร้อมคำแนะนำ ครอบคลุมข้อมูล CBAM ที่สินค้าของเขาต้องใช้พอดี ไม่ต้องสมัครบัญชี ไม่ต้องอบรม พร้อมระบบเตือนอัตโนมัติ และเมื่อมีจุดต้องแก้ ระบบจะเปิดเฉพาะช่องนั้นให้แก้เท่านั้น",
        tags: [
          "แบบสอบถามพร้อมคำแนะนำ",
          "ข้อมูลแยกตามสินค้า",
          "เตือนอัตโนมัติ",
          "ไม่ต้องสมัครบัญชี",
        ],
      },
      {
        label: "02 / AI QUALITY CHECK",
        title: "ทุกการส่งข้อมูลถูกคัดกรองก่อนถึงมือคุณ",
        desc: "เมื่อซัพพลายเออร์ส่งข้อมูลเข้ามา Certrace จะตรวจคุณภาพด้วย AI ทั้งความครบถ้วนตามช่องข้อมูล CBAM ที่กำหนด ความผิดปกติของหน่วยและช่วงค่า รวมถึงหลักฐานที่อ่อน แล้วสรุปเป็นภาษาที่เข้าใจง่ายพร้อมคะแนนความน่าเชื่อถือ ทั้งหมดนี้เป็นเพียงคำแนะนำ ตัวเลขที่ยื่นจริงยังคำนวณด้วยระบบที่ตรวจสอบย้อนกลับได้",
        tags: [
          "คะแนนความน่าเชื่อถือ",
          "บทสรุปผู้บริหาร",
          "แจ้งเตือนความผิดปกติ",
          "ตรวจทานหลักฐาน",
        ],
      },
      {
        label: "03 / COMPLIANCE ENGINE",
        title: "กฎช่วงบังคับใช้จริง ตรวจให้ครบก่อนส่งออกไป",
        desc: "การตรวจสอบที่แม่นยำและทำซ้ำได้ ตามกฎช่วงบังคับใช้จริงปี 2026 ทั้งเพดานค่าตั้งต้นสำหรับสินค้าเชิงซ้อน การจัดการ Scope 2 ตามหมวดสินค้า เงื่อนไขการทวนสอบ และการประเมินภาระต้นทุน CBAM พร้อมการตรวจก่อนยื่นที่จะระงับการส่งไว้จนกว่าจะแก้ข้อผิดพลาดร้ายแรงครบทุกจุด",
        tags: [
          "เพดานค่าตั้งต้น 20%",
          "กฎ Scope 2",
          "ภาระต้นทุนเป็นยูโร",
          "ตรวจก่อนยื่นทะเบียน",
        ],
      },
      {
        label: "04 / REPORTS & HANDOFF",
        title: "ชุดเอกสารที่ผู้ยื่นของลูกค้าคุณใช้ยื่นได้ทันที",
        desc: "สร้างชุดเอกสารสื่อสารและตรวจสอบ CBAM ฉบับเต็ม ผนึกด้วยแฮช SHA-256 แยกเป็นบทต่อซัพพลายเออร์หนึ่งราย พร้อมไฟล์ XML ตามโครงสร้าง Annex IV ส่งข้อมูลโรงงานเข้าพอร์ทัล O3CI ของสหภาพยุโรป และส่งแบบฟอร์มสื่อสารให้ผู้ยื่นของลูกค้าคุณได้จากในระบบโดยตรง",
        tags: [
          "ชุดเอกสารตรวจสอบ 24 หน้า",
          "แบบฟอร์ม Annex IV",
          "ส่งเข้า O3CI",
          "ผนึกด้วย SHA-256",
        ],
      },
    ],
  },

  comparison: {
    badge: "ทำไมต้อง CERTRACE",
    headline: "เส้นตายเดียวกัน\nแต่มีสามเส้นทางที่ต่างกันมาก",
    intro:
      "ไม่ว่าวันนี้คุณจัดการเรื่องนี้อย่างไร นี่คือการเปรียบเทียบกับแพลตฟอร์มที่สร้างมาเพื่องานนี้โดยเฉพาะ",
    colDiy: "ทำเองภายในองค์กร",
    colConsultant: "จ้างที่ปรึกษา",
    rows: [
      {
        label: "เวลาต่อการยื่นหนึ่งครั้ง",
        diy: "10–19 สัปดาห์",
        consultant: "6–10 สัปดาห์",
        certrace: "นับเป็นวัน ไม่ใช่สัปดาห์",
      },
      {
        label: "ต้นทุนต่อการยื่นหนึ่งครั้ง",
        diy: "ต้นทุนแฝงจากเวลาพนักงาน",
        consultant: "฿370K–770K",
        certrace: "เพียงเศษเสี้ยวของค่าที่ปรึกษา",
      },
      {
        label: "ข้อมูลจากซัพพลายเออร์",
        diy: "กว่า 200 รูปแบบที่ไม่ตรงกัน",
        consultant: "กระทบยอดด้วยมือทีละรายการ",
        certrace: "แบบฟอร์มเดียว ใช้กับทุกซัพพลายเออร์",
      },
      {
        label: "การตรวจคุณภาพ",
        diy: "ตรวจด้วยมือ พลาดได้ง่าย",
        consultant: "มักพบหลังเกิดปัญหาแล้ว",
        certrace: "AI ตรวจทันทีที่ข้อมูลเข้ามา",
      },
      {
        label: "ความพร้อมต่อการตรวจสอบ",
        diy: "รวบรวมกันในนาทีสุดท้าย",
        consultant: "ได้เป็นรายงานที่แก้ไขต่อไม่ได้",
        certrace: "ผนึก มีเวอร์ชัน และพร้อมเสมอ",
      },
      {
        label: "รองรับซัพพลายเออร์ที่เพิ่มขึ้น",
        diy: "เกินไม่กี่รายก็เริ่มรับไม่ไหว",
        consultant: "ถูกเรียกเก็บเงินใหม่ทุกไตรมาส",
        certrace: "ออกแบบมาให้โตไปพร้อมเครือข่ายคุณ",
      },
    ],
  },

  howItWorks: {
    badge: "วิธีการทำงาน",
    headline: "สี่ขั้นตอนง่าย ๆ\nไม่ต้องเรียนรู้ใหม่",
    steps: [
      {
        title: "สร้าง",
        desc: "เลือกสินค้าของคุณ แล้วให้ระบบจัดการที่เหลือ",
        view: "การยื่นรายงาน / สร้างใหม่",
        lines: [
          "# CBAM · ไทย → สหภาพยุโรป · ไตรมาส 2/2026",
          "→ วัตถุประสงค์: ชุดข้อมูลสำหรับหน่วยงาน CBAM",
          "",
          "✓ เลือกสินค้า 3 รายการจากแคตตาล็อก CN · 7208 39 00 …",
          "✓ scope 2: รายงานอย่างเดียว (เหล็กและเหล็กกล้า)",
          "✓ จับคู่ซัพพลายเออร์กับสินค้าแล้ว — 6 คำขอ",
          "",
          "→ ตั้งเส้นตาย · 31 ก.ค.",
          "รหัส CN จริง ข้อมูล CBAM จริง",
        ],
      },
      {
        title: "เก็บข้อมูล",
        desc: "ซัพพลายเออร์กรอกแบบฟอร์มเดียว ไม่ต้องอบรม",
        view: "smart links / การเก็บข้อมูล",
        lines: [
          "# ลิงก์ปลอดภัยหนึ่งลิงก์ต่อหนึ่งราย — ไม่ต้องสมัครบัญชี",
          "✓ ออก Smart Link แล้ว 6 ลิงก์ · ไทย + อังกฤษ",
          "● thai-metal-pro เปิดแบบฟอร์มแล้ว",
          "✓ chonburi-fab ส่งข้อมูลผ่านมือถือ",
          "",
          "→ AI ตรวจคุณภาพ · คะแนนความน่าเชื่อถือ 87/100",
          "● ขอให้แก้ไข → เปิดให้แก้ 2 ช่อง",
          "✓ ส่งใหม่แล้ว · เวอร์ชัน 2 · อยู่ระหว่างตรวจ",
        ],
      },
      {
        title: "ตรวจทาน",
        desc: "อนุมัติได้อย่างมั่นใจ เพราะระบบจับข้อผิดพลาดให้อัตโนมัติ",
        view: "พื้นที่ทำงาน / ตรวจทานและอนุมัติ",
        lines: [
          "# ระบบคำนวณที่ตรวจสอบย้อนกลับได้ · กฎช่วงบังคับใช้จริง",
          "✓ เพดานค่าตั้งต้น (20%) — ผ่าน",
          "✓ บันทึกการทวนสอบ — 6/6",
          "→ ประเมินภาระต้นทุน CBAM · €41,200",
          "",
          "✓ อนุมัติครบทุกซัพพลายเออร์ → สร้างรายงานแล้ว",
          "● ขออนุมัติ — ฝ่ายกฎหมาย · ผู้บริหาร",
          "✓ ยืนยันแล้ว 2/2",
        ],
      },
      {
        title: "ส่งและส่งออก",
        desc: "คลิกเดียว ส่งครบทุกอย่างไปยังทุกปลายทางที่ต้องไป",
        view: "พื้นที่ทำงาน / ส่งและส่งออก",
        lines: [
          "# ตรวจก่อนยื่นทะเบียน — ไม่พบข้อผิดพลาด",
          "✓ ผนึกชุดเอกสาร 24 หน้าแล้ว · sha256 9f3a…c21d",
          "✓ แบบฟอร์มสื่อสารตาม Annex IV (XML)",
          "",
          "→ ส่งเข้าพอร์ทัล O3CI แล้ว",
          "→ ส่งแบบฟอร์มให้ผู้ยื่นของผู้ซื้อแล้ว",
          "✓ ได้รับการตอบรับแล้ว",
          "คุณไม่ต้องตามทะเบียนเอง ผู้ซื้อของคุณเป็นผู้ยื่น",
        ],
      },
    ],
  },

  stakeholders: {
    badge: "เหมาะกับใคร",
    headline: "สร้างมาเพื่อทุกฝ่าย\nในห่วงโซ่การปฏิบัติตามกฎ",
    audiences: [
      {
        title: "ผู้ส่งออก",
        desc: "จัดการการยื่นรายงานทั้งหมดจากพื้นที่ทำงานเดียว ทั้งระบบช่วยสร้าง ติดตาม Smart Link แบบเรียลไทม์ อนุมัติ และส่ง",
        cta: "ดูโซลูชันสำหรับผู้ส่งออก",
      },
      {
        title: "ซัพพลายเออร์",
        desc: "แบบฟอร์มเดียวพร้อมคำแนะนำ ทั้งไทยและอังกฤษ จากอุปกรณ์ใดก็ได้ ไม่ต้องสมัครบัญชี ไม่มีค่าใช้จ่าย พร้อมคำแนะนำจาก AI ก่อนส่ง",
        cta: "ดูโซลูชันสำหรับซัพพลายเออร์",
      },
      {
        title: "ฝ่ายกฎหมายและกำกับดูแล",
        desc: "ไม่มีรายงานใดถูกส่งออกไปโดยไม่มีผู้อนุมัติที่ระบุชื่อ ความผิดปกติถูกยกระดับอัตโนมัติ และทุกการตัดสินใจถูกบันทึกไว้",
        cta: "ดูโซลูชันสำหรับฝ่ายกฎหมาย",
      },
      {
        title: "ผู้นำเข้า",
        desc: "รวบรวมข้อมูลที่ผ่านการตรวจสอบจากผู้ส่งออก คำนวณใบรับรอง และยื่นรายงาน CBAM ประจำปีจากฝั่งสหภาพยุโรป",
        cta: "ดูโซลูชันสำหรับผู้นำเข้า",
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
    note: "ราคาปรับตามจำนวนซัพพลายเออร์และข้อกำหนดด้านการปฏิบัติตามกฎ · แบบรายปี · ซัพพลายเออร์ใช้ฟรีเสมอ · ยกเลิกได้ทุกเมื่อหลังปีแรก",
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

  faq: {
    badge: "คำถามที่พบบ่อย",
    /* Not "คำถามที่พบบ่อย" again — the badge directly above already says it,
       and the repeat read as a mistake. Line two is kept short enough to hold
       one line: Chrome's Thai line-breaker splits "ตรงไปตรงมา" down the
       middle, which is a legal break and a bad-looking one. */
    headline: "ข้อสงสัยที่พบบ่อย\nคำตอบที่ชัดเจน",
    items: [
      {
        q: "Certrace ยื่น CBAM กับสหภาพยุโรปแทนเราได้หรือไม่",
        a: "ไม่ได้ และไม่มีผู้ให้บริการรายใดทำแทนได้ มีเพียงผู้ยื่นรายงาน CBAM ที่ได้รับอนุญาต (Authorised CBAM Declarant) ซึ่งเป็นผู้ซื้อของคุณในสหภาพยุโรปเท่านั้นที่ยื่นต่อทะเบียนได้ Certrace จัดเตรียมทุกอย่างที่เขาต้องใช้ ทั้งแบบฟอร์มตาม Annex IV ชุดเอกสารตรวจสอบที่ผนึกแล้ว และการส่งข้อมูลโรงงานของคุณเข้าพอร์ทัล O3CI",
      },
      {
        q: "ซัพพลายเออร์ของเราต้องจ่ายเงินหรือสมัครบัญชีหรือไม่",
        a: "ไม่ต้อง ซัพพลายเออร์แต่ละรายจะได้รับ Smart Link หนึ่งลิงก์ เป็นแบบฟอร์มพร้อมคำแนะนำทั้งภาษาไทยและอังกฤษ ใช้ได้ทุกอุปกรณ์ ไม่ต้องสมัครบัญชี ไม่มีค่าใช้จ่าย และหากมีจุดที่ต้องแก้ ระบบจะเปิดเฉพาะช่องที่ถูกทำเครื่องหมายไว้",
      },
      {
        q: "AI ทำอะไรบ้าง และเปลี่ยนตัวเลขของเราได้หรือไม่",
        a: "AI ทำหน้าที่ตรวจทาน ไม่แก้ไขข้อมูล โดยจะชี้จุดที่ขาด ความผิดปกติ และหลักฐานที่อ่อน แล้วให้คะแนนความน่าเชื่อถือพร้อมบทสรุปที่อ่านเข้าใจง่าย เพื่อให้ทีมของคุณตรวจได้เร็วขึ้น ส่วนตัวเลขที่ยื่นจริงทุกตัวมาจากระบบคำนวณที่ตรวจสอบย้อนกลับได้ พร้อมแนบร่องรอยการคำนวณทั้งหมด",
      },
      {
        q: "ผลลัพธ์ที่ได้พร้อมสำหรับการตรวจสอบจริงหรือไม่",
        a: "ใช่ ไฟล์ที่ได้คือชุดเอกสารสื่อสารและตรวจสอบ CBAM ประมาณ 24 หน้า ประกอบด้วยบทสรุปการยื่น วิธีการคำนวณ บทแยกต่อซัพพลายเออร์หนึ่งราย ทะเบียนหลักฐาน บันทึกการอนุมัติ และร่องรอยการตรวจสอบทั้งหมด ผนึกด้วยแฮช SHA-256 พร้อมไฟล์ XML ตาม Annex IV แนบไปด้วย",
      },
      {
        q: "ปัจจุบัน Certrace รองรับกฎระเบียบใดบ้าง",
        a: "EU CBAM สำหรับกลุ่มเหล็ก เหล็กกล้า และอะลูมิเนียม พร้อมใช้งานแล้ว มีแคตตาล็อกสินค้าตามรหัส CN จริงและกฎช่วงบังคับใช้จริงฝังอยู่ในระบบ ส่วนคำขอข้อมูลจากผู้ซื้อ (Scope 3 / CSRD) ก็พร้อมใช้แล้วเช่นกัน สำหรับ UK CBAM, EUDR และ CSRD เต็มรูปแบบอยู่ระหว่างพัฒนา",
      },
      {
        q: "ถ้ากฎเปลี่ยน จะเกิดอะไรขึ้น",
        a: "เราอัปเดตแบบฟอร์ม กฎในระบบคำนวณ และเทมเพลตการส่งออกจากส่วนกลาง โดยกฎช่วงบังคับใช้จริงปี 2026 ถูกเข้ารหัสไว้แล้ว คุณไม่ต้องสร้างอะไรขึ้นมาใหม่",
      },
      {
        q: "ข้อมูลซัพพลายเออร์ของเราปลอดภัยแค่ไหน",
        a: "ข้อมูลถูกเข้ารหัสทั้งระหว่างส่งและขณะจัดเก็บ Smart Link แต่ละลิงก์จำกัดขอบเขตอยู่ที่ซัพพลายเออร์รายเดียว ซัพพลายเออร์จึงไม่เห็นข้อมูลของกันและกัน ส่วนทีมของคุณเห็นได้เท่าที่สิทธิ์อนุญาต ทุกการกระทำถูกบันทึกไว้ และชุดเอกสารสุดท้ายถูกผนึกด้วยแฮช ทำให้ตรวจพบได้ทันทีหากมีการแก้ไข",
      },
    ],
  },

  cta: {
    /* Three lines, not two. On one line "การยื่นรายงานครั้งถัดไป" overruns the
       column and Chrome breaks it after "ถัด", stranding "ไป" on a line of its
       own — a legal dictionary break that splits a compound word. Breaking it
       ourselves keeps every line on a real word boundary. */
    headline: "การยื่นรายงาน\nครั้งถัดไป\nโดยไม่วุ่นวาย",
    intro:
      "ดู Certrace ทำงานจริงกับห่วงโซ่อุปทานของคุณ การสาธิต 30 นาที ตั้งแต่การเชิญซัพพลายเออร์จนถึงไฟล์ที่พร้อมตรวจสอบ",
    note: "ซัพพลายเออร์ใช้ฟรีเสมอ · เริ่มได้ทันทีโดยไม่ต้องติดตั้ง",
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
    step2Intro: "30 นาที ผ่านออนไลน์ เวลาทั้งหมดอ้างอิงตาม",
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

  marquee: {
    rowOne: [
      "สร้างมาเพื่อผู้ส่งออกไทยสู่สหภาพยุโรป",
      "จับคู่สินค้า CBAM ตามรหัส CN จริง 67 รายการ",
      "เหล็ก เหล็กกล้า และอะลูมิเนียม พร้อมสำหรับช่วงบังคับใช้จริง",
      "ชุดเอกสารตรวจสอบผนึกด้วย SHA-256",
      "ไฟล์ส่งออกพร้อมสำหรับ Annex IV และ O3CI",
      "ขั้นตอนซัพพลายเออร์สองภาษา ไทยและอังกฤษ",
    ],
    rowTwo: [
      "ระเบียบ EU CBAM 2023/956",
      "ระเบียบปฏิบัติ CBAM (EU) 2023/1773",
      "GHG Protocol",
      "ISO 14064-1",
      "ISO 14067",
      "GDPR",
    ],
    ctaRowOne: [
      "จองการสาธิต",
      "เดินชมระบบพร้อมคำแนะนำ 30 นาที",
      "ดูกับห่วงโซ่อุปทานของคุณเอง",
      "ตั้งแต่เชิญซัพพลายเออร์จนถึงไฟล์พร้อมตรวจสอบ",
      "ซัพพลายเออร์ใช้ฟรีเสมอ",
      "เริ่มได้ทันทีโดยไม่ต้องติดตั้ง",
    ],
    ctaRowTwo: [
      "ดูการใช้งานจริง",
      "จองรอบของคุณ",
      "พูดคุยกับทีมงาน",
      "รับไทม์ไลน์การยื่นของคุณ",
      "เริ่มวันนี้",
      "จองการสาธิต",
    ],
  },

  footer: {
    desc: "แพลตฟอร์ม AI ที่เชื่อมผู้ส่งออกกับซัพพลายเออร์ เพื่อรวบรวมข้อมูลคาร์บอนตามข้อกำหนด CBAM แบบอัตโนมัติ ตั้งแต่การร้องขอจนถึงรายงานที่พร้อมตรวจสอบ",
    location: "กรุงเทพมหานคร ประเทศไทย",
    columns: {
      platform: "แพลตฟอร์ม",
      whoItsFor: "เหมาะกับใคร",
      resources: "แหล่งข้อมูล",
      company: "บริษัท",
    },
    links: {
      smartLink: "Smart Link Collection",
      aiCheck: "AI Quality Check",
      engine: "Compliance Engine",
      reports: "Reports & Handoff",
      exporters: "ผู้ส่งออก",
      suppliers: "ซัพพลายเออร์",
      legalCompliance: "ฝ่ายกฎหมายและกำกับดูแล",
      importers: "ผู้นำเข้า — เร็ว ๆ นี้",
      howItWorks: "วิธีการทำงาน",
      faq: "คำถามที่พบบ่อย",
      timeline: "ไทม์ไลน์ CBAM",
      backlog: "แผนพัฒนา",
      pricing: "ราคา",
      contact: "ติดต่อเรา",
      bookDemo: "จองการสาธิต",
      terms: "ข้อกำหนดการใช้งาน",
      privacy: "นโยบายความเป็นส่วนตัว",
      cookies: "นโยบายคุกกี้",
      reportIssue: "แจ้งปัญหา",
    },
    /* The legal entity name stays in English on the Thai site too — it is how
       the company is registered and how it signs contracts, so translating it
       would name an entity that does not exist on paper. */
    copyright: "© 2026 Certrace Co., Ltd. All rights reserved.",
    contactSubject: "สวัสดี Certrace",
    issueSubject: "แจ้งปัญหาการใช้งาน",
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
    whatYouGet: "สิ่งที่คุณจะได้รับ",
    closingHeadline: "ดูการทำงานจริงกับห่วงโซ่อุปทานของคุณ",
    closingIntro:
      "เดินชมระบบพร้อมคำแนะนำ 30 นาที ตั้งแต่การเชิญซัพพลายเออร์จนถึงไฟล์ที่พร้อมตรวจสอบ และซัพพลายเออร์ใช้ฟรีเสมอ",
    exporters: {
      eyebrow: "สำหรับผู้ส่งออก",
      headline: "จัดการการยื่นรายงานทั้งหมด\nจากพื้นที่ทำงานเดียว",
      intro:
        "สร้างการยื่นรายงานผ่านระบบที่มีคำแนะนำทุกขั้นตอน ติดตาม Smart Link ที่ทยอยเข้ามาแบบเรียลไทม์ อนุมัติทีละรายการ แล้วส่งออกไป พื้นที่ทำงานเดียวที่บอกคุณเสมอว่าต้องทำอะไรต่อ ตั้งแต่คำขอแรกจนถึงการตอบรับจากผู้ซื้อ",
      benefits: [
        {
          title: "ระบบช่วยสร้างการยื่นรายงาน",
          desc: "ไล่ไปทีละขั้นตอน ทั้งรหัส CN โรงงาน และรอบการรายงาน โดยไม่ต้องจำกฎระเบียบให้ขึ้นใจ เพราะระบบเข้ารหัสกฎช่วงบังคับใช้จริงไว้แล้ว",
        },
        {
          title: "ติดตาม Smart Link แบบเรียลไทม์",
          desc: "ส่งลิงก์เดียวต่อซัพพลายเออร์หนึ่งราย แล้วดูข้อมูลที่ส่งเข้ามา การแก้ไข และผลตรวจจาก AI แบบเรียลไทม์ ไม่ต้องตามสถานะทางอีเมลอีก",
        },
        {
          title: "อนุมัติและส่งได้จากที่เดียว",
          desc: "ตรวจความผิดปกติที่ AI แจ้งไว้ ขอให้แก้เฉพาะช่องที่มีปัญหา แล้วอนุมัติ ทั้งหมดทำได้จากพื้นที่ทำงานเดียวกัน",
        },
        {
          title: "ไฟล์ผลลัพธ์ที่พร้อมตรวจสอบ",
          desc: "ชุดเอกสารที่ผนึกด้วยแฮช SHA-256 พร้อมไฟล์ XML ตาม Annex IV พร้อมให้ผู้ยื่นรายงานที่ได้รับอนุญาตของผู้ซื้อคุณนำไปยื่นได้ทันที",
        },
      ],
    },
    suppliers: {
      eyebrow: "สำหรับซัพพลายเออร์",
      headline: "แบบฟอร์มพร้อมคำแนะนำ ใช้ฟรี\nไม่ต้องสมัครบัญชี",
      intro:
        "รับ Smart Link แล้วกรอกแบบฟอร์มเดียวที่มีคำแนะนำ ทั้งภาษาไทยและอังกฤษ จากอุปกรณ์ใดก็ได้ พร้อมรับคำแนะนำจาก AI ก่อนส่ง หากมีจุดต้องแก้ ระบบจะเปิดเฉพาะช่องนั้น ส่วนที่เหลือยังล็อกอยู่",
      benefits: [
        {
          title: "ลิงก์เดียว ใช้ได้ทุกอุปกรณ์",
          desc: "ไม่ต้องเข้าสู่ระบบ ไม่ต้องติดตั้งโปรแกรม เปิดลิงก์บนมือถือหรือคอมพิวเตอร์แล้วกรอกข้อมูลได้ตามจังหวะของคุณ",
        },
        {
          title: "สองภาษา ไทยหรืออังกฤษ",
          desc: "ทุกคำถามและคำแนะนำเขียนด้วยภาษาที่เข้าใจง่ายทั้งภาษาไทยและอังกฤษ สลับได้ตลอดเวลา",
        },
        {
          title: "AI ช่วยตรวจก่อนส่ง",
          desc: "พบหลักฐานที่ขาดหรือตัวเลขที่ไม่สอดคล้องกันก่อนที่ผู้ส่งออกจะเห็น พร้อมคำแนะนำที่อ่านเข้าใจง่าย",
        },
        {
          title: "เปิดให้แก้เฉพาะช่องที่มีปัญหา",
          desc: "หากผู้ส่งออกขอให้แก้ไข ส่วนที่เหลือของข้อมูลจะยังล็อกอยู่ คุณแก้เฉพาะสิ่งที่เปลี่ยนเท่านั้น",
        },
      ],
    },
    legal: {
      eyebrow: "สำหรับฝ่ายกฎหมายและกำกับดูแล",
      headline: "การอนุมัติที่ระบุชื่อผู้รับผิดชอบ\nพร้อมร่องรอยการตรวจสอบครบถ้วน",
      intro:
        "รายงานจะถูกส่งออกก็ต่อเมื่อมีการอนุมัติที่ระบุชื่อผู้รับผิดชอบแล้วเท่านั้น และระบบจะเสนอให้ฝ่ายกฎหมายตรวจทานโดยอัตโนมัติทุกครั้งที่พบการเกินเพดานค่าตั้งต้นหรือความผิดปกติ ทุกการตัดสินใจถูกบันทึกไว้ในร่องรอยการตรวจสอบ",
      benefits: [
        {
          title: "อนุมัติจริง ไม่ใช่แค่ประทับตรา",
          desc: "ทุกการยื่นรายงานต้องมีผู้ตรวจทานที่ระบุชื่อก่อนส่งออกไป ไม่มีรายงานใดออกไปโดยไม่มีผู้รับผิดชอบ",
        },
        {
          title: "ความผิดปกติถูกยกระดับอัตโนมัติ",
          desc: "เมื่อระบบพบการเกินเพดานค่าตั้งต้นหรือข้อมูลที่ผิดปกติ ระบบจะเสนอให้ฝ่ายกฎหมายตรวจทานทันทีโดยอัตโนมัติ",
        },
        {
          title: "กฎช่วงบังคับใช้จริงถูกเข้ารหัสไว้",
          desc: "เพดานค่าตั้งต้น การจัดการ Scope 2 ตามหมวดสินค้า และข้อกำหนดการทวนสอบ ถูกฝังไว้ในระบบแล้ว ไม่ปล่อยให้ตีความกันเอง",
        },
        {
          title: "บันทึกที่ผนึกและมีเวอร์ชัน",
          desc: "ร่องรอยการคำนวณทั้งหมด ทะเบียนหลักฐาน และประวัติการอนุมัติ ถูกรวมไว้ในชุดเอกสารที่ผนึกด้วยแฮช SHA-256 พิสูจน์ได้ ไม่ใช่แค่ยื่นไป",
        },
      ],
    },
    importers: {
      eyebrow: "สำหรับผู้นำเข้า",
      headline: "พื้นที่ทำงานฝั่งผู้ยื่นรายงาน\nในสหภาพยุโรป เร็ว ๆ นี้",
      intro:
        "รวบรวมข้อมูลการปล่อยคาร์บอนที่ผู้ส่งออกของคุณส่งไว้แล้ว คำนวณจำนวนใบรับรอง และยื่นรายงาน CBAM ประจำปี ฝั่งของผู้ยื่นรายงานที่ได้รับอนุญาต สร้างบนชุดข้อมูลเดียวกันที่ซัพพลายเออร์ของคุณกรอกไว้",
      ctaLabel: "ลงชื่อในรายชื่อรอ",
      benefits: [
        {
          title: "ชุดข้อมูลเดียว ใช้ได้ทั้งสองฝั่ง",
          desc: "ไม่ต้องกรอกข้อมูลที่ผู้ส่งออกเก็บไว้แล้วซ้ำอีก เพราะพื้นที่ทำงานฝั่งผู้นำเข้าอ่านจากข้อมูล Smart Link ชุดเดียวกันที่ผ่านการตรวจสอบแล้ว",
        },
        {
          title: "คำนวณใบรับรอง",
          desc: "แปลงข้อมูลการปล่อยคาร์บอนที่รวบรวมไว้ ให้เป็นจำนวนใบรับรองและภาระต้นทุนที่คุณต้องวางแผนล่วงหน้า ก่อนถึงเส้นตายประจำปี",
        },
        {
          title: "ยื่นรายงานประจำปี",
          desc: "จัดเตรียมและยื่นรายงาน CBAM ประจำปี ด้วยมาตรฐานความพร้อมต่อการตรวจสอบเดียวกับฝั่งผู้ส่งออก",
        },
        {
          title: "สร้างเสร็จแล้ว ไม่ใช่แค่แผน",
          desc: "พื้นที่ทำงานฝั่งผู้นำเข้ามีอยู่จริงแล้วในฐานะผลิตภัณฑ์แยกต่างหาก หน้านี้คือหน้าแนะนำก่อนเปิดใช้งานสาธารณะ ไม่ใช่คำสัญญาในแผนงาน",
        },
      ],
    },
  },
};

export const CONTENT: Record<"en" | "th", Content> = { en, th };
