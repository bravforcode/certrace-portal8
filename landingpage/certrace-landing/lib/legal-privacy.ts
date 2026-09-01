import { CONTACT_EMAIL } from "./content";
import type { LegalDoc } from "./legal";

/* ════════════════════════════════════════════════════════════
   THE PRIVACY POLICY

   WHAT THIS REVISION DID. The previous policy described a fairly ordinary SaaS
   product. Certrace is not one, in the specific respect that matters most to a
   privacy notice: MOST OF THE PEOPLE WHOSE PERSONAL DATA IS IN THE PLATFORM DO
   NOT WORK FOR THE CUSTOMER. They work for the customer's suppliers, and for
   those suppliers' suppliers, and they arrive through a Smart Link that they
   were sent rather than an account they opened. A policy that only contemplates
   "Authorized Users" and "Contacts" does not describe them at all.

   So §4 now covers Supplier Participants directly: what reaches us about them,
   who the controller is, what they are told at the point of submission, and
   where their rights are exercised. §3.6 covers the Personal Data that arrives
   incidentally inside evidence documents — utility bills carry account numbers
   and named account holders, and pretending otherwise helps nobody.

   §7 was also rewritten. AI-assisted extraction sends documents to a model
   provider; that is a disclosure and it is named as one, together with the
   fact that it is off by default, the training prohibition, and the
   human-in-the-loop rule.

   §12 says out loud that a sealed compliance record cannot always be edited
   field-by-field, and why erasure there may mean deleting a version rather
   than a value. Saying that in advance is more honest than discovering it
   during a request.

   ANCHOR IDS ARE STABLE — see the note in lib/legal-terms.ts. Sections gained:
   `supplier-data` (4), `marketing` (17), `complaints` (18).
   ════════════════════════════════════════════════════════════ */

