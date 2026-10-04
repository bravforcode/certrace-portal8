import type { CbamGuide } from "./cbam-guide";

/* English source text for the CBAM knowledge hub. The other four languages are
   translated from this file; when a fact changes, change it here first.

   House rules for this content, kept because they are what makes it useful:
     · the first sentence of every answer IS the answer
     · every number carries its date and its source
     · nothing the Commission has not published is estimated — it says TBA
     · every actor is named — "the exporter", "the EU importer", "the
       supplier", "the accredited verifier" — never a bare "you". A reader
       who lands here from a search has not read the sentence before this
       one, and CBAM has four parties with four different obligations. */

export const CBAM_EN: CbamGuide = {
  hub: {
    eyebrow: "ABOUT CBAM",
    headline: "Everything CBAM asks of\nan exporter, explained.",
    intro:
      "The EU's Carbon Border Adjustment Mechanism entered its definitive phase on 1 January 2026. These fifteen guides cover what CBAM now requires, what it costs, and what a non-EU exporter has to prove — written for the exporter who produces the carbon data, not for the EU importer who files the declaration.",
    searchLabel: "Search the guides",
    searchPlaceholder: "Search CBAM guides…",
    allTopics: "All topics",
    noResults: "Nothing matches that search yet.",
    clear: "Clear",
    readTime: "min read",
    pillarLabel: "START HERE",
    updatedLabel: "Updated",
  },
  article: {
    backToHub: "ALL CBAM GUIDES",
    keyFacts: "The short answer",
    onThisPage: "ON THIS PAGE",
    faqHeading: "Questions people actually ask",
    relatedHeading: "Read next",
    updatedPrefix: "Updated",
    readPrefix: "",
    ctaEyebrow: "PUT THIS INTO PRACTICE",
    ctaHeadline: "Knowing the rule is the easy half.",
    ctaBody:
      "The hard half is turning an exporter's supply chain into verified, complete, on-time carbon data the EU importer will accept. That is the entire job Certrace does — one link per supplier, the CBAM arithmetic run for the exporter, and a verifier-ready report finished before the buyer asks for it.",
    ctaPrimary: "START FREE TRIAL",
    ctaSecondary: "BOOK A DEMO",
  },

  articles: {
    /* ═══════════════════════════════════════════════════ 1 */
    "what-is-cbam": {
      title: "What is CBAM, and what changed on 1 January 2026?",
      dek: "CBAM is the EU's carbon price on imported goods. Since 1 January 2026 it is no longer a reporting exercise — EU importers now buy and surrender CBAM certificates against the emissions embedded in the goods a non-EU exporter sells them.",
      metaTitle: "What is CBAM? The EU Carbon Border Adjustment Mechanism explained for exporters (2026)",
      metaDescription:
        "CBAM entered its definitive phase on 1 January 2026. A plain guide for non-EU exporters: what CBAM is, which goods it covers, who pays, what the exporter must prove to the EU importer, and the deadlines that now bind.",
      topic: "Fundamentals",
      keyFacts: [
        { label: "Full name", value: "Carbon Border Adjustment Mechanism" },
        { label: "Legal basis", value: "Regulation (EU) 2023/956" },
        { label: "Definitive phase began", value: "1 January 2026" },
        { label: "Sectors covered", value: "Iron & steel, aluminium, cement, fertilisers, hydrogen, electricity" },
        { label: "Who buys certificates", value: "The EU importer (authorised CBAM declarant)" },
        { label: "Who produces the data", value: "The non-EU producer and exporter" },
        { label: "First declaration due", value: "30 September 2027, for 2026 imports" },
      ],
      sections: [
        {
          h: "The one-paragraph version",
          p: [
            "CBAM makes an importer bringing certain goods into the European Union pay the same carbon price a European factory would have paid to make them. The importer calculates the greenhouse gas emissions embedded in each tonne imported, buys CBAM certificates to cover them, and surrenders those certificates once a year. The price of a certificate tracks the EU Emissions Trading System.",
            "The mechanism is aimed at carbon leakage — the risk that European climate policy simply moves production, and its emissions, outside Europe. Whether or not a non-EU exporter agrees with the design, its practical effect on that exporter is narrow and specific: the exporter's emissions figure is now a line item in the EU importer's cost of buying from them.",
          ],
        },
        {
          h: "What actually changed in 2026",
          p: [
            "Between October 2023 and the end of 2025, CBAM ran a transitional period. Importers reported embedded emissions quarterly and bought nothing. Missing data was awkward but survivable, and default values could be used freely.",
            "On 1 January 2026 the definitive regime began. Three things changed at once:",
          ],
          list: [
            "Certificates became real. Emissions embedded in goods imported from 2026 onward have to be covered by purchased certificates, surrendered annually.",
            "Verification became mandatory. An actual emissions figure only counts if an accredited verifier has checked it. Unverified means default.",
            "Defaults became expensive. The EU's default values are set from high-emitting installations on purpose, so falling back on them costs the EU importer money — money that importer will try not to spend with the exporter who left them no alternative.",
          ],
          note: "2026 has one piece of grace built in: importers report 2026 imports but do not have to hold certificates during 2026 itself. Purchasing opens in February 2027 and the first surrender falls on 30 September 2027.",
        },
        {
          h: "Which goods are in scope",
          p: [
            "Six sectors are covered today, defined by CN code rather than by product name — which matters, because two goods that sound alike can sit either side of the line:",
          ],
          list: [
            "Iron and steel — the largest category by far, and the one most Thai and South-East Asian exporters meet first",
            "Aluminium",
            "Cement",
            "Fertilisers",
            "Hydrogen",
            "Electricity",
          ],
        },
        {
          h: "Who does what",
          p: [
            "The legal obligation sits with the EU importer, who must be an authorised CBAM declarant to import in-scope goods at all. They register in the CBAM Registry, file the annual declaration, buy the certificates and surrender them.",
            "But the data does not exist on the importer's side of the border. Only the exporter knows how much gas the furnace burned, what grid factor the electricity carried, and which precursors went into the billet. So in practice the obligation lands on the exporter commercially even though it binds the EU importer legally: no data from the exporter, no actual value for the importer, and a default value that costs that importer more than a competing exporter's verified figure.",
            "This is why CBAM is best read as a trade condition rather than a tax. It does not stop a non-EU exporter selling into Europe. It changes which exporter Europe would rather buy from.",
          ],
        },
        {
          h: "What the exporter has to be able to produce",
          list: [
            "Specific embedded emissions (SEE) per tonne of each good, split into direct and — where the rules require it — indirect emissions",
            "The production route the good was made on, and the system boundary the exporter measured within",
            "Every precursor that went into a complex good, with its own quantity and its own embedded emissions",
            "Monitoring evidence: meter readings, fuel invoices, laboratory analyses, electricity bills, mill test certificates",
            "A verification report from an accredited verifier",
            "Any carbon price the exporter has already paid at home, if it is to be deducted",
          ],
          p: [
            "None of that is exotic. What makes CBAM hard is not any single item on the list — it is producing all of them, every month, for every plant and every supplier above the exporter in the chain, in a format an accredited European verifier will accept, before the EU importer asks.",
          ],
        },
      ],
      faq: [
        {
          q: "Does a non-EU exporter have to register with the EU?",
          a: "No. Registration in the CBAM Registry is for EU importers, who must be authorised CBAM declarants. A non-EU producer may be recorded as an installation operator and can share data through the system, but the filing obligation stays with the importer.",
        },
        {
          q: "Can Certrace or any vendor file an exporter's CBAM declaration?",
          a: "No — and no vendor can. Only the EU importer's authorised CBAM declarant may file with the Registry. What a platform can do is hand that declarant a complete, verified, correctly formatted dataset from the exporter, so the filing is possible at all.",
        },
        {
          q: "What happens if I simply do not provide data?",
          a: "Nothing happens to the exporter legally. The EU importer applies the EU default value, which is deliberately set high, and pays more per tonne to buy from that exporter than from a competitor who supplied verified figures. That price difference is the enforcement.",
        },
        {
          q: "Does CBAM apply to goods that only contain a little steel?",
          a: "Not yet. Today the scope is the six sectors' own goods. From 1 January 2028 the Commission has proposed extending it to roughly 180 downstream manufactured products with a high steel or aluminium content.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 2 */
    "cbam-key-dates": {
      title: "Every CBAM date that matters between now and September 2027",
      dek: "Certificate sales open in February 2027, four holding checks run through 2027, and the first declaration plus surrender falls on 30 September 2027 for 2026 imports.",
      metaTitle: "CBAM deadlines 2026–2027: key dates, holding checks and the first declaration",
      metaDescription:
        "The full CBAM definitive-regime timeline: quarterly certificate price publication in 2026, sales opening February 2027, the 50% quarterly holding checks, and the 30 September 2027 declaration deadline.",
      topic: "Deadlines",
      keyFacts: [
        { label: "Definitive regime began", value: "1 January 2026" },
        { label: "Certificate sales open", value: "February 2027, for 2026 imports" },
        { label: "Quarterly holding requirement", value: "≥ 50% of year-to-date embedded emissions" },
        { label: "First declaration + first surrender", value: "30 September 2027" },
        { label: "Reporting year covered", value: "Calendar year 2026" },
        { label: "Price publication in 2026", value: "Quarterly · from 2027, weekly" },
      ],
      sections: [
        {
          h: "The timeline in order",
          table: {
            head: ["When", "What happens"],
            rows: [
              ["1 January 2026", "Definitive regime starts. 2026 imports are in scope, but no certificates need to be held during 2026 itself."],
              ["7 April 2026", "Q1 2026 CBAM certificate price published — €75.36 per tonne CO₂e."],
              ["6 July 2026", "Q2 2026 price published — €75.28 per tonne CO₂e."],
              ["5 October 2026", "Q3 2026 price published."],
              ["4 January 2027", "Q4 2026 price published."],
              ["February 2027", "Certificate sales open on the Common Central Platform for authorised CBAM declarants covering 2026 imports."],
              ["Throughout 2027", "Weekly price publication replaces quarterly."],
              ["End Q1 2027", "First holding check: at least 50% of 2027 year-to-date embedded emissions must be covered."],
              ["End Q2 2027", "Second holding check, same 50% test."],
              ["30 June 2027", "Mid-year checkpoint in the Commission's published schedule."],
              ["30 September 2027", "First CBAM declaration filed and first certificates surrendered, for 2026. Also the end of the Q3 2027 holding check."],
              ["End Q4 2027", "Fourth holding check."],
            ],
          },
        },
        {
          h: "What the holding checks mean for the exporter",
          p: [
            "The quarterly holding checks are the EU importer's obligation, not the exporter's — but they change when that importer needs the exporter's numbers, which makes them the exporter's problem in practice.",
            "To hold 50% of year-to-date embedded emissions at the end of a quarter, a declarant has to know what those emissions are. They cannot wait for an annual reconciliation. Expect data requests on a quarterly rhythm from early 2027, and expect the first serious one in Q1 2027 rather than close to the September deadline.",
          ],
          note: "The practical reading: an EU importer who discovers in August 2027 that an exporter's 2026 figures were never verified has no time left to fix it. The conversation that decides whether the exporter's data is usable happens a year earlier than the deadline suggests.",
        },
        {
          h: "Why 2026 feels quiet and is not",
          p: [
            "2026 imports carry no certificate-holding requirement during 2026. That is real relief on the EU importer's cash flow and nothing else. The emissions embedded in every consignment an exporter ships this year are still being counted, and the importer will pay for them in 2027 at a price nobody can discount retroactively.",
            "The data an exporter fails to collect in 2026 cannot be recreated in 2027. A gas meter reading for March 2026 either exists in March 2026 or it does not exist at all — and an accredited verifier will not accept a number reconstructed from memory. The quiet year is the exporter's collection year.",
          ],
        },
        {
          h: "What to have in place, and by when",
          list: [
            "Now — monthly monitoring running for every plant and every in-scope good, with the evidence filed as it is produced",
            "Now — every precursor supplier identified, and asked, with a named contact who answers",
            "Q4 2026 — a full year of 2026 data closed and internally signed off",
            "Q1 2027 — an accredited verifier engaged; the queue is real (see the verifier guide)",
            "H1 2027 — the exporter's verification complete, so the EU importer can meet the Q1 and Q2 holding checks with actual values",
            "By 30 September 2027 — the EU importer files, using the exporter's verified figures rather than the EU default",
          ],
        },
      ],
      faq: [
        {
          q: "When is the first CBAM declaration due?",
          a: "30 September 2027, covering goods imported during calendar year 2026. Certificates for those imports must be surrendered at the same time.",
        },
        {
          q: "Does an exporter need CBAM certificates in 2026?",
          a: "A non-EU exporter never needs certificates at all — the EU importer does. For 2026 imports, that importer does not have to hold them during 2026; purchasing opens in February 2027.",
        },
        {
          q: "What is the 50% holding rule?",
          a: "From 2027, at the end of each quarter an authorised CBAM declarant must hold CBAM certificates covering at least 50% of the embedded emissions of goods imported since the start of that year.",
        },
        {
          q: "How often are certificate prices published?",
          a: "Quarterly during 2026, on a published calendar. From 2027 the Commission moves to weekly average pricing.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 3 */
    "cbam-certificate-price": {
      title: "How much does a CBAM certificate cost, and who sets the price?",
      dek: "One certificate covers one tonne of CO₂e. The Commission published €75.36 for Q1 2026 and €75.28 for Q2 2026, both tracking EU ETS auction prices; Q3 and Q4 2026 are announced on 5 October 2026 and 4 January 2027.",
      metaTitle: "CBAM certificate price 2026: €75.36 Q1, €75.28 Q2, and how the price is calculated",
      metaDescription:
        "What a CBAM certificate costs in 2026, how the European Commission calculates it from EU ETS auction prices, the quarterly publication calendar, and the move to weekly pricing from 2027.",
      topic: "Cost",
      keyFacts: [
        { label: "What one certificate covers", value: "1 tonne of CO₂e embedded emissions" },
        { label: "Q1 2026 price", value: "€75.36 / tCO₂e (published 7 April 2026)" },
        { label: "Q2 2026 price", value: "€75.28 / tCO₂e (published 6 July 2026)" },
        { label: "Q3 2026 price", value: "To be announced 5 October 2026" },
        { label: "Q4 2026 price", value: "To be announced 4 January 2027" },
        { label: "Basis", value: "Average EU ETS auction clearing price" },
        { label: "From 2027", value: "Weekly average pricing" },
      ],
      sections: [
        {
          h: "The published 2026 schedule",
          table: {
            head: ["Quarter", "Price (€/tCO₂e)", "Published"],
            rows: [
              ["Q1 2026", "€75.36", "7 April 2026"],
              ["Q2 2026", "€75.28", "6 July 2026"],
              ["Q3 2026", "TBA", "5 October 2026"],
              ["Q4 2026", "TBA", "4 January 2027"],
            ],
          },
          note: "Q3 and Q4 2026 have not been published at the time of writing. Any figure quoted for them — to an exporter or to an importer — is somebody's forecast, not a Commission price.",
        },
        {
          h: "Where the number comes from",
          p: [
            "A CBAM certificate is priced to match what a European producer pays for the same tonne of CO₂. That anchor is the EU Emissions Trading System: the Commission takes the average clearing price of EU ETS allowances at auction and publishes it as the CBAM certificate price.",
            "In 2026 that average is calculated quarterly. From 2027 it moves to a weekly average, which makes the cost of importing move with the carbon market rather than sitting flat for three months at a time.",
          ],
        },
        {
          h: "Quarterly, then weekly — why the change matters",
          p: [
            "Under quarterly pricing a buyer knows their per-tonne carbon cost three months in advance and can put it in a contract. Under weekly pricing they cannot, and they will start pushing that volatility somewhere — usually into a CBAM clause that passes the variance to the supplier, or into a preference for suppliers whose low verified emissions make the volatility small in absolute terms.",
            "Both responses reward the same thing. If an exporter's specific embedded emissions are half a competing exporter's, every price move costs the EU importer half as much when they buy from that exporter.",
          ],
        },
        {
          h: "What the certificate price does not tell the exporter",
          p: [
            "The certificate price is only one term in the cost. The number of certificates is the other, and that is the term the exporter controls. Before certificates are counted, the calculation deducts the free allocation a European producer would have received and any carbon price the exporter has already paid at home.",
            "So a rising certificate price and a falling free-allocation rate both multiply the same thing: the exporter's emissions per tonne. That is the term worth working on, and the only one genuinely in the exporter's hands.",
          ],
        },
      ],
      faq: [
        {
          q: "What is the CBAM certificate price in 2026?",
          a: "€75.36 per tonne of CO₂e for Q1 2026 and €75.28 for Q2 2026. Q3 is announced on 5 October 2026 and Q4 on 4 January 2027.",
        },
        {
          q: "Who pays for CBAM certificates?",
          a: "The EU importer, acting as an authorised CBAM declarant. The cost usually reaches the exporter through price negotiation or a CBAM clause in the supply contract.",
        },
        {
          q: "Can a non-EU exporter buy CBAM certificates?",
          a: "No. Certificates are sold through the Common Central Platform to authorised CBAM declarants only. Sales open in February 2027 for 2026 imports.",
        },
        {
          q: "Will the price keep rising?",
          a: "It follows the EU ETS auction market, so it moves with that market rather than on a schedule. What is scheduled is the free allocation rate, which falls every year to zero in 2034 — that raises the effective cost even at a flat certificate price.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 4 */
    "cbam-cost-formula": {
      title: "The CBAM cost formula, term by term",
      dek: "CBAM cost = certificate price × (total embedded emissions − free allocation − carbon price already paid at origin). Only one of those terms is the exporter's to move.",
      metaTitle: "How CBAM cost is calculated: the formula explained term by term",
      metaDescription:
        "The CBAM cost equation in plain language — certificate price, total embedded emissions, EU ETS free allocation (benchmark × free allocation rate × cross-sectoral correction factor), and the deduction for carbon already priced in the country of origin.",
      topic: "Cost",
      keyFacts: [
        { label: "The formula", value: "Certificate price × (Embedded emissions − Free allocation − Carbon price paid at origin)" },
        { label: "Free allocation", value: "Benchmark × free allocation rate × cross-sectoral correction factor" },
        { label: "Free allocation rate 2026", value: "97.5%, falling to 0% in 2034" },
        { label: "Cross-sectoral correction factor", value: "Published by the Commission; generally 1" },
        { label: "Origin carbon price", value: "Deductible only if actually paid and verifiable" },
        { label: "The term the exporter controls", value: "Embedded emissions per tonne" },
      ],
      sections: [
        {
          h: "The equation",
          p: [
            "Reduced to its bones, the cost the EU importer carries for a tonne of an exporter's goods is:",
          ],
          note: "CBAM cost = CBAM certificate price (€/tCO₂e) × [ total embedded emissions (tCO₂) − free allocation of EU ETS allowances (tCO₂) − carbon price paid in the country of origin (tCO₂) ]",
        },
        {
          h: "Term 1 — the certificate price",
          p: [
            "Set by the European Commission from EU ETS auction prices: €75.36 for Q1 2026, €75.28 for Q2 2026, quarterly through 2026 and weekly from 2027. Nobody in the supply chain influences it.",
          ],
        },
        {
          h: "Term 2 — total embedded emissions",
          p: [
            "The greenhouse gases embedded in one tonne of the good. This is the number that comes from the exporter's installation, and the only term in the equation the exporter can change.",
            "It can be an actual value — measured, monitored and verified by an accredited verifier — or a default value published by the EU. Actual values are almost always lower, because the defaults are set from high-emitting installations by design.",
          ],
        },
        {
          h: "Term 3 — free allocation",
          p: [
            "European producers do not pay the full ETS price on every tonne; they receive a free allocation of allowances. CBAM deducts an equivalent, so an importer is not charged more than a domestic producer effectively pays. It is calculated as:",
          ],
          list: [
            "Benchmark — the EU's reference value for that good, which varies by product and by whether the exporter is on an actual or a default value",
            "Free allocation rate — 97.5% in 2026, falling every year to 0% in 2034",
            "Cross-sectoral correction factor — published by the Commission, generally equal to 1",
          ],
          note: "Because the free allocation rate falls every year on a published schedule, the same emissions figure costs more each year even if the certificate price never moves. That schedule is the single most predictable pressure in the whole mechanism.",
        },
        {
          h: "Term 4 — carbon price already paid at origin",
          p: [
            "If the exporter has genuinely paid a carbon price at home — a carbon tax, or an emissions trading scheme — that amount can be deducted, so the same tonne is not charged twice.",
            "Two conditions bind hard. It must be actually paid, not merely legislated, and it must be verifiable. A scheme that exists on paper, or a levy the exporter was exempted from, deducts nothing.",
          ],
        },
        {
          h: "What the formula implies about strategy",
          p: [
            "Three of the four terms are decided in Brussels. The certificate price follows a market no exporter trades in, the free allocation rate follows a schedule no exporter can appeal, and the origin-carbon deduction depends on the exporting country's government rather than on the exporter.",
            "The fourth term is the exporter's furnace, grid mix, production route and precursors — and it is multiplied by everything else. Lowering embedded emissions per tonne, or simply proving the lower figure the plant already achieves, is the whole of the strategy available to an exporter.",
          ],
        },
      ],
      faq: [
        {
          q: "How is CBAM cost calculated?",
          a: "Multiply the CBAM certificate price by the embedded emissions of the goods, after deducting the EU ETS free allocation and any carbon price already paid in the country of origin.",
        },
        {
          q: "What is the free allocation rate for 2026?",
          a: "97.5%. It falls every year on a published schedule — 95% in 2027, 90% in 2028, 77.5% in 2029, 51.5% in 2030, 39% in 2031, 26.5% in 2032, 14% in 2033 and 0% from 2034.",
        },
        {
          q: "Can Thailand's carbon price be deducted?",
          a: "Only to the extent a carbon price was actually paid on those emissions and can be verified. A voluntary scheme, an exemption or an unimplemented law deducts nothing.",
        },
        {
          q: "Does a lower emissions figure reduce cost proportionally?",
          a: "Broadly yes, within the same deduction structure — the emissions term is multiplied by the certificate price, so halving verified emissions per tonne roughly halves the certificate cost that tonne carries.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 5 */
    "cbam-free-allocation-phase-down": {
      title: "The CBAM factor: free allocation from 97.5% to zero",
      dek: "The share of free EU ETS allowances deducted from CBAM cost falls every year — 97.5% in 2026, 51.5% in 2030, 14% in 2033 and nothing from 2034. Your carbon cost rises on that schedule whether or not the certificate price moves.",
      metaTitle: "CBAM factor and free allocation phase-out 2026–2034: the full schedule",
      metaDescription:
        "The CBAM factor sets how much EU ETS free allocation is deducted from CBAM cost. The published schedule runs from 97.5% in 2026 to 0% in 2034 — what it means for exporters planning contracts and decarbonisation.",
      topic: "Cost",
      keyFacts: [
        { label: "What the CBAM factor is", value: "The share of free EU ETS allocation still deducted, per year" },
        { label: "2026", value: "97.5%" },
        { label: "2030", value: "51.5%" },
        { label: "2033", value: "14%" },
        { label: "2034 onward", value: "0% — free allocation fully gone" },
        { label: "Legal basis", value: "Directive (EU) 2023/959, Article 10a" },
      ],
      sections: [
        {
          h: "The published schedule",
          table: {
            head: ["Year", "Free allocation / CBAM factor"],
            rows: [
              ["2026", "97.5%"],
              ["2027", "95%"],
              ["2028", "90%"],
              ["2029", "77.5%"],
              ["2030", "51.5%"],
              ["2031", "39%"],
              ["2032", "26.5%"],
              ["2033", "14%"],
              ["2034 onward", "0%"],
            ],
          },
        },
        {
          h: "What it actually does",
          p: [
            "CBAM does not charge an importer for every tonne of embedded emissions. It first deducts what a European producer would have received free under the EU ETS, so the two are treated alike. The CBAM factor is the proportion of that free allocation still being deducted in a given year.",
            "As the EU withdraws free allocation from its own industry, it withdraws the equivalent deduction from imports at the same pace. By 2034 there is no free allocation on either side and imported goods carry the full carbon price.",
          ],
        },
        {
          h: "Read the curve, not the endpoint",
          p: [
            "The dangerous shape here is the middle. Between 2029 and 2031 the factor falls from 77.5% to 39% — it roughly halves in two years. An exporter whose margin absorbs CBAM comfortably in 2026 can find it does not in 2030, on exactly the same emissions figure and exactly the same certificate price.",
            "This is the part of CBAM that is genuinely predictable, and therefore the part that belongs in a five-year plan rather than a compliance calendar. Contracts signed now that run into 2029 should say who carries the increase.",
          ],
          note: "Practical test: an exporter should run current cost exposure at a 51.5% factor. That is 2030 on today's emissions. If the answer changes a commercial decision, the decision belongs in this year's plan, not that year's.",
        },
        {
          h: "The two levers, and what each is worth",
          list: [
            "Lower emissions — cuts the term the factor is applied to. Compounds every year, and gets more valuable as the factor falls.",
            "Verified actual data instead of defaults — usually the larger and faster win, because default values are punitive by design and switching to a verified figure needs no capital expenditure at all.",
          ],
          p: [
            "Most exporters have the second lever available immediately and have never pulled it. The emissions are already lower than the EU default; what is missing is the monitoring, the evidence and the verification that turn a true number into an accepted one.",
          ],
        },
      ],
      faq: [
        {
          q: "What is the CBAM factor?",
          a: "The proportion of EU ETS free allocation still deducted when CBAM cost is calculated. It is 97.5% in 2026 and falls each year to 0% in 2034.",
        },
        {
          q: "When does free allocation disappear entirely?",
          a: "2034. From that year imported goods in scope carry the full carbon price with no free-allocation deduction.",
        },
        {
          q: "Does the phase-down affect exporters or only importers?",
          a: "Legally it changes the importer's bill. Commercially it reaches the exporter, because the rising cost of buying a high-emissions tonne is what drives buyers to switch supplier or renegotiate.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 6 */
    "cbam-scope-2028-extension": {
      title: "What CBAM covers today — and the 180 downstream products coming in 2028",
      dek: "Six sectors are in scope now. The Commission has proposed extending CBAM from 1 January 2028 to around 180 downstream manufactured goods with a high steel or aluminium content — bolts, wheels, radiators, tubes, structural components.",
      metaTitle: "CBAM scope 2026 and the 2028 downstream extension: sectors, CN codes and 180 new products",
      metaDescription:
        "Which goods CBAM covers in its definitive phase, and the proposed 2028 extension to roughly 180 downstream products averaging 79% steel or aluminium content. What manufacturers should do now.",
      topic: "Scope",
      keyFacts: [
        { label: "Sectors in scope since 1 Jan 2026", value: "Iron & steel, aluminium, cement, fertilisers, hydrogen, electricity" },
        { label: "Proposed extension date", value: "1 January 2028" },
        { label: "Products to be added", value: "≈ 180 downstream goods" },
        { label: "Average steel or aluminium content", value: "≈ 79%" },
        { label: "Scope is defined by", value: "CN code — and, for some cement products, 10-digit TARIC code" },
      ],
      sections: [
        {
          h: "Current scope",
          p: [
            "Since the definitive phase began on 1 January 2026, importers of raw materials and semi-finished goods in six sectors must report embedded emissions and surrender certificates against them:",
          ],
          list: [
            "Iron and steel",
            "Aluminium",
            "Cement",
            "Fertilisers",
            "Hydrogen",
            "Electricity",
          ],
          note: "Scope is set by customs code, not by description. An exporter should check the CN code on their own commercial invoice before concluding that a good is out of scope — near neighbours in a product family often sit either side of the boundary.",
        },
        {
          h: "The proposed 2028 extension",
          p: [
            "The current boundary has an obvious weakness: it catches a steel coil but not a bolt made from that coil. That is an invitation to move one processing step outside the EU and import the finished part instead — which is carbon leakage arriving through a side door.",
            "The Commission has therefore proposed extending CBAM from 1 January 2028 to roughly 180 downstream manufactured products with a high share of steel or aluminium — on average around 79% by content. Named examples include:",
          ],
          list: [
            "Bolts, nuts and screws",
            "Wheels and parts",
            "Doors and windows",
            "Radiators",
            "Structural components",
            "Tubes and pipes",
          ],
        },
        {
          h: "Why this is the bigger change for South-East Asia",
          p: [
            "The current six sectors are concentrated in a relatively small number of large installations. Downstream manufacturing is not: it is thousands of mid-sized fabricators, many of whom have never calculated an emissions figure and do not think of themselves as carbon-intensive.",
            "For those firms the 2028 extension is a step change, and it arrives with a second problem attached. A downstream product is a complex good: its embedded emissions are mostly inherited from the steel or aluminium that went into it. So the fabricator's own furnace is the small part of the answer, and the large part has to be collected from suppliers — which is exactly the data problem the upstream sectors are wrestling with now.",
          ],
        },
        {
          h: "What to do before 2028",
          list: [
            "Check the exporter's own CN codes against the proposed list, and the EU customer's codes too — an exporter can be out of scope while the finished part they ship into is not",
            "Start recording supplier emissions data now, even informally; a 2028 obligation needs a 2027 baseline",
            "Get one steel or aluminium supplier answering properly, as a pilot, before the exporter needs twenty suppliers to",
            "Put a CBAM clause into new supply contracts so the data obligation runs up the chain with the order",
          ],
        },
      ],
      faq: [
        {
          q: "Which sectors does CBAM cover?",
          a: "Iron and steel, aluminium, cement, fertilisers, hydrogen and electricity, defined by CN code.",
        },
        {
          q: "Is CBAM being extended to downstream products?",
          a: "The Commission has proposed extending it from 1 January 2028 to around 180 downstream manufactured goods with a high steel or aluminium content, averaging about 79%.",
        },
        {
          q: "How does an exporter know if a product is in scope?",
          a: "By its CN code, not its name. Some cement products have moved to 10-digit TARIC codes so that white and grey clinker can be told apart — a precision that shows how fine the boundary can get.",
        },
      ],
    },
    /* ═══════════════════════════════════════════════════ 7 */
    "actual-vs-default-values": {
      title: "Actual values vs default values — and why defaults are expensive",
      dek: "An actual emissions value must be measured and verified by an accredited verifier. If the exporter cannot supply one, the EU importer must use the EU default — which is set from the worst-performing installations and carries a mark-up on top.",
      metaTitle: "CBAM actual values vs default values: verification, mark-ups and the cost of no data",
      metaDescription:
        "Why CBAM default values are punitive by design, how the Annex I–IV default value structure works, the 10%/20%/30% mark-up schedule, and what an exporter needs to qualify for an actual value instead.",
      topic: "Data",
      keyFacts: [
        { label: "Actual value requires", value: "Monitoring, evidence and verification by an accredited verifier" },
        { label: "If no actual value is available", value: "The EU default value is applied" },
        { label: "How defaults are set", value: "From high-emitting or worst-performing installations, by design" },
        { label: "Mark-up on defaults", value: "10% for 2026, 20% for 2027, 30% from 2028" },
        { label: "Who applies the mark-up", value: "The CBAM Registry, not the published table" },
        { label: "Default value tables", value: "Annexes I–IV of the implementing regulation" },
      ],
      sections: [
        {
          h: "The principle",
          p: [
            "CBAM's stated preference is unambiguous: emissions should be reported as actual, measured, verified data. Default values exist as a fallback for when that data cannot be obtained — not as an equivalent option.",
            "The design makes that preference bite. Default values are deliberately drawn from high-emitting installations, so using one is not neutral. It systematically overstates the exporter's emissions and therefore the certificates the EU importer must purchase.",
          ],
          note: "The rule in one line: no verified data means the default value, and the default value is designed to be worse than the truth for anybody who is not already among the dirtiest producers in the sector.",
        },
        {
          h: "What qualifies as an actual value",
          list: [
            "Emissions monitored against a documented methodology, with a defined system boundary",
            "Primary evidence retained for every figure — meter readings, fuel invoices and calorific values, laboratory analyses, electricity bills",
            "A production route declared and matched to what the plant actually runs",
            "Verification by an accredited verifier, registered and recognised for CBAM work",
          ],
          p: [
            "The verification requirement is the one that catches most exporters. A figure calculated correctly in-house, with every supporting document filed, is still a default-value case until an accredited third party has signed it. Verification is not paperwork appended to the number — it is what turns the number into an actual value.",
          ],
        },
        {
          h: "Where default values come from",
          p: [
            "The EU publishes default values in four annexes, each covering a different case:",
          ],
          table: {
            head: ["Annex", "Covers"],
            rows: [
              ["Annex I", "Goods imported into the customs territory of the Union, except electricity"],
              ["Annex II", "Indirect emissions of goods listed in Annex I of Regulation (EU) 2023/956 and not listed in its Annex II"],
              ["Annex III", "Electricity imported into the customs territory of the Union"],
              ["Annex IV", "Precursors whose country of production cannot be identified"],
            ],
          },
        },
        {
          h: "The corrected default values, and the mark-up",
          p: [
            "The EU has revised its default values so they reflect reality more closely, and the revision changed two things worth knowing about.",
            "First, precision. Some products moved from 8-digit CN codes to 10-digit TARIC codes so that goods previously lumped together can be separated — white clinker and grey clinker, for instance, which had shared a single CN code and have quite different emissions.",
            "Second, presentation. The published tables now give base default values only. The mark-up is no longer pre-computed into the table; the CBAM Registry applies it at declaration time, on a rising schedule: 10% for 2026, 20% for 2027, 30% from 2028 onward.",
          ],
          note: "That schedule compounds with the free-allocation phase-down. A default value in 2028 carries a 30% mark-up in a year when only 90% of free allocation is deducted — the gap between a verified figure and a default figure widens every single year.",
        },
        {
          h: "A worked illustration",
          p: [
            "Take a Thai iron and steel line from the published Annex I table. A good with a base total default value of 1.190 tCO₂e per tonne is declared at 1.309 in 2026 (10% mark-up), 1.428 in 2027 (20%) and 1.547 from 2028 (30%). Nothing about the factory changed; the number rose 30% because no verified figure was supplied.",
            "If the plant's real, verified figure is 0.9 tCO₂e per tonne, the difference by 2028 is 0.647 tonnes of CO₂ per tonne of product — bought at a certificate price in the mid-seventies of euros, on every tonne shipped.",
          ],
        },
        {
          h: "What this means practically",
          list: [
            "Check whether the exporter's goods and country of production appear in the revised default value tables — some routes changed",
            "Confirm the production route recorded for the exporter's goods still matches what the plant actually runs",
            "If a contract quotes a default value, check which year's mark-up it assumes",
            "Treat verification as a procurement lead time, not a formality — it is the step that converts the exporter's real number into one the EU importer can use",
          ],
        },
      ],
      faq: [
        {
          q: "What is the difference between an actual value and a default value in CBAM?",
          a: "An actual value is the exporter's installation-level emissions figure — measured, monitored and independently verified by an accredited verifier. A default value is a published EU estimate the importer falls back on when no verified actual value is available, and it is set high on purpose.",
        },
        {
          q: "How big is the CBAM default value mark-up?",
          a: "10% for 2026, 20% for 2027 and 30% from 2028. The published tables carry base values only; the CBAM Registry applies the mark-up when the declaration is filed.",
        },
        {
          q: "Can an exporter use their own calculation without a verifier?",
          a: "Not as an actual value. Without verification by an accredited verifier the figure does not qualify, and the default value applies instead.",
        },
        {
          q: "Are default values the same for every country?",
          a: "No. The tables are broken down by country and by CN code, and the revision also moved some products to 10-digit TARIC codes to separate goods that previously shared one code.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 8 */
    "precursors-20-percent-rule": {
      title: "Complex goods, precursors and the 20% default-value rule",
      dek: "For a complex good, default values may cover at most 20% of total embedded emissions from precursors. Cross that threshold and the whole declaration fails the test — the full default value is applied to the entire main product.",
      metaTitle: "CBAM precursors and the 20% rule: complex goods, supply chains and the cliff edge",
      metaDescription:
        "How CBAM treats complex goods and precursors, the 20% cap on default values for precursor emissions, what happens when an exporter exceeds it, and how to collect verified precursor data from suppliers up the supply chain.",
      topic: "Data",
      keyFacts: [
        { label: "Complex good", value: "A good whose production consumed in-scope precursors" },
        { label: "Default values allowed for precursors", value: "Up to 20% of total embedded emissions" },
        { label: "If the exporter exceeds 20%", value: "The declaration fails the criterion and full default values apply to the main good" },
        { label: "Intended use of the allowance", value: "Minor precursors where supplier data genuinely cannot be obtained" },
        { label: "Practical consequence", value: "One unanswered major supplier can invalidate the whole product's actual value" },
      ],
      sections: [
        {
          h: "What a complex good is",
          p: [
            "A simple good is made without any in-scope precursor. A complex good is made using one — steel billet becomes hot-rolled coil, coil becomes tube, and each step inherits the embedded emissions of everything above it.",
            "For a complex good, embedded emissions are not just what the exporter's furnace emitted. They are the exporter's own process emissions plus the emissions embedded in every in-scope precursor bought from suppliers and consumed. In most steel and aluminium supply chains, the inherited part dominates.",
          ],
        },
        {
          h: "The 20% allowance, and how it is meant to be used",
          p: [
            "The regulation accepts that a producer cannot always obtain verified figures from every supplier. So it permits default values for precursors — up to 20% of the total embedded emissions of the good.",
            "The allowance is explicitly designed for minor precursors: small inputs, from suppliers too far up the chain or too small to produce verified data, where the cost of chasing exceeds the value of the accuracy. It is not designed as a general-purpose gap filler.",
          ],
        },
        {
          h: "The cliff edge",
          p: [
            "This is the part that surprises exporters. Exceeding 20% does not mean 25% of the emissions are estimated and the rest are actual. It means the declaration no longer satisfies the criterion, and the full default value is applied to the entire main product — including the parts the exporter measured properly and had verified.",
            "One large supplier who does not answer can therefore destroy the value of a full year of monitoring on everything else. It is a threshold rule, not a sliding scale, and it has no partial credit.",
          ],
          note: "An exporter should design supplier data collection around the threshold, not around the average. Rank precursors by their share of total embedded emissions and chase suppliers in that order — the biggest contributor is the one that decides whether the whole product passes.",
        },
        {
          h: "What a precursor record actually needs",
          list: [
            "Which precursor it is, as a material, not a free-text note",
            "Quantity consumed per tonne of the exporter's finished good",
            "Its own specific embedded emissions, and whether they are actual or default",
            "The installation that produced it, and the country",
            "Whether that figure has been verified, and by whom",
          ],
          p: [
            "Free-text precursor descriptions are one of the most common reasons a dataset cannot be used. \"Billet from local mill\" is a sentence; CBAM needs a structured row that can be multiplied, aggregated and checked.",
          ],
        },
        {
          h: "Collecting up the chain",
          p: [
            "The hardest thing about precursors is that the exporter's supplier has the same problem the exporter does, one tier further up — and that supplier has less reason to solve it, because the supplier is not the one losing a European order.",
            "Three things make it work in practice. Ask in the supplier's own language, in a form that is short enough to finish. Ask once and reuse the answer, so a supplier who filled it in for January is not asked the same questions again in February. And make the ask contractual, so it travels with the purchase order rather than depending on goodwill.",
            "Certrace exists because that loop — ask, chase, check, reuse — is a workflow problem rather than a carbon-accounting problem, and it does not solve itself in a spreadsheet.",
          ],
        },
      ],
      faq: [
        {
          q: "What is the CBAM 20% rule?",
          a: "For a complex good, default values may account for no more than 20% of total embedded emissions from precursors. Above that, the declaration fails the criterion and full default values are applied to the whole main product.",
        },
        {
          q: "What counts as a precursor?",
          a: "An in-scope input consumed in producing the exporter's good — for example pig iron, billet or hot-rolled coil going into a downstream steel product.",
        },
        {
          q: "What if one supplier refuses to give data?",
          a: "The exporter can cover them with a default value as long as their share of total embedded emissions stays under 20%. If that share is larger, the whole product falls back to default values.",
        },
        {
          q: "Does an exporter need precursor data for a simple good?",
          a: "No. A simple good is produced without in-scope precursors, so there is nothing to inherit and nothing for the exporter to collect from suppliers further up the chain.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 9 */
    "cbam-verifier-accreditation": {
      title: "Accredited CBAM verifiers: who they are, and why the queue matters",
      dek: "Only an accredited verifier can turn an exporter's emissions figure into an actual value. Verifiers began registering for EU Login and the CBAM Registry from 1 September 2026, and demand from non-EU exporters is already ahead of supply.",
      metaTitle: "CBAM verification: accredited verifiers, national accreditation bodies and the process",
      metaDescription:
        "How CBAM verification works — accreditation through national accreditation bodies, third-country verifiers, the verification process from monitoring plan to reporting, and why exporters should book capacity early.",
      topic: "Verification",
      keyFacts: [
        { label: "Verifier registration opened", value: "1 September 2026" },
        { label: "Accredited by", value: "National accreditation bodies (NABs) in the EU" },
        { label: "Third-country verifiers", value: "Many NABs accept applications from verifiers based outside the EU" },
        { label: "Platform", value: "The CBAM Registry, using EU Login" },
        { label: "What CBAM verifies", value: "Product-level embedded emissions, including production processes and precursors" },
        { label: "What EU ETS verifies", value: "Installation-level emissions inside the EU" },
      ],
      sections: [
        {
          h: "Why verification is the gate",
          p: [
            "Everything in CBAM that saves the EU importer money runs through verification. An exporter's measured figure that has not been verified is treated as no figure at all, and the default value applies. There is no partial credit for good monitoring.",
            "That makes verifier capacity a supply-chain input like any other — with a lead time, a queue, and a price that rises when everyone wants it at once.",
          ],
        },
        {
          h: "How accreditation works",
          p: [
            "Verifiers are accredited by national accreditation bodies in the EU. From 1 September 2026, verifiers wishing to do CBAM work create an EU Login account, register in the CBAM Registry, and apply to a national accreditation body for accreditation.",
            "Crucially for exporters, many national bodies accept applications from verifiers established outside the EU, so that verification capacity exists close to the installations being verified rather than only in Europe. The route runs: verifier applies → national accreditation body assesses → accredited verifier, working through the CBAM Registry.",
          ],
        },
        {
          h: "What a verification actually involves",
          list: [
            "Monitoring plan validation — is the methodology sound before the year is measured, not after",
            "Risk assessment — where is this installation most likely to be wrong",
            "Site visits — real inspection of the plant and its measuring points",
            "Reporting — the verification report and opinion the declarant relies on",
          ],
          p: [
            "Two technical questions dominate the middle of that process: materiality thresholds, which decide how large a misstatement has to be before it matters, and data gaps, which decide what a verifier will accept when a plant's records are incomplete. Both are judgement calls made against published criteria, and both go better when the underlying evidence is already organised.",
          ],
        },
        {
          h: "CBAM verification is not EU ETS verification",
          p: [
            "It is a common and expensive assumption that an ETS-experienced verifier can simply apply the same approach. The two differ in what they look at.",
            "EU ETS verifies emissions at installation level, inside the EU. CBAM verifies embedded emissions at product level for installations in third countries — which means the verifier has to follow the boundary of a specific production process and the precursors that entered it, not just the site's total stack emissions.",
          ],
        },
        {
          h: "Why to move early",
          p: [
            "The demand signal is already clear: non-EU exporters need verification, the number of accredited verifiers is finite, and the first CBAM declaration deadline of 30 September 2027 concentrates demand into a narrow window in the first half of 2027.",
            "A verifier engaged in Q4 2026 or Q1 2027 has time to validate the exporter's monitoring plan before the year is closed — which is the cheapest moment to find a problem. A verifier engaged in mid-2027 is being asked to audit a finished year against records they had no say in, with a hard deadline behind them.",
          ],
          note: "The DG TAXUD guidance is blunt about the direction of travel: verifiers who accredit early will be readier and better placed to serve customers in a global market. Read from the exporter's side, that is a warning about queueing.",
        },
      ],
      faq: [
        {
          q: "Who can verify CBAM emissions data?",
          a: "Only a verifier accredited by a national accreditation body in the EU and registered in the CBAM Registry. Verifiers based outside the EU can be accredited too.",
        },
        {
          q: "When did CBAM verifier accreditation open?",
          a: "1 September 2026, when verifiers began creating EU Login accounts and registering in the CBAM Registry.",
        },
        {
          q: "How is CBAM verification different from EU ETS verification?",
          a: "EU ETS verifies installation-level emissions inside the EU. CBAM verifies product-level embedded emissions at third-country installations, following production processes and precursors.",
        },
        {
          q: "How long does verification take?",
          a: "It depends on the installation, but plan for it as a lead-time item rather than a formality — monitoring plan validation, a risk assessment, a site visit and reporting are separate steps, and capacity is limited into the 2027 deadline.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 10 */
    "cbam-cost-thai-steel": {
      title: "What CBAM actually costs a Thai steel exporter, per tonne",
      dek: "At €75 per tonne of CO₂ and 3 tCO₂ per tonne of steel, the carbon cost is roughly ฿9,000 a tonne — about 36% of a ฿25,000 steel price. Halve the emissions and it falls to ฿4,500, around 16%.",
      metaTitle: "CBAM cost per tonne of steel: a worked Thai example at 3.0 and 1.5 tCO₂/t",
      metaDescription:
        "A worked CBAM cost calculation for Thai steel exporters — carbon cost per tonne at two emissions intensities, expressed against domestic steel prices, and what the comparison implies for competitiveness.",
      topic: "Cost",
      keyFacts: [
        { label: "Assumed CBAM price", value: "€75 / tCO₂ ≈ ฿3,000 (at ~฿40 per €)" },
        { label: "High-intensity case", value: "SEE 3.0 tCO₂/t → ฿9,000 per tonne of steel" },
        { label: "As share of a ฿25,000 steel price", value: "≈ 36%" },
        { label: "Lower-intensity case", value: "SEE 1.5 tCO₂/t → ฿4,500 per tonne" },
        { label: "As share of a ฿28,000 steel price", value: "≈ 16%" },
        { label: "What this figure is", value: "Gross carbon exposure, before benchmark, free allocation and CBAM factor" },
      ],
      sections: [
        {
          h: "The arithmetic",
          p: [
            "The calculation is deliberately simple: carbon cost per tonne of product = CBAM certificate price × specific embedded emissions.",
            "At a certificate price of €75 per tonne CO₂ — roughly ฿3,000 at an exchange rate near ฿40 to the euro — the sum comes out as follows.",
          ],
          table: {
            head: ["", "Higher intensity", "Lower intensity"],
            rows: [
              ["Specific embedded emissions", "3.0 tCO₂ / t steel", "1.5 tCO₂ / t steel"],
              ["Carbon cost", "฿9,000 / t", "฿4,500 / t"],
              ["Reference steel price", "≈ ฿25,000 / t", "≈ ฿28,000 / t"],
              ["Delivered cost with carbon", "฿34,000 / t", "฿32,500 / t"],
              ["Carbon as share of steel price", "≈ 36%", "≈ 16%"],
            ],
          },
        },
        {
          h: "What that comparison really says",
          p: [
            "At three tonnes of CO₂ per tonne of steel, carbon is about a third of the value of the product. That is not a compliance overhead to be absorbed in an admin budget — it is a change to the competitive position of the goods themselves.",
            "The second column is the interesting one. Halving the emissions intensity does not halve the total delivered cost, but it moves carbon from roughly a third of the price to roughly a sixth. Two mills selling physically identical steel now quote materially different landed costs to the same European buyer.",
          ],
        },
        {
          h: "Read the caveats properly",
          p: [
            "These figures are gross carbon exposure. They deliberately do not deduct the CBAM benchmark, the free allocation or the CBAM factor, and they do not deduct any carbon price already paid in Thailand.",
            "Applying those deductions lowers the number in 2026, when the free allocation rate is 97.5%. It lowers it much less in 2030 at 51.5%, and not at all from 2034. So treat the gross figure as where this is going, and the net figure as where it is today.",
          ],
          note: "The exchange rate used here is approximately ฿40 to €1. Both the certificate price and the exchange rate move; the ratio between a high-intensity and a low-intensity mill does not.",
        },
        {
          h: "Two ways to change the answer",
          list: [
            "Reduce emissions — an EAF route rather than BF-BOF, cleaner electricity, better process efficiency. Real, slow and capital-intensive, and the only permanent fix.",
            "Prove the emissions the plant already has — monitoring, evidence, verification. Fast, cheap by comparison, and for most exporters the larger immediate saving, because the alternative is not the exporter's real figure but a punitive default.",
          ],
          p: [
            "Most Thai mills are not at three tonnes per tonne. But without verified data, that is not the number their buyer gets to use — and the default is chosen precisely so that it is not flattering.",
          ],
        },
      ],
      faq: [
        {
          q: "How much does CBAM cost per tonne of steel?",
          a: "At €75 per tonne CO₂, roughly ฿9,000 per tonne of steel at 3.0 tCO₂/t, or ฿4,500 at 1.5 tCO₂/t — about 36% and 16% of a typical Thai steel price respectively.",
        },
        {
          q: "Is that the final cost?",
          a: "No. It is gross carbon exposure before the CBAM benchmark, free allocation, the CBAM factor and any carbon price already paid at origin are deducted. Those deductions shrink every year to nothing in 2034.",
        },
        {
          q: "Who actually pays it?",
          a: "The EU importer buys the certificates. In practice the cost is negotiated back into the purchase price, or is the reason the order goes to a lower-emitting supplier instead.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 11 */
    "cbam-vs-uk-us": {
      title: "EU CBAM, UK CBAM and the US proposals compared",
      dek: "The EU runs a certificate system that started in January 2026. The UK starts a tax-based mechanism in January 2027. The US has two draft bills. Different instruments, one shared demand: a verifiable product carbon footprint.",
      metaTitle: "EU CBAM vs UK CBAM vs US CCA and PROVE IT: carbon border measures compared",
      metaDescription:
        "A comparison of carbon border measures — EU CBAM certificates, the UK's tax-based CBAM from 2027, the US Clean Competition Act and PROVE IT Act, plus Canada, Taiwan and Australia.",
      topic: "Global",
      keyFacts: [
        { label: "EU CBAM", value: "Definitive phase since 1 January 2026; certificate purchase and surrender" },
        { label: "UK CBAM", value: "Starts 1 January 2027; tax-based, administered by HMRC" },
        { label: "UK registration threshold", value: "£50,000 of in-scope imports per year" },
        { label: "US", value: "Clean Competition Act and PROVE IT Act — both draft" },
        { label: "Canada", value: "Border carbon adjustments under consideration; carbon price target CAD $170/tCO₂e by 2030" },
        { label: "Common denominator", value: "A credible, verifiable product carbon footprint" },
      ],
      sections: [
        {
          h: "Side by side",
          table: {
            head: ["", "EU CBAM", "UK CBAM", "US CCA (draft)"],
            rows: [
              ["Starts", "2026", "2027", "Under consideration"],
              ["Instrument", "Buy and surrender certificates", "Carbon import tax (tax rate)", "Border fee against a benchmark"],
              ["Administered by", "European Commission / national authorities", "HMRC", "US Customs / Treasury (proposed)"],
              ["Emissions scope", "Direct (Scope 1) + indirect (Scope 2)", "Direct + indirect", "Scope 1, 2 and some Scope 3"],
              ["Verification", "Accredited third-party verification required", "Verified actual data or government default values", "To agency standards"],
            ],
          },
        },
        {
          h: "EU CBAM",
          p: [
            "In its definitive phase since 1 January 2026, after the 2023–2025 transitional period. Six sectors in scope, with downstream products under consideration for 2028. Importers buy and surrender certificates against embedded emissions; the price references EU ETS quarterly averages, moving to weekly. Carbon already priced at origin may be deducted. Scope 1 and, for some goods, Scope 2 must be verified by an accredited verifier. First declaration for 2026: 30 September 2027.",
          ],
        },
        {
          h: "UK CBAM",
          p: [
            "Starts 1 January 2027, covering five sectors — iron and steel, aluminium, cement, fertilisers and hydrogen. Glass and ceramics were removed from the initial scope.",
            "The instrument is a tax rather than a certificate market: a carbon import tax administered by HMRC, with a quarterly CBAM rate referencing the UK ETS together with Carbon Price Support. There is a registration threshold of £50,000 of in-scope imports per year, and importers may use verified actual data or government-set default values.",
          ],
        },
        {
          h: "United States",
          p: [
            "Two draft bills, neither enacted. The Clean Competition Act would impose a border carbon fee by comparing an import's carbon intensity against a US baseline, charging the difference where the import is higher. The PROVE IT Act would first build the underlying data: a comparative study of product-level carbon intensity for US goods and those of trading partners, to serve as the factual basis for any future measure.",
          ],
        },
        {
          h: "Elsewhere",
          list: [
            "Canada — border carbon adjustments under consideration, alongside a domestic carbon price rising toward CAD $170/tCO₂e by 2030",
            "Taiwan — a domestic carbon fee has begun, with border adjustment mechanisms being studied",
            "Australia — reviewing its Safeguard Mechanism and preparing exporters for these regimes",
          ],
        },
        {
          h: "The point that matters for an exporter",
          p: [
            "The instruments differ — certificates here, a tax there, a fee against a benchmark somewhere else — and that difference matters enormously to the importer who has to comply. It matters much less to the exporter supplying the data.",
            "Every one of these regimes asks the same question of the goods: what is the verified carbon footprint of this product, per unit, to a standard somebody credible will stand behind? An exporter who builds that once has answered all of them. An exporter who builds it as a one-off EU compliance exercise will build it again for the UK in 2027, and again for whatever the US enacts.",
          ],
          note: "This is why product-level carbon data is worth treating as infrastructure rather than paperwork. The regulations will keep changing shape; the underlying dataset they all want does not.",
        },
      ],
      faq: [
        {
          q: "When does UK CBAM start?",
          a: "1 January 2027. It covers iron and steel, aluminium, cement, fertilisers and hydrogen, and works as a tax administered by HMRC rather than a certificate market.",
        },
        {
          q: "How is UK CBAM different from EU CBAM?",
          a: "The EU sells certificates that importers surrender; the UK levies a carbon import tax at a quarterly rate. The UK also sets a £50,000 registration threshold, which the EU does not.",
        },
        {
          q: "Does the US have a CBAM?",
          a: "Not yet. The Clean Competition Act and the PROVE IT Act are both draft legislation — one proposing a border carbon fee, the other proposing the comparative carbon-intensity data that would underpin it.",
        },
        {
          q: "Will one dataset satisfy all of them?",
          a: "Largely, if it is built properly: a verified product-level carbon footprint with documented boundaries and retained evidence is the common requirement across every regime announced so far.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 12 */
    "cbam-exporter-action-plan": {
      title: "Five ways CBAM changes life for a non-EU exporter — and what to do about each",
      dek: "Carbon intensity becomes a competitiveness factor, emissions data becomes a trade condition, MRV becomes a recurring cost, a domestic carbon price becomes an asset, and circumvention becomes a serious legal risk.",
      metaTitle: "CBAM for non-EU exporters: the five impacts and a practical action plan",
      metaDescription:
        "How CBAM reshapes competitiveness, contracts, MRV cost, domestic carbon pricing and anti-circumvention risk for exporters outside the EU — with a concrete three-part response.",
      topic: "Strategy",
      keyFacts: [
        { label: "Impact 1", value: "Competitiveness now tracks carbon intensity" },
        { label: "Impact 2", value: "Emissions data becomes a condition of trade" },
        { label: "Impact 3", value: "MRV and audit become a recurring cost" },
        { label: "Impact 4", value: "A verifiable domestic carbon price is deductible" },
        { label: "Impact 5", value: "Circumvention carries penalties up to five times the amount due" },
        { label: "The response", value: "Real emissions data · accredited verification · a decarbonisation plan" },
      ],
      sections: [
        {
          h: "1 — Competitiveness moves to carbon intensity",
          p: [
            "Higher CO₂ per tonne now means a higher landed cost at the EU border, and European buyers see it as a price difference rather than an environmental statistic. Lower-carbon production routes — an electric arc furnace instead of BF-BOF, for example — carry a materially lower CBAM burden and become the first choice for an EU importer.",
            "What the exporter should do: know the emissions intensity per product line, in tCO₂e per tonne, and know how it compares against the EU default for the same CN code. An exporter who cannot state both cannot argue with the EU importer about price.",
          ],
        },
        {
          h: "2 — Emissions data becomes a condition of trade",
          p: [
            "No actual data means the EU default plus a mark-up of 10% for 2026, rising to 20% and then 30%. Importers are already writing CBAM clauses into contracts that require disclosure of a product carbon footprint and reserve the right to reprice or cancel if data is not delivered on time.",
            "What the exporter should do: read every new EU contract for a CBAM clause before signing, and make sure the deadline in it is one the exporter's own collection process can actually hit. A clause the exporter cannot meet is a repricing right handed to the importer.",
          ],
        },
        {
          h: "3 — MRV becomes a recurring cost",
          p: [
            "Monitoring, reporting and verification is not a one-off project. Every year needs measurement, records, precursor data from suppliers, and a third-party verification report from a verifier registered in the CBAM Registry. That cost recurs and, as scope widens, grows.",
            "What to do: build it as a repeatable monthly process rather than an annual scramble. The cost of MRV is dominated by how much of it is manual — chasing suppliers by email, re-keying spreadsheets, rebuilding the same report each year. Automating the loop is where the cost actually falls.",
          ],
        },
        {
          h: "4 — A domestic carbon price becomes an asset",
          p: [
            "A carbon tax or ETS actually paid at home can be deducted from the CBAM cost, provided it is genuinely paid and verifiable. That is a direct incentive for exporting countries to introduce their own carbon pricing — keeping the revenue domestically instead of sending it to Europe.",
            "What the exporter should do: track what the exporting country's own government is doing, and keep the payment evidence. If a deductible carbon price exists and the exporter cannot evidence paying it, the importer gets no deduction.",
          ],
        },
        {
          h: "5 — Circumvention is a serious legal risk",
          p: [
            "Anti-circumvention rules prohibit misdeclaring CN codes or routing goods through a third country to escape the mechanism. Where circumvention is found, both importer and exporter face heavy penalties — up to five times the amount due.",
            "What to do: nothing clever. Classify correctly, document the real production route, and treat any advice built on reclassification or transshipment as a liability rather than a saving.",
          ],
          note: "The Commission designed the extension to downstream products partly to close exactly this door. Circumvention strategies have a short shelf life and a long penalty.",
        },
        {
          h: "The three-part response",
          list: [
            "Build real emissions data — stop relying on default values, calculate CO₂ per unit of product correctly within the EU system boundary, and keep the evidence month by month as the exporter produces it",
            "Prepare for accredited verification — engage a verifier early, get the monitoring plan validated before the year closes, audit the plant, and have the report ready",
            "Plan decarbonisation investment — improve energy efficiency and materials use, and reduce embedded CO₂ so the CBAM burden falls sustainably rather than being merely documented",
          ],
          p: [
            "CBAM is not only a regulation. It is trade in a carbon-priced era, and the exporters who adjust first are the ones who keep the European market over the long run.",
          ],
        },
      ],
      faq: [
        {
          q: "What is the single most important thing an exporter should do about CBAM?",
          a: "Produce verified actual emissions data per product. Everything else — price negotiation, contract terms, buyer confidence — follows from having a real number a verifier has signed.",
        },
        {
          q: "What penalty applies for circumventing CBAM?",
          a: "Penalties for circumvention such as CN-code misdeclaration or transshipment can reach five times the amount due, and apply to both importer and exporter.",
        },
        {
          q: "Is it worth investing in decarbonisation just for CBAM?",
          a: "The CBAM cost falls with emissions and the free allocation deduction falls to zero by 2034, so the return grows every year. But the faster return for most exporters is verifying the emissions they already have, because that alone removes a punitive default value.",
        },
        {
          q: "How long does it take to get CBAM-ready?",
          a: "Plan on a full reporting year of monitoring plus verification lead time. Data for a month cannot be reconstructed after the fact, so the exporter's start date effectively decides the first year actual values can be reported for.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 13 */
    "why-cbam-matters": {
      title: "Why CBAM matters to a non-EU exporter — and how Certrace answers it",
      dek: "CBAM matters because it turns an exporter's carbon figure into part of the price an EU buyer pays: without verified data the buyer pays for a marked-up default, and the cost climbs on a published schedule to 2034. Certrace is built to produce that data on the exporter's side, starting with the suppliers.",
      metaTitle: "Why CBAM matters for exporters (2026) — and how Certrace helps exporters prove their carbon data",
      metaDescription:
        "Why the EU's CBAM is a commercial problem for non-EU exporters, what ignoring it costs per tonne, where the real difficulty lies — and what Certrace does, and does not do, to make an exporter's carbon data verifier-ready.",
      topic: "Strategy",
      keyFacts: [
        { label: "Why it matters", value: "Carbon per tonne is now part of the landed cost at the EU border" },
        { label: "Without verified data", value: "EU default value + mark-up of 10% (2026), 20% (2027), 30% from 2028" },
        { label: "Built-in cost pressure", value: "Free allocation falls from 97.5% in 2026 to 0% in 2034" },
        { label: "First hard deadline", value: "30 September 2027 — declaration and surrender for 2026 imports" },
        { label: "The term the exporter controls", value: "Verified embedded emissions per tonne" },
        { label: "What Certrace does", value: "Collects supplier data, runs the CBAM calculation, keeps a verifier-ready report package" },
        { label: "What Certrace does not do", value: "File the declaration, or replace the accredited verifier" },
      ],
      sections: [
        {
          h: "Why CBAM matters: carbon is now part of the price",
          p: [
            "Since 1 January 2026 an EU importer of steel, aluminium, cement, fertilisers, hydrogen or electricity has to buy CBAM certificates for the emissions embedded in every tonne imported. The Commission published the certificate price at €75.36 per tonne of CO₂e for Q1 2026 and €75.28 for Q2 2026.",
            "The legal obligation sits with the EU importer. The data does not. Only the exporter knows what the furnace burned, what the grid supplied and which precursors went into the product — so the importer's carbon bill is decided by the exporter's numbers. That is why CBAM is best read as a trade condition rather than a tax: it does not stop an exporter selling into Europe, it changes which exporter Europe would rather buy from.",
          ],
        },
        {
          h: "Four reasons it cannot wait",
          list: [
            "The data cannot be recreated later. A meter reading for March 2026 exists in March 2026 or not at all, and an accredited verifier will not accept a figure reconstructed from memory. 2026 imports are declared on 30 September 2027, but the evidence behind them is being produced, or lost, now.",
            "Defaults are punitive, and get worse every year. With no verified actual value, the EU importer must use the EU default — set from high-emitting installations on purpose — plus a mark-up of 10% for 2026, 20% for 2027 and 30% from 2028.",
            "The deduction shrinks on a schedule. Free allocation is 97.5% in 2026, 51.5% in 2030 and zero from 2034. The same emissions figure costs more each year even if the certificate price never moves.",
            "The scope is widening. The Commission has proposed adding around 180 downstream steel and aluminium products from 1 January 2028, and the UK starts its own CBAM on 1 January 2027. Every one of these regimes asks for the same thing: a verifiable product carbon footprint.",
          ],
        },
        {
          h: "What it costs to do nothing",
          p: [
            "Take a Thai iron and steel good from the published Annex I table with a base default value of 1.190 tCO₂e per tonne. Without verified data, the EU importer declares it at the marked-up default. If the plant's real, verified figure is 0.9 tCO₂e per tonne, the gap looks like this:",
          ],
          table: {
            head: ["Year", "Default with mark-up", "Verified actual", "Extra CO₂ the buyer pays for, per tonne"],
            rows: [
              ["2026", "1.309 tCO₂e/t (+10%)", "0.9 tCO₂e/t", "0.409 t"],
              ["2027", "1.428 tCO₂e/t (+20%)", "0.9 tCO₂e/t", "0.528 t"],
              ["2028 onward", "1.547 tCO₂e/t (+30%)", "0.9 tCO₂e/t", "0.647 t"],
            ],
          },
          note: "Nothing about the factory changed between those rows. The number rose because nobody supplied a verified figure — and at certificate prices in the mid-seventies of euros, the EU importer pays for that gap on every tonne shipped. A buyer facing that choice will prefer the exporter whose verified figure removes it.",
        },
        {
          h: "Where the real difficulty is",
          p: [
            "The CBAM formula fits on one line. What makes CBAM hard for an exporter is the workflow behind the one term the exporter controls:",
          ],
          list: [
            "Suppliers up the chain hold the precursor data, answer in different formats, and have less reason to care than the exporter who would lose the European order",
            "For a complex good, defaults may cover at most 20% of total embedded emissions from precursors — one large supplier who does not answer can push the whole product back to the default value",
            "Evidence has to be collected every month, for every plant and product line, and kept in a form an accredited verifier will accept",
            "Verifier capacity is limited, and the first declaration concentrates demand into the first half of 2027",
            "The EU importer needs the result in the EU's format, on a quarterly rhythm from 2027, not as a spreadsheet at the end of the year",
          ],
        },
        {
          h: "How Certrace answers each part",
          p: [
            "Certrace is the workspace where that loop runs on the exporter's side — from the supplier's first answer to the package the EU importer and the verifier receive.",
          ],
          table: {
            head: ["The problem", "What Certrace does"],
            rows: [
              ["Suppliers who do not answer, each in a format of their own", "Smart Link supplier invite — one guided link per supplier, in Thai or English, on any device, with no account and automatic reminders"],
              ["The same questions asked every month", "Fill-once supplier profile — answers are saved and prefilled on the next request, across products, periods and buyers"],
              ["Missing fields, wrong units, impossible numbers", "Automatic quality check the moment a supplier submits, with a plain-language summary; the AI flags problems and never edits a figure"],
              ["The 20% precursor rule and the arithmetic", "CBAM calculation engine with the definitive-period rules built in, including the 20% default cap, and a calculation trail on every figure"],
              ["Not knowing where the exposure is", "Carbon benchmark against default values, by product line — which lines carry the most cost and what a change is worth"],
              ["The buyer or the verifier asks for proof", "Always-ready report package — a ~24-page communication and audit package with methodology, an evidence register, named sign-offs and the audit trail, sealed with a SHA-256 hash, plus Annex IV XML"],
            ],
          },
        },
        {
          h: "Built for the exporter, not the buyer",
          p: [
            "Most carbon platforms in this space are bought by the EU importer, and treat the exporter as a data source to chase. Certrace sits on the other side of the table: the suppliers, the data and the proof belong to the exporter, and the same dataset can answer every buyer who asks rather than being rebuilt for each one.",
            "That matters beyond the EU. The UK, and whatever follows elsewhere, will ask for the same verified product footprint. An exporter who builds it once as infrastructure has answered all of them; an exporter who builds it as a one-off filing will build it again.",
          ],
        },
        {
          h: "What Certrace does not do",
          list: [
            "File the CBAM declaration. Only the EU importer's authorised CBAM declarant may file with the Registry; Certrace hands that declarant a complete dataset, the Annex IV template and the audit package",
            "Replace the accredited verifier. Verification is still done by an independent verifier; Certrace organises the monitoring evidence so that verification has less to find and goes faster",
            "Lower the plant's emissions by itself. Decarbonisation is plant work; what Certrace removes is the cost of an unproven figure — the gap between the default and the truth",
            "Cover every sector yet. Today it supports EU CBAM for iron, steel and aluminium, with 67 CN-coded goods; UK CBAM is on the roadmap",
          ],
          note: "Saying this plainly is the point. On a compliance site, a tool that claims to do the declarant's or the verifier's job is a tool that will fail an audit.",
        },
        {
          h: "Where an exporter should start",
          list: [
            "Check the CN code of every product shipped to the EU — scope is decided by customs code, not by product name",
            "List the precursor suppliers and rank them by their share of embedded emissions; the largest decides whether the product passes the 20% rule",
            "Start monthly collection now, so a full year of 2026 evidence exists when the verifier asks for it",
            "Engage an accredited verifier in Q4 2026 or Q1 2027, while the monitoring plan can still be fixed cheaply",
            "Put the supplier loop on a platform rather than an inbox — that is the part Certrace was built to take off the exporter's desk",
          ],
        },
      ],
      faq: [
        {
          q: "Why is CBAM important for exporters outside the EU?",
          a: "Because the EU importer pays for the emissions embedded in what the exporter sells, and without the exporter's verified data that importer must use a marked-up default. Carbon per tonne becomes part of the price, and buyers move toward exporters who can prove a lower figure.",
        },
        {
          q: "Does Certrace replace an accredited verifier?",
          a: "No. An accredited verifier still has to verify the figures for them to count as actual values. Certrace collects and organises the evidence so the verification is quicker and finds less.",
        },
        {
          q: "Can Certrace file an exporter's CBAM declaration?",
          a: "No, and no vendor can. Only the EU importer's authorised CBAM declarant may file. Certrace gives that declarant the dataset, the Annex IV template and a sealed audit package.",
        },
        {
          q: "Which products does Certrace support today?",
          a: "EU CBAM for iron, steel and aluminium, covering 67 CN-coded goods under the definitive-period rules. UK CBAM is on the roadmap.",
        },
        {
          q: "Do an exporter's suppliers need an account or a fee to use Certrace?",
          a: "No. Each supplier receives one Smart Link — a guided form in Thai or English on any device, with no account and no fee — and their answers are saved so the next request is prefilled.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 14 */
    "cbam-supplier-data-request": {
      title: "A customer asked for CBAM data — what a supplier should do",
      dek: "The request comes because the exporter's EU buyer pays for the emissions embedded in everything that went into the product, including the supplier's material. The supplier owes the EU nothing, but answering with real, evidenced figures is what keeps the exporter — and the order — able to use an actual value instead of a costly default.",
      metaTitle: "Received a CBAM data request? A supplier's guide to what to send and why (2026)",
      metaDescription:
        "Why an exporter is asking its supplier for CBAM emissions data, whether the supplier has to answer, exactly what to send, what evidence to keep, and what to do if the numbers do not exist yet.",
      topic: "Data",
      keyFacts: [
        { label: "Why the request arrives", value: "The exporter needs its precursors' embedded emissions to report an actual value" },
        { label: "Legal obligation on the supplier", value: "None under CBAM — the obligation sits with the EU importer" },
        { label: "Commercial reality", value: "Without the supplier's figure the product can fall back to the EU default" },
        { label: "The rule behind it", value: "Defaults may cover at most 20% of a complex good's embedded emissions from precursors" },
        { label: "What to send", value: "Material, quantity, embedded emissions per tonne, installation, country, evidence, verification status" },
        { label: "What not to send", value: "A number nobody measured — an accredited verifier will not accept it" },
      ],
      sections: [
        {
          h: "Why the request reached the supplier",
          p: [
            "Since 1 January 2026, an EU importer of steel, aluminium and the other CBAM goods buys certificates for the emissions embedded in each tonne imported. Those emissions include not only what the exporter's own plant emitted but everything embedded in the in-scope materials the exporter bought and consumed — the billet in the bar, the coil in the tube.",
            "Those materials are called precursors, and their emissions sit with the supplier. The exporter cannot measure a supplier's furnace, so it has to ask. For most steel and aluminium products, the inherited part is the larger part of the total, which is why the request is rarely optional for the exporter, even though it is not a legal duty for the supplier.",
          ],
        },
        {
          h: "Does a supplier have to answer?",
          p: [
            "Not under CBAM itself. The regulation binds the EU importer, who must be an authorised CBAM declarant; it places no filing duty on a supplier outside the EU, and a supplier never buys certificates.",
            "The pressure is commercial, and it is sharp. For a complex good, default values may cover at most 20% of the total embedded emissions coming from precursors. If one large supplier does not answer, the exporter can cross that line, and then the full EU default value applies to the whole product — including everything the exporter measured properly. A supplier who answers keeps the exporter's product competitive; a supplier who does not may find the next order going to one who did.",
          ],
          note: "Expect the request to become contractual. The guides on this site advise exporters to put a CBAM clause into supply contracts so the data obligation travels with the purchase order. A supplier who builds the answer once is ready when that clause arrives.",
        },
        {
          h: "What the exporter will ask for",
          p: [
            "A usable precursor record is structured data, not a sentence. \"Billet from our mill\" cannot be multiplied or checked; the exporter needs:",
          ],
          list: [
            "Which material it is — as a defined product, ideally with its CN code",
            "The quantity delivered in the period, in tonnes",
            "Its specific embedded emissions in tCO₂e per tonne, and whether that figure is an actual value or a default",
            "The installation that produced it, and the country",
            "The production route — for steel, for example, an electric arc furnace or a blast furnace route",
            "Whether the figure has been verified, and by whom",
          ],
        },
        {
          h: "The evidence to keep behind the number",
          p: [
            "Actual values in CBAM only count once an accredited verifier has checked them, and a verifier checks evidence, not assurances. Whoever verifies the exporter's figure may ask what lies behind the supplier's. Keep, month by month:",
          ],
          list: [
            "Fuel invoices, with quantities and calorific values",
            "Meter readings for gas, steam and other energy inputs",
            "Electricity bills",
            "Laboratory analyses of materials where carbon content matters",
            "Production records — tonnes produced per product and per month",
            "Mill test certificates or equivalent product documents",
          ],
          note: "Evidence has to be collected as it is produced. A meter reading for March exists in March or not at all, and a figure reconstructed later from memory is not one a verifier will sign.",
        },
        {
          h: "If the numbers do not exist yet",
          p: [
            "Many suppliers have never calculated an emissions figure, and that is not a reason to stay silent. Tell the exporter what exists today, and start monthly monitoring now so the next answer is better than this one.",
            "What a supplier must never do is invent a figure, or describe its material as something it is not. A made-up number fails at verification, and misdeclaring goods to escape CBAM is treated as circumvention, with penalties of up to five times the amount due for both importer and exporter. An honest \"we do not have it yet\" lets the exporter decide whether a default can cover that material within the 20% allowance.",
          ],
        },
        {
          h: "Sharing data without giving away the business",
          p: [
            "A common worry is that answering exposes prices or processes to a customer. A CBAM record needs emissions, quantities and evidence for the emissions — not prices, margins or customer lists. Ask the exporter who will see the data and for what; a reasonable answer is the exporter's team, its verifier and, in aggregated form, the EU importer's declarant.",
            "When the request comes through Certrace, it arrives as a Smart Link scoped to that one supplier: the supplier sees only its own form, other suppliers never see its answers, and every action is logged.",
          ],
        },
        {
          h: "Answering through a Smart Link",
          list: [
            "One link, opened on any device, with no account to create and no fee",
            "A guided form in Thai or English that asks only what the product requires",
            "Answers saved to a profile, so next month's request — or another exporter's — arrives prefilled",
            "Missing fields, wrong units and impossible numbers are flagged at submission, before the exporter has to come back with questions",
          ],
          p: [
            "The first answer takes the most work. After that, keeping the profile current is a matter of minutes each period rather than a new questionnaire from every customer.",
          ],
        },
      ],
      faq: [
        {
          q: "Does a supplier have to give CBAM data to its customer?",
          a: "Not under CBAM law, which binds only the EU importer. Commercially it often does: without the supplier's figure, the exporter's product can exceed the 20% default allowance for precursors and fall back entirely to the EU default value.",
        },
        {
          q: "Will the supplier have to pay for CBAM certificates?",
          a: "No. Only the EU importer, as an authorised CBAM declarant, buys and surrenders certificates. The cost can reach the supply chain through prices and contracts, but no supplier buys certificates itself.",
        },
        {
          q: "What should a supplier send if it has never measured its emissions?",
          a: "The facts it does have — material, quantities, installation, production route — and a clear statement that no measured emissions figure exists yet. Never an estimate presented as a measurement. Then start monthly monitoring.",
        },
        {
          q: "Does the supplier's figure need to be verified?",
          a: "An actual value only counts once an accredited verifier has checked it, so expect the verifier working on the exporter's figure to ask about the evidence behind the supplier's number, or whether the supplier's installation has its own verification.",
        },
        {
          q: "Does a supplier need an account to answer a Certrace request?",
          a: "No. A Smart Link opens a guided form in Thai or English on any device, with no account and no fee, and the answers are saved so later requests arrive prefilled.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 15 */
    "how-to-calculate-cbam-emissions": {
      title: "How to calculate CBAM embedded emissions, step by step",
      dek: "Specific embedded emissions per tonne = (the emissions attributed to producing the good + the emissions embedded in every precursor consumed) ÷ the tonnes produced. Five steps take an exporter from meter readings to a figure an accredited verifier can sign.",
      metaTitle: "How to calculate CBAM emissions: SEE step by step, with a worked example (2026)",
      metaDescription:
        "A practical walk-through of the CBAM embedded-emissions calculation for exporters — system boundary, direct and indirect emissions, precursors and the 20% rule, dividing by production — with a worked example and the checks to run before verification.",
      topic: "Data",
      keyFacts: [
        { label: "What is calculated", value: "Specific embedded emissions (SEE), in tCO₂e per tonne of the good" },
        { label: "Simple good", value: "Attributed emissions ÷ tonnes produced" },
        { label: "Complex good", value: "(Attributed emissions + emissions embedded in precursors) ÷ tonnes produced" },
        { label: "Direct emissions", value: "Fuels and processes inside the system boundary (Scope 1)" },
        { label: "Indirect emissions", value: "Electricity consumed (Scope 2) — counted in the declared figure only for some goods" },
        { label: "Default cap for precursors", value: "20% of total embedded emissions" },
        { label: "Becomes an actual value", value: "Only once an accredited verifier has verified it" },
      ],
      sections: [
        {
          h: "What the number is",
          p: [
            "CBAM prices a tonne of goods by its specific embedded emissions — SEE — the tonnes of CO₂-equivalent emitted to make one tonne of that good. It is calculated per good, per production route and per installation, from data collected through the reporting period.",
            "The arithmetic is short. What takes the work is the set of decisions and records underneath it, which is why the steps below matter more than the formula.",
          ],
          note: "Simple good: SEE = attributed emissions ÷ production. Complex good: SEE = (attributed emissions + Σ precursor mass × precursor SEE) ÷ production.",
        },
        {
          h: "Step 1 — Draw the system boundary",
          p: [
            "Decide which processes belong to making the good. The boundary is the production process for that good — not the whole site, and not the whole company. A plant that runs two production routes, or makes in-scope and out-of-scope goods on shared equipment, has to say which inputs and emissions belong to which.",
          ],
          list: [
            "Name the production route actually run, and keep it matched to the plant — a mismatch is one of the first things a verifier checks",
            "List every fuel, material and energy input that crosses the boundary",
            "Where utilities are shared, record how they are split between products, and keep the split consistent from month to month",
          ],
        },
        {
          h: "Step 2 — Direct emissions",
          p: [
            "Direct emissions are what the process releases on site: fuels burned and process emissions from materials such as carbonates or carbon-bearing reductants. Most plants calculate rather than measure them — the quantity of each fuel or material, multiplied by its calorific value and emission factor. A plant with continuous emissions monitoring can measure at the stack instead.",
            "Every number in that calculation needs a source document behind it: fuel invoices with quantities and calorific values, meter readings, and laboratory analyses where carbon content varies.",
          ],
        },
        {
          h: "Step 3 — Indirect emissions",
          p: [
            "Indirect emissions come from the electricity the process consumes: megawatt-hours used, multiplied by the emission factor of that electricity.",
            "Whether they count in the declared figure depends on the good. Regulation (EU) 2023/956 lists, in its Annex II, the goods for which only direct emissions are taken into account — iron and steel, aluminium and hydrogen among them; for goods such as cement and fertilisers, indirect emissions count too. Monitor electricity either way: the bill is evidence a verifier expects to see, the EU default tables carry indirect values, and the UK CBAM starting in 2027 counts direct and indirect emissions.",
          ],
        },
        {
          h: "Step 4 — Add the precursors",
          p: [
            "For a complex good, add the emissions embedded in each in-scope precursor consumed: the tonnes of that precursor used, multiplied by its own SEE. That figure comes from the supplier — an actual value if the supplier can evidence it, otherwise a default.",
            "Then check the 20% rule. Default values may cover no more than 20% of the good's total embedded emissions from precursors. Cross that line and the declaration fails the criterion: the full default value applies to the whole product, including the parts measured properly.",
          ],
        },
        {
          h: "Step 5 — Divide by production",
          p: [
            "Divide the total by the tonnes of the good produced within the same boundary over the same period. The production figure needs its own evidence — production records per product and per month — and it must use the same boundary as the emissions it divides, or the result is meaningless.",
          ],
        },
        {
          h: "A worked example",
          p: [
            "A hypothetical steel tube line, over one month. The numbers are illustrative, chosen to show the arithmetic — they come from no real installation and no EU table.",
          ],
          table: {
            head: ["Input", "Quantity", "Emissions"],
            rows: [
              ["Tubes produced (the good)", "1,000 t", "—"],
              ["Natural gas for reheating (direct)", "From fuel invoices", "120 tCO₂"],
              ["Electricity (indirect)", "400 MWh", "Monitored; not added for iron and steel"],
              ["Hot-rolled coil (precursor)", "1,050 t × 1.8 tCO₂e/t", "1,890 tCO₂e"],
              ["Total embedded emissions", "", "2,010 tCO₂e"],
              ["SEE of the tube", "2,010 ÷ 1,000", "2.01 tCO₂e/t"],
            ],
          },
          note: "The precursor is 94% of the total. If the coil supplier sent no figure, a default would have to cover 94% of embedded emissions from precursors — far past the 20% cap — and the whole tube would fall back to the EU default. The plant's own 120 tonnes, however well measured, would not save it. That is why supplier data comes first.",
        },
        {
          h: "Check the result before the verifier does",
          list: [
            "Units: kilograms against tonnes and kilowatt-hours against megawatt-hours are the most common errors in supplier data",
            "Boundary: the production figure and the emissions use the same boundary and the same period",
            "Precursor share: the part covered by defaults is under 20%, with margin",
            "Comparison: set the result beside the EU default for the same CN code — a figure far above it deserves a second look, and one far below needs its evidence ready",
            "Evidence: every input in the calculation points to a document a verifier can open",
            "Consistency: month-to-month swings have a reason someone can explain",
          ],
        },
        {
          h: "Where Certrace fits",
          p: [
            "Certrace runs this calculation for the exporter, under the definitive-period rules, with the 20% default cap built in and a calculation trail attached to every figure. Supplier inputs are collected through Smart Links and checked the moment they arrive, so a unit error is caught at submission rather than at verification. Coverage today is iron, steel and aluminium.",
          ],
        },
      ],
      faq: [
        {
          q: "What is SEE in CBAM?",
          a: "Specific embedded emissions: the tonnes of CO₂-equivalent emitted to produce one tonne of a good, including — for a complex good — the emissions embedded in the precursors consumed.",
        },
        {
          q: "Do iron and steel include indirect emissions?",
          a: "Not in the declared figure. Annex II of Regulation (EU) 2023/956 lists iron and steel, aluminium and hydrogen among the goods for which only direct emissions are taken into account. Electricity should still be monitored and evidenced.",
        },
        {
          q: "How often should the data be collected?",
          a: "Monthly, as it is produced. Evidence cannot be reconstructed later, and from 2027 EU importers need figures on a quarterly rhythm to meet their certificate-holding checks.",
        },
        {
          q: "Can a default value be used for a precursor?",
          a: "Yes, as long as defaults cover no more than 20% of the good's total embedded emissions from precursors. Above that, the full default value applies to the whole product.",
        },
        {
          q: "Is a correct calculation enough to count as an actual value?",
          a: "No. A figure becomes an actual value only once an accredited verifier has verified it. Until then it is treated as no figure, and the EU default applies.",
        },
      ],
    },
  },
};
