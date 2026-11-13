/* ════════════════════════════════════════════════════════════
   WHAT CERA KNOWS ABOUT USING CERTRACE

   How to get things done in the product, in the words of someone sitting in front
   of it: where to click, what a screen is for, what a message means. Nothing here
   says how any of it is built — only what it does, which is all a user needs and
   all Cera is allowed to say.
   ════════════════════════════════════════════════════════════ */

import { entry, type Entry } from "./knowledge-types";

const p = (
  id: string,
  title: string,
  keys: string[],
  answer: string,
  related?: string[],
) => entry("platform", id, title, keys, answer, related);

export const PLATFORM_KNOWLEDGE: Entry[] = [
  p(
    "what-is-certrace",
    "What Certrace is for",
    [
      "what is certrace",
      "what does certrace do",
      "what can certrace do",
      "about certrace",
      "what is this platform",
      "what is this app",
      "what is this portal",
      "what is this",
      "certrace for",
      "explain certrace",
    ],
    `Certrace helps an exporter prove the emissions behind what it ships to the EU. You set up your installation once, create a product report for each good, collect the plant's monthly readings and the documents behind them, deal with the precursors you buy in, and download the report package your buyer and verifier need.

It shows what you are likely to be charged on default values, so you can see what verified data is worth, and it keeps track of what is still missing. Cera, the assistant you're talking to, answers CBAM questions, explains the screens, reads a file you give it and fills in monthly figures, and keeps you up to date with the rules.`,
    [
      "Where do I start?",
      "What does each sidebar item do?",
      "What can Cera do?",
    ],
  ),
  p(
    "getting-started",
    "Getting started in Certrace",
    [
      "getting started",
      "where do i start in certrace",
      "how do i begin",
      "first steps in certrace",
      "how to start",
      "set up certrace",
      "onboarding",
      "how do i use certrace",
      "walkthrough",
      "how does certrace work",
    ],
    `The order that works:

1. Settings → Installation → Your installations → Add a site. Enter the plant's name, address, UN/LOCODE and coordinates.
2. Verification → New product report. Pick who produces the good, the country and CN code, the route and the year. When you create it, Certrace opens that installation's Overview.
3. On the Overview, answer the 17 required boxes once: the operator, the installation, the monitoring plan summary and seven yes/no questions. It saves as you type. Until all 17 are in, the site's product reports read Blocked — but you can enter months and precursors meanwhile.
4. On the product report, send the plant its monthly link (Monthly data tab) — or fill the month in yourself.
5. On the Precursors tab, add what you buy in and choose default or actual for each.
6. When the installation's Readiness tab shows everything complete, download the package. Every row that isn't ready there says how to fill it, gives an example and links to the screen.`,
    [
      "How do I add an installation?",
      "How do I create a product report?",
      "How does the monthly link work?",
    ],
  ),
  p(
    "sidebar",
    "What the sidebar items do",
    [
      "sidebar",
      "what does each sidebar item do",
      "menu",
      "navigation",
      "what is smart links",
      "what is carbon and cost",
      "what is the dashboard",
      "what are the pages",
      "main menu",
      "tour",
      "what is supply chain",
    ],
    `• Dashboard — where you stand, on one screen: the six figures that matter, the year against the EU default, what needs you, and the dates that matter.
• Verification — the heart of it: company → installation → reporting year → product reports. New product reports start here.
• Smart Links — every monthly link and precursor request you have sent, who has answered, and who is late.
• Supply Chain — everyone you collect data from, plants and precursor suppliers, with how healthy each is and where the worry is.
• Reports — one package per installation and year, ready to export once everything is complete.
• Carbon & Cost — compare installations, years and products: what your own figures cost in certificates, against what a buyer pays on the EU default.
• Cera Intelligence — me.
• Team & seats — invite colleagues.
• Plan & billing — your plan.
• Settings — organisation, profile, notifications, privacy and your own installations.`,
    [
      "What is Verification?",
      "What is the Reports page?",
      "What is on the Supply Chain page?",
    ],
  ),
  p(
    "verification-page",
    "The Verification page",
    [
      "verification page",
      "what is verification",
      "verification screen",
      "how is verification organised",
      "company installation year product report",
      "hierarchy",
      "estate",
      "how are things organised",
    ],
    `Verification lists everything you report on, in four levels: your company (or a supplier) → the installation → the reporting year → the product reports of that year. Each product report is one CN code for one year at one installation.

The ⋯ menu on an installation opens it, jumps to its product reports or its readiness and report set, or starts a new product report. Use the filters for installation, good, year and readiness, and the toggle for cards or a table. Archived product reports sit behind the Archived button.`,
    ["How do I create a product report?", "What is readiness?"],
  ),
  p(
    "add-installation",
    "Adding an installation",
    [
      "add an installation",
      "add installation",
      "add a site",
      "register installation",
      "new installation",
      "register my plant",
      "register your installation",
      "how do i add a site",
      "create installation",
      "add my factory",
    ],
    `Two ways in:
• Settings → Installation → Your installations → Add a site (or Register your installation the first time).
• When you create a product report and choose "We produce it ourselves", you can add a site there.

The form asks for: the name in English; a reference of your own for the site (country code first — like TH-RAYONG-01 — then letters and numbers; it must be unique); the street, post code, city and country; the UN/LOCODE; and the latitude and longitude of the main emission source (the stack of the furnace or kiln that dominates, not the front gate). Every box carries the report item it feeds, and a black box means required.

After that, open the installation and complete its Overview.`,
    [
      "What do the numbered boxes mean?",
      "What is the installation reference?",
      "What goes in the installation Overview?",
    ],
  ),
  p(
    "installation-reference",
    "The installation reference",
    [
      "installation reference",
      "what is the reference",
      "reference th",
      "why do i need a reference",
      "unique reference",
      "change reference",
      "installation id",
    ],
    `The reference is Certrace's own ID for the site — country code first, then letters, numbers and single hyphens, 5 to 32 characters, such as TH-RAYONG-01. Every product report, month, document and package for that plant is filed under it, so it must be unique. It is not the CBAM Registry identifier — that one the EU issues later, and you enter it under Operator on the installation's Overview.

You can change it on the installation's Overview: type the new one and click away. Everything filed under the old one moves with it.`,
    ["What goes in the installation Overview?"],
  ),
  p(
    "installation-overview",
    "The installation Overview",
    [
      "installation overview",
      "what goes in the installation overview",
      "entered once",
      "operator details",
      "monitoring plan summary",
      "installation info",
      "installation page",
      "one time information",
      "operator name",
      "registry id",
    ],
    `The Overview is what you enter once per site; every product report and every report in the package reads from it. It has three parts:

• Operator — the company that runs the plant: name, registration number, address in English, and the CBAM Registry identifier once you have it.
• Installation — name, reference, address, UN/LOCODE and the coordinates of the main emission source.
• Summary of the monitoring plan — the non-CBAM processes, the five main fuels and materials, and yes/no questions: continuous measurement, zero-rated fuels, heat, several electricity sources, electricity made on site, waste gases, CO₂ transfers — and whether electricity goes to the EU. Answer "no" where it doesn't apply; a "no" is an answer.

It saves itself as you type (the badge says so). Seventeen answers are required: three about the operator, four about the installation, three lines of the monitoring plan summary and the seven yes/no questions. The pill in the header — "Installation info 4/17" — counts how many are in; press it to open this page. Until all 17 are answered, the site's product reports read Blocked and the package can't be built, but months and precursors can still be entered.`,
    [
      "Why does my product report say Blocked?",
      "What do the numbered boxes mean?",
      "Why can't I download the package?",
    ],
  ),
  p(
    "number-boxes",
    "The numbered boxes",
    [
      "numbered boxes",
      "number boxes",
      "what do the numbers mean",
      "boxed number",
      "black box white box",
      "required optional",
      "what is the number before the field",
      "tag",
      "field numbers",
      "1(d)",
      "16(a)",
    ],
    `The small box before a field shows which item of the operator's emissions report the answer goes into — "1(d)" is the installation's identity, "16(a)" the fuel and process readings, "13" the production, "12" the electricity sources.

Its colour is the marker: a black box with white digits means required, a white box means optional. Hover or tap it and it says which. A "—" means Certrace asks it but it isn't an item of the report (such as the site reference). There are no separate "required" labels — the box is the label.`,
    [
      "What goes in the installation Overview?",
      "What goes in the monthly data?",
    ],
  ),
  p(
    "create-product-report",
    "Creating a product report",
    [
      "create a product report",
      "new product report",
      "add a product report",
      "how do i create a report",
      "add a product",
      "new product report",
      "how to add a good",
      "start a product report",
      "new report",
    ],
    `Verification → New product report. Four steps:

1. Supplier — who produces this good: "We produce it ourselves" (pick or add your own site) or "Another supplier produces it" (pick the supplier, then their installation).
2. Country and good — the country of production and the CN code. The list shows each code's default value for your country.
3. Route and year — the production route (it decides the benchmark) and the reporting year.
4. Schedule — when each month's data is due.

Each product report is one good at one installation for one year. A second good, or the same good in another year, is another product report.

When you press Create, Certrace opens the installation's Overview — the 17 one-time answers every report of that site starts from. The new report is a click away on the installation's Products tab. To start another from one you already have, use ⋯ → Duplicate report.

From an installation's Products tab or its ⋯ menu, New product report starts with that installation already chosen, so you begin at step 2 — and closing the flow brings you back to the installation.`,
    [
      "What are the tabs of a product report?",
      "How does the monthly link work?",
      "How do I duplicate a product report?",
    ],
  ),
  p(
    "product-report-tabs",
    "The tabs of a product report",
    [
      "product report tabs",
      "what are the tabs",
      "overview monthly data precursors carbon price settings",
      "tabs of a product report",
      "product report screen",
      "what is in a product report",
    ],
    `• Overview — the good, the installation it is made at, the figures worked out so far and where the year stands.
• Monthly data — the twelve months: who has answered, what is missing, and each month's form.
• Precursors — what you buy in, default or actual for each, and the products your own site makes and uses.
• Carbon price — what was paid for this good's emissions at home.
• Settings — the product report's details, schedule, and archiving.

The methodology — how this good's emissions are monitored — sits inside Monthly data, so it has no tab of its own. Readiness isn't a tab here either: it is on the installation, because the reports are filed per installation and year.

At the top, a back arrow and the trail Verification → installation → product report take you up a level.`,
    [
      "How does the monthly link work?",
      "How do precursors work?",
      "What are the tabs of an installation?",
    ],
  ),
  p(
    "monthly-link",
    "The monthly link",
    [
      "monthly link",
      "how does the monthly link work",
      "send monthly link",
      "send link to plant",
      "factory manager link",
      "smart link",
      "plant link",
      "how do i get the data from the plant",
      "request monthly data",
      "send the link",
      "supplier link",
    ],
    `The plant manager gets a link for each month — no account, no password. It opens a short flow: an overview, the methodology (confirmed each month), the monthly readings, the documents, a check and an internal authorisation. The check is a list of what the month contains, laid out like the boxes of the report package: each part is Ready or Missing, and pressing a row takes the plant back to that field and lights it. It checks that everything is there, not whether a figure looks right. The authorisation takes a name and a role; the time it is pressed is recorded, and a history of every authorisation is kept at the bottom. Everything saves as they type, and the plant can start from the previous month and change only what differs.

On the first page the plant can switch to another month — but only a month you have sent: it opens for them once you press Send now on it. If the plant made nothing in a month, press "No production" beside Send now: the month counts as answered, with no tonnes and no emissions, and nobody is asked for it.

You can send the link from the product report's Monthly data tab or from Smart Links, where you also see who has answered and who is late, and send reminders. To read a month, press View on its card: the same form with what the plant is asked for on top. Once the plant has submitted it you can confirm it, send it back naming the parts that need another look, or approve a request from the plant to edit a month it already sent.`,
    [
      "What does the plant fill in each month?",
      "Can I fill in a month myself?",
    ],
  ),
  p(
    "monthly-data",
    "What the plant fills in each month",
    [
      "what goes in the monthly data",
      "monthly data",
      "what does the plant fill in",
      "monthly form",
      "monthly readings",
      "production fuels electricity",
      "what do i enter each month",
      "monthly inputs",
      "what is collected monthly",
    ],
    `Each month asks only what the plant can read off its own meters and records:

• Production — tonnes of saleable output (13 · 34), and any non-CBAM goods made on the same process (14).
• Fuels burned — fuel, quantity, unit, calorific value, emission factor and where it comes from (16(a)). The whole list of standard fuels is there, with "Other fuel" for the rest. The EU standard values fill in and lock until you have a better figure and its document. Each row can also say how its quantity is found: one meter or invoice, deliveries and stock, or a share of a shared meter.
• Electricity — one row per source: grid, power purchase agreement, self-generated or a direct link, with the MWh and the factor (9 to 12) — or a share of a meter that feeds several products. For steel, aluminium and hydrogen it is optional: only their direct emissions count, so a month can be submitted without it.
• Steel and aluminium add their own blocks: raw materials and carbon, scrap (with its deliveries), anodes and electrodes, fluxes, PFC from anode effects (by line of cells), and the alloy composition of what was made.
• Process emissions — material, quantity, method (16(a)).
• Also report this month — only if it applies: continuously measured emissions (16(b)), CO₂ received or sent on (16(d)), heat, waste gases — by energy, or gas by gas with volume and composition — and electricity sent out (17).
• Gaps, estimates and notes (16(e)).

A strip at the top says what is still needed and jumps to it. The plant's address and precursors are not asked — those are yours.`,
    [
      "What do the numbered boxes mean?",
      "Why is the calorific value locked?",
      "What is a stock change?",
      "What is a shared meter?",
    ],
  ),
  p(
    "fill-month-yourself",
    "Filling a month yourself",
    [
      "fill in a month myself",
      "enter the month myself",
      "can i fill in the monthly data",
      "exporter fills month",
      "edit a month",
      "month screen",
      "open a month",
    ],
    `Yes. Open the product report → Monthly data → View on the month. On top is what the plant is asked for, each part Ready or Missing — press a row to go to it. Below is what has been entered, in the same form the plant sees, field for field, with the month's totals above it. You can fill in anything for the plant, change it, copy the setup from the previous month (fuels, factors and sources, never the quantities), or let me fill it from a file — just tell me "smart upload". At the bottom is the history of who authorised the month and when.

A month the plant has submitted opens read-only; press Edit if you must change a figure — it's recorded, and it replaces the plant's attestation with your edit. The review bar and the send-back panel appear once the plant has sent something.`,
    ["How does smart upload work?", "How does the monthly link work?"],
  ),
  p(
    "month-no-production",
    "A month with no production",
    [
      "no production",
      "no production this month",
      "plant did not produce",
      "plant did not manufacture",
      "month with no production",
      "nothing was made",
      "plant was shut",
      "plant closed for a month",
      "mark a month as not produced",
      "zero production month",
      "idle month",
      "shutdown month",
    ],
    `If the plant made nothing in a month, press "No production" beside Send now on that month's card (on the product report's Monthly data tab). The month counts as answered — it is complete, with no tonnes and no emissions — so the year can close, the plant is not asked for it and nobody is chased. If figures had already been typed for that month, the button asks a second time, because marking it clears them.

Everything that reads the year follows: the year's total and its count of months, the readiness of the Monthly data and Evidence tabs, the report boxes and the plant's own month picker. "Take back" on the card puts the month back to not started, and the plant can ask for a "no production" month to be reopened if it did produce after all.`,
    ["How does the monthly link work?", "Can I fill in a month myself?"],
  ),
  p(
    "month-review",
    "Reviewing and sending a month back",
    [
      "review a month",
      "send a month back",
      "ask for a fix",
      "revision request",
      "request revision",
      "plant edit request",
      "reopen a month",
      "confirm a month",
      "month submitted what next",
    ],
    `When a plant submits a month, you see it in the review bar on that month's screen. You can confirm it, or send it back: name the parts that need another look (the boundary, fuels, electricity, process emissions, production, documents), say what's wrong, and the month returns to the plant with those parts highlighted.

The other way round: a plant that spots its own mistake can ask to reopen a submitted month; you approve or refuse. Nothing reopens by itself, so a submitted month always means something.`,
    ["How does the monthly link work?"],
  ),
  p(
    "precursors-tab",
    "Precursors in Certrace",
    [
      "check what the precursor sent",
      "what the precursor sent",
      "check the precursor's data",
      "precursor submitted their data",
      "precursor answered",
      "enter the precursor's data",
      "precursor data",
      "how do precursors work",
      "add a precursor",
      "precursors tab",
      "how do i add a precursor in certrace",
      "add direct precursor",
      "precursor default or actual in certrace",
      "bought in input",
      "add supplier input",
    ],
    `Product report → Precursors → Add precursor. It takes two steps:

1. Pick the good it is (from the catalogue — only its CN code and name are shown, no figures).
2. Say where it was made: choose the country — or tick "The country of production cannot be identified". You then see the default value for that country, and choose Default or Actual.

The CN code and name are fixed once added. Default needs nothing more: the quantity used, and the value stands. Actual asks the producer for verified data: you send them a link with the same boxed questions, and until it arrives and is admissible, the default stands in. An unknown country is always default, at the highest value for that CN code.

When the producer answers, what they sent is under "Check or enter the precursor's data" on the card — the same form they fill in on their link, as one scrolling page with the same explanations and documents. Check it, or enter and change anything for them; the same checks apply. In Smart Links these requests are listed as "Precursor data".

Below the cards, "Made at this installation" is for a product your own site makes and then uses — billet that becomes wire rod.`,
    [
      "What if I don't know the origin?",
      "Default or actual?",
      "What if my own site makes the precursor?",
    ],
  ),
  p(
    "readiness",
    "What readiness means",
    [
      "readiness",
      "what is readiness",
      "what does blocked mean",
      "readiness percent",
      "tab is green",
      "ready complete",
      "what is incomplete",
      "overall readiness",
      "blocked",
    ],
    `Readiness says how close a product report is to something a verifier would accept. Each part — methodology, monthly data, precursors, evidence — is complete, incomplete or blocked ("blocked" means a figure can't be worked out at all, such as a fuel with no calorific value). A product report also reads blocked while the 17 one-time answers on the installation's Overview are not all in — the reports open with the operator and the installation — but nothing is locked: months and precursors can be entered meanwhile. The installation's Readiness tab gathers a year's product reports, the installation's own information and everything that goes to the verifier in one place, and lists exactly what is holding things up; every row that is not ready says how to fill it, gives an example, and links to the screen. In each box, To do shows only what is still open and All shows everything; a row opens and closes with a click.`,
    [
      "Why does my product report say Blocked?",
      "Why can't I download the package?",
      "What is in the report package?",
    ],
  ),
  p(
    "report-package",
    "The report package",
    [
      "what does the package include in certrace",
      "report package",
      "download package",
      "download reports",
      "zip",
      "report set",
      "export package",
      "what is in the package",
      "how do i download the reports",
      "package download",
    ],
    `On the installation's Readiness tab, pick the year: "What goes to the verifier" counts what leaves — three reports (the monitoring plan, the operator's emissions report and the summary report), a declarant-specific addendum only if the installation says electricity goes to the EU, and two attachments: the verification reports of your precursors' installations and the supporting evidence. Each box says what it contains, section by section, and opens to show every item with its state. One button, Download package, gives you the reports as PDFs, the two indexes, and the documents themselves in folders, in a single zip.

The button is live only when the reports are complete — the installation's information, every product report of the year, and every report's own items. The two attachments never hold it back; they list the paper to go and get. During the free trial the package is built without the monitoring plan. An optional internal sign-off puts one person's name on the cover.

The Reports page in the sidebar does the same per installation and year.`,
    [
      "Why can't I download the package?",
      "What is sign-off?",
      "How many reports do I send to the verifier?",
    ],
  ),
  p(
    "package-disabled",
    "Why the package is greyed out",
    [
      "why cant i download the package",
      "why is download package disabled",
      "package greyed out",
      "package not active",
      "download not available",
      "cannot download package",
      "export package disabled",
      "download button disabled",
      "why can't i download",
    ],
    `The package is offered only when all of it is complete. Open the installation's Readiness tab for the year: the card under "What goes to the verifier" lists what is in the way — product reports that aren't complete, items of the installation's information still missing, and each report's open items.

Most often it is one of: the installation Overview has unanswered required boxes (check the pill in the header), a product report has months not submitted or a figure blocked, a precursor has no value, or a required document is missing. Fix those and the button comes alive on its own.`,
    ["What is readiness?", "What goes in the installation Overview?"],
  ),
  p(
    "sign-off",
    "Internal sign-off",
    [
      "sign off",
      "sign-off",
      "what is sign off",
      "internal sign off",
      "who signs",
      "sign the reports",
      "signature on reports",
    ],
    `Sign-off is optional. One person inside your company puts their name and job title to the figures, and the reports carry it on the cover. It records a fingerprint of the figures, so if a month, a precursor or a document changes afterwards, the sign-off lapses and has to be repeated. It is an internal control, not an electronic signature.`,
    ["What is in the report package?"],
  ),
  p(
    "reports-page",
    "The Reports page",
    [
      "reports page",
      "what is the reports page",
      "reports in the sidebar",
      "export pack",
      "installation package",
      "reports tab",
    ],
    `Reports lists one row per installation and reporting year. Each shows its product reports, how ready they are, what is holding the package back, and an Export package button that works the same way as the one on the Readiness tab: live only when everything is complete. Open takes you to that installation's Readiness for the year. Your own installations come first; suppliers' installations you track are listed separately.`,
    ["What is in the report package?"],
  ),
  p(
    "carbon-cost-page",
    "Carbon & Cost",
    [
      "carbon and cost",
      "carbon cost page",
      "what is carbon & cost",
      "cost exposure",
      "what does my buyer pay",
      "default exposure",
      "indicative cost",
      "cost per unit",
      "cost per piece",
      "compare years",
      "currency",
    ],
    `Carbon & Cost compares your embedded emissions and what they cost, by installation, reporting year and product — filter or group by any of them. For each it shows the total, split into direct and indirect emissions (and the precursor part); what your actual figure costs in certificates, with a precursor still on a default counted at the default; and what the same goods cost on the EU default value, as if you had proved nothing — the gap is what proving your real emissions is worth. Switch the amounts between baht, euro, yuan and rupees (the rates are in the table at the bottom). The Cost per unit card adds your energy cost and what the good sells for, so you see the carbon cost as part of the cost of one tonne or one piece. Nothing here is a filing; one correction factor the Commission publishes separately isn't applied yet. This page uses only your own product-report data and shows an empty state when you have no reports.`,
    ["How much will CBAM cost me?"],
  ),
  p(
    "smart-upload-tab",
    "Adding documents and bills",
    [
      "smart upload tab",
      "smart upload on product report",
      "upload bills",
      "upload invoices",
      "auto fill documents",
      "ai fill documents",
      "read my documents",
      "document intake",
      "where did the smart upload tab go",
      "add documents and auto fill",
    ],
    `There is no Smart upload tab any more — reading a file and filling a month is me. Press the Cera button at the top, switch on Smart upload, and give me one text or CSV file; the readings I fill in show in green in the form, tagged Cera filled, so you can check them. On the plant's link, the Add documents button on the first page does the same.

Documents themselves — bills, invoices, meter logs, certificates, PDFs and photos — are attached on each month's Documents step: drop a file on the slot it belongs to, or click the slot to choose it.`,
    ["How does Cera's smart upload work?"],
  ),
  p(
    "cera-features",
    "What Cera can do",
    [
      "what can cera do",
      "cera features",
      "what can you do",
      "help me",
      "what can i ask",
      "how can you help",
      "what are you",
      "who are you",
      "what is cera",
      "your capabilities",
    ],
    `I'm Cera, Certrace's assistant. I can:

• answer questions about CBAM — scope, dates, how embedded emissions are worked out, defaults and mark-ups, verification, costs;
• explain any Certrace screen and walk you through getting something done;
• look up the default value, benchmark and cost for a CN code;
• keep you up to date on CBAM rule changes — ask "what's new in CBAM";
• read a file and fill in a month — say "smart upload", give me one file, and I'll show you what I found and where it goes before anything is saved;
• remember our conversations, so you can come back to them from History.

I only talk about CBAM and about using Certrace.`,
    ["What's new in CBAM?", "Smart upload", "What does each sidebar item do?"],
  ),
  p(
    "cera-smart-upload",
    "How Cera's smart upload works",
    [
      "how does smart upload work",
      "how does cera smart upload work",
      "cera smart upload",
      "upload a file to cera",
      "give cera a file",
      "extract data from file",
      "which files can cera read",
      "supported files",
      "file types",
    ],
    `Press Smart upload to start a Cera chat, choose up to 10 PDF, image, Office, text or spreadsheet files there, then press send. Choose the product report. Cera detects a single clear reporting month in each document or filename; select a month yourself when it is missing or ambiguous. A month you select applies to the whole batch. Cera reads files one at a time, uses OCR for scanned pages and images, then proposes report fields.

Each file has its own review. Compare every proposed value and source quote with the document, select the values you want and apply them. The next file is then read against the updated report. You can skip a file without applying it. Smart upload does not keep the original file or attach it as report evidence; use the report's normal document upload if the source must be retained. Report values change only when you apply reviewed proposals.

On a plant's or precursor's link, Smart upload stays scoped to that form and reads one file at a time.`,
    ["Smart upload", "What does the plant fill in each month?"],
  ),
  p(
    "suppliers",
    "Adding and managing suppliers",
    [
      "add a supplier",
      "how do i add a supplier",
      "new supplier",
      "add supplier",
      "suppliers",
      "suppliers page",
      "supplier directory",
      "invite a supplier",
      "where are my suppliers",
      "add supplier contact",
      "supplier has no installation",
      "do suppliers need an account",
      "do suppliers pay",
      "supplier plant",
      "add a plant for a supplier",
    ],
    `Suppliers are the companies you collect data from. Open the list from the supplier panel on the Dashboard, or by clicking any supplier's name in a table, and press Add supplier. Give the company's name, the country it is registered in, and the person the monthly link goes to — their name, email and phone.

Then open the supplier and add the plant that makes your good. A product report is tied to a plant, so until one is added there is nothing to ask them for. You can also add a supplier as you start a product report: choose "Another supplier produces it".

Suppliers answer through a link each month. They need no account and no seat, it costs them nothing, and the number of suppliers is unlimited.`,
    ["How does the monthly link work?", "How do I create a product report?"],
  ),
  p(
    "dashboard",
    "The Dashboard",
    [
      "dashboard",
      "home page",
      "overview page",
      "what needs you",
      "what does the dashboard show",
      "where each product stands",
      "my deadlines",
    ],
    `The Dashboard is where each day starts, on one screen. Across the top are six figures: the days left to get your figures to your buyers (they file their first declaration on 30 September 2027), how many months are in, how many packages are ready, what the year's embedded emissions come to, what the certificates cost on your data against the EU default, and how healthy your supply chain is. Below them: the year drawn against the EU default; each site and how far its reports have got; what needs you; the dates that matter; who you rely on in the supply chain; and what just happened. Click anything to go straight to the place that fixes it. Switch the money between baht, euro, yuan and rupees at the top. A new account shows its setup actions until it has report data.`,
    ["What does each sidebar item do?", "How do I add a supplier?"],
  ),
  p(
    "account-profile",
    "Your profile, email, password and language",
    [
      "change my password",
      "forgot password",
      "reset password",
      "i forgot my password",
      "change my email",
      "change my name",
      "my profile",
      "update profile",
      "sign out",
      "log out",
      "switch language",
      "change language",
      "language",
      "how do i switch language",
      "how do i change my email",
      "job title",
      "change email address",
    ],
    `Your name and job title are under Settings → Your profile. To change your sign-in email, go to Settings → Email address, enter the new address and your current password — a verification link is sent and nothing changes until you click it. If you've forgotten your password, use "Forgot password" on the sign-in page and a reset link is emailed to you. The language switch and Sign out are in the account menu at the top right — the portal is in English, Thai, Chinese and Hindi, and so is the plant's monthly link. The screens change language; what you type into a form stays in English.`,
    ["Why is everything I type in English?", "What does each sidebar item do?"],
  ),
  p(
    "documents",
    "Documents and evidence",
    [
      "upload documents",
      "where do i upload documents",
      "what documents do i need",
      "which documents",
      "evidence",
      "attach invoice",
      "upload an invoice",
      "attach a file",
      "supporting documents",
      "documents step",
      "what evidence do i need",
      "documents tab",
      "where do i attach evidence",
      "upload a certificate",
    ],
    `Evidence is attached on the Documents step — in the plant's monthly link, or on the product report's Documents tab. Each document goes in a named slot so a verifier can see what covers what: the electricity meter log, the month's electricity bill, the emission factor for the electricity, the production export or meter log, the installation's identity, calibration certificates for the measuring instruments, the process diagram, the internal review record, mill test certificates, a power purchase agreement, laboratory analyses for calculation factors, the justification for using default values, a verification report for bought-in precursor data, and evidence of any carbon price paid.

The step shows which slots matter for what you've reported. A figure from a laboratory, a supplier's certificate or a measurement unlocks only once its document is attached. Drop a file on its slot or click the slot to choose one; I can read a text or CSV file and fill the month's figures from it.`,
    [
      "How does Cera's smart upload work?",
      "Why is the calorific value locked?",
    ],
  ),
  p(
    "plant-link-saving",
    "Does the monthly link save as the plant types",
    [
      "can the plant manager save a draft",
      "does the link save",
      "does the supplier lose data",
      "autosave",
      "can they come back later",
      "plant manager draft",
      "supplier draft",
      "save progress",
      "close the link and come back",
      "does it save automatically",
      "unfinished month",
    ],
    `Yes. Answers are saved as the person types, so they can close the link and open the same link again later to carry on where they stopped. Nothing counts as submitted until they press submit at the end; until then the month stays a draft that you can see in progress.`,
    ["How does the monthly link work?", "How do I send a reminder?"],
  ),
  p(
    "reminders",
    "Reminding a plant about a late month",
    [
      "what are the reminders",
      "send a reminder",
      "remind the plant",
      "chase a late month",
      "reminder interval",
      "how often can i remind",
      "how do i send a reminder",
      "remind supplier",
      "late month",
      "overdue month",
      "month is late",
    ],
    `Each month has a Remind button beside its link. It switches on once the link has been sent, the due date has passed and the month hasn't been submitted; hover it before then and it says why it's off. After a reminder you wait six hours before sending another. A month that was never sent can't be reminded, and one already submitted doesn't need it. The due day each month is set in the product report's schedule.`,
    ["How does the monthly link work?"],
  ),
  p(
    "unlocode",
    "The UN/LOCODE",
    [
      "unlocode",
      "what is unlocode",
      "un locode",
      "location code",
      "no unlocode",
      "i dont have a unlocode",
      "how to get unlocode",
      "apply for unlocode",
      "un/locode",
    ],
    `The UN/LOCODE is a five-letter code for the place where the site is: the two-letter country code first, then three letters for the town or port. Map Ta Phut in Thailand is THMAT; Laem Chabang is THLCH. It says where the goods were produced, so use the code for the town or port the installation sits in — not your head office, and not the port the goods leave from if that is somewhere else.

If your site's town has no code, UNECE — the body that issues them — takes applications directly; a customs broker can't create one. Meanwhile use the nearest listed town: an approximate but real code is more useful than a blank, and the coordinates pin the exact spot anyway.`,
    ["What are latitude and longitude for?", "How do I add an installation?"],
  ),
  p(
    "coordinates",
    "Latitude and longitude",
    [
      "latitude and longitude",
      "what are latitude and longitude for",
      "coordinates",
      "gps",
      "main emission source coordinates",
      "where do i get coordinates",
      "latitude",
      "longitude",
    ],
    `They pin the exact location of the installation's main emission source — the stack of the furnace or kiln that dominates, not the front gate. A verifier uses them to find the right plant on a map and to match it to the address. You can read them off a map application by pressing on the spot.`,
    ["What is the UN/LOCODE?"],
  ),
  p(
    "trial-lock",
    "When an account is read-only",
    [
      "what happens when my trial ends",
      "trial ends",
      "frozen account",
      "what is a frozen account",
      "read only",
      "what is read only",
      "account locked",
      "locked account",
      "why can't i edit",
      "why cant i edit",
      "trial expired",
      "account is frozen",
    ],
    `When a free trial ends, the account becomes read-only until a plan is chosen on Plan & billing. In read-only you can still look at everything, switch language, read your notifications and talk to me; you can't change or submit data. Choosing a plan unlocks it again and nothing is lost.`,
    ["What is on Plan and billing?"],
  ),
  p(
    "devices",
    "Using Certrace on a phone or tablet",
    [
      "does it work on my phone",
      "mobile",
      "phone",
      "tablet",
      "mobile app",
      "is there a mobile app",
      "use on my phone",
      "work on mobile",
      "app store",
    ],
    `Certrace runs in a web browser on a computer, tablet or phone — there's no separate app to install. The screens adapt to a smaller screen, and the plant's monthly link is built to be filled in on a phone, so a factory manager can answer from the shop floor.`,
  ),
  p(
    "data-access",
    "Who can see your data",
    [
      "who can see my data",
      "who sees my data",
      "data access",
      "privacy",
      "can the verifier see my data",
      "can suppliers see my data",
      "who can see my reports",
      "access to my data",
      "who has access",
    ],
    `Only the people you choose. Colleagues on your team see what their role allows — set on Team & seats. A plant manager or supplier who receives a link sees only what that link asks for, never the rest of your account. A verifier works from the package you export for them. How the data is stored and protected is about how the product is built, which I can't go into.`,
    ["How do I invite a colleague?", "How does the monthly link work?"],
  ),
  p(
    "four-eyes",
    "Four-eyes sign-off",
    [
      "four eyes",
      "what is four eyes",
      "second person approval",
      "who approves",
      "maker checker",
      "two people sign",
      "why two signatures",
      "internal approval",
    ],
    `Four-eyes means one person prepares and a second person approves before a report is frozen, so no figure goes to a verifier on one person's say-so. The person who prepared can't also be the approver. After approval the report is frozen; changing it afterwards means reopening it, and that is recorded.`,
    ["What does sign-off do?"],
  ),
  p(
    "team",
    "Team and seats",
    [
      "team",
      "seats",
      "invite colleague",
      "add a user",
      "team and seats",
      "roles",
      "who can edit",
      "invite team member",
      "add team member",
      "permissions",
    ],
    `Team & seats lists the people on your account. Invite a colleague by email, choose their role, and they get a seat. Roles decide what a person can change — for instance, someone who reads and checks but doesn't edit readings. You can change a role or remove someone at any time. Suppliers and plant managers who answer links don't need a seat.`,
  ),
  p(
    "plan-billing",
    "Plan and billing",
    [
      "plan and billing",
      "billing",
      "trial",
      "free trial",
      "upgrade",
      "subscription",
      "my plan",
      "plan limits",
    ],
    `Your plan, what it covers and any trial status are on Plan & billing in the sidebar — that page is the place for anything about plans. During a free trial you can use the product; the monitoring plan in the report package is held back until you're on a plan.`,
  ),
  p(
    "settings",
    "Settings",
    [
      "settings",
      "profile",
      "notifications",
      "privacy",
      "change my name",
      "organisation settings",
      "company name",
      "change language",
      "my installations in settings",
    ],
    `Settings has four tabs: Organisation (your company details, sector, and your own installations — add, edit, open), Profile (your name, job title and contact), Notifications (what Certrace tells you about) and Privacy & security. The language switch is in the top bar. Your own installations list also has a ⋯ menu on each site: open it, jump to its product reports or readiness, and remove it — removal is blocked while any product report still uses the site.`,
  ),
  p(
    "calorific-locked",
    "Why the calorific value is locked",
    [
      "why is the calorific value locked",
      "ncv locked",
      "emission factor locked",
      "cant edit calorific value",
      "factor source",
      "eu standard value locked",
      "type i type ii",
      "why cant i type the ncv",
      "calorific value disabled",
    ],
    `Each fuel row has a factor source. On "EU standard value" the calorific value and emission factor fill in from the EU's table and lock — it is the fallback, admissible only where you have nothing better. To enter your own figures, change the source to a laboratory analysis, the fuel supplier's certificate or the national inventory; those unlock once a spec sheet, invoice or lab report is attached on the Documents step, because a measured value has to be backed by its document.`,
    ["How do I calculate fuel emissions?"],
  ),
  p(
    "grid-factor-awaiting",
    "The grid factor message",
    [
      "awaiting the published",
      "grid factor missing",
      "grid default not published",
      "grid source awaiting",
      "country default for electricity",
      "why cant i enter the grid factor",
      "electricity factor locked",
    ],
    `A grid row takes the EU's published country default and can't be typed. If that default isn't available for your country yet, the row says so and the month can't be submitted with a grid factor missing. Until it is, record the electricity under the source that applies to you — a power purchase agreement or a direct link, with the generator's own factor and its contract — or ask the exporter whether an alternative value has been submitted.`,
    ["How is electricity emissions calculated?"],
  ),
  p(
    "month-cannot-submit",
    "Why a month can't be submitted",
    [
      "what does the check step show",
      "check step",
      "what is the check step",
      "what does the check step do",
      "check before signing",
      "why cant i submit",
      "month cannot be submitted",
      "cannot submit month",
      "submit blocked",
      "what is blocking my month",
      "errors on the month",
      "what is needed to submit",
      "check step errors",
    ],
    `A month can be submitted when nothing required is missing. The Check step lists what the month contains — each part Ready or Missing — and a row takes you back to the field. It looks only at whether everything is there: not whether a figure is too large, unusual next to the other months or out of range — that is for the exporter, who has the year beside it. The usual gaps: production is empty, a fuel row has no quantity, calorific value or emission factor, a row says "Other fuel" with no name, a process row has no material or quantity, or — for goods that count indirect emissions, such as cement and fertilisers — electricity has no MWh or factor. A steel or aluminium month is not held back by missing electricity. Documents, and a month with no fuel, show as "Add if you can" — they do not block. Fill the gaps, check, then sign.`,
    ["What does the plant fill in each month?"],
  ),
  p(
    "english-only",
    "Writing in English",
    [
      "write in english",
      "does it have to be english",
      "thai language in forms",
      "language of the forms",
      "can i type thai",
    ],
    `Anything you type that ends up in a report — descriptions, notes, names — has to be in English, because the operator's emissions report and the monitoring plan must be. Numbers and dates stay as they are. A banner on the forms reminds you; a Thai name for the site can still go in the local-name field where there is one.`,
  ),
  p(
    "stock-change",
    "A stock change",
    [
      "stock change",
      "what is a stock change",
      "opening stock",
      "closing stock",
      "deliveries and stock",
      "no meter on consumption",
      "fuel in a tank",
      "tank stock",
      "used from stock",
      "delivered plus stock",
      "how much was used from stock",
    ],
    `Some plants buy a fuel or a material in lots and draw it down from a tank or a yard, with no meter on what is used. On that row, "How the quantity is found" → "Deliveries and stock": enter what was delivered in the month, the stock on the 1st and the stock on the last day. What was used is the delivered amount plus the opening stock minus the closing stock, and the quantity box fills itself and locks.

If the closing stock is larger than what could have been there, the row says so and the month can't be submitted. When you copy the previous month, this month opens with the stock the last one closed with. Keep the stock count or tank log — the Documents step asks for it once a row uses this.`,
    ["What does the plant fill in each month?", "What is a shared meter?"],
  ),
  p(
    "shared-meter",
    "A shared meter",
    [
      "shared meter",
      "what is a shared meter",
      "one meter several products",
      "meter feeds two products",
      "split a meter",
      "allocate electricity between products",
      "allocation key",
      "share of the meter",
      "main incomer",
      "one electricity meter for the whole site",
      "meter for the whole plant",
    ],
    `When one meter feeds more than one product report — the main incomer of a works that makes two things — enter the whole meter's reading once and let each product take its share. On the fuel or electricity row, "How the quantity is found" → "A share of a shared meter": name the meter, give its reading for the month, and pick how to split it — by tonnes made, by energy burned, or a share you set yourself.

For the first two, "Fill from the other product reports" takes the figures from the installation's other product reports for the same month, and the share is this good's part of the total. The row keeps both numbers so a verifier can recompute it, and the quantity box fills in and locks. Keep the meter log and the basis of the split — the Documents step asks for them.`,
    ["What is a stock change?", "What does the plant fill in each month?"],
  ),
  p(
    "made-here-precursor",
    "A precursor made at your own installation",
    [
      "what if my own site makes the precursor",
      "precursor made here",
      "made at this installation",
      "product made at the same site",
      "billet to wire rod",
      "own precursor",
      "precursor from my own plant",
      "precursor made on site",
      "internal precursor",
      "precursor produced at the installation",
      "use my own product as a precursor",
    ],
    `When your site makes a product and then uses it in another — billet that is rolled into wire rod — you don't send anyone a request. On the product report that uses it, open Precursors and scroll to "Made at this installation" → Add a product made here. Pick the other product report of the same installation and year, and enter the tonnes of it used in the year, including what never reached the finished good.

The embedded emissions it carries are read from that product report each time, so they move when its months change and nothing is typed twice. They add to this good's precursor figure, and the quantity is reported under items 18, 19 and 27. A product can't use itself, and two reports can't use each other. Each row saves the moment you change it and says so in its own card.`,
    ["How do precursors work?"],
  ),
  p(
    "waste-gas-rows",
    "Waste gases, gas by gas",
    [
      "waste gas composition",
      "blast furnace gas",
      "coke oven gas",
      "converter gas",
      "bfg",
      "cog",
      "waste gas balance",
      "process gas volume",
      "record waste gas by volume",
      "waste gas nm3",
      "gas chromatograph",
    ],
    `Under "Also report this month" → Waste gases you can enter the four flows in energy, or record it gas by gas. Each row is one gas going one way — blast-furnace gas produced, coke-oven gas used here, converter gas sent to a neighbour — with its volume in Nm³ and, if you have it, its composition (CO, CO₂, H₂, CH₄).

The calorific value is yours if you give one; otherwise it is worked out from the composition; otherwise the typical value for that gas is used, and the row says which. The energy of each row is added into the balance, and the four flows fill in and lock. Keep the flow-meter log and the analysis — the Documents step asks for them.`,
    ["What does the plant fill in each month?"],
  ),
  p(
    "potlines",
    "Lines of cells in the PFC block",
    [
      "potline",
      "potlines",
      "potroom",
      "more than one cell type",
      "two cell types",
      "different cell types",
      "anode effect minutes",
      "anode effects per cell day",
      "pfc by line",
      "cells are not all one type",
      "lines run differently",
    ],
    `On a primary smelter's month, the PFC block normally takes one cell type and one figure for anode-effect minutes. If your cells are not all one type, or your lines run differently, choose "My cells are not all one type, or the lines run differently" and give each line a row: its name, its cell type, its share of the month's metal (all lines add to 100 %), and how often anode effects happen per cell-day and how long each lasts — which gives its minutes per cell-day. Cell-days are optional, so the minutes can be traced to the cells.

Each line is worked out with its own cell type's factors and the tonnes of CF₄ and C₂F₆ are added. If you count by overvoltage instead, each line has its own overvoltage and current efficiency.`,
    ["What does the plant fill in each month?"],
  ),
  p(
    "alloy-composition",
    "Alloy composition each month",
    [
      "alloy composition",
      "manganese chromium nickel",
      "mn cr ni",
      "mill test certificate composition",
      "stainless steel composition",
      "what is the steel made of",
      "composition of the steel",
      "alloying elements",
      "high alloy steel",
    ],
    `For goods where the report asks for manganese, chromium, nickel and other alloying elements, the monthly form has a block "What the steel is made of". Enter the percentages from the mill test certificates of the heats made that month, and say where they come from. The report states them for the year as the months' figures weighted by the tonnes made in each — so a month of stainless counts more than a quiet month of carbon steel.

If the elements add to 8 % or more, the form warns that the good may be high-alloy steel and its CN code and category should be checked. The Documents step asks for the mill certificates once a month has composition.`,
    ["What does the plant fill in each month?"],
  ),
  p(
    "scrap-deliveries",
    "Scrap by delivery",
    [
      "scrap origin",
      "scrap by delivery",
      "scrap deliveries",
      "pre consumer scrap",
      "post consumer scrap",
      "scrap supplier",
      "scrap grade",
      "record scrap by supplier",
      "how do i show where the scrap came from",
      "pre-consumer share",
    ],
    `Under Scrap (aluminium) or the scrap rows of the raw materials (steel), choose "Record it by delivery". Each delivery has its supplier, its grade as the supplier sells it, whether it is pre-consumer (offcuts and runaround from manufacturing) or post-consumer (end of life), and its tonnes.

The month's scrap tonnes and the pre-consumer part are then worked out from the deliveries and lock, and the report states the scrap per tonne of metal, the pre-consumer share and the table of deliveries. Keep the receiving records or weighbridge tickets — the Documents step asks for them.`,
    ["What does the plant fill in each month?"],
  ),
  p(
    "instrument-details",
    "Where an instrument sits, and its uncertainty",
    [
      "instrument location",
      "where it sits",
      "instrument uncertainty",
      "measurement uncertainty",
      "uncertainty of the meter",
      "where is the instrument",
      "instrument row",
      "calibration date",
    ],
    `Each instrument row in the methodology asks what it measures, which instrument it is, how often it is read and when it was last calibrated — and, optionally, where it sits (the line, feeder or tank, so a verifier can walk to it) and its uncertainty in ± percent from the maker or the calibration certificate. The monitoring plan prints the instruments in a table with all of these, and the control-system element on calibration is answered from the dates.`,
    ["What goes in the monitoring plan?"],
  ),
  p(
    "monitoring-plan-elements",
    "Monitoring plan elements",
    [
      "monitoring plan elements",
      "sampling plan",
      "control system",
      "risk assessment of the data flow",
      "segregation of duties",
      "corrective action",
      "outsourced processes",
      "records and document versions",
      "monitoring plan template",
      "22 elements",
      "what does the monitoring plan need",
    ],
    `The monitoring plan follows a template of 22 elements, and the Readiness tab shows each one with its state. Most come straight from what you have already entered: the goods, processes and routes, benchmarks, instruments, precursors, fuels, heat, electricity, waste gases and CO₂.

Seven are descriptions only you can write, and the methodology has a card for them, "Monitoring plan elements": how the calculation factors are determined and the sampling plan, the risk assessment of the data flow, the quality assurance of the information systems, segregation of duties and competencies, corrective action, control of outsourced processes, and how records and document versions are kept. A line or two each is enough.`,
    ["What goes in the monitoring plan?", "What is readiness?"],
  ),
  p(
    "cera-filled",
    'What "Cera filled" means',
    [
      "cera filled",
      "what is cera filled",
      "green box",
      "green tag",
      "why is the box green",
      "ai filled",
      "filled by cera",
      "what does the green mean",
      "cera filled tag",
    ],
    `When I fill a figure into a form from a file you gave me, the box turns green and carries a "Cera filled" tag with my mark. It means the figure came from the file, not from you typing it — so you can check it against the file. Change it and the green goes; it stays only while the number is still the one I wrote. Nothing is filled until you confirm what I found.`,
    ["How does Cera's smart upload work?"],
  ),
  p(
    "evidence-index",
    "The supporting evidence in the package",
    [
      "evidence index",
      "supporting evidence",
      "supporting evidence and records",
      "what evidence goes to the verifier",
      "evidence in the package",
      "documents in the package",
      "verification report of the precursor",
      "precursor verification reports",
      "do i send the precursor verification report",
    ],
    `Two attachments travel with the reports. The first is an index of the verification reports of the installations that made your precursors on actual values from outside the EU — each with the verifier, the accreditation number, the date, and whether the report is attached. The second indexes the supporting evidence: for every month, how many of the expected documents are attached, and for every document the figure it supports, who attached it and when.

The documents themselves go into the zip in folders beside the reports. A file too large to carry is named in the index as kept by you. Neither index holds the package back — they tell you what paper is still to get.`,
    [
      "What is in the report package?",
      "How many reports do I send to the verifier?",
    ],
  ),
  p(
    "products-tab",
    "The Products tab of an installation",
    [
      "products tab",
      "products of an installation",
      "all products of the installation",
      "products every year",
      "installation products",
      "list of products at the installation",
    ],
    `On an installation, the Products tab lists every product report made there, in every year, grouped by year — there is no year to pick. Each opens the product report; start a new one from the same place — it begins with this installation already chosen.`,
    ["How do I create a product report?"],
  ),
  p(
    "carbon-price-tab",
    "The Carbon price tab",
    [
      "carbon price tab",
      "where do i enter the carbon price",
      "carbon price paid tab",
      "enter carbon price paid",
      "carbon tax paid thailand tab",
    ],
    `On a product report, the Carbon price tab sits beside Precursors. The claim is per good, so it lives with the good. It asks for: the amount per tonne in the currency of the receipt, the instrument, the share of this good's emissions the price covers (0 to 100%), any rebate or offset — in words and as a figure per tonne — the law or regulation it is charged under, the independent person who certified the payment, and the receipt.

The report works it out as the good's emissions × the share covered × the price, less the rebate figure. Nothing is assumed: a price with no share entered deducts nothing, and a rebate larger than the price counts as zero. The law and the certifier do not hold the tab back, but the EU rule asks for both, and the report prints them as not recorded until they are there. It lowers what the EU buyer owes only up to what you can document.`,
    ["How is the carbon price deducted?"],
  ),
  p(
    "why-blocked",
    "Why a product report says Blocked",
    [
      "why does my product report say blocked",
      "why is my product report blocked",
      "why does it say blocked",
      "product report blocked",
      "report says blocked",
      "blocked label",
      "blocked on the card",
      "installation info not complete",
      "methodology not final",
      "what blocks a product report",
      "why is the report red",
      "installation info 5/17",
    ],
    `Blocked means a verifier couldn't begin yet. It comes from one of two places:

• The site's one-time information isn't all in. The header shows "Installation info 5/17" — press it to open the Overview and answer what is left. Until all 17 are answered, every product report of that site reads Blocked.
• One of the report's own parts can't be worked out: the methodology isn't final, a fuel has no calorific value, a precursor chain doesn't add up, or the estimated share is over 5%. The installation's Readiness tab shows the row that is blocked and says what to do.

Nothing is locked. You can keep entering months and precursors while it reads Blocked.`,
    ["What is readiness?", "What goes in the installation Overview?"],
  ),
  p(
    "installation-tabs",
    "The tabs of an installation",
    [
      "what are the tabs of an installation",
      "installation tabs",
      "tabs of an installation",
      "installation menu",
      "overview products readiness",
      "what is on the installation page",
      "installation page tabs",
    ],
    `An installation has three tabs:

• Overview — what you enter once for the site: the operator, the installation and the monitoring plan summary (the 17 required answers).
• Products — every product report made there, in every year, grouped by year. Start a new one here.
• Readiness — pick a year to see what holds the package back, the three reports and two attachments, and to download the package.

The header names the site, its reference and shows "Installation info" — how many of the 17 answers are in.`,
    [
      "What goes in the installation Overview?",
      "What is readiness?",
      "What is in the report package?",
    ],
  ),
  p(
    "duplicate-report",
    "Duplicating a product report",
    [
      "how do i duplicate a product report",
      "duplicate a product report",
      "duplicate report",
      "copy a product report",
      "copy a report",
      "copy last year's report",
      "start next year's report",
      "same report for another year",
      "clone a report",
    ],
    `Open ⋯ on a product report and choose Duplicate report. It takes two steps. First, where the copy goes: the reporting year and, if the supplier has more than one site, the installation. Then what comes across — and for each part you choose: Bring across, or Start new.

The good and its CN code, the production route and country, and who makes it always come across; they are the report. Everything else is yours to choose: the monthly schedule; each part of the monitoring plan (boundary and processes, fuels and electricity, measuring instruments, data gaps, quality assurance, the installation diagram, sector parameters, the sampling plan and the control system), brought across as a draft you can edit; the chain of precursor suppliers — who supplies what, with their contacts, but not their figures, reports or links; and the carbon price claim, without its receipt or rebate. Data gaps start new unless you switch them on, and if you pick a different site the parts that describe the old plant start new too. "Bring everything across" and "Start everything new" set them all at once.

Monthly figures, documents, sign-offs, finished monitoring-plan versions and materiality never come across, because they belong to the year they describe. Nothing is created until you press Create copy, and then the copy opens. A second report for the same good, site and year is allowed — that is how a mid-year change is kept apart.`,
    ["How do I create a product report?"],
  ),
  p(
    "sector-parameters",
    "What steel and aluminium reports ask besides the readings",
    [
      "sector parameters",
      "sector specific parameters",
      "steel parameters",
      "aluminium parameters",
      "reducing agent",
      "scrap per tonne",
      "pre consumer scrap",
      "preconsumer scrap",
      "alloy percentages",
      "alloy composition and scrap use",
      "scrap ratio",
      "what do i enter for scrap",
      "how is scrap worked out",
      "what is pre-consumer scrap",
      "carbon percentage of ferro alloy",
    ],
    `Besides the monthly readings, the report asks each good a few figures of its own. You answer them once for the year, on the "Alloy composition and scrap use" card in Monthly data:

• Pig iron and direct reduced iron: the main reducing agent (coke, natural gas, hydrogen, coal…) and the alloy percentages.
• Crude steel, and iron or steel products such as wire rod or sheet: the alloy percentages (Mn, Cr, Ni and the other elements together — enter 0 where there is none), the tonnes of scrap used per tonne, and the share of that scrap that is pre-consumer. The reducing agent is asked "if known".
• Ferro-alloys: the manganese, chromium or nickel percentage of the alloy, and its carbon.
• Aluminium: the tonnes of scrap per tonne and its pre-consumer share, and the total of other elements if it is above 1 %.

Pre-consumer scrap is offcuts, trimmings and rejects from another manufacturer's production. Scrap that goes straight back into the process it came from is not counted, and scrap from end-of-life products is post-consumer.

Your monthly scrap rows give the scrap per tonne by themselves. If you roll or extrude metal you buy in, the scrap inside it comes from that metal's own figures once its producer's verified data is in; if it is on a default value there is no figure to read, so enter the total for the good yourself. Until everything the good asks for is there, its row on the Readiness tab says "Partly there" and names what is left.`,
    [
      "What does the plant fill in each month?",
      "Which goods count indirect emissions?",
    ],
  ),
  p(
    "electricity-optional",
    "Electricity for steel and aluminium",
    [
      "do i need electricity for steel",
      "is electricity required for steel",
      "electricity for aluminium",
      "electricity not counted",
      "why is electricity not in my total",
      "is electricity required",
      "do i have to enter electricity",
      "electricity optional",
      "electricity not in the figure",
    ],
    `For steel, aluminium and hydrogen the EU counts only the direct emissions — fuel burned and process emissions on site — so the electricity a plant draws is not part of the figure. In Certrace it is optional for these goods: the boxes are white, a month can be submitted without it, and the month's total reads "Direct CO₂" instead of adding electricity.

The report still lists electricity if you give it, and a verifier may ask for it, so enter it when you have it. For cement, fertilisers and other goods that count indirect emissions, electricity is required.`,
    [
      "Which goods count indirect emissions?",
      "What does the plant fill in each month?",
    ],
  ),
  p(
    "history",
    "Cera's history",
    [
      "history",
      "chat history",
      "previous conversations",
      "old chats",
      "find earlier chat",
      "past conversations",
      "delete chat",
      "new chat",
    ],
    `Every conversation is kept. Press History in my header to see them — newest first — open one to continue it, delete the ones you don't want, or start a new chat. Closing me ends the current conversation but doesn't delete it; it's waiting in History.`,
  ),
  p(
    "supply-chain-page",
    "The Supply Chain page",
    [
      "supply chain page",
      "supply chain tab",
      "what is on the supply chain page",
      "who is in my supply chain",
      "supplier health",
      "supply chain health",
      "precursor supplier health",
      "where is the concern",
      "chain health",
      "healthy rate",
    ],
    `Supply Chain lists everyone you collect data from — the suppliers and plants that fill in your months, and the suppliers of your precursors — and scores how healthy each one is, aspect by aspect. A plant is scored on timeliness, coverage of the months, completeness and having a contact; a precursor supplier on how they respond, what basis the figure rests on (verified, unverified or default), the checks on their report and completeness. Each party lands in one state — completed, on track, needs attention, at risk or not started — and the concerns are ranked, so you see who to chase first, what rests on a default, and which supplier carries most of the bought-in emissions. Open a row for the month-by-month detail. A new account shows an empty state until a product report and suppliers are added.`,
    ["How does the monthly link work?", "What does each sidebar item do?"],
  ),
  p(
    "notifications",
    "Notifications",
    [
      "notifications",
      "the bell",
      "notification bell",
      "what does the bell show",
      "how do notifications work",
      "when do i get notified",
      "why did i get a notification",
      "notification settings",
      "turn off notifications",
      "mark all read",
      "unread notifications",
      "what notifies me",
      "where do notifications go",
      "what happens when i click a notification",
    ],
    `The bell in the top bar is a live list built from the same figures as the dashboard, so it can never say a month is late that the dashboard calls on time — and the moment the month is filed, the notice is gone.

It tells you about things that need you (a month overdue or due soon, a supplier who has not answered, a report blocked on a tab, a precursor report that fails a check, documents waiting to be bound), things that have just happened (a month or a supplier's figures came in, a document was uploaded, a monitoring plan was finalised, a package is ready), and messages from Certrace and the system (rule changes in the EU, the countdown to the declaration, your trial and plan limits, sign-ins and password changes).

What a click does depends on who it is from. If it is about your own work, it takes you to the place that fixes it — for a late month, to the first empty field of that month. If it is from Certrace or the system there is nowhere to go, so it opens as a message you can scroll, with a button for the next step.

Settings → Notifications switches each group on or off: declarations, suppliers, AI review, documents, CBAM news, plan and billing, and product updates. Security is always on. "See all" opens the whole list, filtered by what needs action, what happened and messages.`,
    ["What's new in CBAM?", "What does each sidebar item do?"],
  ),
  p(
    "plans",
    "The plans",
    [
      "plans",
      "pricing plans",
      "what plans are there",
      "starter plan",
      "standard plan",
      "enterprise plan",
      "plan limits",
      "what does my plan include",
      "how many cn codes does my plan have",
      "ai tokens",
      "smart upload pages",
      "how many team seats",
      "how much does certrace cost",
    ],
    `Certrace has three plans, on an annual term, priced on request — Contact Sales opens a chat on LINE. A plan counts your own side:

• Starter — 1 company, 1 installation with its report package, 1 CN code, 1 precursor, 1 reporting year, 3 team seats; AI 50 questions; Smart upload 100 pages.
• Standard — 2 companies, 2 installations, 3 CN codes, 4 precursors, 1 reporting year, 5 team seats; AI 150 questions; Smart upload 300 pages.
• Enterprise — 2 companies, 3 installations, 6 CN codes, 8 precursors, 1 reporting year, 10 team seats; AI 300 questions; Smart upload 600 pages.

Every plan has unlimited smart links, onboarding with one meeting session, and support within 1 business day. In Smart upload an Excel file counts as 1 page, and each image inside it counts as one more. Suppliers and precursor suppliers enter and fill in through their smart link on every plan, without limit, and never take a seat. Plan & billing shows how much of your CN codes, installations, reporting years and seats you have used.`,
    ["What does each sidebar item do?"],
  ),
];