export const PRIVACY_EN: LegalDoc = {
  eyebrow: "LEGAL",
  title: "Certrace Privacy Policy",
  effectiveLabel: "Effective Date",
  effective: "1 September 2026",
  updatedLabel: "Last Updated",
  updated: "1 September 2026",
  lede: "How Certrace collects, uses, discloses, and protects personal data — under Thailand’s Personal Data Protection Act B.E. 2562 (2019) and, where it applies, the EU General Data Protection Regulation. It covers the people who hold accounts with us, and also the suppliers who never do.",
  contentsLabel: "ON THIS PAGE",
  sections: [
    {
      id: "applicability",
      heading: "1. Introduction and Applicability",
      blocks: [
        {
          p: "This Privacy Policy explains how Certrace, a company operating in Bangkok, Thailand (the “Company,” “Certrace,” “we,” “us,” or “our”) collects, uses, discloses, and protects personal data in connection with the Certrace platform for ESG data management and CBAM compliance support (the “Platform” or “Services”), in accordance with the Personal Data Protection Act B.E. 2562 (2019) of Thailand (“Thai PDPA”), Regulation (EU) 2016/679 (“GDPR”) where it applies to the processing in question, and other applicable data protection laws.",
        },
        {
          p: "This Privacy Policy applies to personal data of:",
        },
        {
          ul: [
            "**Authorized Users** — individuals who register for or use the Platform on behalf of a business customer (“Customer”);",
            "**Supplier Participants** — individuals at Customer’s suppliers, and at those suppliers’ own upstream suppliers, who submit data through a Smart Link without holding an account. Section 4 is written for them;",
            "**Contacts** — individuals whose details are provided to us in connection with sales, pricing, support, partnership, careers, or event enquiries; and",
            "**Visitors** to our public website.",
          ],
        },
        {
          p: "It does not create third-party rights and should be read together with our Terms of Service. Where Certrace and a Customer have executed a data processing addendum, that addendum governs the processing it covers to the extent of any conflict.",
        },
      ],
    },
    {
      id: "roles",
      heading: "2. Our Roles: Data Controller and Data Processor",
      blocks: [
        {
          p: "Certrace’s processing activities fall into two distinct legal capacities. Which one applies decides who you ask, and it changes within a single screen — the person who logs in is our relationship; the supplier contact they typed into it is theirs.",
        },
        {
          p: "**2.1 Capacity as Data Controller.** With respect to Account and Authorized User Data, Billing Data, Communications Data, website usage data, and marketing data (Sections 3.1, 3.3, 3.4, 3.5) — for example, the name, work email, and job title of an individual who registers to use the Platform — Certrace acts as the Data Controller and determines the purposes and means of processing.",
        },
        {
          p: "**2.2 Capacity as Data Processor.** With respect to personal data contained within Customer Data (as defined in our Terms of Service) — including supplier contact details entered by the Customer, data submitted by a Supplier Participant through a Smart Link issued from the Customer’s account, and personal data appearing inside Evidence Documents — Certrace acts strictly as a Data Processor, processing such data solely on the documented instructions of the relevant Customer, who is the Data Controller for it.",
        },
        {
          p: "**2.3 What That Means for a Request.** Requests to exercise data-subject rights over data in Section 2.2 should be directed to the relevant Customer in the first instance. Where a Supplier Participant does not know which Customer holds their data, they may contact us and we will identify the Customer and pass the request on, or tell them who to ask. We will not disclose one Customer’s records to another party in the course of doing so.",
        },
        {
          p: "**2.4 Independent Controllers.** Certrace and Customer are independent controllers, not joint controllers, in respect of the data each determines. Nothing in this Policy makes Certrace responsible for Customer’s own compliance with the notice and lawful-basis obligations described in Section 4.2.",
        },
      ],
    },
    {
      id: "categories",
      heading: "3. Categories of Personal Data We Collect",
      blocks: [
        {
          p: "**3.1 Account and Authorized User Data.** Name, work email address, job title, department, employer, telephone number, credentials in hashed form, role and permission level, language preference, notification preferences, and records of sign-in, sign-off, and approval actions taken in the Platform.",
        },
        {
          p: "**3.2 Customer Business Data.** Data that Customer or a Supplier Participant submits for ESG and CBAM purposes — production volumes, fuel and energy consumption, process and precursor data, installation and site information, supply-chain relationships, and the supporting records behind them. It is business data, but it routinely carries personal data alongside it: the name of the person at a supplier who is responsible for a month’s figures, the name and signature of whoever signed a submission off, and the names appearing on the documents described in Section 3.6. Certrace processes this whole category as a Data Processor.",
        },
        {
          p: "**3.3 Billing and Payment Data.** Billing contact name, company registration and tax details, invoicing address, and payment records. Certrace does not store full payment card numbers; payments are handled by PCI-DSS compliant third-party processors.",
        },
        {
          p: "**3.4 Platform and Website Usage Data.** IP address, browser and device information, approximate location derived from IP, log and diagnostic data, error reports, and usage analytics collected automatically through the Platform and our website, including through the cookies described in Section 14.",
        },
        {
          p: "**3.5 Communications Data.** Information provided when you contact us — support requests, sales and pricing enquiries, demo bookings, feature requests, issue reports, career applications and the links submitted with them, and correspondence by email or LINE.",
        },
        {
          p: "**3.6 Personal Data Inside Evidence Documents.** Customers and Supplier Participants upload supporting documents — utility and fuel invoices, meter and instrument logs, ERP exports, laboratory and mill test reports, calibration records, and carbon-price receipts. These are commercial records, but they commonly carry an account holder’s name, a site address, a customer or meter reference, and the name and signature of an engineer or technician. We process what is in them; we do not extract personal data from them for any purpose of our own, and we do not index them by the individuals named in them.",
        },
        {
          p: "**3.7 What We Ask You Not to Upload.** The Platform is not designed for, and Customers are contractually required not to upload, special categories of personal data, health or biometric data, payment card data, or government identity documents. Emissions reporting does not require any of them.",
        },
      ],
    },
    {
      id: "supplier-data",
      heading: "4. If You Are a Supplier Who Received a Link",
      blocks: [
        {
          p: "This section is for the person who was sent a Smart Link by a customer of theirs and is being asked for emissions data. It matters because you did not choose us — somebody you supply did.",
        },
        {
          p: "**4.1 How We Got Your Details.** Your name, email address, and sometimes your telephone number and job title were entered into the Platform by the company that sent you the link, because they need production and emissions figures from you in order to answer their own regulatory obligations. We did not obtain them from a public source, buy them, or receive them from a data broker.",
        },
        {
          p: "**4.2 Who Is Responsible.** The company that invited you is the Data Controller for your data. They decide what to ask you, how long to keep it, and what to do with it afterwards. Certrace is their Data Processor and acts on their instructions. They are also the party responsible for having a lawful basis to hold your details and for telling you that they do — an obligation our Terms of Service makes explicit to them.",
        },
        {
          p: "**4.3 What Happens to What You Submit.** The data and documents you submit go into that customer’s workspace. They are used to calculate embedded emissions for the goods you supply and to evidence those figures to a verifier or a buyer. Your submission may be retained so that a later request can be pre-filled with what you already answered — that is on the instruction of the company that invited you, and it exists so that you are not asked the same questions every month.",
        },
        {
          p: "**4.4 Who Else Sees It.** Your submission is visible to the customer who invited you, in their account. It is not visible to their other suppliers, it is not visible to Certrace’s other customers, and Certrace does not operate a shared supplier database across customers. Where the customer chooses to pass your figures on — to their own buyer, to an importer, or to a verifier — that is their disclosure, made under their own obligations, and generally the reason you were asked in the first place.",
        },
        {
          p: "**4.5 No Account, No Charge, No Marketing.** Access through a Smart Link creates no account, costs nothing, and never will. We do not send Supplier Participants marketing on the strength of an invitation, and being invited does not put you on any list of ours.",
        },
        {
          p: "**4.6 Your Rights, and Where to Take Them.** You hold the rights in Section 13. Address them to the company that invited you, since they are the controller. If you cannot reach them, or you do not know which company holds your data, contact us and we will pass the request on or tell you who to ask. Tell us if a link reached you in error and we will notify the sender so that it can be revoked.",
        },
      ],
    },
    {
      id: "use",
      heading: "5. How We Use Personal Data",
      blocks: [
        {
          p: "We process the categories of Personal Data described above for the following purposes:",
        },
        {
          p: "**5.1 Service Delivery.** To create and manage Authorized User accounts, issue and resolve Smart Links, collect and organise submissions, run calculations, and generate Reports and Outputs for Customer.",
        },
        {
          p: "**5.2 Account and Security Management.** To authenticate users, maintain the security and integrity of the Platform, detect and prevent fraud, abuse, or unauthorised access, and enforce our Terms of Service.",
        },
        {
          p: "**5.3 The Audit Trail.** To record who submitted, edited, reviewed, approved, or signed off each figure, and when. This is not incidental logging — an emissions figure that cannot say who stood behind it is not evidence, and the record exists because verification requires it. It is retained as described in Section 12.",
        },
        {
          p: "**5.4 Notifications and Reminders.** To send the operational messages the Platform runs on — a request issued, a month due, a submission received, a signature required, a cap approaching — to the addresses Customer and its Supplier Participants provide. These are service messages, not marketing, and cannot be switched off entirely while an account is active, though their frequency and categories can be configured.",
        },
        {
          p: "**5.5 Customer Support.** To respond to enquiries, provide technical support, and communicate service-related updates such as maintenance windows and security notices.",
        },
        {
          p: "**5.6 Billing and Administration.** To process payments, issue invoices and receipts, and maintain financial records as required by law.",
        },
        {
          p: "**5.7 Product Improvement.** To analyse aggregated or de-identified usage patterns in order to improve the Platform’s features, reliability, and calculation methodologies. Aggregates are produced at a level that cannot reasonably be resolved back to one Customer, one installation, or one individual.",
        },
        {
          p: `**5.8 Sales and Marketing Communications.** To respond to demo, pricing, and partnership requests and, where the Contact has opted in, to send product updates, newsletters, and event invitations. Consent may be withdrawn at any time through the unsubscribe link in each message or by writing to ${CONTACT_EMAIL}. See Section 17.`,
        },
        {
          p: "**5.9 Recruitment.** To assess career applications and the portfolio, CV, or profile links submitted with them. Applications are retained for twelve (12) months so that we can come back to a candidate when a suitable role opens, unless the applicant asks us to delete them sooner.",
        },
        {
          p: "**5.10 Legal and Regulatory Compliance.** To comply with applicable law, respond to lawful requests from public authorities, and establish, exercise, or defend legal claims.",
        },
      ],
    },
    {
      id: "legal-bases",
      heading: "6. Legal Bases for Processing",
      blocks: [
        {
          p: "Under the Thai PDPA and, where applicable, the GDPR, we rely on the following legal bases:",
        },
        {
          ul: [
            "**Performance of a contract** — to provide the Platform under the Terms of Service agreed with Customer, to manage the Authorized User accounts necessary for that purpose, and to bill for it;",
            "**Legitimate interests** — for security and fraud prevention, service messages, the integrity of the audit trail, product improvement on aggregated data, responding to business enquiries, and establishing or defending legal claims, in each case balanced against the interests and rights of the data subject;",
            "**Consent** — for marketing communications and for non-essential cookies, as described in Sections 14 and 17. Withdrawal is always possible and does not affect processing carried out before it;",
            "**Legal obligation** — for tax, accounting, and regulatory record-keeping, and for responding to lawful requests from authorities;",
            "**Contractual necessity in the interest of the data subject or their employer** — for the processing of Supplier Participant contact details, where the underlying instruction and lawful basis are the Customer’s, as described in Section 4.2; and",
            "**Vital interests or substantial public interest** — only in the rare circumstances where they apply.",
          ],
        },
        {
          p: "Where we rely on legitimate interests, a data subject may object under Section 13, and we will stop unless we can demonstrate compelling grounds that override those interests or the processing is needed to establish or defend a legal claim.",
        },
      ],
    },
    {
      id: "automated",
      heading: "7. Automated Processing, Calculation, and AI Features",
      blocks: [
        {
          p: "**7.1 Deterministic Processing.** Most of what the Platform does automatically is arithmetic and rule application: validating and standardising submitted values, converting units, checking plausibility, applying sector rules, and calculating embedded emissions. It is deterministic, the workings are shown, and the same inputs always produce the same result.",
        },
        {
          p: "**7.2 AI-Assisted Features, and What They Send Where.** Where a Customer enables them, AI-assisted features may transmit an Evidence Document, or an extract of submitted data, to a third-party model provider engaged as a Sub-processor, for the purpose of proposing values or summarising changes and risks. This is a disclosure of whatever that document contains, including any personal data described in Section 3.6, and we name it as one.",
        },
        {
          p: "**7.3 It Is Off Until It Is Switched On.** AI-assisted features are optional and are not enabled by default. The Platform is fully usable without them — the same fields are simply typed in by a person. A Customer may disable them at any time.",
        },
        {
          p: "**7.4 A Human Always Decides.** Extracted values are presented as proposals with a confidence indication and are written into the record only when a person accepts them. Nothing is populated silently. Where a proposal falls below our confidence threshold it is flagged for review and does not count toward evidence coverage until a person has dealt with it.",
        },
        {
          p: "**7.5 No Training on Your Data.** We do not use personal data or Customer Data collected through the Platform to train foundational or third-party machine-learning models made available to anyone other than the relevant Customer, and we contract with our AI Sub-processors on terms that prohibit them from doing so with data we send them.",
        },
        {
          p: "**7.6 No Automated Decisions with Legal Effect.** We do not take decisions producing legal effects concerning an individual, or similarly significantly affecting one, by automated means alone. Readiness scores, quality flags, and risk indicators describe organisations, installations, and datasets — not people — and are always advisory and subject to human review.",
        },
        {
          p: "**7.7 Outputs Are Still Yours to Check.** Reports and Outputs are provided on an “as-is” basis, and the relevant Customer bears sole responsibility for reviewing, verifying, and where required independently validating them before relying on them for any regulatory, commercial, or professional purpose, as further described in our Terms of Service.",
        },
      ],
    },
    {
      id: "sharing",
      heading: "8. Data Sharing and Disclosure",
      blocks: [
        {
          p: "We do not sell personal data, and we do not share it for anyone else’s advertising. We may share personal data in the following circumstances:",
        },
        {
          p: "**8.1 Sub-processors.** With cloud hosting and storage, infrastructure, email delivery, error monitoring, analytics, payment processing, and — for the optional features in Section 7 — AI model providers, each processing personal data on our behalf under written data-processing terms consistent with the Thai PDPA and, where applicable, the GDPR.",
        },
        {
          p: "**8.2 Within the Customer Organisation.** Account and Authorized User Data, and submissions made to a Customer’s account, are visible to other Authorized Users of that account according to the roles and permissions the Customer configures. Certrace enforces those roles; the Customer decides them.",
        },
        {
          p: "**8.3 At the Customer’s Direction.** Where a Customer exports, shares, or transmits a Report, dataset, or document to its own buyer, importer, verifier, auditor, or regulator, that disclosure is the Customer’s act under its own obligations. It is usually the reason the data was collected.",
        },
        {
          p: "**8.4 Professional Advisors.** With our auditors, accountants, insurers, and legal advisers, as reasonably necessary to obtain professional advice or defend a claim.",
        },
        {
          p: "**8.5 Regulatory and Legal Disclosures.** With courts, regulators, or law enforcement where required by a valid legal mandate, subpoena, or statutory obligation. Where we are legally permitted to do so, we will notify the affected Customer before disclosing data we hold on their behalf, so that they may seek to challenge it.",
        },
        {
          p: "**8.6 Business Transfers.** In connection with a merger, acquisition, financing, or sale of assets, subject to the acquiring party committing to handle personal data consistently with this Privacy Policy. We will give notice of any such transfer before personal data becomes subject to a materially different policy.",
        },
        {
          p: "**8.7 Sub-processor Changes.** We maintain a list of material Sub-processors and will give notice of the addition of a new one. A Customer may object on reasonable data-protection grounds; the process and the remedy are set out in our Terms of Service.",
        },
      ],
    },
    {
      id: "transfers",
      heading: "9. Cross-Border Data Transfers",
      blocks: [
        {
          p: "**9.1 Where Data Goes.** Certrace operates from Thailand and its infrastructure and Sub-processors may store or process personal data outside Thailand, including in Singapore, the European Union, the United Kingdom, and the United States. CBAM work is cross-border by nature: a Thai exporter’s figures are read by an EU importer and, often, a European verifier.",
        },
        {
          p: "**9.2 Safeguards.** Where we transfer personal data outside Thailand, we take the steps required under the Thai PDPA to ensure the receiving jurisdiction or recipient provides an adequate level of protection, or we implement appropriate safeguards — including contractual data-protection commitments with our Sub-processors — before making the transfer, unless a statutory exemption applies. For transfers of personal data out of the European Economic Area or the United Kingdom to which the GDPR applies, we rely on the European Commission’s Standard Contractual Clauses or the UK International Data Transfer Addendum, supplemented where necessary by additional technical and organisational measures.",
        },
        {
          p: "**9.3 Copies of the Safeguards.** A Customer may request a copy of the relevant transfer mechanism, with commercial terms redacted, by writing to us at the address in Section 19.",
        },
      ],
    },
    {
      id: "security",
      heading: "10. Data Security",
      blocks: [
        {
          p: "**10.1 Measures.** We implement technical and organisational security measures designed to protect personal data against unauthorised access, alteration, disclosure, or destruction. These include encryption of data in transit, encryption at rest with our infrastructure providers, role-based access control, least-privilege access for our own personnel, credential hashing, hardened HTTP security headers, scoped and revocable Smart Link tokens, logging of access to production systems, and periodic review of our providers and our own configuration.",
        },
        {
          p: "**10.2 Your Part.** No system can be guaranteed secure. We ask Authorized Users to use strong, unique credentials, to keep them to themselves, to remove colleagues who have left, and to treat a Smart Link as addressed correspondence rather than something to forward.",
        },
        {
          p: `**10.3 Incidents.** Where we become aware of a personal data breach, we will assess it without undue delay, notify affected Customers with the information reasonably available to us so that they can meet their own notification obligations, and notify the Office of the Personal Data Protection Committee and, where the GDPR applies, the relevant supervisory authority, where the law requires it. Suspected security issues can be reported to ${CONTACT_EMAIL} and will be treated as a priority.`,
        },
      ],
    },
    {
      id: "retention",
      heading: "11. Data Retention",
      blocks: [
        {
          p: "**11.1 Account Data.** Retained for as long as the associated Customer account remains active, and for a reasonable period afterwards to comply with legal, accounting, or dispute-resolution obligations, after which it is deleted or anonymised.",
        },
        {
          p: "**11.2 Customer Data.** Retained and deleted in accordance with the Customer’s instructions and our Terms of Service. Following termination, expiry, or the end of a free trial, Customer Data remains available for export for thirty (30) days, after which we may delete or anonymise it.",
        },
        {
          p: "**11.3 Billing Records.** Retained for the period required by Thai tax and accounting law, currently a minimum of five (5) years from the end of the relevant accounting period.",
        },
        {
          p: "**11.4 Communications and Enquiries.** Retained for up to twenty-four (24) months from the last contact, unless a longer period is needed to defend a claim. Career applications are retained for twelve (12) months — see Section 5.9.",
        },
        {
          p: "**11.5 Logs and Analytics.** Technical logs are retained for up to twelve (12) months. Aggregated and de-identified statistics may be retained indefinitely, because they no longer identify anyone.",
        },
        {
          p: "**11.6 Sealed Compliance Records.** Sealed versions and audit entries are retained for as long as the associated account is active and for any period the Customer instructs, reflecting the multi-year record-retention obligations that CBAM and related regimes impose on the parties concerned. See Section 12.",
        },
      ],
    },
    {
      id: "records",
      heading: "12. Sealed Records and the Limits of Erasure",
      blocks: [
        {
          p: "**12.1 Why Some Records Do Not Change.** The Platform seals a submission or a Report by keeping an immutable version of the dataset behind it, together with an integrity hash and a record of who approved it. That is the point of the product: a figure a verifier can test has to be tied to a moment, a source, and a person. Sealed versions and audit entries therefore cannot be edited or partially deleted through ordinary controls, by Certrace or by the Customer.",
        },
        {
          p: "**12.2 What That Means for an Erasure Request.** Where a request concerns personal data inside a sealed version or an audit entry, we will comply to the extent we are able and the law requires. But erasure there may mean deleting an entire version rather than a field within it, which would remove the evidence behind a figure a Customer may be legally required to keep. Retaining that record may be justified as necessary for compliance with a legal obligation, or for the establishment, exercise, or defence of legal claims. We will say which applies, in the specific case, rather than refusing in the abstract.",
        },
        {
          p: "**12.3 Contact Details Are a Different Matter.** A supplier contact who no longer wishes to receive requests can be removed from future ones without touching any sealed record, and a request to that effect will be actioned promptly by the Customer who holds the relationship.",
        },
      ],
    },
    {
      id: "rights",
      heading: "13. Your Rights as a Data Subject",
      blocks: [
        {
          p: "Subject to the exceptions and conditions in the Thai PDPA and, where it applies, the GDPR, data subjects have the right to:",
        },
        {
          ul: [
            "**Be informed** about how their personal data is collected and used — which is what this document is for;",
            "**Access** their personal data and obtain a copy of it;",
            "**Rectify** inaccurate or incomplete personal data;",
            "**Erase or destroy** personal data, or restrict its processing, in the circumstances the law provides — read with Section 12;",
            "**Object** to processing carried out on the basis of legitimate interests, and to direct marketing at any time and without qualification;",
            "**Data portability**, where technically feasible and the processing is based on consent or contract;",
            "**Withdraw consent** at any time where processing is based on consent, without affecting the lawfulness of processing before withdrawal;",
            "**Not be subject** to a decision based solely on automated processing that produces legal effects — see Section 7.6; and",
            "**Lodge a complaint** with a supervisory authority — see Section 18.",
          ],
        },
        {
          p: `**13.1 How to Exercise Them.** For data where Certrace is the Data Controller, write to ${CONTACT_EMAIL}. We will acknowledge within seven (7) days and respond substantively within thirty (30) days, or tell you why we need longer. There is no fee unless a request is manifestly unfounded or excessive.`,
        },
        {
          p: "**13.2 Verification.** We will take reasonable steps to verify the identity of a requester before acting, because disclosing personal data to the wrong person is itself a breach. We will ask for the minimum needed to be satisfied, and will not use what you send for verification for anything else.",
        },
        {
          p: "**13.3 Where We Are the Processor.** Where a request concerns data for which Certrace acts as a Data Processor on behalf of a Customer — including data submitted by Supplier Participants — we will direct the request to, or act on the instruction of, the relevant Customer, consistent with Sections 2.3 and 4.6.",
        },
      ],
    },
    {
      id: "cookies",
      heading: "14. Cookies and Similar Technologies",
      blocks: [
        {
          p: "We use cookies and similar technologies on the Platform and our website to (a) maintain login sessions and essential functionality, (b) remember preferences such as language, (c) understand usage patterns in order to improve the Platform, and (d) where consented, measure marketing campaign performance. Essential cookies are necessary for the Platform to function and cannot be disabled. Non-essential cookies are used only with opt-in consent, which may be withdrawn at any time through the cookie settings on our website or through browser controls. We do not use cookies to build advertising profiles, and we do not share cookie-derived data with advertising networks.",
        },
      ],
    },
    {
      id: "minors",
      heading: "15. Business Use; Minors",
      blocks: [
        {
          p: "The Platform is intended solely for business use by adult professionals acting on behalf of an organisation, and is not directed to, or intended for use by, individuals under eighteen (18) years of age. We do not knowingly collect personal data from minors. If we become aware that we have inadvertently collected such data, we will take reasonable steps to delete it.",
        },
      ],
    },
    {
      id: "links",
      heading: "16. Third-Party Links",
      blocks: [
        {
          p: "The Platform and our website may contain links to third-party websites or services, including our social accounts and the LINE Official Account through which we provide support. We are not responsible for the privacy practices of those third parties, and messages you send us on a third-party messaging service are also subject to that service’s own policy. We encourage you to review it.",
        },
      ],
    },
    {
      id: "marketing",
      heading: "17. Marketing Communications",
      blocks: [
        {
          p: "**17.1 What We Send.** Product updates, CBAM explainers, event invitations, and occasional news about the company — to Contacts who asked for them, and to Authorized Users at Customers who have not opted out.",
        },
        {
          p: "**17.2 What We Do Not Do.** We do not send marketing to Supplier Participants on the strength of an invitation they received. We do not sell, rent, or share contact details with anyone for their own marketing. We do not buy lists.",
        },
        {
          p: `**17.3 Opting Out.** Every marketing message carries an unsubscribe link that works without a login. You may also write to ${CONTACT_EMAIL}. Opting out of marketing does not stop the service messages described in Section 5.4, which are part of the Platform working.`,
        },
      ],
    },
    {
      id: "complaints",
      heading: "18. Complaints and Supervisory Authorities",
      blocks: [
        {
          p: `If you believe we have handled your personal data improperly, please tell us first at ${CONTACT_EMAIL}. We would rather fix it than be told about it by a regulator, and a complaint reaches a person on the founding team rather than a queue.`,
        },
        {
          p: "You also have the right to complain to a supervisory authority. In Thailand, that is the Office of the Personal Data Protection Committee (PDPC). In the European Economic Area or the United Kingdom, it is the supervisory authority of the country where you live, work, or where you believe the issue arose. Exercising that right does not depend on having contacted us first.",
        },
      ],
    },
    {
      id: "changes",
      heading: "19. Changes to this Privacy Policy",
      blocks: [
        {
          p: "We may update this Privacy Policy from time to time to reflect changes in our practices, our Sub-processors, or applicable law. We will update the “Last Updated” date at the top and, for material changes, give notice through the Platform or by email before the changes take effect. Continued use of the Platform following such notice constitutes acknowledgment of the revised Privacy Policy. Where a change would require consent under applicable law, we will ask for it rather than assume it.",
        },
      ],
    },
    {
      id: "contact",
      heading: "20. Contact Us",
      blocks: [
        {
          p: `For any question, request, or complaint about this Privacy Policy or our data processing practices, contact our Data Protection Officer at **${CONTACT_EMAIL}**. Certrace operates from Bangkok, Thailand. Write in Thai or English, whichever is easier.`,
        },
      ],
    },
  ],
};

