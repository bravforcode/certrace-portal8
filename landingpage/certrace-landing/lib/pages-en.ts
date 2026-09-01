import type { PageCopy } from "./pages";

/* English source copy for the pages added after the original site. The other
   four languages are translated from here; change a fact here first. */

export const PAGES_EN: PageCopy = {
  nav: {
    aboutCbam: "About CBAM",
    aboutCbamDesc: "Twelve guides to the regulation, the money and the proof.",
    events: "Events",
    eventsDesc: "Where to find us — expos, conferences and seminars.",
    updates: "Updates",
    updatesDesc: "What the team has been doing, and what we learned.",
    about: "About Certrace",
    aboutDesc: "Who we are, why we built this, and what we believe.",
    contact: "Contact",
    contactDesc: "Email, LINE, and every other way to reach us.",
    careers: "Careers",
    careersDesc: "Build carbon compliance infrastructure with us.",
    requestFeature: "Request a feature",
    requestFeatureDesc: "Tell us what the product is missing.",
    reportIssue: "Report an issue",
    reportIssueDesc: "Something broken or wrong? Send it straight to us.",
    requestPricing: "Request pricing",
    requestPricingDesc: "Tell us your CN codes and plants, get a real figure back.",
    freeTrial: "FREE TRIAL",
    startFreeTrial: "START FREE TRIAL",
  },

  footer: {
    columns: {
      product: "PRODUCT",
      solutions: "WHO IT'S FOR",
      resources: "RESOURCES",
      company: "COMPANY",
    },
    lineCta: "Add us on LINE",
    lineSub: "Talk to a CBAM expert",
    followUs: "FOLLOW",
    newsletter: {
      heading: "CBAM, in your inbox",
      body: "What changed in the regulation, what it costs, and what exporters are being asked for — when there is something worth sending, and not otherwise.",
      placeholder: "you@company.com",
      submit: "SUBSCRIBE",
      success: "Subscribed. We will write when there is something worth reading.",
      invalidEmail: "Enter a valid email address.",
      consent: "By receiving news from Certrace you accept our {terms} and {privacy}.",
      termsLabel: "Terms of Service",
      privacyLabel: "Privacy Policy",
    },
  },

  events: {
    eyebrow: "EVENTS",
    headline: "Come and argue with us\nabout carbon data.",
    intro:
      "Where the Certrace team will be, and where we have been. If you are going to any of these, tell us — we would rather spend the time with an exporter who has the problem than at the stand.",
    searchPlaceholder: "Search events…",
    filterAll: "All",
    filterUpcoming: "Upcoming",
    filterPast: "Past",
    countUpcoming: "upcoming",
    countPast: "past",
    noResults: "No events match that search.",
    clear: "Clear",
    upcomingBadge: "UPCOMING",
    pastBadge: "PAST",
    dateLabel: "Date",
    timeLabel: "Time",
    venueLabel: "Venue",
    viewEvent: "EVENT DETAILS",
    backToEvents: "ALL EVENTS",
    aboutHeading: "About this event",
    presenceHeading: "What we are doing there",
    detailsHeading: "Details",
    addToCalendar: "ADD TO GOOGLE CALENDAR",
    provisionalNote:
      "Some details — exact hall, stand number and session times — are still to be confirmed by the organiser. We update this page as they are published.",
    relatedUpdate: "Read what happened →",
    ctaHeadline: "Can't make it?",
    ctaBody:
      "Book a demo instead and we will walk you through the same thing, on your own products, in half an hour.",
    notFound: "We could not find that event.",
    kinds: { expo: "Expo", conference: "Conference", seminar: "Seminar" },
    items: {
      "kmitl-expo-2026": {
        name: "KMITL Expo 2026",
        summary:
          "Six days of Thai industry, research and deep tech at King Mongkut's Institute of Technology Ladkrabang — and a working demo of the exporter portal.",
        kindLabel: "Expo",
        body: [
          "KMITL Expo brings together industry, research groups and the engineering faculties that supply most of Thailand's manufacturing talent. It is one of the few Thai events where the people who run the plants and the people who model them are in the same building.",
          "That matters for CBAM, because the hardest part of a carbon figure is not the arithmetic — it is the monitoring underneath it. The exporters who will do well under the definitive regime are the ones already instrumented well enough to answer a verifier, and that starts on the shop floor rather than in a compliance department.",
        ],
        presence: [
          "A live walkthrough of the exporter portal — a real CBAM year, from the first supplier request to a sealed report package.",
          "A short session on the 2026 rule changes: what the definitive regime actually requires, and what the 30 September 2027 deadline means for data you are collecting right now.",
          "Open desk time for anyone who wants to bring their own CN codes and see what the EU default value would cost them.",
        ],
      },
      "telecomsworld-asia-2026": {
        name: "TelecomsWorld Asia 2026",
        summary:
          "Two days at Centara Grand, CentralWorld — where connectivity, data infrastructure and the systems that carry supply-chain data meet.",
        kindLabel: "Conference",
        body: [
          "TelecomsWorld Asia is where the region's connectivity and digital-infrastructure operators meet. It is not an obvious CBAM venue, which is exactly why we are going.",
          "Carbon compliance is turning into a data-infrastructure problem. The bottleneck for a Thai exporter is not understanding the regulation — it is moving verified, structured data between companies that have no shared system, in a form a European auditor accepts. That is a plumbing problem, and the people who build plumbing for a living are worth talking to.",
        ],
        presence: [
          "Meet the founding team — we are there for conversations, not a booth performance.",
          "A demo of the supplier smart link: how a supplier with no account, no software and no English answers a CBAM request from a phone.",
          "Partnership conversations with platforms already carrying supply-chain data that CBAM now needs.",
        ],
      },
      "tgo-chula-cbam-phase-3": {
        name: "Preparing Thai Exporters for EU CBAM — Phase 3",
        summary:
          "A TGO and Chulalongkorn University seminar on getting export goods ready for the definitive CBAM regime. We went to listen.",
        kindLabel: "Seminar",
        body: [
          "Organised by the Thailand Greenhouse Gas Management Organization with Chulalongkorn University, this was the third seminar in a series on preparing Thai export goods for the EU CBAM.",
          "The programme covered the definitive-phase requirements, the certificate price mechanism, default values and their mark-ups, and what verification will demand from Thai installations. The most useful part was not the slides: it was the room, full of exporters describing what they had already tried and where it had failed.",
        ],
      },
    },
  },

  updates: {
    eyebrow: "UPDATES",
    headline: "What we are building,\nand who we are learning from.",
    intro:
      "Company news from the Certrace team. Rooms we sat in, people we listened to, and what changed in the product because of it. Product releases live on the backlog page instead.",
    searchPlaceholder: "Search updates…",
    noResults: "No updates match that search.",
    clear: "Clear",
    readMore: "READ THE FULL POST",
    backToUpdates: "ALL UPDATES",
    relatedEvent: "See the event →",
    ctaHeadline: "Working on the same problem?",
    ctaBody:
      "If you are an exporter, a supplier, an association or a verifier dealing with CBAM data, we would like to hear how it is actually going. Come and tell us.",
    notFound: "We could not find that update.",
    kinds: {
      event: "Event",
      partnership: "Partnership",
      product: "Product",
      company: "Company",
    },
    items: {
      "meeting-thai-exporters-association": {
        title: "Meeting the Thai Export and Manufacturers Association",
        dek: "The founding team met Khun Kittipan Moonsrichai, President of the Thai Export and Manufacturers Association, to talk about what carbon compliance is doing to Thai exporters.",
        kindLabel: "Partnership",
        body: [
          "On 28 August 2026, the Certrace founding team had the opportunity to meet and exchange ideas with Khun Kittipan Moonsrichai, President of the Thai Export and Manufacturers Association.",
          "Our conversation focused on the challenges Thai exporters are facing as carbon compliance and CBAM requirements become increasingly important in international trade.",
          "It was a valuable opportunity for us to share Certrace's vision and to learn directly from an industry leader about how we can better support Thai exporters in navigating these changes.",
          "We look forward to continuing the conversation and exploring ways to help Thai businesses strengthen their competitiveness in the global market. 🌏",
        ],
      },
      "tgo-chula-cbam-seminar": {
        title: "Turning CBAM requirements into real-world action",
        dek: "At the TGO and Chulalongkorn University seminar on EU CBAM Phase 3, the most useful hour was the one spent listening to exporters describe what is actually hard.",
        kindLabel: "Event",
        body: [
          "🌱 Turning CBAM requirements into real-world action.",
          "Today, the Certrace team had the opportunity to join the \"Preparing Exporters for the EU CBAM Phase 3\" seminar, organized by TGO and Chulalongkorn University.",
          "Beyond the presentations, what mattered most was hearing directly from Thai exporters and industry stakeholders about the challenges they are facing as CBAM becomes a real business requirement.",
          "From collecting emissions data and coordinating with suppliers to meeting reporting requirements and responding to EU buyer demands, one thing became clear:",
          "The challenge isn't simply understanding CBAM.",
          "The real challenge is turning fragmented supply-chain information into accurate, complete, and verifiable carbon data — on time, in the right format, and at a cost exporters can realistically manage.",
          "These conversations helped us better understand the gap between what regulations require and what exporters can practically execute today.",
          "That is exactly the problem Certrace is building to solve — helping exporters transform fragmented supply-chain data into compliance-ready carbon data they can confidently share with their buyers.",
          "A huge thank you to the organizers, speakers, and especially the exporters who openly shared their experiences and challenges with us.",
          "We believe the best solutions are built by listening closely to the people facing the problem. 🚀",
        ],
      },
    },
  },

  about: {
    eyebrow: "ABOUT CERTRACE",
    headline: "We build the proof layer\nfor carbon-priced trade.",
    intro:
      "Certrace is carbon compliance infrastructure for exporters. We started because the hardest part of CBAM is not the regulation — it is getting a supply chain to answer, in time, in a form a European verifier will accept.",
    storyHeading: "Why this exists",
    story: [
      "In 2023 the EU began asking importers to report the carbon embedded in the steel, aluminium and cement they bought. Most of the software built in response pointed at the importer: dashboards for the company filing the declaration, and a request queue pointed at everybody upstream.",
      "That leaves the exporter — the company that actually has the data — holding a spreadsheet, an inbox and a deadline. We watched Thai exporters spend weeks chasing suppliers who had no reason to answer, then miss the buyer's window anyway and fall back on an EU default value that made their goods look worse than they are.",
      "So we built for the other end of the table. One link per supplier, no account required, in their own language. The CBAM arithmetic run correctly and deterministically. Evidence attached to the month it belongs to. And a verifier-ready report package finished before the buyer asks — because by the time they ask, the order has usually already moved.",
    ],
    missionHeading: "What we are trying to do",
    mission:
      "Make verified product carbon data something an exporter can produce as a matter of routine, rather than a project they survive once a year. Not only to comply — to see where you actually stand, cut the carbon that is genuinely there, and reach the buyer with the proof before a competitor does. If that data becomes ordinary, the order goes to whoever is genuinely cleaner rather than whoever has the biggest compliance department.",
    factsHeading: "The short version",
    facts: [
      { label: "Founded", value: "2026" },
      { label: "Based in", value: "Bangkok, Thailand" },
      { label: "What we do", value: "Carbon compliance infrastructure for exporters" },
      { label: "Regulation covered", value: "EU CBAM — definitive regime" },
      { label: "Sides of the chain live", value: "Exporters and suppliers" },
      { label: "Languages in the product", value: "Thai and English, with more in progress" },
      { label: "Suppliers pay", value: "Nothing, on every plan" },
      { label: "Importers pay", value: "Nothing" },
    ],
    teamHeading: "The team",
    teamIntro:
      "A founding team split between the regulation and the product — the people who decide what a filed number means, and the people who build the thing that produces it.",
    team: [
      {
        name: "Founder & CEO",
        role: "Product, business and CBAM",
        bio: "Owns the CBAM interpretation the engine is built on, and the company around it — product direction, commercial strategy and fundraising. Techstars Top 10 Global Finalist. Spends most weeks in front of exporters rather than in front of the code.",
        photo: "/team/founder.jpg",
      },
      {
        name: "Co-founder & CTO",
        role: "Engineering",
        bio: "Built the calculation engine, the precursor tree and the evidence model, and the architecture that keeps all three auditable. Responsible for the rule that AI never decides a filed figure.",
      },
      {
        name: "Co-founder & COO",
        role: "Partnerships and operations",
        bio: "Runs the commercial side and the partnerships behind it — trade associations, verifiers, and the exporters who arrive with a supply chain attached. Turns a signed pilot into a reporting year that actually closes.",
      },
      {
        name: "Co-founder & Senior ESG Compliance Specialist",
        role: "Methodology and verification",
        bio: "Sustainability leader with 15+ years in ESG advisory, climate regulation, carbon management and supply-chain transformation, including CBAM work at a global firm. Former UN Climate Youth Representative (COP15 and COP17). Turns implementing acts into questions a form can ask, and keeps the methodology something a verifier will accept.",
      },
      {
        name: "Business Development",
        role: "Exporters and associations",
        bio: "CBAM specialist on the commercial side. Scopes an exporter's exposure before the first call, and builds the association and verifier relationships that put the product where exporters already are.",
      },
      {
        name: "Engineer",
        role: "Exporter workspace",
        bio: "Builds the exporter side — the monthly workspace, the readiness checks and the report package — down to the state that has to survive a verification a year later.",
      },
      {
        name: "Engineer",
        role: "Supplier side and data model",
        bio: "Builds the supplier experience — one link, no account, on a phone, in their language — and the data model under it that keeps every figure traceable to a document.",
      },
      {
        name: "Product Owner",
        role: "Product",
        bio: "Owns what gets built and in what order. Turns what exporters, suppliers and verifiers actually do into a backlog, and holds the line against the things that only look like features.",
      },
    ],
    ctaHeadline: "Come and tell us we are wrong.",
    ctaBody:
      "If you export into the EU and something on this page does not match your experience, that is the most useful thing you could send us.",
  },

  contact: {
    eyebrow: "CONTACT",
    headline: "Talk to a person.",
    intro:
      "One inbox, one LINE account, and a founding team small enough that the answer comes from somebody who can actually change the product.",
    emailHeading: "Email",
    emailBody:
      "The published address for everything — sales, support, partnerships, press. It reaches the whole team, not a ticket queue. Clicking it opens a Gmail window already addressed to us.",
    emailSubject: "Hello Certrace",
    lineHeading: "LINE Official",
    lineBody:
      "The fastest way to reach us, and the one most Thai exporters actually use. Add the account and message us directly — Thai or English, whichever is easier.",
    lineCta: "ADD ON LINE",
    socialHeading: "Social",
    socialBody:
      "Product updates, CBAM explainers and where we will be next. Facebook and Instagram run twice — a global account and a Thailand-market one posting in Thai, tagged TH. LinkedIn and YouTube are company-wide.",
    officeHeading: "Where we are",
    officeBody: "Bangkok, Thailand. Visits by arrangement — message us first and we will make the coffee.",
    responseNote: "We answer inside one business day, and usually a lot faster than that.",
    otherHeading: "Something more specific?",
    otherBody:
      "Want to see the product on your own CN codes, or start on the free trial without talking to anyone? Both are fine.",
    demoCta: "BOOK A DEMO",
    trialCta: "START FREE TRIAL",
    pricingCardLabel: "Request pricing",
    pricingCardDesc: "Tell us your CN codes and plants, get a real figure back.",
  },

  forms: {
    close: "Close",
    back: "Back",
    careers: {
      eyebrow: "CAREERS",
      title: "Work on this with us.",
      intro:
        "We are a small team in Bangkok building carbon compliance infrastructure. No formal openings list — tell us what you would do here and we will read it properly.",
      fields: {
        name: { label: "Your name", placeholder: "Somchai Prasert" },
        email: { label: "Email", placeholder: "you@example.com" },
        role: { label: "What you would work on" },
        roleOther: {
          label: "Tell us what",
          placeholder: "The role you have in mind, in your own words",
        },
        link1: {
          label: "CV, resume, portfolio, GitHub or LinkedIn",
          placeholder: "https://",
          hint: "Up to three links — whatever shows your work best. We would rather look at something you made than read a CV.",
        },
        link2: { label: "Second link", placeholder: "https://" },
        link3: { label: "Third link", placeholder: "https://" },
        message: {
          label: "Why Certrace",
          placeholder:
            "What draws you to carbon compliance, why this team, and what you would want to build here.",
        },
      },
      options: [
        "Engineering — frontend",
        "Engineering — backend / data",
        "CBAM methodology & compliance",
        "Design",
        "Partnerships & sales",
        "Customer success",
        "Something else",
      ],
      submit: "SEND APPLICATION",
      sending: "Sending…",
      successTitle: "Got it — thank you.",
      successBody:
        "Your application is with the founding team. If there is a fit we will reply within a few working days.",
      required: "This field is required.",
      invalidEmail: "Enter a valid email address.",
    },
    feature: {
      eyebrow: "REQUEST A FEATURE",
      title: "What is the product missing?",
      intro:
        "The most useful requests describe the situation, not the solution. Tell us what you were trying to do and where it stopped.",
      fields: {
        name: { label: "Your name", placeholder: "Somchai Prasert" },
        email: { label: "Work email", placeholder: "you@company.com" },
        company: { label: "Company", placeholder: "Siam Steel Export Co., Ltd." },
        area: { label: "Which part of the product" },
        areaOther: {
          label: "Which part",
          placeholder: "The part of the product you mean",
        },
        summary: {
          label: "In one line",
          placeholder: "Bulk-send monthly requests to every supplier at once",
        },
        detail: {
          label: "What were you trying to do, and what would you suggest?",
          placeholder:
            "Describe the situation, what you tried, and what you had to do instead — then your suggestion, if you have one. Volumes and deadlines help.",
        },
      },
      options: [
        "Supplier requests & smart links",
        "The monthly data form",
        "CBAM calculation & precursors",
        "Evidence & verification readiness",
        "Reports & the verifier pack",
        "Carbon cost & benchmarking",
        "Team, seats & permissions",
        "Something else",
      ],
      submit: "SEND REQUEST",
      sending: "Sending…",
      successTitle: "Request received.",
      successBody:
        "It goes onto the same board the team plans from. If we build it, you will see it on the backlog page.",
      required: "This field is required.",
      invalidEmail: "Enter a valid email address.",
    },
    issue: {
      eyebrow: "REPORT AN ISSUE",
      title: "Something broken?",
      intro:
        "Tell us what happened and what you expected instead. If it is blocking a deadline, say so — that changes how fast we look at it.",
      fields: {
        name: { label: "Your name", placeholder: "Somchai Prasert" },
        email: { label: "Email", placeholder: "you@company.com" },
        where: { label: "Where did it happen" },
        whereOther: {
          label: "Where exactly",
          placeholder: "The page, screen or email it happened on",
        },
        severity: { label: "Is it blocking you?" },
        detail: {
          label: "What happened",
          placeholder:
            "What you did, what happened, and what you expected. Exact wording of any error message helps a lot.",
        },
      },
      options: [
        "This website",
        "The exporter portal",
        "A supplier smart link",
        "A report or export file",
        "Emails and reminders",
        "Somewhere else",
      ],
      submit: "SEND REPORT",
      sending: "Sending…",
      successTitle: "Thank you — we're on it.",
      successBody:
        "The report is with the team. If we need more detail to reproduce it, we will email you.",
      required: "This field is required.",
      invalidEmail: "Enter a valid email address.",
    },
    pricing: {
      eyebrow: "REQUEST PRICING",
      title: "Get a figure for your operation.",
      intro:
        "A CBAM quote is scoped on how much you actually export, not on a headline number. Answer these and you get a real figure back the same working day — no call sequence in between.",
      fields: {
        name: { label: "Your name", placeholder: "Somchai Prasert" },
        email: { label: "Work email", placeholder: "you@company.com" },
        company: { label: "Company", placeholder: "Siam Steel Export Co., Ltd." },
        role: { label: "Your role", placeholder: "Export Manager" },
        cnCodes: {
          label: "CN codes you export",
          hint: "Distinct eight-digit codes, not products. Two grades under one code count once.",
        },
        sites: { label: "Production sites" },
        goods: { label: "What you export" },
        timeline: { label: "When you need to be filing" },
        plan: { label: "Plan you have in mind" },
        volume: { label: "Annual volume into the EU" },
        notes: {
          label: "Anything else we should know",
          placeholder:
            "Precursor chains, group structure, an existing verifier, a deadline you are working to — anything that changes the shape of the quote.",
        },
      },
      optionSets: {
        cnCodes: ["1–5", "6–20", "21–50", "More than 50", "Not sure yet"],
        sites: ["One", "2–5", "6–10", "More than 10"],
        goods: [
          "Iron and steel",
          "Aluminium",
          "Cement",
          "Fertilisers",
          "Hydrogen",
          "Electricity",
          "More than one of these",
        ],
        timeline: [
          "We are filing now",
          "Within three months",
          "Within six months",
          "This year, no date yet",
          "Researching for now",
        ],
        plan: ["Starter", "Standard", "Enterprise", "Not sure — recommend one"],
        volume: [
          "Under 1,000 t",
          "1,000–10,000 t",
          "10,000–50,000 t",
          "Over 50,000 t",
        ],
      },
      submit: "REQUEST PRICING",
      sending: "Sending…",
      successTitle: "On its way to you.",
      successBody:
        "A named figure for your CN codes and plants, from somebody on the team rather than a template. Usually the same working day.",
      required: "This field is required.",
      invalidEmail: "Enter a valid email address.",
    },
    /* THE GATE IN FRONT OF THE ENGINE'S RESULT. Five fields and not one
       question about the goods: the reader answered those by typing their CN
       codes, and asking again on the way to the number would be the thing the
       tool was built to avoid. What travels on to the quote form is exactly
       these answers, so nobody is asked their name twice either. */
    calculate: {
      eyebrow: "CBAM ENGINE",
      title: "One step before the numbers.",
      intro:
        "The count runs against the real CBAM annex on your own codes. Tell us who it is for and the result opens on this page — no account, no call.",
      fields: {
        name: { label: "Your name", placeholder: "Somchai Prasert" },
        email: { label: "Work email", placeholder: "you@company.com" },
        phone: { label: "Phone number", placeholder: "081 234 5678" },
        company: { label: "Company", placeholder: "Siam Steel Export Co., Ltd." },
        role: { label: "Your role", placeholder: "Export Manager" },
      },
      submit: "SHOW MY RESULT",
      sending: "Calculating…",
      successTitle: "Counted.",
      successBody:
        "Your CN codes, products and sectors are on the page behind this window, with the plan that covers them.",
      required: "This field is required.",
      invalidEmail: "Enter a valid email address.",
    },
  },

  pricingPage: {
    eyebrow: "PRICING",
    headline: "Simple, transparent pricing.\nScaled to your operation.",
    intro:
      "Three plans, metered on the CN codes you actually export. Every plan is designed to save you more than it costs from day one, and suppliers are always free — on every plan, without limit.",
    tiers: {
      starter: {
        name: "Starter",
        tag: "One site",
        line: "Everything you need, for one plant.",
        builtFor:
          "Your first CBAM year. A single production site, a focused export range, one or two people doing the work.",
        forLabel: "BUILT FOR",
      },
      standard: {
        name: "Standard",
        tag: "Most chosen",
        line: "More plants, more products, more years.",
        builtFor:
          "Several plants, complex goods with real precursor chains, and more than one reporting year in flight.",
        forLabel: "BUILT FOR",
      },
      enterprise: {
        name: "Enterprise",
        tag: "Custom",
        line: "No limits, and we run the year with you.",
        builtFor:
          "Exporters and traders past 20 CN codes, or past five plants, who need the reporting year run with them.",
        forLabel: "BUILT FOR",
      },
    },
    startTrial: "START FREE TRIAL",
    caps: {
      cnCodes: "CN codes",
      sites: "Production sites",
      years: "Reporting years open at once",
      seats: "Team seats",
      suppliers: "Suppliers",
      tiersDeep: "Supply-chain tiers",
      upTo: "Up to {n}",
      unlimited: "Unlimited",
      customFrom: "{n}+ custom",
    },
    compareLink: "COMPARE EVERY FEATURE",
    compareLinkSub:
      "The full table — 42 capabilities across the three plans. And the free CN-code engine, if you want the plan worked out for you first.",
    actionsRow: "Get started",
    calc: {
      navLabel: "CBAM engine — free",
      navDesc: "Count your CN codes and see which plan covers them.",
      eyebrow: "FREE · NO ACCOUNT",
      heading: "How many CN codes\nare you actually filing?",
      intro:
        "Plans are metered on distinct CN codes, not on products — and most exporters carry several products under one code. Put your codes in and the engine counts them against the real CBAM annex, then tells you which plan covers you.",
      codeLabel: "CN code",
      codePlaceholder: "7207 11 90",
      codeHint: "Start typing an eight-digit code. Spaces and dots are fine.",
      productsLabel: "Products under it",
      productsHint: "Different grades, sizes or finishes filed under the same code.",
      addCode: "ADD ANOTHER CN CODE",
      remove: "Remove",
      notCbam: "Not in the CBAM annex — this code is outside the scheme.",
      duplicate: "Already on the list — add its products to that row instead.",
      sitesLabel: "Production sites",
      resultHeading: "What you are filing",
      resultCodes: "CN codes",
      resultProducts: "Products",
      resultSectors: "Sectors",
      emptyState: "Add a CN code and the plan appears here.",
      fits: "The plan that fits",
      fitsWhy: "{plan} is the smallest plan that covers what you entered.",
      overCap: "Past every published cap. Enterprise is scoped with you rather than sold off a list.",
      computeCta: "CALCULATE MY PLAN",
      lockedState:
        "Your codes are in. Add your details and the count and the plan open here.",
      quoteCta: "REQUEST PRICING FOR THIS",
      trialCta: "START FREE TRIAL",
      contextLine: "From the engine — {codes} CN codes · {products} products · {sites} sites · {sectors}",
      disclaimer:
        "Nothing here is sent anywhere. The count stays in your browser until you ask us for a price, and the codes are checked against the same annex the product calculates against.",
      sectors: {
        steel: "Iron & steel",
        aluminium: "Aluminium",
        cement: "Cement",
        fertilisers: "Fertilisers",
        hydrogen: "Hydrogen",
        electricity: "Electricity",
      },
    },
    compareHeading: "Feature by feature",
    compareIntro:
      "Everything each plan includes. Most of the product is on every tier: the plans differ by how much of it you can point at, not by what it can do.",
    featureColumn: "Feature",
    included: "Included",
    notIncluded: "Not included",
    groups: {
      scope: "Scope & limits",
      collecting: "Collecting from your suppliers",
      calculation: "The calculation",
      readiness: "Verification readiness",
      signoff: "Sign-off & record",
      cost: "What CBAM is costing you",
      handover: "What you hand over",
      support: "Onboarding & support",
    },
    rows: {
      cnCodes: "CN codes included",
      sites: "Production sites",
      years: "Reporting years open at once",
      seats: "Team seats",
      suppliers: "Suppliers — always free for them",
      chainDepth: "Supply-chain tiers",
      linkNoAccount: "Suppliers answer by link — no account needed",
      monthlyForm: "Step-by-step monthly form",
      copyLastMonth: "Copy last month's answers",
      bilingual: "Thai and English everywhere",
      blockIncomplete: "Incomplete months are blocked",
      oneBoard: "All open requests on one board",
      chaseRecord: "Send, resend and chase, with a record",
      ownDueDay: "Set your own due day",
      directIndirectPrecursor: "Direct, indirect and precursor emissions",
      sectorRules: "Sector rules applied automatically",
      everySupplierFigure: "Every supplier in the chain, with its own figure",
      weakestLink: "Chain graded by its weakest link",
      scrapZero: "Scrap counted as zero, automatically",
      defaultCap: "20% default-value cap watched for you",
      showsMissing: "Shows exactly what is still missing",
      methodologyDoc: "Methodology document written for you",
      versionsKept: "Every version kept when you edit",
      docsToMonth: "Documents attached to the right month",
      materiality: "Materiality check",
      aiExtraction: "AI reads your documents, you approve",
      autosave: "Everything saves as you type",
      signMonth: "Sign off each month",
      signatureVoids: "Signature voids if the figures change",
      sendBack: "Send a month back for correction",
      activityFeed: "Activity feed across all reports",
      vsDefault: "Your figure against the EU default",
      certificateCost: "Estimated certificate cost, and what you save",
      fullYear: "Full-year projection",
      trendSector: "Trend and sector comparison",
      precursorShare: "What each precursor adds",
      onePdf: "One PDF, with every document inside it",
      verifierPack: "Verifier pack showing the workings",
      draftStamp: "Incomplete work stamped DRAFT",
      onboarding: "Onboarding",
      support: "Support",
      training: "Training",
    },
    cells: {
      onboardingStarter: "Self-serve, guided in-app",
      onboardingStandard: "Guided setup + data migration",
      onboardingEnterprise: "Dedicated implementation",
      supportStarter: "Email & LINE · 2 business days",
      supportStandard: "Priority · 1 business day",
      supportEnterprise: "Named manager · agreed SLA",
      trainingStarter: "Help centre and videos",
      trainingStandard: "One workshop for your team",
      trainingEnterprise: "Team and supplier training, ongoing",
    },
    colophon: [
      "Certrace · EU CBAM compliance for exporters",
      "Prices exclude VAT",
      "Annual term",
      "Suppliers always free",
    ],
    faqHeading: "About the plans",
    faq: [
      {
        q: "Why are the prices not listed?",
        a: "Because a CBAM engagement is scoped on how many CN codes and plants a year actually has, and a headline number invites the wrong comparison before that conversation. Ask and you get a real figure the same day, not a call sequence.",
      },
      {
        q: "What counts as a CN code?",
        a: "Each distinct eight-digit CN code you export and track. Two grades of rebar under one code count once; the same product under two codes counts twice.",
      },
      {
        q: "Do my suppliers pay anything?",
        a: "No — on every plan, without limit. They answer through a link, with no account, no seat and no fee. Charging the party you need cooperation from would be the single fastest way to stop getting data.",
      },
      {
        q: "What happens if I go over a cap?",
        a: "Nothing breaks and nothing is deleted. You are told which cap you have reached and what the next tier covers. Reporting years already open stay open.",
      },
      {
        q: "Is there a free trial?",
        a: "Yes — 30 days with Enterprise-level capacity, so you can test on your real chain rather than a sample. No card needed to start.",
      },
      {
        q: "Can I change plan mid-year?",
        a: "Up, at any time, prorated. Down at renewal, so a reporting year is never re-scoped underneath you halfway through.",
      },
    ],
    ctaHeadline: "Start on the trial. Ask about price later.",
    ctaBody:
      "Thirty days at Enterprise capacity, on your own suppliers and your own CN codes. If it does not save you more than it costs, that will be obvious well before anybody invoices you.",
  },
};