/* The Thai text of the Privacy Policy. Same twenty sections, same anchor ids,
   in the same order as the English. The `languageNote` says the English text
   prevails — see the note in lib/legal-terms.ts for why that line is load
   bearing rather than boilerplate. */
export const PRIVACY_TH: LegalDoc = {
  eyebrow: "ข้อกำหนดและกฎหมาย",
  title: "นโยบายความเป็นส่วนตัวของ Certrace",
  effectiveLabel: "วันที่มีผลบังคับใช้",
  effective: "1 กันยายน 2026",
  updatedLabel: "อัปเดตล่าสุด",
  updated: "1 กันยายน 2026",
  lede: "Certrace เก็บรวบรวม ใช้ เปิดเผย และคุ้มครองข้อมูลส่วนบุคคลอย่างไร ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ของประเทศไทย และตาม GDPR ของสหภาพยุโรปเท่าที่ใช้บังคับ ครอบคลุมทั้งผู้ที่มีบัญชีกับเรา และซัพพลายเออร์ที่ไม่เคยมีบัญชีเลย",
  contentsLabel: "หัวข้อในหน้านี้",
  languageNote:
    "ฉบับแปลภาษาไทยนี้จัดทำขึ้นเพื่อความสะดวกในการอ่าน หากมีข้อความใดขัดหรือแย้งกัน ให้ยึดฉบับภาษาอังกฤษเป็นหลัก",
  sections: [
    {
      id: "applicability",
      heading: "1. บทนำและขอบเขตการใช้บังคับ",
      blocks: [
        {
          p: "นโยบายความเป็นส่วนตัวฉบับนี้อธิบายว่า Certrace ซึ่งเป็นบริษัทที่ดำเนินกิจการในกรุงเทพมหานคร ประเทศไทย (“บริษัท” “Certrace” “เรา”) เก็บรวบรวม ใช้ เปิดเผย และคุ้มครองข้อมูลส่วนบุคคลอย่างไร ในส่วนที่เกี่ยวกับแพลตฟอร์ม Certrace สำหรับการจัดการข้อมูล ESG และการสนับสนุนการปฏิบัติตาม CBAM (“แพลตฟอร์ม” หรือ “บริการ”) ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (“PDPA”) ตาม Regulation (EU) 2016/679 (“GDPR”) เท่าที่ใช้บังคับกับการประมวลผลนั้น และตามกฎหมายคุ้มครองข้อมูลอื่นที่เกี่ยวข้อง",
        },
        { p: "นโยบายฉบับนี้ใช้กับข้อมูลส่วนบุคคลของ" },
        {
          ul: [
            "**ผู้ใช้ที่ได้รับอนุญาต** — บุคคลที่ลงทะเบียนหรือใช้งานแพลตฟอร์มในนามของลูกค้าองค์กร (“ลูกค้า”)",
            "**ผู้เข้าร่วมฝ่ายซัพพลายเออร์** — บุคคลที่ซัพพลายเออร์ของลูกค้าและซัพพลายเออร์ต้นน้ำของบุคคลเหล่านั้น ซึ่งส่งข้อมูลผ่านสมาร์ทลิงก์โดยไม่มีบัญชีผู้ใช้ ข้อ 4 เขียนขึ้นเพื่อบุคคลกลุ่มนี้โดยเฉพาะ",
            "**ผู้ติดต่อ** — บุคคลที่มีการให้ข้อมูลติดต่อแก่เราในส่วนที่เกี่ยวกับการขาย การสอบถามราคา การสนับสนุน ความร่วมมือ การสมัครงาน หรือการสอบถามเกี่ยวกับงานอีเวนต์ และ",
            "**ผู้เยี่ยมชม** เว็บไซต์สาธารณะของเรา",
          ],
        },
        {
          p: "นโยบายฉบับนี้ไม่ก่อให้เกิดสิทธิแก่บุคคลภายนอก และควรอ่านประกอบกับข้อกำหนดการใช้งานของเรา ในกรณีที่ Certrace และลูกค้าได้ลงนามในข้อตกลงการประมวลผลข้อมูล ให้ยึดข้อตกลงนั้นสำหรับการประมวลผลที่ข้อตกลงครอบคลุมเท่าที่ขัดแย้งกัน",
        },
      ],
    },
    {
      id: "roles",
      heading: "2. บทบาทของเรา: ผู้ควบคุมข้อมูลและผู้ประมวลผลข้อมูล",
      blocks: [
        {
          p: "กิจกรรมการประมวลผลของ Certrace แบ่งเป็นสองสถานะทางกฎหมายที่แยกจากกัน สถานะไหนใช้บังคับเป็นตัวกำหนดว่าต้องไปถามใคร และสถานะนี้เปลี่ยนได้ภายในหน้าจอเดียว — คนที่ล็อกอินคือความสัมพันธ์ของเรา ส่วนผู้ติดต่อฝ่ายซัพพลายเออร์ที่เขากรอกเข้ามาคือความสัมพันธ์ของเขา",
        },
        {
          p: "**2.1 สถานะผู้ควบคุมข้อมูลส่วนบุคคล** สำหรับข้อมูลบัญชีและข้อมูลผู้ใช้ที่ได้รับอนุญาต ข้อมูลการเรียกเก็บเงิน ข้อมูลการติดต่อสื่อสาร ข้อมูลการใช้งานเว็บไซต์ และข้อมูลด้านการตลาด (ข้อ 3.1, 3.3, 3.4, 3.5) — เช่น ชื่อ อีเมลที่ทำงาน และตำแหน่งงานของบุคคลที่ลงทะเบียนใช้แพลตฟอร์ม — Certrace ทำหน้าที่เป็นผู้ควบคุมข้อมูลส่วนบุคคล และเป็นผู้กำหนดวัตถุประสงค์และวิธีการประมวลผล",
        },
        {
          p: "**2.2 สถานะผู้ประมวลผลข้อมูลส่วนบุคคล** สำหรับข้อมูลส่วนบุคคลที่อยู่ในข้อมูลลูกค้า (ตามนิยามในข้อกำหนดการใช้งาน) — รวมถึงข้อมูลติดต่อของซัพพลายเออร์ที่ลูกค้ากรอกเข้ามา ข้อมูลที่ผู้เข้าร่วมฝ่ายซัพพลายเออร์ส่งผ่านสมาร์ทลิงก์ที่ออกจากบัญชีของลูกค้า และข้อมูลส่วนบุคคลที่ปรากฏในเอกสารหลักฐาน — Certrace ทำหน้าที่เป็นผู้ประมวลผลข้อมูลส่วนบุคคลโดยเคร่งครัด โดยประมวลผลตามคำสั่งที่บันทึกไว้ของลูกค้าที่เกี่ยวข้อง ซึ่งเป็นผู้ควบคุมข้อมูลส่วนบุคคลสำหรับข้อมูลนั้น",
        },
        {
          p: "**2.3 ความหมายต่อการยื่นคำขอ** คำขอใช้สิทธิของเจ้าของข้อมูลเกี่ยวกับข้อมูลตามข้อ 2.2 ควรยื่นต่อลูกค้าที่เกี่ยวข้องเป็นลำดับแรก ในกรณีที่ผู้เข้าร่วมฝ่ายซัพพลายเออร์ไม่ทราบว่าลูกค้ารายใดถือข้อมูลของตน สามารถติดต่อเราได้ และเราจะระบุตัวลูกค้าและส่งคำขอต่อ หรือแจ้งว่าควรติดต่อผู้ใด ทั้งนี้เราจะไม่เปิดเผยข้อมูลของลูกค้ารายหนึ่งต่อบุคคลอื่นในระหว่างดำเนินการดังกล่าว",
        },
        {
          p: "**2.4 ผู้ควบคุมข้อมูลอิสระ** Certrace และลูกค้าเป็นผู้ควบคุมข้อมูลอิสระต่อกัน ไม่ใช่ผู้ควบคุมข้อมูลร่วม ในส่วนของข้อมูลที่แต่ละฝ่ายเป็นผู้กำหนด ไม่มีข้อความใดในนโยบายฉบับนี้ที่ทำให้ Certrace รับผิดชอบต่อการปฏิบัติตามหน้าที่แจ้งและหน้าที่มีฐานทางกฎหมายของลูกค้าตามข้อ 4.2",
        },
      ],
    },
    {
      id: "categories",
      heading: "3. ประเภทของข้อมูลส่วนบุคคลที่เราเก็บรวบรวม",
      blocks: [
        {
          p: "**3.1 ข้อมูลบัญชีและผู้ใช้ที่ได้รับอนุญาต** ชื่อ อีเมลที่ทำงาน ตำแหน่งงาน แผนก นายจ้าง หมายเลขโทรศัพท์ ข้อมูลรับรองในรูปแบบที่ผ่านการแฮช บทบาทและระดับสิทธิ์ ภาษาที่เลือก การตั้งค่าการแจ้งเตือน และบันทึกการเข้าสู่ระบบ การลงนามรับรอง และการอนุมัติที่กระทำในแพลตฟอร์ม",
        },
        {
          p: "**3.2 ข้อมูลธุรกิจของลูกค้า** ข้อมูลที่ลูกค้าหรือผู้เข้าร่วมฝ่ายซัพพลายเออร์ส่งเข้ามาเพื่อวัตถุประสงค์ด้าน ESG และ CBAM — ปริมาณการผลิต การใช้เชื้อเพลิงและพลังงาน ข้อมูลกระบวนการและสารตั้งต้น ข้อมูลสถานประกอบการและโรงงาน ความสัมพันธ์ในห่วงโซ่อุปทาน และเอกสารสนับสนุนที่อยู่เบื้องหลัง ข้อมูลนี้เป็นข้อมูลธุรกิจ แต่มักมีข้อมูลส่วนบุคคลติดมาด้วยเสมอ ได้แก่ ชื่อผู้รับผิดชอบตัวเลขประจำเดือนที่ฝั่งซัพพลายเออร์ ชื่อและลายเซ็นของผู้ลงนามรับรอง และชื่อที่ปรากฏบนเอกสารตามข้อ 3.6 Certrace ประมวลผลข้อมูลประเภทนี้ทั้งหมดในฐานะผู้ประมวลผลข้อมูล",
        },
        {
          p: "**3.3 ข้อมูลการเรียกเก็บเงินและการชำระเงิน** ชื่อผู้ติดต่อด้านการเงิน ข้อมูลทะเบียนนิติบุคคลและภาษี ที่อยู่ในการวางบิล และบันทึกการชำระเงิน Certrace ไม่จัดเก็บหมายเลขบัตรชำระเงินฉบับเต็ม การชำระเงินดำเนินการผ่านผู้ให้บริการรับชำระเงินภายนอกที่ได้มาตรฐาน PCI-DSS",
        },
        {
          p: "**3.4 ข้อมูลการใช้งานแพลตฟอร์มและเว็บไซต์** หมายเลข IP ข้อมูลเบราว์เซอร์และอุปกรณ์ ตำแหน่งโดยประมาณที่ได้จาก IP ข้อมูลบันทึกและข้อมูลวินิจฉัย รายงานข้อผิดพลาด และข้อมูลวิเคราะห์การใช้งานที่เก็บโดยอัตโนมัติผ่านแพลตฟอร์มและเว็บไซต์ รวมถึงผ่านคุกกี้ตามข้อ 14",
        },
        {
          p: "**3.5 ข้อมูลการติดต่อสื่อสาร** ข้อมูลที่ให้ไว้เมื่อคุณติดต่อเรา ได้แก่ คำขอรับการสนับสนุน การสอบถามด้านการขายและราคา การนัดชมระบบ คำขอฟีเจอร์ การแจ้งปัญหา ใบสมัครงานและลิงก์ที่แนบมาด้วย และการติดต่อทางอีเมลหรือ LINE",
        },
        {
          p: "**3.6 ข้อมูลส่วนบุคคลในเอกสารหลักฐาน** ลูกค้าและผู้เข้าร่วมฝ่ายซัพพลายเออร์อัปโหลดเอกสารสนับสนุน — ใบแจ้งหนี้ค่าสาธารณูปโภคและเชื้อเพลิง บันทึกมิเตอร์และเครื่องมือวัด ไฟล์ส่งออกจากระบบ ERP รายงานผลห้องปฏิบัติการและใบรับรองผลการทดสอบ บันทึกการสอบเทียบ และใบเสร็จราคาคาร์บอน เอกสารเหล่านี้เป็นเอกสารทางการค้า แต่โดยทั่วไปมีชื่อผู้ถือบัญชี ที่อยู่โรงงาน เลขที่ผู้ใช้หรือเลขมิเตอร์ และชื่อกับลายเซ็นของวิศวกรหรือช่างเทคนิคปรากฏอยู่ เราประมวลผลสิ่งที่อยู่ในเอกสาร แต่ไม่ได้สกัดข้อมูลส่วนบุคคลออกมาเพื่อวัตถุประสงค์ของเราเอง และไม่ได้จัดทำดัชนีเอกสารตามชื่อบุคคลที่ปรากฏในนั้น",
        },
        {
          p: "**3.7 สิ่งที่เราขอให้ไม่อัปโหลด** แพลตฟอร์มไม่ได้ออกแบบมาสำหรับข้อมูลส่วนบุคคลอ่อนไหว ข้อมูลสุขภาพหรือชีวมิติ ข้อมูลบัตรชำระเงิน หรือเอกสารแสดงตนที่ออกโดยรัฐ และลูกค้ามีหน้าที่ตามสัญญาที่จะไม่อัปโหลดสิ่งเหล่านี้ การรายงานการปล่อยก๊าซไม่จำเป็นต้องใช้ข้อมูลเหล่านั้นเลย",
        },
      ],
    },
    {
      id: "supplier-data",
      heading: "4. หากคุณคือซัพพลายเออร์ที่ได้รับลิงก์",
      blocks: [
        {
          p: "หัวข้อนี้เขียนขึ้นสำหรับผู้ที่ได้รับสมาร์ทลิงก์จากลูกค้าของตนและถูกขอข้อมูลการปล่อยก๊าซ หัวข้อนี้สำคัญเพราะคุณไม่ได้เลือกเรา — คนที่คุณส่งของให้ต่างหากที่เลือก",
        },
        {
          p: "**4.1 เราได้ข้อมูลของคุณมาอย่างไร** ชื่อ อีเมล และบางครั้งหมายเลขโทรศัพท์กับตำแหน่งงานของคุณ ถูกกรอกเข้าสู่แพลตฟอร์มโดยบริษัทที่ส่งลิงก์มาให้คุณ เพราะบริษัทนั้นต้องการตัวเลขการผลิตและการปล่อยก๊าซจากคุณเพื่อปฏิบัติตามภาระตามกฎหมายของตนเอง เราไม่ได้ข้อมูลมาจากแหล่งสาธารณะ ไม่ได้ซื้อมา และไม่ได้รับมาจากนายหน้าข้อมูล",
        },
        {
          p: "**4.2 ใครเป็นผู้รับผิดชอบ** บริษัทที่เชิญคุณคือผู้ควบคุมข้อมูลส่วนบุคคลของคุณ บริษัทนั้นเป็นผู้ตัดสินว่าจะถามอะไร เก็บไว้นานเท่าใด และจะทำอะไรกับข้อมูลต่อไป Certrace เป็นผู้ประมวลผลข้อมูลของบริษัทนั้นและทำตามคำสั่งของบริษัทนั้น บริษัทนั้นยังเป็นผู้รับผิดชอบในการมีฐานทางกฎหมายเพื่อถือข้อมูลของคุณและในการแจ้งให้คุณทราบ ซึ่งเป็นหน้าที่ที่ข้อกำหนดการใช้งานของเราระบุไว้ต่อบริษัทนั้นอย่างชัดแจ้ง",
        },
        {
          p: "**4.3 สิ่งที่คุณส่งเข้ามาถูกนำไปทำอะไร** ข้อมูลและเอกสารที่คุณส่งจะเข้าสู่พื้นที่ทำงานของลูกค้ารายนั้น และถูกใช้คำนวณค่าการปล่อยก๊าซแฝงของสินค้าที่คุณจัดหา และเป็นหลักฐานสนับสนุนตัวเลขนั้นต่อผู้ทวนสอบหรือผู้ซื้อ ข้อมูลที่คุณส่งอาจถูกเก็บไว้เพื่อให้คำขอครั้งถัดไปเติมคำตอบที่คุณเคยให้ไว้ล่วงหน้าได้ — นั่นเป็นไปตามคำสั่งของบริษัทที่เชิญคุณ และมีขึ้นเพื่อไม่ให้คุณต้องตอบคำถามเดิมซ้ำทุกเดือน",
        },
        {
          p: "**4.4 ใครเห็นข้อมูลนั้นอีกบ้าง** ข้อมูลที่คุณส่งจะปรากฏต่อลูกค้าที่เชิญคุณในบัญชีของเขา ไม่ปรากฏต่อซัพพลายเออร์รายอื่นของเขา ไม่ปรากฏต่อลูกค้ารายอื่นของ Certrace และ Certrace ไม่ได้ดำเนินการฐานข้อมูลซัพพลายเออร์ร่วมข้ามลูกค้า ในกรณีที่ลูกค้าเลือกส่งต่อตัวเลขของคุณ — ไปยังผู้ซื้อของเขา ผู้นำเข้า หรือผู้ทวนสอบ — นั่นเป็นการเปิดเผยของลูกค้ารายนั้นภายใต้ภาระของเขาเอง และโดยทั่วไปก็เป็นเหตุผลที่คุณถูกขอข้อมูลตั้งแต่แรก",
        },
        {
          p: "**4.5 ไม่มีบัญชี ไม่มีค่าใช้จ่าย ไม่มีการตลาด** การเข้าถึงผ่านสมาร์ทลิงก์ไม่สร้างบัญชี ไม่มีค่าใช้จ่าย และจะไม่มีตลอดไป เราไม่ส่งสื่อการตลาดถึงผู้เข้าร่วมฝ่ายซัพพลายเออร์เพียงเพราะได้รับคำเชิญ และการได้รับคำเชิญไม่ได้ทำให้คุณอยู่ในรายชื่อใดของเรา",
        },
        {
          p: "**4.6 สิทธิของคุณและช่องทางใช้สิทธิ** คุณมีสิทธิตามข้อ 13 กรุณายื่นต่อบริษัทที่เชิญคุณ เพราะบริษัทนั้นเป็นผู้ควบคุมข้อมูล หากติดต่อไม่ได้ หรือคุณไม่ทราบว่าบริษัทใดถือข้อมูลของคุณ ติดต่อเราแล้วเราจะส่งคำขอต่อหรือแจ้งว่าควรติดต่อผู้ใด และหากลิงก์มาถึงคุณโดยผิดพลาด โปรดแจ้งเรา เราจะแจ้งผู้ส่งเพื่อเพิกถอนลิงก์นั้น",
        },
      ],
    },
    {
      id: "use",
      heading: "5. เราใช้ข้อมูลส่วนบุคคลอย่างไร",
      blocks: [
        { p: "เราประมวลผลข้อมูลส่วนบุคคลตามประเภทข้างต้นเพื่อวัตถุประสงค์ดังนี้" },
        {
          p: "**5.1 การให้บริการ** เพื่อสร้างและจัดการบัญชีผู้ใช้ที่ได้รับอนุญาต ออกและจัดการสมาร์ทลิงก์ เก็บรวบรวมและจัดระเบียบข้อมูลที่ส่งเข้ามา ดำเนินการคำนวณ และสร้างรายงานและผลลัพธ์ให้ลูกค้า",
        },
        {
          p: "**5.2 การจัดการบัญชีและความปลอดภัย** เพื่อยืนยันตัวตนผู้ใช้ รักษาความปลอดภัยและความสมบูรณ์ของแพลตฟอร์ม ตรวจจับและป้องกันการฉ้อโกง การใช้งานในทางที่ผิด หรือการเข้าถึงโดยไม่ได้รับอนุญาต และบังคับใช้ข้อกำหนดการใช้งานของเรา",
        },
        {
          p: "**5.3 ร่องรอยการตรวจสอบ** เพื่อบันทึกว่าใครเป็นผู้ส่ง แก้ไข ตรวจทาน อนุมัติ หรือลงนามรับรองตัวเลขแต่ละค่า และเมื่อใด นี่ไม่ใช่การเก็บล็อกโดยบังเอิญ — ตัวเลขการปล่อยก๊าซที่บอกไม่ได้ว่าใครยืนอยู่เบื้องหลังย่อมไม่ใช่หลักฐาน และบันทึกนี้มีอยู่เพราะการทวนสอบต้องการมัน ระยะเวลาการเก็บรักษาเป็นไปตามข้อ 12",
        },
        {
          p: "**5.4 การแจ้งเตือนและการเตือนความจำ** เพื่อส่งข้อความเชิงปฏิบัติการที่แพลตฟอร์มใช้ทำงาน — คำขอถูกออกแล้ว เดือนใดครบกำหนด ได้รับข้อมูลแล้ว ต้องลงนาม ใกล้ถึงเพดาน — ไปยังที่อยู่ที่ลูกค้าและผู้เข้าร่วมฝ่ายซัพพลายเออร์ให้ไว้ ข้อความเหล่านี้เป็นข้อความบริการ ไม่ใช่การตลาด และไม่สามารถปิดทั้งหมดได้ในขณะที่บัญชียังใช้งานอยู่ แม้จะปรับความถี่และหมวดหมู่ได้",
        },
        {
          p: "**5.5 การสนับสนุนลูกค้า** เพื่อตอบข้อสอบถาม ให้การสนับสนุนทางเทคนิค และแจ้งข้อมูลที่เกี่ยวกับบริการ เช่น ช่วงเวลาบำรุงรักษาและประกาศด้านความปลอดภัย",
        },
        {
          p: "**5.6 การเรียกเก็บเงินและงานธุรการ** เพื่อดำเนินการชำระเงิน ออกใบแจ้งหนี้และใบเสร็จ และเก็บรักษาบันทึกทางการเงินตามที่กฎหมายกำหนด",
        },
        {
          p: "**5.7 การปรับปรุงผลิตภัณฑ์** เพื่อวิเคราะห์รูปแบบการใช้งานแบบรวมหรือแบบไม่ระบุตัวตน สำหรับปรับปรุงฟีเจอร์ ความน่าเชื่อถือ และระเบียบวิธีการคำนวณของแพลตฟอร์ม ข้อมูลรวมจัดทำในระดับที่ไม่อาจย้อนกลับไประบุลูกค้ารายเดียว สถานประกอบการเดียว หรือบุคคลใดได้ตามสมควร",
        },
        {
          p: `**5.8 การขายและการสื่อสารการตลาด** เพื่อตอบคำขอสาธิต คำขอราคา และการติดต่อเรื่องความร่วมมือ และเพื่อส่งข่าวสารผลิตภัณฑ์ จดหมายข่าว และคำเชิญร่วมงาน เฉพาะกรณีที่ผู้ติดต่อได้ให้ความยินยอมไว้ ความยินยอมสามารถถอนได้ตลอดเวลาผ่านลิงก์ยกเลิกการรับข่าวสารในทุกฉบับ หรือโดยแจ้งมาที่ ${CONTACT_EMAIL} ดูข้อ 17`,
        },
        {
          p: "**5.9 การรับสมัครงาน** เพื่อพิจารณาใบสมัครงานและลิงก์ผลงาน CV หรือโปรไฟล์ที่แนบมาด้วย ใบสมัครจะถูกเก็บไว้สิบสอง (12) เดือนเพื่อให้เรากลับมาติดต่อได้เมื่อมีตำแหน่งที่เหมาะสม เว้นแต่ผู้สมัครขอให้ลบก่อนหน้านั้น",
        },
        {
          p: "**5.10 การปฏิบัติตามกฎหมาย** เพื่อปฏิบัติตามกฎหมายที่ใช้บังคับ ตอบสนองคำขอที่ชอบด้วยกฎหมายจากหน่วยงานรัฐ และก่อตั้ง ใช้ หรือต่อสู้สิทธิเรียกร้องตามกฎหมาย",
        },
      ],
    },
    {
      id: "legal-bases",
      heading: "6. ฐานทางกฎหมายในการประมวลผล",
      blocks: [
        { p: "ภายใต้ PDPA และ GDPR เท่าที่ใช้บังคับ เราอาศัยฐานทางกฎหมายดังต่อไปนี้" },
        {
          ul: [
            "**การปฏิบัติตามสัญญา** — เพื่อให้บริการแพลตฟอร์มตามข้อกำหนดการใช้งานที่ตกลงกับลูกค้า เพื่อจัดการบัญชีผู้ใช้ที่ได้รับอนุญาตซึ่งจำเป็นต่อการนั้น และเพื่อเรียกเก็บค่าบริการ",
            "**ประโยชน์โดยชอบด้วยกฎหมาย** — เพื่อความปลอดภัยและการป้องกันการฉ้อโกง ข้อความบริการ ความสมบูรณ์ของร่องรอยการตรวจสอบ การปรับปรุงผลิตภัณฑ์บนข้อมูลแบบรวม การตอบข้อสอบถามทางธุรกิจ และการก่อตั้งหรือต่อสู้สิทธิเรียกร้อง โดยชั่งน้ำหนักกับประโยชน์และสิทธิของเจ้าของข้อมูลในแต่ละกรณี",
            "**ความยินยอม** — สำหรับการสื่อสารการตลาดและคุกกี้ที่ไม่จำเป็น ตามข้อ 14 และ 17 การถอนความยินยอมทำได้เสมอและไม่กระทบการประมวลผลที่ทำไปก่อนหน้านั้น",
            "**การปฏิบัติตามกฎหมาย** — สำหรับการเก็บรักษาเอกสารทางภาษี บัญชี และตามกฎระเบียบ และการตอบสนองคำขอที่ชอบด้วยกฎหมายจากหน่วยงานรัฐ",
            "**ความจำเป็นตามสัญญาเพื่อประโยชน์ของเจ้าของข้อมูลหรือนายจ้างของเขา** — สำหรับการประมวลผลข้อมูลติดต่อของผู้เข้าร่วมฝ่ายซัพพลายเออร์ ซึ่งคำสั่งและฐานทางกฎหมายเบื้องหลังเป็นของลูกค้าตามข้อ 4.2 และ",
            "**ประโยชน์สำคัญต่อชีวิตหรือประโยชน์สาธารณะที่สำคัญ** — เฉพาะในกรณีที่พบได้ยากซึ่งใช้บังคับ",
          ],
        },
        {
          p: "ในกรณีที่เราอาศัยฐานประโยชน์โดยชอบด้วยกฎหมาย เจ้าของข้อมูลสามารถคัดค้านได้ตามข้อ 13 และเราจะหยุดประมวลผล เว้นแต่เราแสดงได้ว่ามีเหตุผลอันชอบด้วยกฎหมายที่สำคัญยิ่งกว่า หรือการประมวลผลนั้นจำเป็นต่อการก่อตั้งหรือต่อสู้สิทธิเรียกร้อง",
        },
      ],
    },
    {
      id: "automated",
      heading: "7. การประมวลผลอัตโนมัติ การคำนวณ และฟีเจอร์ปัญญาประดิษฐ์",
      blocks: [
        {
          p: "**7.1 การประมวลผลแบบกำหนดผลลัพธ์แน่นอน** สิ่งที่แพลตฟอร์มทำอัตโนมัติส่วนใหญ่คือการคำนวณและการใช้กฎ ได้แก่ การตรวจสอบและแปลงค่าที่ส่งเข้ามาให้เป็นมาตรฐาน การแปลงหน่วย การตรวจความสมเหตุสมผล การใช้กฎรายสาขา และการคำนวณค่าการปล่อยก๊าซแฝง ทั้งหมดกำหนดผลลัพธ์แน่นอน แสดงวิธีคำนวณให้เห็น และให้ผลเดิมเสมอเมื่อข้อมูลตั้งต้นเหมือนเดิม",
        },
        {
          p: "**7.2 ฟีเจอร์ที่ใช้ AI และสิ่งที่ถูกส่งไปที่ใด** ในกรณีที่ลูกค้าเปิดใช้งาน ฟีเจอร์ที่ใช้ AI อาจส่งเอกสารหลักฐานหรือส่วนหนึ่งของข้อมูลที่ส่งเข้ามา ไปยังผู้ให้บริการโมเดลภายนอกที่ว่าจ้างในฐานะผู้ประมวลผลช่วง เพื่อเสนอค่าหรือสรุปการเปลี่ยนแปลงและความเสี่ยง นี่คือการเปิดเผยสิ่งที่อยู่ในเอกสารนั้น รวมถึงข้อมูลส่วนบุคคลตามข้อ 3.6 และเราระบุไว้ตรง ๆ ว่าเป็นการเปิดเผย",
        },
        {
          p: "**7.3 ปิดอยู่จนกว่าจะเปิด** ฟีเจอร์ที่ใช้ AI เป็นทางเลือกและไม่ได้เปิดใช้งานโดยค่าเริ่มต้น แพลตฟอร์มใช้งานได้เต็มรูปแบบโดยไม่ต้องใช้ฟีเจอร์เหล่านี้ เพียงแต่ช่องข้อมูลเดิมจะถูกพิมพ์โดยคน ลูกค้าสามารถปิดได้ตลอดเวลา",
        },
        {
          p: "**7.4 มนุษย์เป็นผู้ตัดสินเสมอ** ค่าที่สกัดได้จะแสดงเป็นข้อเสนอพร้อมระดับความเชื่อมั่น และจะถูกบันทึกลงในระเบียนก็ต่อเมื่อมีคนกดยอมรับเท่านั้น ไม่มีการเติมค่าใดโดยเงียบ ๆ หากข้อเสนอมีความเชื่อมั่นต่ำกว่าเกณฑ์ของเรา ระบบจะกำกับให้ทบทวน และจะยังไม่นับเป็นความครอบคลุมของหลักฐานจนกว่าจะมีคนจัดการ",
        },
        {
          p: "**7.5 ไม่ใช้ข้อมูลของคุณฝึกโมเดล** เราไม่ใช้ข้อมูลส่วนบุคคลหรือข้อมูลลูกค้าที่เก็บผ่านแพลตฟอร์มไปฝึกโมเดลพื้นฐานหรือโมเดลของบุคคลภายนอกที่เปิดให้ผู้อื่นนอกจากลูกค้ารายนั้นใช้งาน และเราทำสัญญากับผู้ประมวลผลช่วงด้าน AI บนเงื่อนไขที่ห้ามผู้เหล่านั้นกระทำเช่นนั้นกับข้อมูลที่เราส่งไป",
        },
        {
          p: "**7.6 ไม่มีการตัดสินใจอัตโนมัติที่มีผลทางกฎหมาย** เราไม่ตัดสินใจที่ก่อผลทางกฎหมายต่อบุคคล หรือส่งผลกระทบต่อบุคคลในทำนองเดียวกันอย่างมีนัยสำคัญ ด้วยวิธีอัตโนมัติเพียงลำพัง คะแนนความพร้อม สัญญาณคุณภาพ และตัวชี้วัดความเสี่ยงอธิบายองค์กร สถานประกอบการ และชุดข้อมูล ไม่ใช่บุคคล และมีลักษณะเป็นคำแนะนำที่อยู่ภายใต้การทบทวนโดยมนุษย์เสมอ",
        },
        {
          p: "**7.7 ผลลัพธ์ยังคงเป็นสิ่งที่คุณต้องตรวจ** รายงานและผลลัพธ์ให้ไว้ “ตามสภาพ” และลูกค้าที่เกี่ยวข้องรับผิดชอบแต่เพียงผู้เดียวในการทบทวน ตรวจสอบ และในกรณีที่จำเป็น ให้มีการตรวจยืนยันโดยอิสระ ก่อนนำไปใช้อ้างอิงเพื่อวัตถุประสงค์ทางกฎหมาย การค้า หรือวิชาชีพใด ๆ ตามที่อธิบายเพิ่มเติมในข้อกำหนดการใช้งาน",
        },
      ],
    },
    {
      id: "sharing",
      heading: "8. การแบ่งปันและเปิดเผยข้อมูล",
      blocks: [
        {
          p: "เราไม่ขายข้อมูลส่วนบุคคล และไม่แบ่งปันข้อมูลส่วนบุคคลเพื่อการโฆษณาของผู้อื่น เราอาจแบ่งปันข้อมูลส่วนบุคคลในกรณีดังต่อไปนี้",
        },
        {
          p: "**8.1 ผู้ประมวลผลช่วง** กับผู้ให้บริการโฮสต์และจัดเก็บข้อมูลบนคลาวด์ โครงสร้างพื้นฐาน การส่งอีเมล การเฝ้าระวังข้อผิดพลาด การวิเคราะห์ข้อมูล การรับชำระเงิน และสำหรับฟีเจอร์ทางเลือกตามข้อ 7 ผู้ให้บริการโมเดล AI โดยแต่ละรายประมวลผลข้อมูลส่วนบุคคลในนามของเราภายใต้เงื่อนไขการประมวลผลข้อมูลเป็นลายลักษณ์อักษรที่สอดคล้องกับ PDPA และ GDPR เท่าที่ใช้บังคับ",
        },
        {
          p: "**8.2 ภายในองค์กรของลูกค้า** ข้อมูลบัญชีและข้อมูลผู้ใช้ที่ได้รับอนุญาต ตลอดจนข้อมูลที่ส่งเข้าสู่บัญชีของลูกค้า จะปรากฏต่อผู้ใช้ที่ได้รับอนุญาตรายอื่นของบัญชีนั้นตามบทบาทและสิทธิ์ที่ลูกค้าตั้งค่าไว้ Certrace บังคับใช้บทบาทเหล่านั้น ส่วนลูกค้าเป็นผู้กำหนด",
        },
        {
          p: "**8.3 ตามคำสั่งของลูกค้า** ในกรณีที่ลูกค้าส่งออก แบ่งปัน หรือส่งรายงาน ชุดข้อมูล หรือเอกสาร ไปยังผู้ซื้อ ผู้นำเข้า ผู้ทวนสอบ ผู้สอบบัญชี หรือหน่วยงานกำกับดูแลของตน การเปิดเผยนั้นเป็นการกระทำของลูกค้าภายใต้ภาระของลูกค้าเอง และโดยทั่วไปก็เป็นเหตุผลที่มีการเก็บข้อมูลนั้นมาแต่ต้น",
        },
        {
          p: "**8.4 ที่ปรึกษาวิชาชีพ** กับผู้สอบบัญชี นักบัญชี ผู้รับประกันภัย และที่ปรึกษากฎหมายของเรา เท่าที่จำเป็นตามสมควรเพื่อขอคำแนะนำทางวิชาชีพหรือต่อสู้ข้อเรียกร้อง",
        },
        {
          p: "**8.5 การเปิดเผยตามกฎหมาย** กับศาล หน่วยงานกำกับดูแล หรือหน่วยงานบังคับใช้กฎหมาย เมื่อมีคำสั่งที่ชอบด้วยกฎหมาย หมายเรียก หรือหน้าที่ตามกฎหมาย ในกรณีที่กฎหมายอนุญาต เราจะแจ้งลูกค้าที่ได้รับผลกระทบก่อนเปิดเผยข้อมูลที่เราถือไว้แทนลูกค้ารายนั้น เพื่อให้ลูกค้าสามารถโต้แย้งได้",
        },
        {
          p: "**8.6 การโอนกิจการ** ในกรณีการควบรวม การเข้าซื้อกิจการ การระดมทุน หรือการขายทรัพย์สิน โดยผู้รับโอนต้องผูกพันที่จะจัดการข้อมูลส่วนบุคคลให้สอดคล้องกับนโยบายฉบับนี้ เราจะแจ้งการโอนดังกล่าวก่อนที่ข้อมูลส่วนบุคคลจะอยู่ภายใต้นโยบายที่ต่างออกไปในสาระสำคัญ",
        },
        {
          p: "**8.7 การเปลี่ยนแปลงผู้ประมวลผลช่วง** เราจัดทำรายชื่อผู้ประมวลผลช่วงที่มีนัยสำคัญและจะแจ้งเมื่อมีการเพิ่มรายใหม่ ลูกค้าสามารถคัดค้านด้วยเหตุผลด้านการคุ้มครองข้อมูลอย่างสมเหตุสมผลได้ กระบวนการและสิทธิเยียวยาระบุไว้ในข้อกำหนดการใช้งาน",
        },
      ],
    },
    {
      id: "transfers",
      heading: "9. การโอนข้อมูลข้ามพรมแดน",
      blocks: [
        {
          p: "**9.1 ข้อมูลไปที่ไหนบ้าง** Certrace ดำเนินกิจการจากประเทศไทย และโครงสร้างพื้นฐานกับผู้ประมวลผลช่วงของเราอาจจัดเก็บหรือประมวลผลข้อมูลส่วนบุคคลนอกประเทศไทย รวมถึงในสิงคโปร์ สหภาพยุโรป สหราชอาณาจักร และสหรัฐอเมริกา งาน CBAM เป็นงานข้ามพรมแดนโดยธรรมชาติ ตัวเลขของผู้ส่งออกไทยถูกอ่านโดยผู้นำเข้าในสหภาพยุโรป และบ่อยครั้งโดยผู้ทวนสอบในยุโรป",
        },
        {
          p: "**9.2 มาตรการคุ้มครอง** ในกรณีที่เราโอนข้อมูลส่วนบุคคลออกนอกประเทศไทย เราดำเนินการตามที่ PDPA กำหนดเพื่อให้แน่ใจว่าประเทศปลายทางหรือผู้รับมีมาตรฐานการคุ้มครองข้อมูลที่เพียงพอ หรือจัดให้มีมาตรการคุ้มครองที่เหมาะสม — รวมถึงข้อผูกพันด้านการคุ้มครองข้อมูลตามสัญญากับผู้ประมวลผลช่วงของเรา — ก่อนการโอน เว้นแต่มีข้อยกเว้นตามกฎหมาย สำหรับการโอนข้อมูลส่วนบุคคลออกจากเขตเศรษฐกิจยุโรปหรือสหราชอาณาจักรที่อยู่ภายใต้ GDPR เราอาศัยข้อสัญญามาตรฐานของคณะกรรมาธิการยุโรป (Standard Contractual Clauses) หรือ UK International Data Transfer Addendum พร้อมมาตรการทางเทคนิคและองค์กรเพิ่มเติมเท่าที่จำเป็น",
        },
        {
          p: "**9.3 การขอสำเนามาตรการคุ้มครอง** ลูกค้าสามารถขอสำเนากลไกการโอนที่เกี่ยวข้อง โดยปกปิดเงื่อนไขเชิงพาณิชย์ ได้โดยแจ้งมาที่ที่อยู่ตามข้อ 19",
        },
      ],
    },
    {
      id: "security",
      heading: "10. ความปลอดภัยของข้อมูล",
      blocks: [
        {
          p: "**10.1 มาตรการ** เราจัดให้มีมาตรการรักษาความปลอดภัยทางเทคนิคและองค์กรเพื่อคุ้มครองข้อมูลส่วนบุคคลจากการเข้าถึง เปลี่ยนแปลง เปิดเผย หรือทำลายโดยไม่ได้รับอนุญาต ซึ่งรวมถึงการเข้ารหัสข้อมูลระหว่างการส่ง การเข้ารหัสข้อมูลขณะจัดเก็บกับผู้ให้บริการโครงสร้างพื้นฐาน การควบคุมการเข้าถึงตามบทบาท การให้สิทธิ์บุคลากรของเราเท่าที่จำเป็นน้อยที่สุด การแฮชข้อมูลรับรอง การตั้งค่าส่วนหัวความปลอดภัย HTTP ที่เข้มงวด โทเคนสมาร์ทลิงก์ที่จำกัดขอบเขตและเพิกถอนได้ การบันทึกการเข้าถึงระบบที่ใช้งานจริง และการทบทวนผู้ให้บริการและการตั้งค่าของเราเองเป็นระยะ",
        },
        {
          p: "**10.2 ส่วนของคุณ** ไม่มีระบบใดรับประกันความปลอดภัยได้ร้อยเปอร์เซ็นต์ เราขอให้ผู้ใช้ที่ได้รับอนุญาตใช้ข้อมูลรับรองที่คาดเดายากและไม่ซ้ำ เก็บไว้กับตัว ถอดถอนเพื่อนร่วมงานที่ลาออกแล้ว และปฏิบัติต่อสมาร์ทลิงก์เสมือนจดหมายที่จ่าหน้าถึงบุคคล ไม่ใช่สิ่งที่ส่งต่อกันได้",
        },
        {
          p: `**10.3 เหตุการณ์ละเมิด** เมื่อเราทราบถึงเหตุการละเมิดข้อมูลส่วนบุคคล เราจะประเมินโดยไม่ชักช้าเกินสมควร แจ้งลูกค้าที่ได้รับผลกระทบพร้อมข้อมูลเท่าที่มีอยู่ตามสมควรเพื่อให้ลูกค้าปฏิบัติตามหน้าที่แจ้งของตนได้ และแจ้งสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล ตลอดจนหน่วยงานกำกับดูแลที่เกี่ยวข้องในกรณีที่ GDPR ใช้บังคับ เมื่อกฎหมายกำหนด ปัญหาด้านความปลอดภัยที่สงสัยสามารถแจ้งได้ที่ ${CONTACT_EMAIL} และเราจะถือเป็นเรื่องเร่งด่วน`,
        },
      ],
    },
    {
      id: "retention",
      heading: "11. ระยะเวลาการเก็บรักษาข้อมูล",
      blocks: [
        {
          p: "**11.1 ข้อมูลบัญชี** เก็บไว้ตราบเท่าที่บัญชีของลูกค้าที่เกี่ยวข้องยังใช้งานอยู่ และอีกระยะหนึ่งตามสมควรหลังจากนั้นเพื่อปฏิบัติตามภาระทางกฎหมาย บัญชี หรือการระงับข้อพิพาท จากนั้นจะถูกลบหรือทำให้ไม่ระบุตัวตน",
        },
        {
          p: "**11.2 ข้อมูลลูกค้า** เก็บรักษาและลบตามคำสั่งของลูกค้าและตามข้อกำหนดการใช้งานของเรา หลังการยุติ สิ้นสุดอายุ หรือสิ้นสุดช่วงทดลองใช้ฟรี ข้อมูลลูกค้ายังคงส่งออกได้เป็นเวลาสามสิบ (30) วัน หลังจากนั้นเราอาจลบหรือทำให้ไม่ระบุตัวตน",
        },
        {
          p: "**11.3 บันทึกการเรียกเก็บเงิน** เก็บไว้ตามระยะเวลาที่กฎหมายภาษีและบัญชีของไทยกำหนด ปัจจุบันอย่างน้อยห้า (5) ปีนับจากสิ้นรอบระยะเวลาบัญชีที่เกี่ยวข้อง",
        },
        {
          p: "**11.4 การติดต่อสื่อสารและข้อสอบถาม** เก็บไว้ไม่เกินยี่สิบสี่ (24) เดือนนับจากการติดต่อครั้งล่าสุด เว้นแต่จำเป็นต้องเก็บนานกว่านั้นเพื่อต่อสู้ข้อเรียกร้อง ใบสมัครงานเก็บไว้สิบสอง (12) เดือน — ดูข้อ 5.9",
        },
        {
          p: "**11.5 ข้อมูลบันทึกและข้อมูลวิเคราะห์** ข้อมูลบันทึกทางเทคนิคเก็บไว้ไม่เกินสิบสอง (12) เดือน สถิติแบบรวมและแบบไม่ระบุตัวตนอาจเก็บไว้ได้ไม่จำกัดเวลา เพราะไม่สามารถระบุตัวบุคคลใดได้แล้ว",
        },
        {
          p: "**11.6 บันทึกการปฏิบัติตามกฎหมายที่ปิดผนึก** เวอร์ชันที่ปิดผนึกและรายการในร่องรอยการตรวจสอบเก็บไว้ตราบเท่าที่บัญชีที่เกี่ยวข้องยังใช้งานอยู่ และตามระยะเวลาที่ลูกค้าสั่ง ซึ่งสะท้อนภาระการเก็บรักษาเอกสารหลายปีที่ CBAM และระบบที่เกี่ยวข้องกำหนดแก่คู่กรณี ดูข้อ 12",
        },
      ],
    },
    {
      id: "records",
      heading: "12. บันทึกที่ปิดผนึกและข้อจำกัดของการลบข้อมูล",
      blocks: [
        {
          p: "**12.1 ทำไมบันทึกบางอย่างจึงเปลี่ยนไม่ได้** แพลตฟอร์มปิดผนึกการส่งข้อมูลหรือรายงานโดยเก็บเวอร์ชันของชุดข้อมูลเบื้องหลังไว้อย่างไม่เปลี่ยนแปลง พร้อมค่าแฮชความสมบูรณ์และบันทึกว่าใครอนุมัติ นั่นคือแก่นของผลิตภัณฑ์ ตัวเลขที่ผู้ทวนสอบตรวจสอบได้ต้องผูกกับช่วงเวลา แหล่งที่มา และบุคคล เวอร์ชันที่ปิดผนึกและรายการตรวจสอบจึงไม่สามารถแก้ไขหรือลบบางส่วนผ่านกลไกปกติได้ ไม่ว่าโดย Certrace หรือโดยลูกค้า",
        },
        {
          p: "**12.2 ความหมายต่อคำขอให้ลบข้อมูล** ในกรณีที่คำขอเกี่ยวข้องกับข้อมูลส่วนบุคคลที่อยู่ในเวอร์ชันที่ปิดผนึกหรือรายการตรวจสอบ เราจะดำเนินการเท่าที่ทำได้และเท่าที่กฎหมายกำหนด แต่การลบข้อมูล ณ จุดนั้นอาจหมายถึงการลบทั้งเวอร์ชันแทนที่จะลบเฉพาะช่องข้อมูล ซึ่งจะทำให้หลักฐานเบื้องหลังตัวเลขที่ลูกค้าอาจมีหน้าที่ตามกฎหมายต้องเก็บรักษาหายไป การเก็บรักษาบันทึกนั้นอาจชอบด้วยกฎหมายในฐานะที่จำเป็นต่อการปฏิบัติตามกฎหมาย หรือต่อการก่อตั้ง ใช้ หรือต่อสู้สิทธิเรียกร้อง เราจะระบุว่าเหตุใดใช้บังคับในกรณีนั้น ๆ แทนที่จะปฏิเสธอย่างลอย ๆ",
        },
        {
          p: "**12.3 ข้อมูลติดต่อเป็นคนละเรื่อง** ผู้ติดต่อฝ่ายซัพพลายเออร์ที่ไม่ประสงค์จะรับคำขออีกต่อไปสามารถถูกนำออกจากคำขอในอนาคตได้โดยไม่กระทบบันทึกที่ปิดผนึกใด ๆ และคำขอเช่นว่าจะได้รับการดำเนินการโดยเร็วจากลูกค้าที่เป็นเจ้าของความสัมพันธ์นั้น",
        },
      ],
    },
    {
      id: "rights",
      heading: "13. สิทธิของคุณในฐานะเจ้าของข้อมูลส่วนบุคคล",
      blocks: [
        {
          p: "ภายใต้ข้อยกเว้นและเงื่อนไขตาม PDPA และ GDPR เท่าที่ใช้บังคับ เจ้าของข้อมูลส่วนบุคคลมีสิทธิดังนี้",
        },
        {
          ul: [
            "**สิทธิได้รับแจ้ง** เกี่ยวกับวิธีการเก็บรวบรวมและใช้ข้อมูลส่วนบุคคลของตน ซึ่งเป็นวัตถุประสงค์ของเอกสารฉบับนี้",
            "**สิทธิเข้าถึง** ข้อมูลส่วนบุคคลของตนและขอรับสำเนา",
            "**สิทธิแก้ไข** ข้อมูลส่วนบุคคลที่ไม่ถูกต้องหรือไม่ครบถ้วน",
            "**สิทธิลบหรือทำลาย** ข้อมูลส่วนบุคคล หรือระงับการใช้ข้อมูล ในกรณีที่กฎหมายกำหนด — อ่านประกอบกับข้อ 12",
            "**สิทธิคัดค้าน** การประมวลผลบนฐานประโยชน์โดยชอบด้วยกฎหมาย และคัดค้านการตลาดทางตรงได้ตลอดเวลาโดยไม่มีเงื่อนไข",
            "**สิทธิให้โอนย้ายข้อมูล** เท่าที่ทำได้ในทางเทคนิคและเมื่อการประมวลผลอาศัยฐานความยินยอมหรือสัญญา",
            "**สิทธิถอนความยินยอม** ได้ตลอดเวลาเมื่อการประมวลผลอาศัยฐานความยินยอม โดยไม่กระทบความชอบด้วยกฎหมายของการประมวลผลก่อนการถอน",
            "**สิทธิที่จะไม่ถูกตัดสินใจ** โดยอาศัยการประมวลผลอัตโนมัติเพียงลำพังซึ่งก่อผลทางกฎหมาย — ดูข้อ 7.6 และ",
            "**สิทธิร้องเรียน** ต่อหน่วยงานกำกับดูแล — ดูข้อ 18",
          ],
        },
        {
          p: `**13.1 วิธีใช้สิทธิ** สำหรับข้อมูลที่ Certrace เป็นผู้ควบคุมข้อมูล กรุณาแจ้งมาที่ ${CONTACT_EMAIL} เราจะตอบรับภายในเจ็ด (7) วัน และตอบในเนื้อหาภายในสามสิบ (30) วัน หรือแจ้งเหตุผลหากต้องใช้เวลานานกว่านั้น ไม่มีค่าธรรมเนียม เว้นแต่คำขอนั้นไม่มีมูลหรือเกินสมควรอย่างชัดเจน`,
        },
        {
          p: "**13.2 การยืนยันตัวตน** เราจะดำเนินการตามสมควรเพื่อยืนยันตัวตนของผู้ยื่นคำขอก่อนดำเนินการ เพราะการเปิดเผยข้อมูลส่วนบุคคลให้ผิดคนก็เป็นการละเมิดเช่นกัน เราจะขอเพียงเท่าที่จำเป็นที่สุดเพื่อให้มั่นใจ และจะไม่นำสิ่งที่คุณส่งมาเพื่อการยืนยันตัวตนไปใช้เพื่อการอื่น",
        },
        {
          p: "**13.3 กรณีที่เราเป็นผู้ประมวลผล** ในกรณีที่คำขอเกี่ยวกับข้อมูลที่ Certrace ทำหน้าที่เป็นผู้ประมวลผลในนามของลูกค้า — รวมถึงข้อมูลที่ผู้เข้าร่วมฝ่ายซัพพลายเออร์ส่งเข้ามา — เราจะส่งคำขอต่อหรือดำเนินการตามคำสั่งของลูกค้าที่เกี่ยวข้อง ตามข้อ 2.3 และ 4.6",
        },
      ],
    },
    {
      id: "cookies",
      heading: "14. คุกกี้และเทคโนโลยีที่คล้ายกัน",
      blocks: [
        {
          p: "เราใช้คุกกี้และเทคโนโลยีที่คล้ายกันบนแพลตฟอร์มและเว็บไซต์ของเรา เพื่อ (ก) รักษาสถานะการเข้าสู่ระบบและฟังก์ชันที่จำเป็น (ข) จดจำการตั้งค่าเช่นภาษา (ค) ทำความเข้าใจรูปแบบการใช้งานเพื่อปรับปรุงแพลตฟอร์ม และ (ง) วัดผลแคมเปญการตลาดในกรณีที่ได้รับความยินยอม คุกกี้ที่จำเป็นขาดไม่ได้สำหรับการทำงานของแพลตฟอร์มและไม่สามารถปิดได้ คุกกี้ที่ไม่จำเป็นใช้เฉพาะเมื่อได้รับความยินยอมแบบ opt-in ซึ่งถอนได้ตลอดเวลาผ่านการตั้งค่าคุกกี้บนเว็บไซต์หรือผ่านการตั้งค่าเบราว์เซอร์ เราไม่ใช้คุกกี้สร้างโปรไฟล์เพื่อการโฆษณา และไม่แบ่งปันข้อมูลที่ได้จากคุกกี้ให้เครือข่ายโฆษณา",
        },
      ],
    },
    {
      id: "minors",
      heading: "15. การใช้งานเชิงธุรกิจและผู้เยาว์",
      blocks: [
        {
          p: "แพลตฟอร์มมีไว้สำหรับการใช้งานเชิงธุรกิจโดยผู้ประกอบวิชาชีพที่บรรลุนิติภาวะซึ่งกระทำการในนามขององค์กรเท่านั้น ไม่ได้มุ่งหมายหรือมีไว้สำหรับบุคคลอายุต่ำกว่าสิบแปด (18) ปี เราไม่เก็บรวบรวมข้อมูลส่วนบุคคลจากผู้เยาว์โดยรู้เห็น หากเราทราบว่าได้เก็บรวบรวมข้อมูลดังกล่าวโดยไม่ตั้งใจ เราจะดำเนินการตามสมควรเพื่อลบข้อมูลนั้น",
        },
      ],
    },
    {
      id: "links",
      heading: "16. ลิงก์ไปยังบุคคลภายนอก",
      blocks: [
        {
          p: "แพลตฟอร์มและเว็บไซต์ของเราอาจมีลิงก์ไปยังเว็บไซต์หรือบริการของบุคคลภายนอก รวมถึงบัญชีโซเชียลของเราและบัญชี LINE Official ที่เราใช้ให้การสนับสนุน เราไม่รับผิดชอบแนวปฏิบัติด้านความเป็นส่วนตัวของบุคคลภายนอกเหล่านั้น และข้อความที่คุณส่งถึงเราผ่านบริการส่งข้อความของบุคคลภายนอกยังอยู่ภายใต้นโยบายของบริการนั้นด้วย เราขอแนะนำให้คุณอ่านนโยบายดังกล่าว",
        },
      ],
    },
    {
      id: "marketing",
      heading: "17. การสื่อสารการตลาด",
      blocks: [
        {
          p: "**17.1 เราส่งอะไรบ้าง** ข่าวสารผลิตภัณฑ์ บทความอธิบาย CBAM คำเชิญร่วมงาน และข่าวบริษัทเป็นครั้งคราว — ส่งถึงผู้ติดต่อที่ขอรับ และถึงผู้ใช้ที่ได้รับอนุญาตของลูกค้าที่ไม่ได้แจ้งยกเลิก",
        },
        {
          p: "**17.2 สิ่งที่เราไม่ทำ** เราไม่ส่งสื่อการตลาดถึงผู้เข้าร่วมฝ่ายซัพพลายเออร์เพียงเพราะเขาได้รับคำเชิญ เราไม่ขาย ให้เช่า หรือแบ่งปันข้อมูลติดต่อให้ผู้ใดเพื่อการตลาดของผู้นั้น และเราไม่ซื้อรายชื่อ",
        },
        {
          p: `**17.3 การยกเลิกรับข่าวสาร** ทุกข้อความการตลาดมีลิงก์ยกเลิกที่ใช้ได้โดยไม่ต้องเข้าสู่ระบบ หรือจะแจ้งมาที่ ${CONTACT_EMAIL} ก็ได้ การยกเลิกรับสื่อการตลาดไม่ได้หยุดข้อความบริการตามข้อ 5.4 ซึ่งเป็นส่วนหนึ่งของการทำงานของแพลตฟอร์ม`,
        },
      ],
    },
    {
      id: "complaints",
      heading: "18. การร้องเรียนและหน่วยงานกำกับดูแล",
      blocks: [
        {
          p: `หากคุณเชื่อว่าเราจัดการข้อมูลส่วนบุคคลของคุณอย่างไม่เหมาะสม กรุณาแจ้งเราก่อนที่ ${CONTACT_EMAIL} เราอยากแก้ไขมากกว่าจะได้ยินเรื่องนี้จากหน่วยงานกำกับดูแล และคำร้องเรียนจะถึงคนในทีมผู้ก่อตั้งโดยตรง ไม่ใช่คิวตั๋วอัตโนมัติ`,
        },
        {
          p: "คุณยังมีสิทธิร้องเรียนต่อหน่วยงานกำกับดูแล ในประเทศไทยคือสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.) ในเขตเศรษฐกิจยุโรปหรือสหราชอาณาจักรคือหน่วยงานกำกับดูแลของประเทศที่คุณอาศัย ทำงาน หรือที่คุณเชื่อว่าเหตุเกิดขึ้น การใช้สิทธินี้ไม่ขึ้นกับว่าคุณได้ติดต่อเรามาก่อนหรือไม่",
        },
      ],
    },
    {
      id: "changes",
      heading: "19. การเปลี่ยนแปลงนโยบายฉบับนี้",
      blocks: [
        {
          p: "เราอาจปรับปรุงนโยบายฉบับนี้เป็นครั้งคราวเพื่อสะท้อนการเปลี่ยนแปลงในแนวปฏิบัติของเรา ผู้ประมวลผลช่วงของเรา หรือกฎหมายที่ใช้บังคับ เราจะปรับวันที่ “อัปเดตล่าสุด” ที่ด้านบน และสำหรับการเปลี่ยนแปลงในสาระสำคัญ จะแจ้งผ่านแพลตฟอร์มหรือทางอีเมลก่อนการเปลี่ยนแปลงมีผล การใช้งานแพลตฟอร์มต่อไปหลังการแจ้งดังกล่าวถือเป็นการรับทราบนโยบายฉบับปรับปรุง ในกรณีที่การเปลี่ยนแปลงต้องได้รับความยินยอมตามกฎหมาย เราจะขอความยินยอมแทนที่จะสันนิษฐานเอาเอง",
        },
      ],
    },
    {
      id: "contact",
      heading: "20. ติดต่อเรา",
      blocks: [
        {
          p: `สำหรับคำถาม คำขอ หรือข้อร้องเรียนเกี่ยวกับนโยบายฉบับนี้หรือแนวปฏิบัติด้านการประมวลผลข้อมูลของเรา กรุณาติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลของเราที่ **${CONTACT_EMAIL}** Certrace ดำเนินกิจการจากกรุงเทพมหานคร ประเทศไทย เขียนมาเป็นภาษาไทยหรือภาษาอังกฤษก็ได้ตามถนัด`,
        },
      ],
    },
  ],
};
