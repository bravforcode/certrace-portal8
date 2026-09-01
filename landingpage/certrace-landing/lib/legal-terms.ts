import { CONTACT_EMAIL } from "./content";
import type { LegalDoc } from "./legal";

/* ════════════════════════════════════════════════════════════
   THE TERMS OF SERVICE

   WHAT THIS REVISION DID. The previous text was a competent generic B2B SaaS
   agreement that happened to mention CBAM. It did not describe the product
   that actually exists, and the gaps were the expensive kind: nothing about
   Smart Links (through which people who are not the Customer, hold no account
   and sign nothing put data into the Platform), nothing about the AI features,
   nothing about the sealed versions and audit trail the whole product is built
   to produce, and no clause saying plainly that an exporter is not the CBAM
   declarant and Certrace does not file anything with the EU.

   Every one of those is a liability surface. A supplier's data arriving
   through a link nobody signed for; a figure an extraction model proposed and
   a human accepted; a report a buyer's verifier later rejects; a customer who
   believed the annual declaration had been filed on their behalf. The
   sections below name each of them, say who is responsible, and cap what
   Certrace can be held to.

   THE SECTIONS IT GAINED: 5 (regulatory standing), 7 (metering, caps and the
   trial), 8 (suppliers and Smart Links), 10 (AI and automated processing),
   12 (records, versions and the audit trail), 19 (beta features, lifted out
   of §4 and expanded), 25 (export control and sanctions).

   ANCHOR IDS ARE STABLE. Section numbers moved; every `id` that existed
   before still exists and still points at the same subject, because the
   contents rail and any external deep link depend on them. New sections carry
   new ids. Do not renumber an id to match its heading.

   Written to be read. The clauses are ordinary contract prose, but the lede
   and the headings are in the same voice as the rest of the site: an exporter
   who is going to be bound by this should be able to get through it.
   ════════════════════════════════════════════════════════════ */

export const TERMS_EN: LegalDoc = {
  eyebrow: "LEGAL",
  title: "Certrace Terms of Service",
  effectiveLabel: "Effective Date",
  effective: "1 September 2026",
  updatedLabel: "Last Updated",
  updated: "1 September 2026",
  lede: "These Terms govern your access to and use of the Certrace platform. Please read them carefully — they form a binding agreement between your organisation and Certrace, and they set out what the Platform does, what it deliberately does not do, and who is responsible for what.",
  contentsLabel: "ON THIS PAGE",
  sections: [
    {
      id: "introduction",
      heading: "1. Introduction and Acceptance of Terms",
      blocks: [
        {
          p: "These Terms of Service (the “Terms”) constitute a legally binding agreement between Certrace, a company operating in Bangkok, Thailand (the “Company,” “Certrace,” “we,” “us,” or “our”), and the business entity, organization, or individual acting on behalf of a business entity that registers for, accesses, or uses the Certrace platform (the “Customer,” “you,” or “your”).",
        },
        {
          p: "The Company provides a business-to-business (“B2B”) software-as-a-service platform for environmental, social, and governance (“ESG”) data management and Carbon Border Adjustment Mechanism (“CBAM”) compliance support (the “Platform” or “Services”), as further described in Section 4 and bounded by Section 5.",
        },
        {
          p: "By (a) creating an account, (b) executing an Order Form (as defined below) that references these Terms, (c) clicking “I Agree” or a similar affirmation, (d) commencing a free trial, or (e) otherwise accessing or using the Platform, the Customer — and the individual accepting on the Customer’s behalf — represent that they have the authority to bind the Customer to these Terms, and the Customer agrees to be bound by these Terms and the Certrace Privacy Policy, which is incorporated herein by reference. If the Customer does not agree to these Terms, the Customer must not access or use the Platform.",
        },
        {
          p: "The Platform is designed for business use by corporate personnel and is not intended for use by consumers or by individuals under eighteen (18) years of age. Each individual accessing the Platform on Customer’s behalf represents that they are at least eighteen (18) years old and are acting within the scope of their employment or engagement with Customer.",
        },
        {
          p: "**Supplier Participants.** Certain third parties — typically Customer’s suppliers and their own upstream suppliers — may submit data through a Smart Link without holding an account and without executing an Order Form. Their use is governed by Section 8 and by the notice presented to them at the point of submission. Nothing in these Terms makes such a party a Customer, and nothing in these Terms is intended to confer rights on them except as expressly stated in Section 8.",
        },
        {
          p: "The Company reserves the right to modify these Terms at any time, provided that for Customers under an active paid Subscription Term, material changes adverse to Customer will not take effect until Customer’s next renewal, unless required sooner to comply with applicable law. The Company will provide notice of material changes by updating the “Last Updated” date and, where reasonably practicable, by direct notice (e.g., email or in-Platform notice). Continued use of the Platform after the effective date of such modifications constitutes acceptance of the revised Terms.",
        },
        {
          p: "Where Certrace and Customer have executed a separate signed master subscription agreement, order form, data processing addendum, or enterprise agreement that expressly references and is intended to supersede these Terms, that signed agreement governs to the extent of any conflict.",
        },
      ],
    },
    {
      id: "definitions",
      heading: "2. Definitions",
      blocks: [
        {
          ul: [
            "**“Authorized User”** means an individual employee, contractor, or agent of Customer who is authorized by Customer to access and use the Platform under Customer’s account, and to whom a unique login credential and a Seat have been issued.",
            "**“CBAM”** means the Carbon Border Adjustment Mechanism established under Regulation (EU) 2023/956, as amended, together with the implementing and delegated acts adopted under it, and any equivalent, successor, or related carbon border or emissions-reporting regime.",
            "**“CBAM Declarant”** means the party that, under applicable EU law, holds authorised CBAM declarant status and is legally entitled and obliged to submit the CBAM declaration and surrender CBAM certificates. Certrace is never the CBAM Declarant, and, in the ordinary case addressed by these Terms, neither is Customer — see Section 5.",
            "**“Customer Data”** means all data, files, records, and information — including production data, activity data, emissions data, energy and fuel data, precursor and supply-chain information, Evidence Documents, supplier and installation information, and procurement records — that Customer, its Authorized Users, or a Supplier Participant acting on a Smart Link issued from Customer’s account submit, upload, or transmit to the Platform, excluding Certrace’s own Platform-generated calculations, models, and Reports.",
            "**“Evidence Document”** means any document uploaded to the Platform in support of a data point, including utility and fuel invoices, meter and instrument logs, ERP exports, laboratory and mill test reports, calibration records, carbon-price receipts, and supplier communication templates.",
            "**“Order Form”** means an ordering document, subscription agreement, quotation, or online checkout flow specifying the subscription plan, fees, Subscription Term, Plan Caps, and other commercial terms agreed between Certrace and Customer, which incorporates these Terms by reference.",
            "**“Plan Caps”** means the quantitative limits attached to a subscription tier, including the number of CN codes, production sites or installations, concurrently open reporting years, and Seats, as set out in the applicable Order Form and described on the Certrace pricing page.",
            "**“Platform” or “Services”** means Certrace’s proprietary software-as-a-service platform, including web applications, dashboards, calculation engines, Smart Links, automated and AI-assisted features, application programming interfaces (“APIs”), and related documentation and support, made available to Customer.",
            "**“Report” or “Output”** means any calculation, dashboard, readiness assessment, monitoring methodology documentation, verifier pack, evidence register, communication-template file, XML or other structured export, ESG scorecard, CBAM emissions report, or other output generated by the Platform based on Customer Data.",
            "**“Seat”** means one Authorized User licence under the applicable Order Form.",
            "**“Smart Link”** means a tokenised, account-free web address issued from Customer’s account through which a Supplier Participant is invited to submit data, documents, or a signature to the Platform.",
            "**“Supplier Participant”** means a third party — including Customer’s suppliers, their upstream suppliers, installation operators, and their personnel — who accesses the Platform through a Smart Link.",
            "**“Subscription Term”** means the period during which Customer is entitled to access the Platform, as specified in the applicable Order Form, including any free trial period.",
            "**“Sub-processor”** means a third party engaged by Certrace to process Customer Data or Personal Data on Certrace’s behalf in connection with providing the Services.",
            "**“Confidential Information”** has the meaning given in Section 15.",
            "**“Personal Data”** has the meaning given under the Personal Data Protection Act B.E. 2562 (2019) of Thailand (“Thai PDPA”) and, where applicable to the processing in question, Regulation (EU) 2016/679 (“GDPR”).",
            "**“Material Breach”** means a severe violation of these Terms, explicitly including fraudulent activity, non-payment, intellectual property infringement, unauthorized disclosure of Confidential Information, circumvention of Plan Caps or access controls, or violation of the Acceptable Use Policy in Section 13.",
          ],
        },
      ],
    },
    {
      id: "eligibility",
      heading: "3. Eligibility and Account Registration",
      blocks: [
        {
          p: "**3.1 Business Use Only.** The Platform is offered solely for business-to-business use. Customer must be a duly organized and validly existing business entity (or a natural person acting in a business capacity, such as a sole proprietor) with the authority to enter into these Terms.",
        },
        {
          p: "**3.2 Account Creation.** Customer will designate one or more Authorized Users, including at least one account owner, and agrees to provide accurate, current, and complete registration information — including its legal entity name, registration number, and, where it exports into the European Union, the identifiers required to produce a usable communication template — and to keep that information up to date.",
        },
        {
          p: `**3.3 Account Security.** Customer is responsible for maintaining the confidentiality of all Authorized User login credentials and for all activities occurring under its account, whether or not authorized by Customer. Customer must notify Certrace promptly at ${CONTACT_EMAIL} upon becoming aware of any unauthorized access to or use of its account, or of any Smart Link having been forwarded to or accessed by a party Customer did not intend to invite.`,
        },
        {
          p: "**3.4 Roles and Internal Permissions.** The Platform provides role-based access control, allowing Customer to distinguish between account owners, ordinary members, and legal or compliance reviewers. Customer is solely responsible for assigning, reviewing, and revoking those roles, for ensuring that each Authorized User holds only the access their function requires, and for removing Authorized Users who leave Customer’s organisation. Certrace enforces the roles Customer configures; it does not decide who inside Customer’s organisation ought to hold them.",
        },
        {
          p: "**3.5 Seats Are Personal.** A Seat identifies one named individual. Credentials must not be shared between individuals, and a Seat must not be operated as a shared or generic account.",
        },
      ],
    },
    {
      id: "services",
      heading: "4. Description of the Services",
      blocks: [
        {
          p: "**4.1 Overview.** The Platform provides tools to help Customer collect, organize, calculate, evidence, and hand over ESG- and emissions-related data relevant to CBAM and related sustainability reporting obligations. Depending on the subscription tier and the configuration Customer chooses, this includes: issuing Smart Links to suppliers and installation operators; structured monthly and annual data collection; modelling of precursor and supply-chain relationships across multiple tiers; automated quality, completeness and plausibility checks; deterministic embedded-emissions calculation under sector rules; readiness assessment against verification requirements; evidence management; carbon-cost and benchmark analysis; and the generation of Reports and Outputs described in Section 11.",
        },
        {
          p: "**4.2 Not an Accredited Verifier.** CBAM and related regulatory frameworks generally require certain emissions data to be verified by an independent, accredited verification body before it may be relied upon. Certrace is a software provider. It is not an accredited verifier under EN ISO 14065, under CBAM, or under any other regulatory scheme; it does not perform verification; and it does not issue verification opinions. Reports and Outputs generated by the Platform are preparatory and informational tools that are intended to make an independent verification engagement faster and better evidenced. They do not substitute for that engagement, for a customs declaration, or for a regulatory filing. Customer remains solely responsible for engaging any accredited verifier, customs representative, or other professional required by applicable law.",
        },
        {
          p: "**4.3 Reference Data and Regulatory Change.** The Platform incorporates reference data — including CN code and aggregated goods classifications, sector rules, default values, emission and calorific factors, grid factors, and carbon price references — derived from published regulatory and standards sources. That reference data is maintained on a commercially reasonable basis. Regulatory instruments, implementing acts, and published default values change, sometimes with short notice and sometimes with retroactive effect. Certrace endeavours to keep the Platform current but does not warrant that the Platform reflects the most current requirements at every moment, and Customer remains responsible for satisfying itself that the basis of a filing is correct at the time it is made.",
        },
        {
          p: "**4.4 Changes to the Services.** Certrace may modify, update, or discontinue features of the Platform from time to time, provided that Certrace will not materially reduce the core functionality of the Services purchased under an active Order Form during the applicable Subscription Term without reasonable notice or a comparable replacement feature.",
        },
        {
          p: "**4.5 Customer’s Operational Responsibilities.** The Platform is a system of record and calculation; it is not a substitute for Customer’s own monitoring, metering, and internal control. Customer is responsible for installing, operating, calibrating and maintaining the measurement infrastructure from which its data originates, for the completeness and accuracy of what it and its suppliers enter, for meeting its own and its counterparties’ deadlines, and for retaining underlying records for the periods applicable law requires of it.",
        },
      ],
    },
    {
      id: "scope-limits",
      heading: "5. Regulatory Standing: What Certrace Does Not Do",
      blocks: [
        {
          p: "This Section is the one Customer should read twice. It describes limits that are structural rather than commercial, and it does not change with the subscription tier.",
        },
        {
          p: "**5.1 Certrace Does Not File Anything.** Certrace does not submit, and cannot submit, any declaration, report, or registration to the European Commission, to the CBAM Registry, to any EU member state competent authority or customs authority, to the Thai government, or to any other regulator, on Customer’s behalf or on any party’s behalf. No feature of the Platform constitutes a filing. Where an Output is described as “ready”, that describes the completeness of the document against the applicable template — not that anything has been submitted to anyone.",
        },
        {
          p: "**5.2 The Exporter Is Not the CBAM Declarant.** Under the definitive CBAM regime, only a party established in the European Union that holds authorised CBAM declarant status — in practice the importer or its indirect customs representative — may lodge the CBAM declaration and surrender certificates. A non-EU exporter, producer, or installation operator has no standing to make that filing. Certrace is built for that party: its purpose is to produce a defensible dataset and the accompanying documentation that the CBAM Declarant, and any verifier engaged in relation to it, can rely on. Any Customer that believes it is itself the CBAM Declarant must obtain its own legal advice on that question; the Platform does not determine it.",
        },
        {
          p: "**5.3 No Professional Advice.** Nothing produced by, contained in, or arising out of the Platform — including guidance text, readiness indicators, risk flags, benchmark comparisons, cost estimates, checklists, and the explanatory material published on Certrace’s website — constitutes legal, customs, tax, accounting, engineering, actuarial, or other professional advice, or an opinion on Customer’s regulatory position. Customer must not treat it as a substitute for advice from a qualified adviser retained by Customer.",
        },
        {
          p: "**5.4 No Guarantee of Outcome.** Certrace does not warrant, and expressly disclaims any representation, that use of the Platform will result in CBAM or other regulatory compliance, in the acceptance of any Report or Output by a verifier, buyer, importer, auditor, competent authority, or court, in the avoidance of penalties, adjustments, default-value markups, or carbon costs, or in the retention of any commercial relationship. Determinations of compliance are made by third parties applying their own judgement to Customer’s own facts.",
        },
        {
          p: "**5.5 No Fiduciary or Advisory Relationship.** These Terms create a software licensing relationship and nothing more. Certrace does not act as Customer’s agent, adviser, representative, or fiduciary, and does not assume any duty of care beyond the obligations expressly stated in these Terms.",
        },
      ],
    },
    {
      id: "fees",
      heading: "6. Subscription Plans, Orders, and Fees",
      blocks: [
        {
          p: "**6.1 Order Forms.** Customer’s access to the Platform is governed by the applicable Order Form, which specifies the subscription tier, the Plan Caps including the number of Seats, fees, billing frequency, and Subscription Term.",
        },
        {
          p: "**6.2 Quoted, Not Listed.** Certrace publishes its plan structure and Plan Caps but not its prices. A quotation is scoped on Customer’s actual CN codes, production sites, and reporting scope. A quotation is an offer capable of acceptance only for the period and on the terms stated in it, and is not a representation about future pricing.",
        },
        {
          p: "**6.3 Fees and Payment.** Customer agrees to pay all fees specified in the applicable Order Form. Unless otherwise stated, fees are quoted and payable in Thai Baht (THB), exclusive of applicable value-added tax (“VAT”) and withholding tax, which shall be borne by Customer in addition to the stated fees unless a valid exemption applies. Where Certrace agrees to invoice in another currency, the applicable exchange basis will be stated in the Order Form.",
        },
        {
          p: "**6.4 Invoicing and Late Payment.** Unless otherwise agreed in an Order Form, invoices are due within thirty (30) days of the invoice date. Certrace may charge interest on overdue amounts at the maximum rate permitted by applicable law, and may suspend Customer’s access for undisputed amounts unpaid more than fifteen (15) days after written notice of non-payment. Customer must raise any good-faith dispute over an invoice within twenty (20) days of the invoice date, and must pay the undisputed portion when due.",
        },
        {
          p: "**6.5 Auto-Renewal.** Unless otherwise specified in the applicable Order Form, Subscription Terms automatically renew for successive periods equal to the expiring term, at Certrace’s then-current fees, unless either party gives written notice of non-renewal at least thirty (30) days before the end of the then-current term.",
        },
        {
          p: "**6.6 Plan Changes.** Customer may upgrade its subscription tier at any time during a Subscription Term, with fees prorated for the remainder of the term. Downgrades take effect at the next renewal, so that a reporting year already in progress is not re-scoped underneath Customer part-way through it.",
        },
        {
          p: "**6.7 Taxes.** Each party is responsible for its own income, franchise, and similar taxes based on its own net income. Fees are exclusive of VAT and other applicable indirect taxes, which Certrace will invoice where required by law.",
        },
        {
          p: "**6.8 Refunds.** Except as expressly stated in an Order Form or required by applicable law, fees are non-refundable and non-creditable, including where Customer ceases to use the Platform, exceeds or fails to use its Plan Caps, or terminates before the end of a Subscription Term.",
        },
      ],
    },
    {
      id: "metering",
      heading: "7. Metering, Plan Caps, and the Free Trial",
      blocks: [
        {
          p: "**7.1 How the Platform Is Metered.** Subscription tiers are metered principally on the number of distinct eight-digit CN codes Customer maintains, together with the number of production sites or installations, the number of reporting years open concurrently, and the number of Seats. Measures are derived from Customer’s live configuration rather than stored as a separate counter; archiving a workspace or closing a reporting year releases the capacity it held.",
        },
        {
          p: "**7.2 Suppliers Are Not Metered.** Supplier Participants are unlimited and are not charged, on every tier. They consume no Seat and require no account. Certrace reserves the right to apply reasonable technical limits against abusive or automated use of Smart Links, and to decline to issue Smart Links at a volume inconsistent with Customer’s stated operations.",
        },
        {
          p: "**7.3 Caps Warn Before They Block.** Certrace does not interrupt work that is already under way because a cap has moved: exceeding a cap does not delete data, close a reporting year, or invalidate a Report. Where Customer reaches a cap, the Platform will say so and may decline the creation of a new unit of scope — a new site, a new reporting year, a new CN code, or a new Seat — until the applicable tier is changed. Customer must not circumvent Plan Caps, including by operating multiple accounts to divide a single operation, by sharing Seats, or by any technical means.",
        },
        {
          p: "**7.4 Free Trial.** Certrace may offer a free trial, ordinarily of thirty (30) days and at enterprise-level capacity, so that the Platform can be evaluated against Customer’s real supply chain rather than sample data. Certain features may be withheld during a trial. Unless a paid Order Form is executed before it expires, at the end of a trial Customer’s account becomes read-only: Customer retains access to view and export what it entered for the period described in Section 9.5, but may not create or modify records.",
        },
        {
          p: "**7.5 Trials Carry No Warranty.** NOTWITHSTANDING ANY OTHER PROVISION OF THESE TERMS, THE PLATFORM IS PROVIDED DURING A FREE TRIAL “AS IS” AND WITHOUT WARRANTY, SUPPORT COMMITMENT, OR SERVICE LEVEL OF ANY KIND, AND CERTRACE’S TOTAL AGGREGATE LIABILITY ARISING FROM OR RELATING TO A FREE TRIAL SHALL NOT EXCEED ONE THOUSAND THAI BAHT (THB 1,000). Customer should not rely on a trial account as its sole record of anything.",
        },
      ],
    },
    {
      id: "suppliers",
      heading: "8. Suppliers and Smart Links",
      blocks: [
        {
          p: "**8.1 What a Smart Link Is.** A Smart Link is a tokenised web address, issued from Customer’s account, that allows a named Supplier Participant to submit specified data, documents, or a signature to Customer’s workspace without creating an account. It exists because the party that holds the emissions data is usually not the party that holds the subscription, and requiring that party to register was, in practice, the single largest reason data never arrived.",
        },
        {
          p: "**8.2 Customer Issues Them, and Customer Owns the Relationship.** Customer decides which Supplier Participants to invite, what to ask them for, and when. Customer represents and warrants that it has a legitimate business relationship with each Supplier Participant it invites, that it has the right to request the data it requests, and that it has provided each individual whose Personal Data it enters (including supplier contact names, email addresses, and telephone numbers) with any notice, and obtained any consent, required by applicable data protection law. Certrace has no relationship with, and gives no undertaking to, a Supplier Participant beyond the notice presented at the point of submission and the obligations Certrace owes as a processor under the Privacy Policy.",
        },
        {
          p: "**8.3 Custody of Links.** A Smart Link is an addressed invitation, not a credential of Customer’s account: it grants access only to the specific request it was minted for, and grants no access to Customer’s account, to other workspaces, or to other suppliers’ submissions. It can nevertheless be forwarded by its recipient. Customer is responsible for the addresses it sends links to and must notify Certrace promptly if a link is known or suspected to have reached an unintended party, so that it can be revoked and re-issued.",
        },
        {
          p: "**8.4 Data Submitted by Others Is Customer Data.** Data, documents, and signatures submitted by a Supplier Participant through a Smart Link issued from Customer’s account are Customer Data for the purposes of these Terms, and Customer’s obligations and warranties in Section 9 apply to them. Certrace does not independently verify what a Supplier Participant submits, does not confirm the identity of the individual who submits it, and does not undertake that a submission was made by, or with the authority of, the entity to which the link was addressed.",
        },
        {
          p: "**8.5 Free, and Provided As Is.** Access through a Smart Link is provided free of charge, to Supplier Participants, “as is” and without warranty of any kind. Certrace’s total aggregate liability to any Supplier Participant, in contract, tort, or otherwise, arising out of or relating to that access shall not exceed one thousand Thai Baht (THB 1,000). Customer will indemnify Certrace in accordance with Section 22.2 against claims brought by a Supplier Participant it invited.",
        },
        {
          p: "**8.6 Reuse Across Requests.** Where a Supplier Participant’s answers are retained so they can be pre-filled into a later request, that retention is on Customer’s instruction and within Customer’s workspace. Certrace does not disclose one Customer’s supplier submissions to another Customer, and does not operate a shared supplier database across Customers.",
        },
      ],
    },
    {
      id: "customer-data",
      heading: "9. Customer Data; License and Ownership",
      blocks: [
        {
          p: "**9.1 Ownership.** As between the parties, Customer retains all right, title, and interest in and to Customer Data. Nothing in these Terms transfers ownership of Customer Data to Certrace.",
        },
        {
          p: "**9.2 License to Certrace.** Customer grants Certrace a worldwide, non-exclusive, royalty-free license to host, store, process, transmit, and use Customer Data solely to (a) provide, maintain, secure, troubleshoot, and improve the Platform and Services for Customer, and (b) generate Reports and Outputs on Customer’s behalf. Certrace will not sell Customer Data, and will not use Customer Data to train foundational or third-party machine-learning models made available to any party other than Customer. Certrace contracts with its AI Sub-processors on terms that prohibit them from training their models on Customer Data — see Section 10.",
        },
        {
          p: "**9.3 Aggregated and De-Identified Data.** Certrace may generate aggregated or de-identified statistics derived from Customer Data (for example, sector benchmarks and distribution ranges) that do not identify Customer, any Supplier Participant, any installation, or any individual, and may use and share such aggregated data for research, product improvement, and industry benchmarking. Certrace will not publish an aggregate that could reasonably be resolved back to a single Customer or installation.",
        },
        {
          p: "**9.4 Customer Data Warranty.** Customer represents and warrants that (a) it has all necessary rights, consents, and authority to submit Customer Data to the Platform — including data originating from Supplier Participants — and to grant the license in Section 9.2, (b) Customer Data does not infringe any third-party right or violate applicable law, and (c) Customer Data is, to the best of Customer’s knowledge, accurate and complete. Certrace does not independently verify the accuracy or completeness of Customer Data, and Customer is solely responsible for it. A calculation is only as sound as the figures it is performed on.",
        },
        {
          p: "**9.5 Data Export and Deletion.** During the Subscription Term, Customer may export Customer Data through the Platform’s standard export functionality. Upon termination or expiration of the Subscription Term, or at the end of a free trial, Certrace will make Customer Data available for export for thirty (30) days, after which Certrace may delete or anonymize Customer Data in accordance with its data retention practices and the Certrace Privacy Policy. Customer is responsible for taking that export. Certrace is not a system of record for Customer’s statutory retention obligations, and Customer must not rely on the Platform as its sole archive.",
        },
        {
          p: "**9.6 Prohibited Content.** Customer must not upload to the Platform any special categories of personal data, health data, biometric data, payment card data, government identity documents, or classified or export-controlled technical data, except where expressly agreed in writing with Certrace in advance. Emissions and production records do not require any of these, and the Platform is not configured to protect them at the standard those categories demand.",
        },
      ],
    },
    {
      id: "ai",
      heading: "10. Automated Processing and AI Features",
      blocks: [
        {
          p: "**10.1 What Is Automated.** The Platform applies automated processing at several points, including: deterministic validation, unit standardisation, and plausibility checks on submitted data; deterministic calculation of embedded emissions under sector rules; readiness and completeness scoring; and, where Customer enables it, AI-assisted extraction of values from Evidence Documents and AI-assisted summarisation of changes, risks, and data quality.",
        },
        {
          p: "**10.2 Extraction Only Ever Proposes.** Where AI-assisted extraction is enabled, extracted values are presented as proposals with a confidence indication, and are written into Customer’s record only when an Authorized User accepts them. Certrace does not silently populate a field from a document. This is a deliberate design constraint rather than a temporary limitation: the evidentiary value of an emissions figure depends on a human having tied it to a source document, and an automatically populated field destroys precisely the traceability a verifier tests.",
        },
        {
          p: "**10.3 AI Output Is Probabilistic.** Outputs of AI-assisted features may be incomplete, inaccurate, or wrong in ways that are not obvious, including where they appear confident. Customer must review every proposed value against the underlying document before accepting it. Once accepted, a value is Customer Data and Customer is responsible for it, whatever proposed it. Certrace does not warrant the accuracy of any AI-assisted output and, to the maximum extent permitted by applicable law, disclaims all liability arising from Customer’s acceptance of, or reliance on, one.",
        },
        {
          p: "**10.4 AI Sub-processors, and Turning It Off.** AI-assisted features may transmit the relevant document or data extract to a third-party model provider engaged as a Sub-processor. Those features are optional and are not enabled by default; the Platform is fully usable with them switched off, and Customer may disable them at any time. The current AI Sub-processors, and the terms on which they are engaged — including that Customer Data is not used to train their models — are described in the Privacy Policy.",
        },
        {
          p: "**10.5 No Automated Decision-Making with Legal Effect.** Certrace does not use the Platform to take decisions producing legal effects concerning, or similarly significantly affecting, any individual. Scores, flags, and readiness indicators are addressed to organisations and installations, are advisory, and are always subject to human review by Customer.",
        },
        {
          p: "**10.6 Customer-Supplied Model Credentials.** Where the Platform permits Customer to supply its own credentials for a third-party model provider, Customer is responsible for those credentials, for the terms of its own agreement with that provider, and for all charges incurred under them. Certrace is not a party to that relationship.",
        },
      ],
    },
    {
      id: "reports",
      heading: "11. Reports, Outputs, and Disclaimer of Regulatory Advice",
      blocks: [
        {
          p: "**11.1 Informational Purpose Only.** All Reports and Outputs, and all recommendations, benchmarks, readiness indicators, risk flags, cost estimates, or scoring generated by the Platform, are provided on an “as-is” basis for informational purposes only. They do not constitute legal, customs, tax, accounting, engineering, or other professional or regulatory advice, and they are not a verification opinion.",
        },
        {
          p: "**11.2 No Guarantee of Regulatory Acceptance.** Certrace does not warrant that any Report or Output will be accepted by the European Commission, any EU member state customs or competent authority, any CBAM Declarant, any buyer, any accredited verifier, the Thai government, or any other body, nor that use of the Platform will result in CBAM compliance, avoidance of penalties or default-value markups, or any other specific outcome. See Section 5.",
        },
        {
          p: "**11.3 Customer’s Responsibility to Verify.** Customer is solely responsible for reviewing, verifying, and, where required, obtaining independent accredited verification of all Reports and Outputs prior to submission to any regulator, customs authority, importer, business partner, or other third party, and for the ultimate content of any official filing made in reliance on them.",
        },
        {
          p: "**11.4 Draft and Sealed States.** The Platform distinguishes between work in progress and work that has been signed off, and marks incomplete Outputs accordingly. A document bearing a draft marking must not be presented to a third party as a final position. Removing, obscuring, or altering a draft marking, a version identifier, a dataset hash, or a sign-off record on an Output is a Material Breach.",
        },
        {
          p: "**11.5 Estimates Are Estimates.** Carbon cost, certificate cost, exposure, and savings figures produced by the Platform are modelled estimates based on published reference prices and Customer’s own data at a moment in time. They are not quotations, valuations, forecasts, or financial advice, they will change, and they must not be presented to any third party — including any investor, lender, or auditor — as a determined liability.",
        },
      ],
    },
    {
      id: "records",
      heading: "12. Records, Versions, and the Audit Trail",
      blocks: [
        {
          p: "**12.1 Immutability by Design.** Where the Platform seals a submission or a Report, it retains an immutable version of the underlying dataset together with an integrity hash and a record of who approved it and when. Customer acknowledges that this is a deliberate feature and that sealed versions and audit records cannot be edited or selectively deleted through the Platform’s ordinary controls, including by Customer.",
        },
        {
          p: "**12.2 Deletion Requests Against Sealed Records.** Where Customer or a data subject requests deletion of information contained in a sealed version or audit record, Certrace will comply to the extent it is able and applicable law requires, but Customer acknowledges that the integrity of a compliance record is itself a legitimate interest and a legal-obligation basis for retention, and that satisfying such a request may require the deletion of an entire version rather than a field within it. See the Privacy Policy for how this is handled.",
        },
        {
          p: "**12.3 Sign-Off and Segregation of Duties.** Where Customer configures sign-off, four-eyes review, or approval chains, the Platform records the identity of each approver as authenticated by Customer’s own account controls. Certrace does not authenticate the legal authority of an approver within Customer’s organisation, and an approval recorded in the Platform is Customer’s act.",
        },
        {
          p: "**12.4 Statutory Retention Is Customer’s.** CBAM and related regimes impose record retention obligations on the party filing and on operators. Those obligations are Customer’s, run for periods that may exceed Customer’s Subscription Term, and are not discharged by data being held in the Platform. See Sections 4.5 and 9.5.",
        },
      ],
    },
    {
      id: "acceptable-use",
      heading: "13. Acceptable Use Policy",
      blocks: [
        { p: "Customer shall not, and shall ensure its Authorized Users do not:" },
        {
          ul: [
            "(a) submit data, credentials, documents, or information that Customer does not have the right to submit, or that is knowingly false, fraudulent, backdated, or misleading, or misrepresent the source, period, or installation to which data relates;",
            "(b) use the Platform to build or offer a competing product or service, or to benchmark the Platform for competitive purposes, without Certrace’s prior written consent;",
            "(c) use automated means (bots, scrapers, or similar) to access or extract data from the Platform other than through Certrace’s supported APIs, or attempt to enumerate, guess, or brute-force Smart Link tokens or any other identifier;",
            "(d) attempt to reverse engineer, decompile, or discover the source code, algorithms, reference datasets, or underlying models of the Platform, except to the extent such restriction is prohibited by applicable law;",
            "(e) probe, scan, or test the vulnerability of the Platform, or breach or circumvent any authentication, rate limiting, or Plan Cap, except under a written authorisation from Certrace;",
            "(f) upload or transmit malicious code, viruses, or content that is unlawful, defamatory, or infringes third-party intellectual property or privacy rights;",
            "(g) alter, remove, or obscure a draft marking, version identifier, dataset hash, sign-off record, or audit entry on any Output, or present a draft as a final position;",
            "(h) share Authorized User login credentials with any individual not authorized to hold that credential, or resell, sublicense, or provide third-party access to the Platform without Certrace’s prior written consent — noting that inviting a Supplier Participant through a Smart Link is expressly permitted and is not third-party access for this purpose; or",
            "(i) use the Platform in a manner that violates applicable export control, sanctions, anti-bribery, or anti-corruption laws.",
          ],
        },
        {
          p: "Certrace reserves the right to investigate suspected violations and to suspend or terminate access in accordance with Section 20.",
        },
      ],
    },
    {
      id: "ip",
      heading: "14. Intellectual Property Rights",
      blocks: [
        {
          p: "**14.1 Certrace IP.** As between the parties, Certrace and its licensors retain all right, title, and interest in and to the Platform, including its software, calculation methodologies, reference and emissions-factor libraries, classification mappings, templates, document layouts, algorithms, prompts, user interface, and all related intellectual property rights. These Terms grant Customer no ownership interest in the Platform.",
        },
        {
          p: "**14.2 License to Customer.** Subject to Customer’s compliance with these Terms and payment of applicable fees, Certrace grants Customer a limited, non-exclusive, non-transferable, non-sublicensable, revocable license, during the Subscription Term, to access and use the Platform and to download, display, and distribute Reports and Outputs for Customer’s own business and regulatory-compliance purposes, including sharing them with Customer’s own customers, importers, verifiers, auditors, and regulators as necessary. That distribution right survives termination in respect of Outputs generated during the Subscription Term.",
        },
        {
          p: "**14.3 Feedback.** If Customer or an Authorized User provides suggestions, feature requests, defect reports, or other feedback regarding the Platform, Certrace may use, incorporate, and commercialise that feedback without restriction, attribution, or compensation, and Customer assigns to Certrace any rights it may hold in it.",
        },
        {
          p: "**14.4 Attribution and Marks.** Neither party may use the other’s name, logo, or trade marks without prior written consent, except that Certrace may identify Customer as a customer in its ordinary business materials unless Customer notifies Certrace in writing that it objects.",
        },
      ],
    },
    {
      id: "confidentiality",
      heading: "15. Confidentiality",
      blocks: [
        {
          p: "**15.1 Definition.** “Confidential Information” means non-public information disclosed by one party (“Discloser”) to the other (“Recipient”), whether orally or in writing, that is designated as confidential or that a reasonable person would understand to be confidential given the nature of the information and circumstances of disclosure, including Customer Data, supplier identities and terms, production and emissions figures, business and financial information, pricing, security documentation, and product roadmaps — but excluding information that (a) is or becomes publicly available through no fault of the Recipient, (b) was rightfully known to the Recipient prior to disclosure, (c) is rightfully obtained from a third party without breach of confidentiality, or (d) is independently developed without use of the Discloser’s Confidential Information.",
        },
        {
          p: "**15.2 Obligations.** Recipient will (a) use Confidential Information solely to perform its obligations or exercise its rights under these Terms, (b) protect it using at least the same degree of care it uses for its own confidential information of similar nature, and no less than reasonable care, and (c) not disclose it to any third party except to employees, contractors, Sub-processors, and professional advisors with a need to know who are bound by confidentiality obligations at least as protective as those herein.",
        },
        {
          p: "**15.3 Compelled Disclosure.** Recipient may disclose Confidential Information to the extent required by law, regulation, or court order, provided that, where legally permitted, Recipient gives Discloser reasonable advance notice to seek a protective order and discloses only what is legally required.",
        },
        {
          p: "**15.4 Survival.** The obligations in this Section survive for five (5) years after termination, and indefinitely in respect of any Confidential Information that constitutes a trade secret under applicable law.",
        },
      ],
    },
    {
      id: "data-protection",
      heading: "16. Data Protection and Privacy",
      blocks: [
        {
          p: "**16.1 The Split.** Certrace processes Personal Data in accordance with the Certrace Privacy Policy, which forms part of these Terms by reference. Where Certrace processes Personal Data contained within Customer Data on Customer’s behalf and at Customer’s instruction — including the contact details of Supplier Participants and any Personal Data incidentally contained in Evidence Documents — Certrace acts as a data processor and Customer acts as data controller, as those terms are understood under the Thai PDPA and, where it applies, the GDPR. Certrace acts as a controller in respect of Customer’s own account, billing, support, and marketing data.",
        },
        {
          p: "**16.2 Customer’s Controller Obligations.** Customer warrants that it has a lawful basis for each disclosure of Personal Data it makes to the Platform, that it has issued any notice and obtained any consent required in respect of Supplier Participants and their personnel, and that its instructions to Certrace will not cause Certrace to breach applicable data protection law. This matters more here than in an ordinary SaaS relationship, because much of the Personal Data in the Platform describes people who work for Customer’s suppliers rather than for Customer.",
        },
        {
          p: "**16.3 Security Measures and Incidents.** Certrace will implement appropriate technical and organizational measures to protect Personal Data as further described in the Privacy Policy, and will notify Customer without undue delay after becoming aware of a personal data breach affecting Customer Data, with the information reasonably available to it.",
        },
        {
          p: "**16.4 Data Processing Addendum.** Upon Customer’s written request, the parties will enter into a separate data processing addendum reflecting these arrangements in more detail, including sub-processing, international transfer safeguards, audit rights, and assistance with data subject requests. Where such an addendum is executed, it governs over this Section 16 to the extent of any conflict.",
        },
      ],
    },
    {
      id: "availability",
      heading: "17. Service Availability, Support, and Maintenance",
      blocks: [
        {
          p: "**17.1 Commercially Reasonable Efforts.** Certrace will use commercially reasonable efforts to make the Platform available on a continuous basis, excluding scheduled maintenance (for which Certrace will provide advance notice where reasonably practicable), emergency maintenance, and circumstances beyond Certrace’s reasonable control.",
        },
        {
          p: "**17.2 Support.** Certrace will provide customer support in accordance with the support terms specified in the applicable Order Form or, absent such terms, its then-current standard support practices for Customer’s tier. Support is provided during Thai business hours unless otherwise agreed.",
        },
        {
          p: "**17.3 Specific Service Levels.** Any specific uptime commitments, credits, or service-level terms apply only if expressly set out in a signed Order Form or separate service-level agreement, which will govern over this Section 17 to the extent of any conflict. Absent such a document, no uptime commitment is made.",
        },
        {
          p: "**17.4 Deadlines Are Customer’s.** Customer acknowledges that regulatory and commercial deadlines are Customer’s responsibility and must not be planned in a way that depends on the Platform being available at a particular moment. Reminders, due dates, and countdowns in the Platform are conveniences, not undertakings, and Certrace is not liable for a deadline missed.",
        },
      ],
    },
    {
      id: "sub-processors",
      heading: "18. Third-Party Services and Sub-processors",
      blocks: [
        {
          p: "**18.1 Sub-processors.** The Platform relies on third-party services and cloud infrastructure providers (each, a “Sub-processor”) to deliver the Services, including cloud hosting and storage, email delivery, error monitoring, analytics, payment processing, and — for the optional features described in Section 10 — AI model providers. Certrace remains responsible for Sub-processors’ performance of the obligations they undertake on Certrace’s behalf.",
        },
        {
          p: "**18.2 List and Notice.** Certrace will maintain a list of material Sub-processors and provide notice of the addition of any new material Sub-processor, as further described in the Privacy Policy. Where Customer reasonably objects to a new Sub-processor on data protection grounds within fifteen (15) days of notice, the parties will discuss in good faith; if no accommodation is reached, Customer’s sole remedy is to terminate the affected Services and receive a pro-rata refund of prepaid fees for the unexpired term.",
        },
        {
          p: "**18.3 Third-Party Integrations.** Where Customer connects the Platform to a third-party service of its own choosing, that connection is at Customer’s risk and governed by Customer’s agreement with that third party. Certrace is not responsible for a third-party service’s availability, security, or handling of data Customer directs to it.",
        },
      ],
    },
    {
      id: "beta",
      heading: "19. Beta and Preview Features",
      blocks: [
        {
          p: "Certrace may make available features labeled “beta,” “early access,” “preview,” “experimental,” or similar (each, a “Beta Feature”). Beta Features are provided “as is” and “as available,” without warranty of any kind, are excluded from any uptime or support commitment, may be modified or discontinued at any time without notice, and may produce inaccurate results. Certrace’s total aggregate liability arising out of or relating to a Beta Feature shall not exceed one thousand Thai Baht (THB 1,000). Customer must not rely on a Beta Feature for a regulatory filing or a commercial commitment, and information about an unreleased Beta Feature is Certrace’s Confidential Information.",
        },
      ],
    },
    {
      id: "term",
      heading: "20. Term, Suspension, and Termination",
      blocks: [
        {
          p: "**20.1 Term.** These Terms remain in effect for as long as Customer maintains an account or an active Order Form with Certrace.",
        },
        {
          p: "**20.2 Termination for Convenience.** Either party may decline to renew a Subscription Term by providing notice in accordance with Section 6.5.",
        },
        {
          p: "**20.3 Termination for Cause.** Either party may terminate these Terms or the applicable Order Form if the other party commits a Material Breach that remains uncured thirty (30) days after written notice describing the breach (or immediately, in the case of Customer’s non-payment following the notice period in Section 6.4, or Customer’s violation of Section 13). Either party may also terminate immediately if the other becomes insolvent, enters liquidation or receivership, or makes a general assignment for the benefit of creditors.",
        },
        {
          p: "**20.4 Suspension.** Certrace may suspend Customer’s access to the Platform, in whole or in part, with notice where reasonably practicable, if Certrace reasonably believes continued access poses a security risk, may expose Certrace, a Supplier Participant, or a third party to liability, or violates Section 13. Certrace will restore access promptly once the cause is resolved.",
        },
        {
          p: "**20.5 Effect of Termination.** Upon termination or expiration, Customer’s right to access the Platform ceases, and Customer remains liable for all fees accrued prior to the effective date of termination. The export window in Section 9.5 applies. Sections 2, 5, 9.1, 9.5, 10.3, 11, 12, 14.1, 14.2, 14.3, 15, 16, 21, 22, 23, and 26 survive termination, together with any other provision that by its nature should survive.",
        },
      ],
    },
    {
      id: "warranties",
      heading: "21. Warranties and Disclaimers",
      blocks: [
        {
          p: "**21.1 Mutual.** Each party represents that it has the legal power and authority to enter into these Terms.",
        },
        {
          p: "**21.2 Disclaimer.** EXCEPT AS EXPRESSLY STATED IN THESE TERMS, THE PLATFORM AND ALL REPORTS AND OUTPUTS ARE PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, NON-INFRINGEMENT, OR THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW. WITHOUT LIMITING THE FOREGOING, CERTRACE MAKES NO WARRANTY AS TO THE ACCURACY, CURRENCY, OR REGULATORY SUFFICIENCY OF ANY REFERENCE DATA, DEFAULT VALUE, EMISSION FACTOR, CLASSIFICATION MAPPING, CALCULATION, READINESS INDICATOR, OR AI-ASSISTED OUTPUT.",
        },
      ],
    },
    {
      id: "indemnification",
      heading: "22. Indemnification",
      blocks: [
        {
          p: "**22.1 By Certrace.** Certrace will defend Customer against any third-party claim alleging that the Platform, as provided by Certrace and used in accordance with these Terms, infringes that third party’s intellectual property rights, and will indemnify Customer for damages finally awarded as a result, provided Customer promptly notifies Certrace of the claim, gives Certrace sole control of the defense and settlement, and provides reasonable cooperation. This obligation does not apply to claims arising from (a) Customer Data, (b) modification of the Platform not made by Certrace, (c) use of the Platform in combination with products not provided by Certrace, where the infringement would not have occurred but for such combination, (d) a Beta Feature, or (e) use in breach of these Terms. If the Platform becomes, or Certrace believes it may become, the subject of such a claim, Certrace may at its option procure the right to continue use, modify the Platform to be non-infringing, or terminate the affected Services on notice with a pro-rata refund of prepaid fees. This Section states Certrace’s entire liability and Customer’s exclusive remedy for intellectual property infringement.",
        },
        {
          p: "**22.2 By Customer.** Customer will defend and indemnify Certrace, its affiliates, and their personnel against any third-party claim, and any resulting damages, fines, and reasonable legal costs, arising from (a) Customer Data, including data submitted by a Supplier Participant through a Smart Link issued from Customer’s account; (b) Customer’s or its Authorized Users’ violation of these Terms or of applicable law, including data protection law; (c) Customer’s use of a Report or Output in a manner inconsistent with Sections 5 or 11, including presenting one as a filing, a verification opinion, or a determined liability; (d) any claim by a Supplier Participant, buyer, importer, verifier, or regulator relating to data Customer collected, accepted, or transmitted through the Platform; or (e) Customer’s failure to obtain a required consent or to give a required notice.",
        },
      ],
    },
    {
      id: "liability",
      heading: "23. Limitation of Liability",
      blocks: [
        {
          p: "**23.1 Exclusion of Indirect Damages.** TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NEITHER PARTY WILL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, GOODWILL, BUSINESS OPPORTUNITY, OR DATA, ARISING OUT OF OR RELATED TO THESE TERMS OR THE PLATFORM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.",
        },
        {
          p: "**23.2 Specific Exclusions.** WITHOUT LIMITING SECTION 23.1, CERTRACE WILL NOT BE LIABLE FOR: ANY REGULATORY FINE, PENALTY, INTEREST, ADJUSTMENT, DEFAULT-VALUE MARKUP, OR CBAM CERTIFICATE OR CARBON COST INCURRED BY CUSTOMER OR ANY THIRD PARTY; THE REJECTION OF ANY DATASET, REPORT, OR OUTPUT BY A VERIFIER, BUYER, IMPORTER, AUDITOR, OR AUTHORITY; THE LOSS OF ANY CUSTOMER RELATIONSHIP, ORDER, OR TENDER; ANY MISSED DEADLINE; OR ANY DECISION TAKEN IN RELIANCE ON A COST, EXPOSURE, OR BENCHMARK ESTIMATE.",
        },
        {
          p: "**23.3 Liability Cap.** EXCEPT FOR (A) A PARTY’S INDEMNIFICATION OBLIGATIONS UNDER SECTION 22, (B) A PARTY’S BREACH OF SECTION 15 (CONFIDENTIALITY), (C) CUSTOMER’S PAYMENT OBLIGATIONS, OR (D) A PARTY’S GROSS NEGLIGENCE, FRAUD, OR WILLFUL MISCONDUCT, EACH PARTY’S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THESE TERMS SHALL NOT EXCEED THE TOTAL FEES PAID OR PAYABLE BY CUSTOMER TO CERTRACE IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM. THE CAPS IN SECTIONS 7.5, 8.5, AND 19 APPLY IN PLACE OF THIS CAP TO THE MATTERS THEY ADDRESS.",
        },
        {
          p: "**23.4 Single Cap.** The existence of more than one claim will not enlarge the cap. Claims by Customer and by any of its affiliates or Authorized Users are aggregated for the purpose of this Section.",
        },
        {
          p: "**23.5 Limitation Period.** No claim arising out of or relating to these Terms may be brought more than twelve (12) months after the claimant knew or ought reasonably to have known of the facts giving rise to it, except where applicable law prohibits such a limit.",
        },
        {
          p: "**23.6 Basis of the Bargain.** The parties acknowledge that the limitations in this Section 23 are an essential basis of the bargain, that fees have been set in reliance on them, and that they apply even if a limited remedy fails of its essential purpose. Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited.",
        },
      ],
    },
    {
      id: "force-majeure",
      heading: "24. Force Majeure",
      blocks: [
        {
          p: "Neither party will be liable for any delay or failure to perform its obligations (other than payment obligations) resulting from causes beyond its reasonable control, including acts of God, natural disaster, epidemic or pandemic, war, civil unrest, terrorism, governmental or regulatory action, embargo or sanction, labor disputes, power, internet or telecommunications failure, denial-of-service attack, or failures of third-party hosting or Sub-processor infrastructure.",
        },
      ],
    },
    {
      id: "compliance-laws",
      heading: "25. Export Control, Sanctions, and Anti-Corruption",
      blocks: [
        {
          p: "**25.1 Trade Controls.** Each party will comply with applicable export control, customs, and economic sanctions laws. Customer represents that it is not, and is not owned or controlled by or acting on behalf of, a party designated on any applicable sanctions list, and that it will not make the Platform available to any such party or in any embargoed territory. Certrace may suspend or terminate access immediately if this ceases to be true.",
        },
        {
          p: "**25.2 Anti-Bribery.** Each party will comply with applicable anti-bribery and anti-corruption laws, including the Organic Act on Counter Corruption of Thailand, the UK Bribery Act 2010, and the US Foreign Corrupt Practices Act, and will not offer or accept any improper payment in connection with these Terms.",
        },
        {
          p: "**25.3 No Facilitation of Misstatement.** Customer will not use the Platform to prepare, present, or transmit data it knows or suspects to be false to a regulator, verifier, customs authority, importer, or buyer. Certrace may report to the relevant party, and may terminate immediately, where it has reasonable grounds to believe the Platform is being used for that purpose.",
        },
      ],
    },
    {
      id: "general",
      heading: "26. General Provisions",
      blocks: [
        {
          p: "**26.1 Governing Law and Jurisdiction.** These Terms are governed by the laws of the Kingdom of Thailand, without regard to conflict-of-law principles, and excluding the United Nations Convention on Contracts for the International Sale of Goods. The parties submit to the exclusive jurisdiction of the competent courts of Bangkok, Thailand for any dispute arising out of or relating to these Terms, except that either party may seek interim injunctive relief in any court of competent jurisdiction to protect its intellectual property or Confidential Information.",
        },
        {
          p: "**26.2 Escalation.** Before commencing proceedings, the parties will attempt in good faith to resolve any dispute by escalating it to a senior representative of each party for a period of thirty (30) days. This does not apply to an application for interim relief or to a claim for unpaid fees.",
        },
        {
          p: "**26.3 Assignment.** Customer may not assign these Terms without Certrace’s prior written consent, except to a successor of substantially all its business or assets. Certrace may assign these Terms in connection with a merger, acquisition, reorganization, or sale of assets, or to an affiliate, without Customer’s consent.",
        },
        {
          p: "**26.4 Relationship of the Parties.** The parties are independent contractors. Nothing in these Terms creates a partnership, joint venture, agency, or employment relationship.",
        },
        {
          p: "**26.5 No Third-Party Beneficiaries.** Except as expressly stated in Sections 8.5 and 22, these Terms confer no rights on any person who is not a party to them.",
        },
        {
          p: "**26.6 Compliance with Laws.** Each party will comply with applicable laws in connection with these Terms. Section 25 applies in addition.",
        },
        {
          p: `**26.7 Notices.** Notices under these Terms must be in writing and delivered by email to ${CONTACT_EMAIL} (for Certrace) or to the primary account contact designated by Customer, and are deemed given upon confirmed receipt. Operational notices — including notices of Sub-processor changes, maintenance, and cap warnings — may be given in the Platform.`,
        },
        {
          p: "**26.8 Severability.** If any provision of these Terms is held invalid or unenforceable, the remaining provisions will remain in full force and effect, and the invalid provision will be modified to the minimum extent necessary to make it enforceable while preserving its commercial intent.",
        },
        {
          p: "**26.9 Non-Waiver.** No failure or delay by either party in exercising any right under these Terms will operate as a waiver of that right.",
        },
        {
          p: "**26.10 Language.** These Terms are executed in English. Translations are provided for convenience only; in the event of any inconsistency, the English version prevails.",
        },
        {
          p: "**26.11 Entire Agreement.** These Terms, together with all Order Forms, any data processing addendum, and the Privacy Policy, constitute the entire agreement between the parties regarding the Platform and supersede all prior agreements and understandings, written or oral, regarding the subject matter herein, including any statement made on Certrace’s website or in a sales conversation. In the event of conflict between these Terms and an Order Form, the Order Form controls with respect to the specific commercial terms it addresses. Any purchase order or Customer-issued terms are of no effect.",
        },
        {
          p: "**26.12 Survival.** Provisions that by their nature should survive termination will survive any termination or expiration of these Terms — see Section 20.5.",
        },
      ],
    },
    {
      id: "contact",
      heading: "27. Contact Information",
      blocks: [
        {
          p: `Questions or legal notices regarding these Terms should be directed to: **${CONTACT_EMAIL}**. Certrace operates from Bangkok, Thailand.`,
        },
      ],
    },
  ],
};

/* The Thai text of the Terms. Same twenty-seven sections, same anchor ids, in
   the same order — a reader switching language mid-document has to land on the
   same clause. §26.10 and the `languageNote` both say that the English text
   prevails, which is what keeps this a translation rather than a second,
   competing contract. */
export const TERMS_TH: LegalDoc = {
  eyebrow: "ข้อกำหนดและกฎหมาย",
  title: "ข้อกำหนดการใช้งาน Certrace",
  effectiveLabel: "วันที่มีผลบังคับใช้",
  effective: "1 กันยายน 2026",
  updatedLabel: "อัปเดตล่าสุด",
  updated: "1 กันยายน 2026",
  lede: "ข้อกำหนดฉบับนี้ควบคุมการเข้าถึงและการใช้งานแพลตฟอร์ม Certrace โปรดอ่านอย่างละเอียด เพราะถือเป็นข้อตกลงที่มีผลผูกพันระหว่างองค์กรของคุณกับ Certrace และระบุว่าแพลตฟอร์มทำอะไร ไม่ทำอะไรโดยเจตนา และใครรับผิดชอบส่วนไหน",
  contentsLabel: "หัวข้อในหน้านี้",
  languageNote:
    "ฉบับแปลภาษาไทยนี้จัดทำขึ้นเพื่อความสะดวกในการอ่าน หากมีข้อความใดขัดหรือแย้งกัน ให้ยึดฉบับภาษาอังกฤษเป็นหลัก",
  sections: [
    {
      id: "introduction",
      heading: "1. บทนำและการยอมรับข้อกำหนด",
      blocks: [
        {
          p: "ข้อกำหนดการใช้งานฉบับนี้ (“ข้อกำหนด”) เป็นข้อตกลงที่มีผลผูกพันตามกฎหมายระหว่าง Certrace ซึ่งเป็นบริษัทที่ดำเนินกิจการในกรุงเทพมหานคร ประเทศไทย (“บริษัท” “Certrace” “เรา”) กับนิติบุคคล องค์กร หรือบุคคลที่กระทำการในนามของนิติบุคคล ซึ่งลงทะเบียน เข้าถึง หรือใช้งานแพลตฟอร์ม Certrace (“ลูกค้า” “คุณ”)",
        },
        {
          p: "บริษัทให้บริการแพลตฟอร์มซอฟต์แวร์แบบ Software-as-a-Service สำหรับองค์กรธุรกิจ (“B2B”) เพื่อการจัดการข้อมูลด้านสิ่งแวดล้อม สังคม และธรรมาภิบาล (“ESG”) และสนับสนุนการปฏิบัติตามมาตรการปรับคาร์บอนก่อนข้ามพรมแดน (“CBAM”) (“แพลตฟอร์ม” หรือ “บริการ”) ตามที่อธิบายไว้ในข้อ 4 และภายใต้ขอบเขตที่กำหนดในข้อ 5",
        },
        {
          p: "การที่ลูกค้า (ก) สร้างบัญชี (ข) ลงนามในใบสั่งซื้อ (ตามนิยามด้านล่าง) ที่อ้างถึงข้อกำหนดฉบับนี้ (ค) กดยอมรับหรือแสดงเจตนาในลักษณะเดียวกัน (ง) เริ่มใช้งานช่วงทดลองฟรี หรือ (จ) เข้าถึงหรือใช้งานแพลตฟอร์มด้วยประการอื่นใด ถือว่าลูกค้าและบุคคลที่ยอมรับในนามของลูกค้ารับรองว่ามีอำนาจผูกพันลูกค้าตามข้อกำหนดฉบับนี้ และลูกค้าตกลงผูกพันตามข้อกำหนดฉบับนี้ รวมถึงนโยบายความเป็นส่วนตัวของ Certrace ซึ่งถือเป็นส่วนหนึ่งของข้อกำหนดโดยการอ้างอิง หากลูกค้าไม่ยอมรับ ลูกค้าต้องไม่เข้าถึงหรือใช้งานแพลตฟอร์ม",
        },
        {
          p: "แพลตฟอร์มออกแบบมาสำหรับการใช้งานเชิงธุรกิจโดยบุคลากรขององค์กร ไม่ได้มีไว้สำหรับผู้บริโภคหรือบุคคลอายุต่ำกว่าสิบแปด (18) ปี บุคคลแต่ละรายที่เข้าถึงแพลตฟอร์มในนามของลูกค้ารับรองว่าตนมีอายุไม่ต่ำกว่าสิบแปด (18) ปี และกระทำการภายในขอบเขตการจ้างงานหรือการมอบหมายจากลูกค้า",
        },
        {
          p: "**ผู้เข้าร่วมฝ่ายซัพพลายเออร์** บุคคลภายนอกบางราย — โดยทั่วไปคือซัพพลายเออร์ของลูกค้าและซัพพลายเออร์ต้นน้ำของซัพพลายเออร์เหล่านั้น — อาจส่งข้อมูลผ่านสมาร์ทลิงก์โดยไม่มีบัญชีผู้ใช้และไม่ได้ลงนามในใบสั่งซื้อ การใช้งานของบุคคลเหล่านั้นอยู่ภายใต้ข้อ 8 และคำชี้แจงที่แสดงต่อบุคคลนั้น ณ จุดที่ส่งข้อมูล ไม่มีข้อความใดในข้อกำหนดฉบับนี้ทำให้บุคคลดังกล่าวกลายเป็นลูกค้า และไม่มีเจตนาให้สิทธิใดแก่บุคคลดังกล่าว เว้นแต่ที่ระบุไว้อย่างชัดแจ้งในข้อ 8",
        },
        {
          p: "บริษัทสงวนสิทธิ์ในการแก้ไขข้อกำหนดฉบับนี้ได้ตลอดเวลา ทั้งนี้สำหรับลูกค้าที่อยู่ระหว่างระยะเวลาการสมัครสมาชิกแบบชำระเงิน การเปลี่ยนแปลงในสาระสำคัญที่เป็นผลร้ายต่อลูกค้าจะยังไม่มีผลจนกว่าจะถึงรอบต่ออายุครั้งถัดไป เว้นแต่กฎหมายกำหนดให้ต้องมีผลเร็วกว่านั้น บริษัทจะแจ้งการเปลี่ยนแปลงในสาระสำคัญโดยปรับวันที่ “อัปเดตล่าสุด” และแจ้งโดยตรงเท่าที่ทำได้ตามสมควร (เช่น ทางอีเมลหรือในแพลตฟอร์ม) การใช้งานต่อเนื่องหลังวันที่มีผลถือเป็นการยอมรับข้อกำหนดฉบับแก้ไข",
        },
        {
          p: "ในกรณีที่ Certrace และลูกค้าได้ลงนามในสัญญาการให้บริการหลัก ใบสั่งซื้อ ข้อตกลงการประมวลผลข้อมูล หรือสัญญาระดับองค์กรแยกต่างหาก ซึ่งอ้างถึงและมีเจตนาให้แทนที่ข้อกำหนดฉบับนี้ ให้ยึดสัญญาที่ลงนามนั้นเป็นหลักเท่าที่ขัดแย้งกัน",
        },
      ],
    },
    {
      id: "definitions",
      heading: "2. คำนิยาม",
      blocks: [
        {
          ul: [
            "**“ผู้ใช้ที่ได้รับอนุญาต”** หมายถึง พนักงาน ผู้รับจ้าง หรือตัวแทนของลูกค้าที่ลูกค้าอนุญาตให้เข้าถึงและใช้งานแพลตฟอร์มภายใต้บัญชีของลูกค้า และได้รับข้อมูลการเข้าสู่ระบบเฉพาะรายพร้อมที่นั่ง (Seat)",
            "**“CBAM”** หมายถึง มาตรการปรับคาร์บอนก่อนข้ามพรมแดนที่จัดตั้งขึ้นตาม Regulation (EU) 2023/956 ตามที่แก้ไขเพิ่มเติม พร้อมกฎหมายลำดับรองที่ออกภายใต้กฎระเบียบดังกล่าว และระบบรายงานคาร์บอนข้ามพรมแดนที่เทียบเท่า สืบทอด หรือเกี่ยวข้อง",
            "**“ผู้ยื่นแจ้ง CBAM”** หมายถึง คู่สัญญาที่มีสถานะผู้ยื่นแจ้ง CBAM ที่ได้รับอนุญาตตามกฎหมายสหภาพยุโรป และมีสิทธิและหน้าที่ตามกฎหมายในการยื่นคำแจ้ง CBAM และส่งมอบใบรับรอง CBAM Certrace ไม่เคยเป็นผู้ยื่นแจ้ง CBAM และในกรณีทั่วไปตามข้อกำหนดฉบับนี้ ลูกค้าก็ไม่ได้เป็นเช่นกัน — ดูข้อ 5",
            "**“ข้อมูลลูกค้า”** หมายถึง ข้อมูล ไฟล์ บันทึก และสารสนเทศทั้งหมด — รวมถึงข้อมูลการผลิต ข้อมูลกิจกรรม ข้อมูลการปล่อยก๊าซ ข้อมูลพลังงานและเชื้อเพลิง ข้อมูลสารตั้งต้นและห่วงโซ่อุปทาน เอกสารหลักฐาน ข้อมูลซัพพลายเออร์และสถานประกอบการ และบันทึกการจัดซื้อ — ที่ลูกค้า ผู้ใช้ที่ได้รับอนุญาต หรือผู้เข้าร่วมฝ่ายซัพพลายเออร์ซึ่งใช้สมาร์ทลิงก์ที่ออกจากบัญชีของลูกค้า ได้ส่ง อัปโหลด หรือถ่ายโอนเข้าสู่แพลตฟอร์ม โดยไม่รวมการคำนวณ แบบจำลอง และรายงานที่แพลตฟอร์มของ Certrace สร้างขึ้นเอง",
            "**“เอกสารหลักฐาน”** หมายถึง เอกสารใด ๆ ที่อัปโหลดเข้าสู่แพลตฟอร์มเพื่อสนับสนุนจุดข้อมูลหนึ่ง ๆ รวมถึงใบแจ้งหนี้ค่าสาธารณูปโภคและเชื้อเพลิง บันทึกมิเตอร์และเครื่องมือวัด ไฟล์ส่งออกจากระบบ ERP รายงานผลห้องปฏิบัติการและใบรับรองผลการทดสอบ บันทึกการสอบเทียบ ใบเสร็จราคาคาร์บอน และแบบฟอร์มสื่อสารของซัพพลายเออร์",
            "**“ใบสั่งซื้อ”** หมายถึง เอกสารสั่งซื้อ สัญญาสมาชิก ใบเสนอราคา หรือขั้นตอนการชำระเงินออนไลน์ ซึ่งระบุแพ็กเกจ ค่าธรรมเนียม ระยะเวลาการสมัครสมาชิก เพดานแพ็กเกจ และเงื่อนไขเชิงพาณิชย์อื่นที่ตกลงกัน และอ้างถึงข้อกำหนดฉบับนี้",
            "**“เพดานแพ็กเกจ”** หมายถึง ขีดจำกัดเชิงปริมาณที่ผูกกับแพ็กเกจ รวมถึงจำนวนรหัส CN จำนวนโรงงานผลิตหรือสถานประกอบการ จำนวนปีรายงานที่เปิดพร้อมกัน และจำนวนที่นั่ง ตามที่ระบุในใบสั่งซื้อและตามที่อธิบายในหน้าราคาของ Certrace",
            "**“แพลตฟอร์ม” หรือ “บริการ”** หมายถึง แพลตฟอร์มซอฟต์แวร์กรรมสิทธิ์ของ Certrace รวมถึงเว็บแอปพลิเคชัน แดชบอร์ด เครื่องมือคำนวณ สมาร์ทลิงก์ ฟีเจอร์อัตโนมัติและฟีเจอร์ที่ใช้ปัญญาประดิษฐ์ ส่วนต่อประสานโปรแกรมประยุกต์ (“API”) และเอกสารประกอบและการสนับสนุนที่เกี่ยวข้อง",
            "**“รายงาน” หรือ “ผลลัพธ์”** หมายถึง การคำนวณ แดชบอร์ด การประเมินความพร้อม เอกสารระเบียบวิธีการติดตาม ชุดเอกสารสำหรับผู้ทวนสอบ ทะเบียนหลักฐาน ไฟล์แบบฟอร์มสื่อสาร ไฟล์ส่งออก XML หรือรูปแบบมีโครงสร้างอื่น แผงคะแนน ESG รายงานการปล่อยก๊าซ CBAM หรือผลลัพธ์อื่นที่แพลตฟอร์มสร้างขึ้นจากข้อมูลลูกค้า",
            "**“ที่นั่ง”** หมายถึง สิทธิ์การใช้งานของผู้ใช้ที่ได้รับอนุญาตหนึ่งราย ตามใบสั่งซื้อที่เกี่ยวข้อง",
            "**“สมาร์ทลิงก์”** หมายถึง ที่อยู่เว็บที่มีโทเคนกำกับ ออกจากบัญชีของลูกค้า เพื่อเชิญผู้เข้าร่วมฝ่ายซัพพลายเออร์ส่งข้อมูล เอกสาร หรือลายเซ็นเข้าสู่แพลตฟอร์มโดยไม่ต้องสร้างบัญชี",
            "**“ผู้เข้าร่วมฝ่ายซัพพลายเออร์”** หมายถึง บุคคลภายนอก — รวมถึงซัพพลายเออร์ของลูกค้า ซัพพลายเออร์ต้นน้ำของบุคคลเหล่านั้น ผู้ดำเนินการสถานประกอบการ และบุคลากรของบุคคลเหล่านั้น — ซึ่งเข้าถึงแพลตฟอร์มผ่านสมาร์ทลิงก์",
            "**“ระยะเวลาการสมัครสมาชิก”** หมายถึง ระยะเวลาที่ลูกค้ามีสิทธิ์เข้าถึงแพลตฟอร์มตามใบสั่งซื้อ รวมถึงช่วงทดลองใช้ฟรี",
            "**“ผู้ประมวลผลช่วง”** หมายถึง บุคคลภายนอกที่ Certrace ว่าจ้างให้ประมวลผลข้อมูลลูกค้าหรือข้อมูลส่วนบุคคลในนามของ Certrace เพื่อการให้บริการ",
            "**“ข้อมูลที่เป็นความลับ”** มีความหมายตามที่กำหนดในข้อ 15",
            "**“ข้อมูลส่วนบุคคล”** มีความหมายตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (“PDPA”) และตาม Regulation (EU) 2016/679 (“GDPR”) เท่าที่ใช้บังคับกับการประมวลผลนั้น",
            "**“การผิดสัญญาในสาระสำคัญ”** หมายถึง การละเมิดข้อกำหนดฉบับนี้อย่างร้ายแรง ซึ่งรวมถึงการฉ้อโกง การไม่ชำระเงิน การละเมิดทรัพย์สินทางปัญญา การเปิดเผยข้อมูลที่เป็นความลับโดยไม่ได้รับอนุญาต การหลบเลี่ยงเพดานแพ็กเกจหรือกลไกควบคุมการเข้าถึง หรือการละเมิดนโยบายการใช้งานที่ยอมรับได้ในข้อ 13",
          ],
        },
      ],
    },
    {
      id: "eligibility",
      heading: "3. คุณสมบัติและการลงทะเบียนบัญชี",
      blocks: [
        {
          p: "**3.1 ใช้เพื่อธุรกิจเท่านั้น** แพลตฟอร์มนี้ให้บริการเฉพาะการใช้งานระหว่างองค์กรธุรกิจ ลูกค้าต้องเป็นนิติบุคคลที่จัดตั้งและดำรงอยู่โดยชอบด้วยกฎหมาย (หรือบุคคลธรรมดาที่กระทำการในฐานะทางธุรกิจ เช่น เจ้าของกิจการรายเดียว) และมีอำนาจเข้าทำข้อกำหนดฉบับนี้",
        },
        {
          p: "**3.2 การสร้างบัญชี** ลูกค้าจะกำหนดผู้ใช้ที่ได้รับอนุญาตอย่างน้อยหนึ่งราย รวมถึงเจ้าของบัญชีอย่างน้อยหนึ่งราย และตกลงให้ข้อมูลการลงทะเบียนที่ถูกต้อง เป็นปัจจุบัน และครบถ้วน — รวมถึงชื่อนิติบุคคลตามกฎหมาย เลขทะเบียน และเลขระบุตัวตนที่จำเป็นต่อการจัดทำแบบฟอร์มสื่อสารที่ใช้งานได้จริงในกรณีที่ส่งออกไปยังสหภาพยุโรป — และปรับปรุงข้อมูลดังกล่าวให้เป็นปัจจุบันเสมอ",
        },
        {
          p: `**3.3 ความปลอดภัยของบัญชี** ลูกค้ามีหน้าที่รักษาความลับของข้อมูลการเข้าสู่ระบบของผู้ใช้ที่ได้รับอนุญาตทุกราย และรับผิดชอบกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของตน ไม่ว่าลูกค้าจะอนุญาตหรือไม่ก็ตาม ลูกค้าต้องแจ้ง Certrace โดยทันทีที่ ${CONTACT_EMAIL} เมื่อทราบถึงการเข้าถึงหรือการใช้งานบัญชีโดยไม่ได้รับอนุญาต หรือเมื่อทราบว่าสมาร์ทลิงก์ถูกส่งต่อไปยังหรือถูกเปิดโดยบุคคลที่ลูกค้าไม่ได้ตั้งใจเชิญ`,
        },
        {
          p: "**3.4 บทบาทและสิทธิ์ภายในองค์กร** แพลตฟอร์มมีการควบคุมการเข้าถึงตามบทบาท ซึ่งแยกระหว่างเจ้าของบัญชี สมาชิกทั่วไป และผู้ตรวจสอบฝ่ายกฎหมายหรือคอมไพลแอนซ์ ลูกค้ามีหน้าที่แต่เพียงผู้เดียวในการกำหนด ทบทวน และเพิกถอนบทบาทเหล่านั้น ในการดูแลให้ผู้ใช้แต่ละรายมีสิทธิ์เท่าที่หน้าที่ต้องการ และในการถอดถอนผู้ใช้ที่พ้นจากองค์กรของลูกค้า Certrace บังคับใช้บทบาทตามที่ลูกค้าตั้งค่า แต่ไม่ได้เป็นผู้ตัดสินว่าใครในองค์กรของลูกค้าควรได้รับบทบาทใด",
        },
        {
          p: "**3.5 ที่นั่งเป็นของบุคคลเฉพาะราย** ที่นั่งหนึ่งระบุถึงบุคคลหนึ่งรายที่ระบุชื่อ ห้ามใช้ข้อมูลการเข้าสู่ระบบร่วมกันระหว่างบุคคล และห้ามใช้ที่นั่งเป็นบัญชีกลางหรือบัญชีร่วม",
        },
      ],
    },
    {
      id: "services",
      heading: "4. รายละเอียดของบริการ",
      blocks: [
        {
          p: "**4.1 ภาพรวม** แพลตฟอร์มให้เครื่องมือช่วยลูกค้าในการเก็บรวบรวม จัดระเบียบ คำนวณ จัดทำหลักฐาน และส่งมอบข้อมูลด้าน ESG และการปล่อยก๊าซที่เกี่ยวข้องกับ CBAM และภาระการรายงานด้านความยั่งยืนที่เกี่ยวข้อง ขึ้นกับแพ็กเกจและการตั้งค่าที่ลูกค้าเลือก ซึ่งรวมถึงการออกสมาร์ทลิงก์ถึงซัพพลายเออร์และผู้ดำเนินการสถานประกอบการ การเก็บข้อมูลรายเดือนและรายปีอย่างมีโครงสร้าง การจำลองความสัมพันธ์ของสารตั้งต้นและห่วงโซ่อุปทานหลายชั้น การตรวจสอบคุณภาพ ความครบถ้วน และความสมเหตุสมผลโดยอัตโนมัติ การคำนวณค่าการปล่อยก๊าซแฝงตามกฎรายสาขาแบบกำหนดผลลัพธ์แน่นอน การประเมินความพร้อมต่อข้อกำหนดการทวนสอบ การจัดการหลักฐาน การวิเคราะห์ต้นทุนคาร์บอนและการเทียบมาตรฐาน ตลอดจนการสร้างรายงานและผลลัพธ์ตามข้อ 11",
        },
        {
          p: "**4.2 ไม่ใช่ผู้ทวนสอบที่ได้รับการรับรอง** CBAM และกรอบกฎหมายที่เกี่ยวข้องโดยทั่วไปกำหนดให้ข้อมูลการปล่อยก๊าซบางประเภทต้องผ่านการทวนสอบโดยหน่วยงานทวนสอบอิสระที่ได้รับการรับรองก่อนจึงจะนำไปใช้อ้างอิงได้ Certrace เป็นผู้ให้บริการซอฟต์แวร์ ไม่ใช่ผู้ทวนสอบที่ได้รับการรับรองตาม EN ISO 14065 ตาม CBAM หรือตามระบบกำกับดูแลใด ๆ ไม่ได้ทำการทวนสอบ และไม่ได้ออกความเห็นการทวนสอบ รายงานและผลลัพธ์ที่แพลตฟอร์มสร้างขึ้นเป็นเครื่องมือเตรียมการและให้ข้อมูล เพื่อทำให้การทวนสอบโดยหน่วยงานอิสระเร็วขึ้นและมีหลักฐานดีขึ้น แต่ไม่ใช่สิ่งทดแทนการทวนสอบ การแจ้งพิธีการศุลกากร หรือการยื่นต่อหน่วยงานกำกับดูแล ลูกค้ามีหน้าที่แต่เพียงผู้เดียวในการว่าจ้างผู้ทวนสอบที่ได้รับการรับรอง ตัวแทนออกของ หรือผู้เชี่ยวชาญอื่นตามที่กฎหมายกำหนด",
        },
        {
          p: "**4.3 ข้อมูลอ้างอิงและการเปลี่ยนแปลงกฎระเบียบ** แพลตฟอร์มใช้ข้อมูลอ้างอิง — รวมถึงการจำแนกรหัส CN และหมวดสินค้า กฎรายสาขา ค่าเริ่มต้น ค่าการปล่อยก๊าซและค่าความร้อน ค่าการปล่อยของโครงข่ายไฟฟ้า และราคาคาร์บอนอ้างอิง — ซึ่งได้มาจากแหล่งกฎหมายและมาตรฐานที่เผยแพร่แล้ว ข้อมูลอ้างอิงดังกล่าวได้รับการดูแลตามความพยายามอันสมเหตุสมผลเชิงพาณิชย์ กฎหมาย กฎหมายลำดับรอง และค่าเริ่มต้นที่ประกาศใช้มีการเปลี่ยนแปลงได้ บางครั้งโดยแจ้งล่วงหน้าไม่นานและบางครั้งมีผลย้อนหลัง Certrace พยายามปรับปรุงแพลตฟอร์มให้เป็นปัจจุบัน แต่ไม่รับประกันว่าแพลตฟอร์มสะท้อนข้อกำหนดล่าสุดตลอดเวลา และลูกค้ายังคงมีหน้าที่ตรวจสอบให้แน่ใจว่าฐานของการยื่นถูกต้อง ณ เวลาที่ยื่น",
        },
        {
          p: "**4.4 การเปลี่ยนแปลงบริการ** Certrace อาจแก้ไข ปรับปรุง หรือยกเลิกฟีเจอร์ของแพลตฟอร์มเป็นครั้งคราว ทั้งนี้ Certrace จะไม่ลดทอนฟังก์ชันหลักของบริการที่ซื้อไว้ภายใต้ใบสั่งซื้อที่ยังมีผลในระหว่างระยะเวลาการสมัครสมาชิกอย่างมีนัยสำคัญ โดยไม่แจ้งล่วงหน้าตามสมควรหรือไม่มีฟีเจอร์ทดแทนที่เทียบเคียงได้",
        },
        {
          p: "**4.5 ความรับผิดชอบด้านปฏิบัติการของลูกค้า** แพลตฟอร์มเป็นระบบบันทึกและคำนวณ ไม่ใช่สิ่งทดแทนการติดตาม การวัด และการควบคุมภายในของลูกค้าเอง ลูกค้ามีหน้าที่ติดตั้ง ใช้งาน สอบเทียบ และบำรุงรักษาโครงสร้างพื้นฐานการวัดที่เป็นต้นทางของข้อมูล รับผิดชอบความครบถ้วนและความถูกต้องของสิ่งที่ตนและซัพพลายเออร์กรอกเข้ามา รับผิดชอบกำหนดเวลาของตนเองและของคู่ค้า และรับผิดชอบการเก็บรักษาเอกสารต้นทางตามระยะเวลาที่กฎหมายกำหนดแก่ตน",
        },
      ],
    },
    {
      id: "scope-limits",
      heading: "5. สถานะทางกฎหมาย: สิ่งที่ Certrace ไม่ได้ทำ",
      blocks: [
        {
          p: "ข้อนี้เป็นข้อที่ลูกค้าควรอ่านสองรอบ เพราะอธิบายข้อจำกัดเชิงโครงสร้าง ไม่ใช่ข้อจำกัดเชิงพาณิชย์ และไม่เปลี่ยนไปตามแพ็กเกจที่เลือก",
        },
        {
          p: "**5.1 Certrace ไม่ได้ยื่นเอกสารใด ๆ** Certrace ไม่ได้และไม่สามารถยื่นคำแจ้ง รายงาน หรือการลงทะเบียนใด ๆ ต่อคณะกรรมาธิการยุโรป ต่อ CBAM Registry ต่อหน่วยงานผู้มีอำนาจหรือหน่วยงานศุลกากรของรัฐสมาชิกสหภาพยุโรป ต่อหน่วยงานรัฐของไทย หรือต่อหน่วยงานกำกับดูแลอื่นใด ไม่ว่าในนามของลูกค้าหรือของบุคคลใด ไม่มีฟีเจอร์ใดของแพลตฟอร์มที่ถือเป็นการยื่น เมื่อผลลัพธ์ถูกระบุว่า “พร้อม” นั่นหมายถึงความครบถ้วนของเอกสารเมื่อเทียบกับแบบฟอร์มที่ใช้บังคับ ไม่ได้หมายความว่ามีการยื่นสิ่งใดต่อผู้ใด",
        },
        {
          p: "**5.2 ผู้ส่งออกไม่ใช่ผู้ยื่นแจ้ง CBAM** ภายใต้ระบบ CBAM ในช่วงบังคับใช้จริง มีเพียงคู่สัญญาที่จัดตั้งในสหภาพยุโรปและมีสถานะผู้ยื่นแจ้ง CBAM ที่ได้รับอนุญาต — ในทางปฏิบัติคือผู้นำเข้าหรือตัวแทนออกของทางอ้อม — ที่สามารถยื่นคำแจ้ง CBAM และส่งมอบใบรับรองได้ ผู้ส่งออก ผู้ผลิต หรือผู้ดำเนินการสถานประกอบการนอกสหภาพยุโรปไม่มีสถานะที่จะยื่นเอกสารนั้น Certrace สร้างขึ้นเพื่อคู่สัญญาฝ่ายหลัง โดยมีวัตถุประสงค์เพื่อผลิตชุดข้อมูลที่ปกป้องได้พร้อมเอกสารประกอบที่ผู้ยื่นแจ้ง CBAM และผู้ทวนสอบที่เกี่ยวข้องสามารถใช้อ้างอิงได้ ลูกค้ารายใดที่เชื่อว่าตนเองเป็นผู้ยื่นแจ้ง CBAM ต้องขอคำแนะนำทางกฎหมายของตนเองในประเด็นนั้น แพลตฟอร์มไม่ได้เป็นผู้ชี้ขาด",
        },
        {
          p: "**5.3 ไม่ใช่คำแนะนำจากผู้ประกอบวิชาชีพ** สิ่งใดก็ตามที่แพลตฟอร์มสร้างขึ้น บรรจุอยู่ หรือเกิดจากแพลตฟอร์ม — รวมถึงข้อความแนะนำ ตัวชี้วัดความพร้อม สัญญาณความเสี่ยง การเทียบมาตรฐาน การประมาณต้นทุน รายการตรวจสอบ และเนื้อหาอธิบายที่เผยแพร่บนเว็บไซต์ของ Certrace — ไม่ถือเป็นคำแนะนำทางกฎหมาย ศุลกากร ภาษี บัญชี วิศวกรรม คณิตศาสตร์ประกันภัย หรือวิชาชีพอื่น และไม่ถือเป็นความเห็นต่อสถานะทางกฎหมายของลูกค้า ลูกค้าต้องไม่ใช้สิ่งเหล่านี้แทนคำแนะนำจากที่ปรึกษาผู้มีคุณสมบัติที่ลูกค้าว่าจ้างเอง",
        },
        {
          p: "**5.4 ไม่รับประกันผลลัพธ์** Certrace ไม่รับประกันและปฏิเสธโดยชัดแจ้งซึ่งการรับรองใด ๆ ว่าการใช้แพลตฟอร์มจะทำให้เกิดการปฏิบัติตาม CBAM หรือกฎหมายอื่น จะทำให้รายงานหรือผลลัพธ์ได้รับการยอมรับจากผู้ทวนสอบ ผู้ซื้อ ผู้นำเข้า ผู้ตรวจสอบบัญชี หน่วยงานผู้มีอำนาจ หรือศาล จะทำให้หลีกเลี่ยงค่าปรับ การปรับปรุงตัวเลข การบวกเพิ่มจากค่าเริ่มต้น หรือต้นทุนคาร์บอน หรือจะทำให้รักษาความสัมพันธ์ทางการค้าใดไว้ได้ การชี้ขาดเรื่องการปฏิบัติตามกฎหมายกระทำโดยบุคคลภายนอกที่ใช้ดุลพินิจของตนกับข้อเท็จจริงของลูกค้าเอง",
        },
        {
          p: "**5.5 ไม่มีความสัมพันธ์แบบผู้ให้คำปรึกษาหรือผู้ถือความไว้วางใจ** ข้อกำหนดฉบับนี้ก่อให้เกิดความสัมพันธ์การอนุญาตให้ใช้ซอฟต์แวร์เท่านั้น Certrace ไม่ได้กระทำการในฐานะตัวแทน ที่ปรึกษา ผู้แทน หรือผู้ถือความไว้วางใจของลูกค้า และไม่รับภาระหน้าที่ดูแลใดเกินกว่าที่ระบุไว้อย่างชัดแจ้งในข้อกำหนดฉบับนี้",
        },
      ],
    },
    {
      id: "fees",
      heading: "6. แพ็กเกจ การสั่งซื้อ และค่าธรรมเนียม",
      blocks: [
        {
          p: "**6.1 ใบสั่งซื้อ** การเข้าถึงแพลตฟอร์มของลูกค้าอยู่ภายใต้ใบสั่งซื้อที่เกี่ยวข้อง ซึ่งระบุแพ็กเกจ เพดานแพ็กเกจรวมถึงจำนวนที่นั่ง ค่าธรรมเนียม ความถี่ในการวางบิล และระยะเวลาการสมัครสมาชิก",
        },
        {
          p: "**6.2 เสนอราคา ไม่ใช่ประกาศราคา** Certrace เผยแพร่โครงสร้างแพ็กเกจและเพดานแพ็กเกจ แต่ไม่เผยแพร่ราคา ใบเสนอราคาคิดจากรหัส CN โรงงานผลิต และขอบเขตการรายงานจริงของลูกค้า ใบเสนอราคาเป็นคำเสนอที่สนองรับได้เฉพาะภายในระยะเวลาและตามเงื่อนไขที่ระบุไว้ในใบเสนอราคานั้น และไม่ถือเป็นการรับรองเกี่ยวกับราคาในอนาคต",
        },
        {
          p: "**6.3 ค่าธรรมเนียมและการชำระเงิน** ลูกค้าตกลงชำระค่าธรรมเนียมทั้งหมดตามใบสั่งซื้อ เว้นแต่ระบุไว้เป็นอย่างอื่น ค่าธรรมเนียมเสนอและชำระเป็นเงินบาทไทย (THB) ไม่รวมภาษีมูลค่าเพิ่ม (“VAT”) และภาษีหัก ณ ที่จ่ายที่เกี่ยวข้อง ซึ่งลูกค้าเป็นผู้รับภาระเพิ่มเติมจากค่าธรรมเนียมที่ระบุ เว้นแต่มีการยกเว้นที่ชอบด้วยกฎหมาย หากตกลงให้วางบิลเป็นสกุลเงินอื่น เกณฑ์อัตราแลกเปลี่ยนจะระบุไว้ในใบสั่งซื้อ",
        },
        {
          p: "**6.4 การวางบิลและการชำระล่าช้า** เว้นแต่ตกลงเป็นอย่างอื่นในใบสั่งซื้อ ใบแจ้งหนี้ครบกำหนดภายในสามสิบ (30) วันนับจากวันที่ในใบแจ้งหนี้ Certrace อาจคิดดอกเบี้ยจากยอดค้างชำระในอัตราสูงสุดที่กฎหมายอนุญาต และอาจระงับการเข้าถึงของลูกค้าสำหรับยอดที่ไม่มีข้อโต้แย้งซึ่งค้างชำระเกินสิบห้า (15) วันหลังการแจ้งเป็นหนังสือ ลูกค้าต้องยกข้อโต้แย้งโดยสุจริตเกี่ยวกับใบแจ้งหนี้ภายในยี่สิบ (20) วันนับจากวันที่ในใบแจ้งหนี้ และต้องชำระส่วนที่ไม่มีข้อโต้แย้งเมื่อครบกำหนด",
        },
        {
          p: "**6.5 การต่ออายุอัตโนมัติ** เว้นแต่ระบุไว้เป็นอย่างอื่นในใบสั่งซื้อ ระยะเวลาการสมัครสมาชิกจะต่ออายุอัตโนมัติเป็นช่วงเวลาเท่ากับช่วงที่สิ้นสุดลง ในอัตราค่าธรรมเนียมของ Certrace ที่ใช้อยู่ในขณะนั้น เว้นแต่ฝ่ายใดฝ่ายหนึ่งแจ้งเป็นหนังสือว่าไม่ต่ออายุอย่างน้อยสามสิบ (30) วันก่อนสิ้นสุดระยะเวลาปัจจุบัน",
        },
        {
          p: "**6.6 การเปลี่ยนแพ็กเกจ** ลูกค้าอาจอัปเกรดแพ็กเกจได้ตลอดเวลาระหว่างระยะเวลาการสมัครสมาชิก โดยคิดค่าธรรมเนียมตามสัดส่วนของระยะเวลาที่เหลือ การลดระดับแพ็กเกจมีผลเมื่อถึงรอบต่ออายุครั้งถัดไป เพื่อไม่ให้ปีรายงานที่ดำเนินอยู่ถูกเปลี่ยนขอบเขตกลางคัน",
        },
        {
          p: "**6.7 ภาษี** แต่ละฝ่ายรับผิดชอบภาษีเงินได้และภาษีในลักษณะเดียวกันที่คำนวณจากรายได้สุทธิของตนเอง ค่าธรรมเนียมไม่รวมภาษีมูลค่าเพิ่มและภาษีทางอ้อมอื่นที่เกี่ยวข้อง ซึ่ง Certrace จะวางบิลตามที่กฎหมายกำหนด",
        },
        {
          p: "**6.8 การคืนเงิน** เว้นแต่ระบุไว้อย่างชัดแจ้งในใบสั่งซื้อหรือกฎหมายกำหนด ค่าธรรมเนียมไม่สามารถขอคืนหรือใช้เป็นเครดิตได้ รวมถึงกรณีที่ลูกค้าเลิกใช้แพลตฟอร์ม ใช้เกินหรือใช้ไม่เต็มเพดานแพ็กเกจ หรือยุติสัญญาก่อนสิ้นสุดระยะเวลาการสมัครสมาชิก",
        },
      ],
    },
    {
      id: "metering",
      heading: "7. การวัดปริมาณการใช้ เพดานแพ็กเกจ และช่วงทดลองใช้ฟรี",
      blocks: [
        {
          p: "**7.1 วัดจากอะไร** แพ็กเกจวัดจากจำนวนรหัส CN แปดหลักที่ต่างกันซึ่งลูกค้าดูแลอยู่เป็นหลัก ประกอบกับจำนวนโรงงานผลิตหรือสถานประกอบการ จำนวนปีรายงานที่เปิดพร้อมกัน และจำนวนที่นั่ง ค่าที่วัดได้มาจากการตั้งค่าที่ใช้งานอยู่จริงของลูกค้า ไม่ได้เก็บเป็นตัวนับแยกต่างหาก การจัดเก็บพื้นที่ทำงานเข้าคลังหรือการปิดปีรายงานจะคืนความจุที่ใช้อยู่",
        },
        {
          p: "**7.2 ซัพพลายเออร์ไม่ถูกนับ** ผู้เข้าร่วมฝ่ายซัพพลายเออร์ไม่จำกัดจำนวนและไม่มีค่าใช้จ่ายในทุกแพ็กเกจ ไม่ใช้ที่นั่งและไม่ต้องมีบัญชี Certrace สงวนสิทธิ์ในการกำหนดขีดจำกัดทางเทคนิคตามสมควรเพื่อป้องกันการใช้สมาร์ทลิงก์ในทางที่ผิดหรือแบบอัตโนมัติ และในการปฏิเสธการออกสมาร์ทลิงก์ในปริมาณที่ไม่สอดคล้องกับการดำเนินงานที่ลูกค้าแจ้งไว้",
        },
        {
          p: "**7.3 เพดานเตือนก่อนบล็อก** Certrace จะไม่ขัดจังหวะงานที่ดำเนินอยู่แล้วเพราะเพดานขยับ การใช้เกินเพดานจะไม่ลบข้อมูล ไม่ปิดปีรายงาน และไม่ทำให้รายงานเป็นโมฆะ เมื่อลูกค้าถึงเพดาน แพลตฟอร์มจะแจ้งให้ทราบ และอาจปฏิเสธการสร้างหน่วยขอบเขตใหม่ — โรงงานใหม่ ปีรายงานใหม่ รหัส CN ใหม่ หรือที่นั่งใหม่ — จนกว่าจะเปลี่ยนแพ็กเกจ ลูกค้าต้องไม่หลบเลี่ยงเพดานแพ็กเกจ ไม่ว่าโดยการเปิดหลายบัญชีเพื่อแบ่งการดำเนินงานเดียวกัน การใช้ที่นั่งร่วมกัน หรือโดยวิธีทางเทคนิคใด ๆ",
        },
        {
          p: "**7.4 ช่วงทดลองใช้ฟรี** Certrace อาจเสนอช่วงทดลองใช้ฟรี โดยปกติสามสิบ (30) วันที่ความจุระดับ Enterprise เพื่อให้ประเมินแพลตฟอร์มกับห่วงโซ่อุปทานจริงของลูกค้าแทนข้อมูลตัวอย่าง ฟีเจอร์บางอย่างอาจไม่เปิดในช่วงทดลอง หากไม่มีการลงนามในใบสั่งซื้อแบบชำระเงินก่อนสิ้นสุดช่วงทดลอง บัญชีของลูกค้าจะเปลี่ยนเป็นสถานะอ่านอย่างเดียว โดยลูกค้ายังเข้าดูและส่งออกสิ่งที่กรอกไว้ได้ตามระยะเวลาในข้อ 9.5 แต่จะสร้างหรือแก้ไขบันทึกไม่ได้",
        },
        {
          p: "**7.5 ช่วงทดลองไม่มีการรับประกัน** โดยไม่คำนึงถึงข้อกำหนดอื่นใดในสัญญาฉบับนี้ ในระหว่างช่วงทดลองใช้ฟรี แพลตฟอร์มให้บริการ “ตามสภาพ” โดยไม่มีการรับประกัน ข้อผูกพันด้านการสนับสนุน หรือระดับการให้บริการใด ๆ และความรับผิดรวมทั้งสิ้นของ Certrace ที่เกิดจากหรือเกี่ยวข้องกับช่วงทดลองใช้ฟรีจะไม่เกินหนึ่งพันบาท (1,000 บาท) ลูกค้าไม่ควรใช้บัญชีทดลองเป็นบันทึกเพียงแหล่งเดียวของสิ่งใด",
        },
      ],
    },
    {
      id: "suppliers",
      heading: "8. ซัพพลายเออร์และสมาร์ทลิงก์",
      blocks: [
        {
          p: "**8.1 สมาร์ทลิงก์คืออะไร** สมาร์ทลิงก์คือที่อยู่เว็บที่มีโทเคนกำกับ ออกจากบัญชีของลูกค้า ซึ่งอนุญาตให้ผู้เข้าร่วมฝ่ายซัพพลายเออร์ที่ระบุชื่อส่งข้อมูล เอกสาร หรือลายเซ็นเข้าสู่พื้นที่ทำงานของลูกค้าโดยไม่ต้องสร้างบัญชี สิ่งนี้มีอยู่เพราะผู้ที่ถือข้อมูลการปล่อยก๊าซมักไม่ใช่ผู้ที่ถือสมาชิก และในทางปฏิบัติ การบังคับให้ฝ่ายนั้นสมัครสมาชิกคือสาเหตุอันดับหนึ่งที่ข้อมูลไม่เคยมาถึง",
        },
        {
          p: "**8.2 ลูกค้าเป็นผู้ออกลิงก์และเป็นเจ้าของความสัมพันธ์** ลูกค้าเป็นผู้ตัดสินว่าจะเชิญผู้เข้าร่วมฝ่ายซัพพลายเออร์รายใด ขออะไร และเมื่อใด ลูกค้ารับรองและรับประกันว่าตนมีความสัมพันธ์ทางธุรกิจที่ชอบด้วยกฎหมายกับผู้เข้าร่วมฝ่ายซัพพลายเออร์แต่ละรายที่เชิญ ว่าตนมีสิทธิ์ขอข้อมูลที่ขอ และว่าตนได้แจ้งและได้รับความยินยอมตามที่กฎหมายคุ้มครองข้อมูลส่วนบุคคลกำหนดจากบุคคลแต่ละรายที่ตนกรอกข้อมูลส่วนบุคคลเข้ามา (รวมถึงชื่อผู้ติดต่อ อีเมล และหมายเลขโทรศัพท์ของซัพพลายเออร์) Certrace ไม่มีความสัมพันธ์กับและไม่ให้คำมั่นใดแก่ผู้เข้าร่วมฝ่ายซัพพลายเออร์ นอกเหนือจากคำชี้แจงที่แสดง ณ จุดส่งข้อมูล และหน้าที่ที่ Certrace มีในฐานะผู้ประมวลผลตามนโยบายความเป็นส่วนตัว",
        },
        {
          p: "**8.3 การดูแลลิงก์** สมาร์ทลิงก์เป็นคำเชิญที่จ่าหน้าถึงผู้รับ ไม่ใช่ข้อมูลรับรองการเข้าสู่บัญชีของลูกค้า โดยให้สิทธิ์เข้าถึงเฉพาะคำขอที่ออกลิงก์นั้นมาเท่านั้น และไม่ให้สิทธิ์เข้าถึงบัญชีของลูกค้า พื้นที่ทำงานอื่น หรือข้อมูลที่ซัพพลายเออร์รายอื่นส่งมา อย่างไรก็ตาม ผู้รับสามารถส่งต่อลิงก์ได้ ลูกค้าจึงรับผิดชอบที่อยู่ที่ตนส่งลิงก์ไป และต้องแจ้ง Certrace โดยทันทีหากทราบหรือสงสัยว่าลิงก์ไปถึงบุคคลที่ไม่ได้ตั้งใจ เพื่อให้เพิกถอนและออกใหม่ได้",
        },
        {
          p: "**8.4 ข้อมูลที่ผู้อื่นส่งเข้ามาถือเป็นข้อมูลลูกค้า** ข้อมูล เอกสาร และลายเซ็นที่ผู้เข้าร่วมฝ่ายซัพพลายเออร์ส่งผ่านสมาร์ทลิงก์ที่ออกจากบัญชีของลูกค้า ถือเป็นข้อมูลลูกค้าตามข้อกำหนดฉบับนี้ และหน้าที่กับคำรับประกันของลูกค้าตามข้อ 9 ใช้บังคับกับข้อมูลนั้น Certrace ไม่ได้ตรวจสอบสิ่งที่ผู้เข้าร่วมฝ่ายซัพพลายเออร์ส่งมาโดยอิสระ ไม่ได้ยืนยันตัวตนของบุคคลที่ส่ง และไม่รับรองว่าการส่งข้อมูลกระทำโดยหรือด้วยอำนาจของนิติบุคคลที่ลิงก์นั้นจ่าหน้าถึง",
        },
        {
          p: "**8.5 ให้เปล่าและให้ตามสภาพ** การเข้าถึงผ่านสมาร์ทลิงก์ให้แก่ผู้เข้าร่วมฝ่ายซัพพลายเออร์โดยไม่คิดค่าใช้จ่าย “ตามสภาพ” และไม่มีการรับประกันใด ๆ ความรับผิดรวมทั้งสิ้นของ Certrace ต่อผู้เข้าร่วมฝ่ายซัพพลายเออร์รายใด ไม่ว่าตามสัญญา ละเมิด หรือมูลอื่น ที่เกิดจากหรือเกี่ยวข้องกับการเข้าถึงดังกล่าว จะไม่เกินหนึ่งพันบาท (1,000 บาท) ลูกค้าจะชดใช้ค่าเสียหายให้ Certrace ตามข้อ 22.2 สำหรับข้อเรียกร้องที่ยื่นโดยผู้เข้าร่วมฝ่ายซัพพลายเออร์ที่ลูกค้าเชิญ",
        },
        {
          p: "**8.6 การใช้คำตอบซ้ำข้ามคำขอ** ในกรณีที่คำตอบของผู้เข้าร่วมฝ่ายซัพพลายเออร์ถูกเก็บไว้เพื่อเติมล่วงหน้าในคำขอครั้งถัดไป การเก็บนั้นเป็นไปตามคำสั่งของลูกค้าและอยู่ภายในพื้นที่ทำงานของลูกค้า Certrace ไม่เปิดเผยข้อมูลที่ซัพพลายเออร์ของลูกค้ารายหนึ่งส่งมาให้ลูกค้ารายอื่น และไม่ได้ดำเนินการฐานข้อมูลซัพพลายเออร์ร่วมข้ามลูกค้า",
        },
      ],
    },
    {
      id: "customer-data",
      heading: "9. ข้อมูลลูกค้า สิทธิการใช้งาน และความเป็นเจ้าของ",
      blocks: [
        {
          p: "**9.1 ความเป็นเจ้าของ** ระหว่างคู่สัญญา ลูกค้าคงไว้ซึ่งสิทธิ กรรมสิทธิ์ และผลประโยชน์ทั้งหมดในข้อมูลลูกค้า ไม่มีข้อความใดในข้อกำหนดฉบับนี้ที่โอนความเป็นเจ้าของข้อมูลลูกค้าให้ Certrace",
        },
        {
          p: "**9.2 สิทธิการใช้งานที่ให้แก่ Certrace** ลูกค้าให้สิทธิ Certrace แบบทั่วโลก ไม่จำกัดแต่เพียงผู้เดียว และปลอดค่าตอบแทน ในการจัดเก็บ ประมวลผล ส่งผ่าน และใช้ข้อมูลลูกค้า เพียงเพื่อ (ก) ให้บริการ บำรุงรักษา รักษาความปลอดภัย แก้ไขปัญหา และปรับปรุงแพลตฟอร์มและบริการสำหรับลูกค้า และ (ข) สร้างรายงานและผลลัพธ์ในนามของลูกค้า Certrace จะไม่ขายข้อมูลลูกค้า และจะไม่ใช้ข้อมูลลูกค้าฝึกโมเดลพื้นฐานหรือโมเดลของบุคคลภายนอกที่เปิดให้ผู้อื่นนอกจากลูกค้าใช้งาน Certrace ทำสัญญากับผู้ประมวลผลช่วงด้าน AI บนเงื่อนไขที่ห้ามผู้เหล่านั้นฝึกโมเดลด้วยข้อมูลลูกค้า — ดูข้อ 10",
        },
        {
          p: "**9.3 ข้อมูลรวมและข้อมูลที่ไม่ระบุตัวตน** Certrace อาจสร้างสถิติแบบรวมหรือแบบไม่ระบุตัวตนจากข้อมูลลูกค้า (เช่น ค่ามาตรฐานรายสาขาและช่วงการกระจายตัว) ซึ่งไม่ระบุตัวลูกค้า ผู้เข้าร่วมฝ่ายซัพพลายเออร์ สถานประกอบการ หรือบุคคลใด และอาจใช้และเผยแพร่ข้อมูลรวมดังกล่าวเพื่อการวิจัย การปรับปรุงผลิตภัณฑ์ และการเทียบมาตรฐานอุตสาหกรรม Certrace จะไม่เผยแพร่ค่ารวมที่อาจย้อนกลับไประบุตัวลูกค้ารายเดียวหรือสถานประกอบการเดียวได้ตามสมควร",
        },
        {
          p: "**9.4 คำรับประกันเกี่ยวกับข้อมูลลูกค้า** ลูกค้ารับรองและรับประกันว่า (ก) ตนมีสิทธิ ความยินยอม และอำนาจที่จำเป็นทั้งหมดในการส่งข้อมูลลูกค้าเข้าสู่แพลตฟอร์ม — รวมถึงข้อมูลที่มาจากผู้เข้าร่วมฝ่ายซัพพลายเออร์ — และในการให้สิทธิตามข้อ 9.2 (ข) ข้อมูลลูกค้าไม่ละเมิดสิทธิของบุคคลภายนอกหรือฝ่าฝืนกฎหมาย และ (ค) ข้อมูลลูกค้าถูกต้องและครบถ้วนเท่าที่ลูกค้าทราบ Certrace ไม่ได้ตรวจสอบความถูกต้องหรือความครบถ้วนของข้อมูลลูกค้าโดยอิสระ และลูกค้ารับผิดชอบแต่เพียงผู้เดียว การคำนวณย่อมดีได้เพียงเท่าที่ตัวเลขตั้งต้นดี",
        },
        {
          p: "**9.5 การส่งออกและการลบข้อมูล** ระหว่างระยะเวลาการสมัครสมาชิก ลูกค้าสามารถส่งออกข้อมูลลูกค้าผ่านฟังก์ชันส่งออกมาตรฐานของแพลตฟอร์ม เมื่อสิ้นสุดหรือยุติระยะเวลาการสมัครสมาชิก หรือเมื่อสิ้นสุดช่วงทดลองใช้ฟรี Certrace จะเปิดให้ส่งออกข้อมูลลูกค้าได้เป็นเวลาสามสิบ (30) วัน หลังจากนั้น Certrace อาจลบหรือทำให้ข้อมูลลูกค้าไม่ระบุตัวตนตามแนวปฏิบัติการเก็บรักษาข้อมูลและนโยบายความเป็นส่วนตัวของ Certrace ลูกค้ามีหน้าที่ดำเนินการส่งออกนั้น Certrace ไม่ใช่ระบบบันทึกสำหรับภาระการเก็บรักษาตามกฎหมายของลูกค้า และลูกค้าต้องไม่ใช้แพลตฟอร์มเป็นคลังเอกสารเพียงแหล่งเดียว",
        },
        {
          p: "**9.6 เนื้อหาที่ห้ามอัปโหลด** ลูกค้าต้องไม่อัปโหลดเข้าสู่แพลตฟอร์มซึ่งข้อมูลส่วนบุคคลอ่อนไหว ข้อมูลสุขภาพ ข้อมูลชีวมิติ ข้อมูลบัตรชำระเงิน เอกสารแสดงตนที่ออกโดยรัฐ หรือข้อมูลทางเทคนิคที่เป็นความลับหรืออยู่ภายใต้การควบคุมการส่งออก เว้นแต่ตกลงเป็นหนังสือกับ Certrace ไว้ล่วงหน้า ข้อมูลการปล่อยก๊าซและการผลิตไม่จำเป็นต้องใช้สิ่งเหล่านี้ และแพลตฟอร์มไม่ได้ตั้งค่าให้ปกป้องข้อมูลประเภทดังกล่าวในระดับที่ข้อมูลเหล่านั้นเรียกร้อง",
        },
      ],
    },
    {
      id: "ai",
      heading: "10. การประมวลผลอัตโนมัติและฟีเจอร์ปัญญาประดิษฐ์",
      blocks: [
        {
          p: "**10.1 อะไรบ้างที่เป็นอัตโนมัติ** แพลตฟอร์มใช้การประมวลผลอัตโนมัติในหลายจุด รวมถึงการตรวจสอบความถูกต้อง การแปลงหน่วยให้เป็นมาตรฐาน และการตรวจความสมเหตุสมผลของข้อมูลที่ส่งเข้ามาแบบกำหนดผลลัพธ์แน่นอน การคำนวณค่าการปล่อยก๊าซแฝงตามกฎรายสาขา การให้คะแนนความพร้อมและความครบถ้วน และเมื่อลูกค้าเปิดใช้งาน การสกัดค่าจากเอกสารหลักฐานด้วย AI และการสรุปการเปลี่ยนแปลง ความเสี่ยง และคุณภาพข้อมูลด้วย AI",
        },
        {
          p: "**10.2 การสกัดข้อมูลทำได้เพียงเสนอ ไม่เขียนเอง** เมื่อเปิดใช้การสกัดข้อมูลด้วย AI ค่าที่สกัดได้จะแสดงเป็นข้อเสนอพร้อมระดับความเชื่อมั่น และจะถูกบันทึกลงในระเบียนของลูกค้าก็ต่อเมื่อผู้ใช้ที่ได้รับอนุญาตกดยอมรับเท่านั้น Certrace ไม่เติมค่าลงในช่องข้อมูลจากเอกสารโดยเงียบ ๆ นี่เป็นข้อจำกัดที่ออกแบบไว้โดยเจตนา ไม่ใช่ข้อจำกัดชั่วคราว เพราะคุณค่าเชิงหลักฐานของตัวเลขการปล่อยก๊าซขึ้นอยู่กับการที่มนุษย์ผูกตัวเลขนั้นกับเอกสารต้นทาง และช่องที่ถูกเติมอัตโนมัติทำลายความสามารถในการสาวกลับซึ่งเป็นสิ่งที่ผู้ทวนสอบตรวจพอดี",
        },
        {
          p: "**10.3 ผลลัพธ์ของ AI เป็นความน่าจะเป็น** ผลลัพธ์จากฟีเจอร์ที่ใช้ AI อาจไม่ครบถ้วน ไม่ถูกต้อง หรือผิดในลักษณะที่ไม่ปรากฏชัด รวมถึงกรณีที่ดูมั่นใจ ลูกค้าต้องตรวจสอบค่าที่เสนอทุกค่ากับเอกสารต้นทางก่อนกดยอมรับ เมื่อกดยอมรับแล้ว ค่านั้นถือเป็นข้อมูลลูกค้าและลูกค้ารับผิดชอบ ไม่ว่าสิ่งใดจะเป็นผู้เสนอ Certrace ไม่รับประกันความถูกต้องของผลลัพธ์ที่ใช้ AI และปฏิเสธความรับผิดทั้งปวงที่เกิดจากการที่ลูกค้ากดยอมรับหรือใช้อ้างอิงผลลัพธ์ดังกล่าว เท่าที่กฎหมายอนุญาตสูงสุด",
        },
        {
          p: "**10.4 ผู้ประมวลผลช่วงด้าน AI และการปิดใช้งาน** ฟีเจอร์ที่ใช้ AI อาจส่งเอกสารหรือส่วนของข้อมูลที่เกี่ยวข้องไปยังผู้ให้บริการโมเดลภายนอกที่ว่าจ้างในฐานะผู้ประมวลผลช่วง ฟีเจอร์เหล่านั้นเป็นทางเลือกและไม่ได้เปิดใช้งานโดยค่าเริ่มต้น แพลตฟอร์มใช้งานได้เต็มรูปแบบโดยปิดฟีเจอร์เหล่านี้ และลูกค้าสามารถปิดได้ตลอดเวลา รายชื่อผู้ประมวลผลช่วงด้าน AI ในปัจจุบันและเงื่อนไขการว่าจ้าง — รวมถึงข้อห้ามใช้ข้อมูลลูกค้าฝึกโมเดล — ระบุไว้ในนโยบายความเป็นส่วนตัว",
        },
        {
          p: "**10.5 ไม่มีการตัดสินใจอัตโนมัติที่มีผลทางกฎหมาย** Certrace ไม่ใช้แพลตฟอร์มในการตัดสินใจที่ก่อผลทางกฎหมายต่อบุคคลใด หรือส่งผลกระทบต่อบุคคลในทำนองเดียวกันอย่างมีนัยสำคัญ คะแนน สัญญาณ และตัวชี้วัดความพร้อมมุ่งไปที่องค์กรและสถานประกอบการ มีลักษณะเป็นคำแนะนำ และอยู่ภายใต้การทบทวนโดยมนุษย์ของลูกค้าเสมอ",
        },
        {
          p: "**10.6 ข้อมูลรับรองของผู้ให้บริการโมเดลที่ลูกค้าจัดหาเอง** ในกรณีที่แพลตฟอร์มอนุญาตให้ลูกค้าใส่ข้อมูลรับรองของผู้ให้บริการโมเดลภายนอกของตนเอง ลูกค้ารับผิดชอบข้อมูลรับรองนั้น รับผิดชอบเงื่อนไขของสัญญาที่ตนมีกับผู้ให้บริการรายนั้น และรับผิดชอบค่าใช้จ่ายทั้งหมดที่เกิดขึ้น Certrace ไม่ได้เป็นคู่สัญญาในความสัมพันธ์ดังกล่าว",
        },
      ],
    },
    {
      id: "reports",
      heading: "11. รายงาน ผลลัพธ์ และข้อจำกัดความรับผิดด้านคำแนะนำทางกฎระเบียบ",
      blocks: [
        {
          p: "**11.1 เพื่อเป็นข้อมูลเท่านั้น** รายงานและผลลัพธ์ทั้งหมด ตลอดจนข้อเสนอแนะ ค่ามาตรฐานเทียบเคียง ตัวชี้วัดความพร้อม สัญญาณความเสี่ยง การประมาณต้นทุน หรือคะแนนที่แพลตฟอร์มสร้างขึ้น ให้ไว้ “ตามสภาพ” เพื่อเป็นข้อมูลเท่านั้น ไม่ถือเป็นคำแนะนำทางกฎหมาย ศุลกากร ภาษี บัญชี วิศวกรรม หรือวิชาชีพหรือกฎระเบียบอื่นใด และไม่ใช่ความเห็นการทวนสอบ",
        },
        {
          p: "**11.2 ไม่รับประกันการยอมรับจากหน่วยงาน** Certrace ไม่รับประกันว่ารายงานหรือผลลัพธ์ใดจะได้รับการยอมรับจากคณะกรรมาธิการยุโรป หน่วยงานศุลกากรหรือหน่วยงานผู้มีอำนาจของรัฐสมาชิกสหภาพยุโรป ผู้ยื่นแจ้ง CBAM ผู้ซื้อ ผู้ทวนสอบที่ได้รับการรับรอง หน่วยงานรัฐของไทย หรือหน่วยงานอื่นใด และไม่รับประกันว่าการใช้แพลตฟอร์มจะทำให้เกิดการปฏิบัติตาม CBAM การหลีกเลี่ยงค่าปรับหรือการบวกเพิ่มจากค่าเริ่มต้น หรือผลลัพธ์เฉพาะอื่นใด ดูข้อ 5",
        },
        {
          p: "**11.3 หน้าที่ตรวจสอบของลูกค้า** ลูกค้ามีหน้าที่แต่เพียงผู้เดียวในการทบทวน ตรวจสอบ และในกรณีที่กฎหมายกำหนด จัดให้มีการทวนสอบโดยหน่วยงานอิสระที่ได้รับการรับรองสำหรับรายงานและผลลัพธ์ทั้งหมด ก่อนส่งให้หน่วยงานกำกับดูแล หน่วยงานศุลกากร ผู้นำเข้า คู่ค้า หรือบุคคลภายนอกอื่น และรับผิดชอบเนื้อหาสุดท้ายของการยื่นอย่างเป็นทางการที่อ้างอิงรายงานหรือผลลัพธ์นั้น",
        },
        {
          p: "**11.4 สถานะร่างและสถานะปิดผนึก** แพลตฟอร์มแยกระหว่างงานที่ยังดำเนินอยู่กับงานที่ผ่านการลงนามรับรองแล้ว และกำกับผลลัพธ์ที่ยังไม่สมบูรณ์ไว้ตามนั้น เอกสารที่มีเครื่องหมายร่างต้องไม่ถูกนำเสนอต่อบุคคลภายนอกในฐานะข้อสรุปสุดท้าย การลบ บดบัง หรือแก้ไขเครื่องหมายร่าง เลขเวอร์ชัน ค่าแฮชของชุดข้อมูล หรือบันทึกการลงนามรับรองบนผลลัพธ์ ถือเป็นการผิดสัญญาในสาระสำคัญ",
        },
        {
          p: "**11.5 ค่าประมาณคือค่าประมาณ** ตัวเลขต้นทุนคาร์บอน ต้นทุนใบรับรอง ความเสี่ยงทางการเงิน และเงินที่ประหยัดได้ซึ่งแพลตฟอร์มสร้างขึ้น เป็นค่าประมาณจากแบบจำลองที่อิงราคาอ้างอิงที่เผยแพร่และข้อมูลของลูกค้า ณ ช่วงเวลาหนึ่ง ไม่ใช่ใบเสนอราคา การประเมินมูลค่า การพยากรณ์ หรือคำแนะนำทางการเงิน ค่าเหล่านี้จะเปลี่ยนแปลง และต้องไม่ถูกนำเสนอต่อบุคคลภายนอก — รวมถึงนักลงทุน ผู้ให้กู้ หรือผู้สอบบัญชี — ในฐานะภาระหนี้ที่กำหนดแน่นอนแล้ว",
        },
      ],
    },
    {
      id: "records",
      heading: "12. บันทึก เวอร์ชัน และร่องรอยการตรวจสอบ",
      blocks: [
        {
          p: "**12.1 ความไม่เปลี่ยนแปลงโดยการออกแบบ** เมื่อแพลตฟอร์มปิดผนึกการส่งข้อมูลหรือรายงาน ระบบจะเก็บเวอร์ชันของชุดข้อมูลต้นทางที่ไม่เปลี่ยนแปลงได้ พร้อมค่าแฮชความสมบูรณ์และบันทึกว่าใครอนุมัติเมื่อใด ลูกค้ารับทราบว่านี่เป็นคุณลักษณะที่ตั้งใจให้เป็นเช่นนั้น และเวอร์ชันที่ปิดผนึกกับบันทึกการตรวจสอบไม่สามารถแก้ไขหรือลบเฉพาะส่วนผ่านกลไกปกติของแพลตฟอร์มได้ รวมถึงโดยลูกค้าเอง",
        },
        {
          p: "**12.2 คำขอลบข้อมูลที่อยู่ในบันทึกที่ปิดผนึก** ในกรณีที่ลูกค้าหรือเจ้าของข้อมูลส่วนบุคคลขอให้ลบข้อมูลที่อยู่ในเวอร์ชันที่ปิดผนึกหรือบันทึกการตรวจสอบ Certrace จะดำเนินการเท่าที่ทำได้และเท่าที่กฎหมายกำหนด แต่ลูกค้ารับทราบว่าความสมบูรณ์ของบันทึกการปฏิบัติตามกฎหมายเป็นประโยชน์โดยชอบด้วยกฎหมายและเป็นฐานการปฏิบัติตามกฎหมายในการเก็บรักษาข้อมูล และการปฏิบัติตามคำขอดังกล่าวอาจต้องลบทั้งเวอร์ชันแทนที่จะลบเฉพาะช่องข้อมูล ดูรายละเอียดในนโยบายความเป็นส่วนตัว",
        },
        {
          p: "**12.3 การลงนามรับรองและการแบ่งแยกหน้าที่** ในกรณีที่ลูกค้าตั้งค่าการลงนามรับรอง การตรวจแบบสี่ตา หรือลำดับการอนุมัติ แพลตฟอร์มจะบันทึกตัวตนของผู้อนุมัติแต่ละรายตามที่ระบบควบคุมบัญชีของลูกค้ายืนยันตัวตนไว้ Certrace ไม่ได้ตรวจสอบอำนาจตามกฎหมายของผู้อนุมัติภายในองค์กรของลูกค้า และการอนุมัติที่บันทึกไว้ในแพลตฟอร์มถือเป็นการกระทำของลูกค้า",
        },
        {
          p: "**12.4 การเก็บรักษาตามกฎหมายเป็นหน้าที่ของลูกค้า** CBAM และระบบที่เกี่ยวข้องกำหนดภาระการเก็บรักษาเอกสารแก่ผู้ยื่นและผู้ดำเนินการ ภาระเหล่านั้นเป็นของลูกค้า มีระยะเวลาที่อาจยาวกว่าระยะเวลาการสมัครสมาชิกของลูกค้า และไม่ถือว่าปฏิบัติครบถ้วนเพียงเพราะข้อมูลอยู่ในแพลตฟอร์ม ดูข้อ 4.5 และ 9.5",
        },
      ],
    },
    {
      id: "acceptable-use",
      heading: "13. นโยบายการใช้งานที่ยอมรับได้",
      blocks: [
        { p: "ลูกค้าจะไม่กระทำ และจะดูแลให้ผู้ใช้ที่ได้รับอนุญาตไม่กระทำการดังนี้" },
        {
          ul: [
            "(ก) ส่งข้อมูล ข้อมูลรับรอง เอกสาร หรือสารสนเทศที่ลูกค้าไม่มีสิทธิ์ส่ง หรือที่รู้อยู่ว่าเป็นเท็จ ฉ้อฉล ลงวันที่ย้อนหลัง หรือทำให้เข้าใจผิด หรือแสดงแหล่งที่มา ช่วงเวลา หรือสถานประกอบการของข้อมูลอย่างคลาดเคลื่อน",
            "(ข) ใช้แพลตฟอร์มเพื่อสร้างหรือเสนอผลิตภัณฑ์หรือบริการที่แข่งขันกัน หรือเพื่อเทียบเคียงแพลตฟอร์มเพื่อวัตถุประสงค์ในการแข่งขัน โดยไม่ได้รับความยินยอมเป็นหนังสือล่วงหน้าจาก Certrace",
            "(ค) ใช้วิธีอัตโนมัติ (บ็อต โปรแกรมดึงข้อมูล หรือลักษณะเดียวกัน) เข้าถึงหรือดึงข้อมูลจากแพลตฟอร์มนอกเหนือจากผ่าน API ที่ Certrace รองรับ หรือพยายามคาดเดา ไล่เรียง หรือเดาสุ่มโทเคนสมาร์ทลิงก์หรือรหัสระบุอื่นใด",
            "(ง) พยายามทำวิศวกรรมย้อนกลับ ถอดรหัส หรือค้นหาซอร์สโค้ด อัลกอริทึม ชุดข้อมูลอ้างอิง หรือโมเดลเบื้องหลังของแพลตฟอร์ม เว้นแต่ในขอบเขตที่กฎหมายห้ามมิให้จำกัดสิทธิดังกล่าว",
            "(จ) ตรวจ สแกน หรือทดสอบช่องโหว่ของแพลตฟอร์ม หรือละเมิดหรือหลบเลี่ยงกลไกยืนยันตัวตน การจำกัดอัตราการเรียกใช้ หรือเพดานแพ็กเกจ เว้นแต่ได้รับอนุญาตเป็นหนังสือจาก Certrace",
            "(ฉ) อัปโหลดหรือส่งโค้ดที่เป็นอันตราย ไวรัส หรือเนื้อหาที่ผิดกฎหมาย หมิ่นประมาท หรือละเมิดทรัพย์สินทางปัญญาหรือความเป็นส่วนตัวของบุคคลภายนอก",
            "(ช) แก้ไข ลบ หรือบดบังเครื่องหมายร่าง เลขเวอร์ชัน ค่าแฮชของชุดข้อมูล บันทึกการลงนามรับรอง หรือรายการในร่องรอยการตรวจสอบบนผลลัพธ์ใด ๆ หรือนำเสนอฉบับร่างในฐานะข้อสรุปสุดท้าย",
            "(ซ) แบ่งปันข้อมูลการเข้าสู่ระบบของผู้ใช้ที่ได้รับอนุญาตให้บุคคลที่ไม่ได้รับอนุญาตให้ถือข้อมูลนั้น หรือขายต่อ ให้สิทธิช่วง หรือให้บุคคลภายนอกเข้าถึงแพลตฟอร์มโดยไม่ได้รับความยินยอมเป็นหนังสือล่วงหน้าจาก Certrace — ทั้งนี้การเชิญผู้เข้าร่วมฝ่ายซัพพลายเออร์ผ่านสมาร์ทลิงก์กระทำได้โดยชัดแจ้ง และไม่ถือเป็นการให้บุคคลภายนอกเข้าถึงตามความหมายในข้อนี้ หรือ",
            "(ฌ) ใช้แพลตฟอร์มในลักษณะที่ฝ่าฝืนกฎหมายควบคุมการส่งออก มาตรการคว่ำบาตร กฎหมายต่อต้านการให้สินบน หรือกฎหมายต่อต้านการทุจริตที่ใช้บังคับ",
          ],
        },
        {
          p: "Certrace สงวนสิทธิ์ในการสอบสวนกรณีที่สงสัยว่ามีการฝ่าฝืน และในการระงับหรือยุติการเข้าถึงตามข้อ 20",
        },
      ],
    },
    {
      id: "ip",
      heading: "14. สิทธิในทรัพย์สินทางปัญญา",
      blocks: [
        {
          p: "**14.1 ทรัพย์สินทางปัญญาของ Certrace** ระหว่างคู่สัญญา Certrace และผู้ให้สิทธิของ Certrace คงไว้ซึ่งสิทธิ กรรมสิทธิ์ และผลประโยชน์ทั้งหมดในแพลตฟอร์ม รวมถึงซอฟต์แวร์ ระเบียบวิธีการคำนวณ ชุดข้อมูลอ้างอิงและค่าการปล่อยก๊าซ การจับคู่รหัสจำแนกประเภท แบบฟอร์ม รูปแบบเอกสาร อัลกอริทึม พรอมป์ ส่วนต่อประสานผู้ใช้ และสิทธิในทรัพย์สินทางปัญญาที่เกี่ยวข้องทั้งหมด ข้อกำหนดฉบับนี้ไม่ได้ให้ความเป็นเจ้าของในแพลตฟอร์มแก่ลูกค้า",
        },
        {
          p: "**14.2 สิทธิการใช้งานที่ให้แก่ลูกค้า** ภายใต้การปฏิบัติตามข้อกำหนดฉบับนี้และการชำระค่าธรรมเนียม Certrace ให้สิทธิลูกค้าแบบจำกัด ไม่จำกัดแต่เพียงผู้เดียว โอนไม่ได้ ให้สิทธิช่วงไม่ได้ และเพิกถอนได้ ในระหว่างระยะเวลาการสมัครสมาชิก เพื่อเข้าถึงและใช้งานแพลตฟอร์ม และเพื่อดาวน์โหลด แสดง และเผยแพร่รายงานและผลลัพธ์เพื่อวัตถุประสงค์ทางธุรกิจและการปฏิบัติตามกฎหมายของลูกค้าเอง รวมถึงการแบ่งปันให้ลูกค้าของลูกค้า ผู้นำเข้า ผู้ทวนสอบ ผู้สอบบัญชี และหน่วยงานกำกับดูแลตามความจำเป็น สิทธิในการเผยแพร่นั้นยังคงอยู่หลังการสิ้นสุดสัญญาสำหรับผลลัพธ์ที่สร้างขึ้นในระหว่างระยะเวลาการสมัครสมาชิก",
        },
        {
          p: "**14.3 ข้อเสนอแนะ** หากลูกค้าหรือผู้ใช้ที่ได้รับอนุญาตให้ข้อเสนอแนะ คำขอฟีเจอร์ รายงานข้อบกพร่อง หรือความคิดเห็นอื่นเกี่ยวกับแพลตฟอร์ม Certrace อาจใช้ นำไปรวม และนำไปใช้เชิงพาณิชย์ได้โดยไม่มีข้อจำกัด ไม่ต้องระบุที่มา และไม่มีค่าตอบแทน และลูกค้าโอนสิทธิใด ๆ ที่ตนอาจมีในข้อเสนอแนะนั้นให้ Certrace",
        },
        {
          p: "**14.4 การอ้างชื่อและเครื่องหมายการค้า** คู่สัญญาฝ่ายใดฝ่ายหนึ่งจะไม่ใช้ชื่อ โลโก้ หรือเครื่องหมายการค้าของอีกฝ่ายโดยไม่ได้รับความยินยอมเป็นหนังสือล่วงหน้า ยกเว้น Certrace อาจระบุว่าลูกค้าเป็นลูกค้าในสื่อธุรกิจตามปกติ เว้นแต่ลูกค้าแจ้งคัดค้านเป็นหนังสือ",
        },
      ],
    },
    {
      id: "confidentiality",
      heading: "15. การรักษาความลับ",
      blocks: [
        {
          p: "**15.1 นิยาม** “ข้อมูลที่เป็นความลับ” หมายถึง ข้อมูลที่ไม่เปิดเผยต่อสาธารณะซึ่งฝ่ายหนึ่ง (“ผู้เปิดเผย”) เปิดเผยต่ออีกฝ่าย (“ผู้รับ”) ไม่ว่าด้วยวาจาหรือเป็นลายลักษณ์อักษร ซึ่งระบุว่าเป็นความลับหรือที่วิญญูชนพึงเข้าใจว่าเป็นความลับตามลักษณะของข้อมูลและพฤติการณ์การเปิดเผย รวมถึงข้อมูลลูกค้า ตัวตนและเงื่อนไขของซัพพลายเออร์ ตัวเลขการผลิตและการปล่อยก๊าซ ข้อมูลธุรกิจและการเงิน ราคา เอกสารด้านความปลอดภัย และแผนพัฒนาผลิตภัณฑ์ — แต่ไม่รวมข้อมูลที่ (ก) เป็นหรือกลายเป็นข้อมูลสาธารณะโดยมิใช่ความผิดของผู้รับ (ข) ผู้รับทราบโดยชอบอยู่ก่อนการเปิดเผย (ค) ได้รับโดยชอบจากบุคคลภายนอกโดยไม่มีการผิดหน้าที่รักษาความลับ หรือ (ง) พัฒนาขึ้นเองโดยไม่ได้ใช้ข้อมูลที่เป็นความลับของผู้เปิดเผย",
        },
        {
          p: "**15.2 หน้าที่** ผู้รับจะ (ก) ใช้ข้อมูลที่เป็นความลับเพียงเพื่อปฏิบัติหน้าที่หรือใช้สิทธิของตนตามข้อกำหนดฉบับนี้ (ข) ปกป้องข้อมูลนั้นด้วยความระมัดระวังไม่น้อยกว่าที่ใช้กับข้อมูลลับของตนเองในลักษณะเดียวกัน และไม่น้อยกว่าความระมัดระวังตามสมควร และ (ค) ไม่เปิดเผยต่อบุคคลภายนอก เว้นแต่ต่อพนักงาน ผู้รับจ้าง ผู้ประมวลผลช่วง และที่ปรึกษาวิชาชีพที่จำเป็นต้องรู้ และผูกพันด้วยหน้าที่รักษาความลับที่คุ้มครองไม่น้อยกว่าที่กำหนดไว้ในที่นี้",
        },
        {
          p: "**15.3 การเปิดเผยตามคำสั่ง** ผู้รับอาจเปิดเผยข้อมูลที่เป็นความลับเท่าที่กฎหมาย กฎระเบียบ หรือคำสั่งศาลกำหนด โดยหากกฎหมายอนุญาต ผู้รับจะแจ้งผู้เปิดเผยล่วงหน้าตามสมควรเพื่อขอคำสั่งคุ้มครอง และเปิดเผยเพียงเท่าที่กฎหมายบังคับ",
        },
        {
          p: "**15.4 การคงอยู่ของหน้าที่** หน้าที่ตามข้อนี้คงอยู่ต่อไปอีกห้า (5) ปีหลังการสิ้นสุดสัญญา และคงอยู่ตลอดไปสำหรับข้อมูลที่เป็นความลับซึ่งถือเป็นความลับทางการค้าตามกฎหมาย",
        },
      ],
    },
    {
      id: "data-protection",
      heading: "16. การคุ้มครองข้อมูลและความเป็นส่วนตัว",
      blocks: [
        {
          p: "**16.1 การแบ่งบทบาท** Certrace ประมวลผลข้อมูลส่วนบุคคลตามนโยบายความเป็นส่วนตัวของ Certrace ซึ่งถือเป็นส่วนหนึ่งของข้อกำหนดฉบับนี้โดยการอ้างอิง ในกรณีที่ Certrace ประมวลผลข้อมูลส่วนบุคคลที่อยู่ในข้อมูลลูกค้าในนามของลูกค้าและตามคำสั่งของลูกค้า — รวมถึงข้อมูลติดต่อของผู้เข้าร่วมฝ่ายซัพพลายเออร์ และข้อมูลส่วนบุคคลที่ปรากฏโดยบังเอิญในเอกสารหลักฐาน — Certrace ทำหน้าที่เป็นผู้ประมวลผลข้อมูลส่วนบุคคล และลูกค้าทำหน้าที่เป็นผู้ควบคุมข้อมูลส่วนบุคคล ตามความหมายภายใต้ PDPA และ GDPR เท่าที่ใช้บังคับ Certrace ทำหน้าที่เป็นผู้ควบคุมข้อมูลสำหรับข้อมูลบัญชี การเรียกเก็บเงิน การสนับสนุน และการตลาดของลูกค้าเอง",
        },
        {
          p: "**16.2 หน้าที่ของลูกค้าในฐานะผู้ควบคุมข้อมูล** ลูกค้ารับประกันว่าตนมีฐานทางกฎหมายสำหรับการเปิดเผยข้อมูลส่วนบุคคลแต่ละครั้งที่ส่งเข้าสู่แพลตฟอร์ม ว่าตนได้แจ้งและได้รับความยินยอมตามที่กำหนดในส่วนที่เกี่ยวกับผู้เข้าร่วมฝ่ายซัพพลายเออร์และบุคลากรของบุคคลเหล่านั้น และว่าคำสั่งของตนต่อ Certrace จะไม่ทำให้ Certrace ฝ่าฝืนกฎหมายคุ้มครองข้อมูลส่วนบุคคล ข้อนี้สำคัญกว่าในความสัมพันธ์ SaaS ทั่วไป เพราะข้อมูลส่วนบุคคลจำนวนมากในแพลตฟอร์มเป็นข้อมูลของบุคคลที่ทำงานให้ซัพพลายเออร์ของลูกค้า ไม่ใช่ของลูกค้าเอง",
        },
        {
          p: "**16.3 มาตรการความปลอดภัยและเหตุการณ์ละเมิด** Certrace จะจัดให้มีมาตรการทางเทคนิคและองค์กรที่เหมาะสมเพื่อคุ้มครองข้อมูลส่วนบุคคลตามที่อธิบายเพิ่มเติมในนโยบายความเป็นส่วนตัว และจะแจ้งลูกค้าโดยไม่ชักช้าเกินสมควรหลังทราบถึงเหตุการละเมิดข้อมูลส่วนบุคคลที่กระทบข้อมูลลูกค้า พร้อมข้อมูลเท่าที่มีอยู่ตามสมควร",
        },
        {
          p: "**16.4 ข้อตกลงการประมวลผลข้อมูล** เมื่อลูกค้าร้องขอเป็นหนังสือ คู่สัญญาจะเข้าทำข้อตกลงการประมวลผลข้อมูลแยกต่างหาก ซึ่งกำหนดรายละเอียดเพิ่มเติมเกี่ยวกับการประมวลผลช่วง มาตรการคุ้มครองการโอนข้อมูลข้ามพรมแดน สิทธิในการตรวจสอบ และการช่วยเหลือในการตอบสนองคำขอของเจ้าของข้อมูล หากมีการลงนามในข้อตกลงดังกล่าว ให้ยึดข้อตกลงนั้นเหนือข้อ 16 นี้เท่าที่ขัดแย้งกัน",
        },
      ],
    },
    {
      id: "availability",
      heading: "17. ความพร้อมใช้งาน การสนับสนุน และการบำรุงรักษา",
      blocks: [
        {
          p: "**17.1 ความพยายามอันสมเหตุสมผลเชิงพาณิชย์** Certrace จะใช้ความพยายามอันสมเหตุสมผลเชิงพาณิชย์ในการทำให้แพลตฟอร์มพร้อมใช้งานอย่างต่อเนื่อง ยกเว้นการบำรุงรักษาตามกำหนด (ซึ่ง Certrace จะแจ้งล่วงหน้าเท่าที่ทำได้ตามสมควร) การบำรุงรักษาฉุกเฉิน และเหตุการณ์ที่อยู่นอกเหนือการควบคุมตามสมควรของ Certrace",
        },
        {
          p: "**17.2 การสนับสนุน** Certrace จะให้การสนับสนุนลูกค้าตามเงื่อนไขการสนับสนุนที่ระบุในใบสั่งซื้อ หรือหากไม่มีเงื่อนไขดังกล่าว ตามแนวปฏิบัติการสนับสนุนมาตรฐานที่ใช้อยู่ในขณะนั้นสำหรับแพ็กเกจของลูกค้า การสนับสนุนให้บริการในเวลาทำการของประเทศไทย เว้นแต่ตกลงเป็นอย่างอื่น",
        },
        {
          p: "**17.3 ระดับการให้บริการเฉพาะ** ข้อผูกพันด้านเวลาให้บริการ เครดิต หรือเงื่อนไขระดับการให้บริการเฉพาะใด ๆ จะใช้บังคับก็ต่อเมื่อระบุไว้อย่างชัดแจ้งในใบสั่งซื้อที่ลงนามหรือในข้อตกลงระดับการให้บริการแยกต่างหาก ซึ่งจะยึดเหนือข้อ 17 นี้เท่าที่ขัดแย้งกัน หากไม่มีเอกสารดังกล่าว ถือว่าไม่มีข้อผูกพันด้านเวลาให้บริการ",
        },
        {
          p: "**17.4 กำหนดเวลาเป็นของลูกค้า** ลูกค้ารับทราบว่ากำหนดเวลาทางกฎหมายและทางการค้าเป็นความรับผิดชอบของลูกค้า และต้องไม่วางแผนในลักษณะที่ต้องพึ่งพาการที่แพลตฟอร์มพร้อมใช้งาน ณ ช่วงเวลาใดเวลาหนึ่ง การแจ้งเตือน วันครบกำหนด และการนับถอยหลังในแพลตฟอร์มเป็นความสะดวก ไม่ใช่คำมั่น และ Certrace ไม่รับผิดต่อกำหนดเวลาที่พลาดไป",
        },
      ],
    },
    {
      id: "sub-processors",
      heading: "18. บริการของบุคคลภายนอกและผู้ประมวลผลช่วง",
      blocks: [
        {
          p: "**18.1 ผู้ประมวลผลช่วง** แพลตฟอร์มพึ่งพาบริการของบุคคลภายนอกและผู้ให้บริการโครงสร้างพื้นฐานคลาวด์ (แต่ละรายเรียกว่า “ผู้ประมวลผลช่วง”) ในการให้บริการ รวมถึงบริการโฮสต์และจัดเก็บข้อมูลบนคลาวด์ การส่งอีเมล การเฝ้าระวังข้อผิดพลาด การวิเคราะห์ข้อมูล การรับชำระเงิน และสำหรับฟีเจอร์ทางเลือกตามข้อ 10 ผู้ให้บริการโมเดล AI Certrace ยังคงรับผิดชอบการปฏิบัติหน้าที่ของผู้ประมวลผลช่วงที่กระทำในนามของ Certrace",
        },
        {
          p: "**18.2 รายชื่อและการแจ้ง** Certrace จะจัดทำรายชื่อผู้ประมวลผลช่วงที่มีนัยสำคัญและแจ้งเมื่อมีการเพิ่มผู้ประมวลผลช่วงที่มีนัยสำคัญรายใหม่ ตามที่อธิบายเพิ่มเติมในนโยบายความเป็นส่วนตัว หากลูกค้าคัดค้านผู้ประมวลผลช่วงรายใหม่ด้วยเหตุผลด้านการคุ้มครองข้อมูลอย่างสมเหตุสมผลภายในสิบห้า (15) วันนับจากการแจ้ง คู่สัญญาจะหารือกันโดยสุจริต หากไม่อาจตกลงกันได้ สิทธิเยียวยาเดียวของลูกค้าคือการยุติบริการส่วนที่ได้รับผลกระทบและรับคืนค่าธรรมเนียมที่ชำระล่วงหน้าตามสัดส่วนของระยะเวลาที่ยังไม่ได้ใช้",
        },
        {
          p: "**18.3 การเชื่อมต่อกับบริการภายนอก** ในกรณีที่ลูกค้าเชื่อมต่อแพลตฟอร์มกับบริการของบุคคลภายนอกที่ลูกค้าเลือกเอง การเชื่อมต่อนั้นเป็นความเสี่ยงของลูกค้าและอยู่ภายใต้สัญญาระหว่างลูกค้ากับบุคคลภายนอกนั้น Certrace ไม่รับผิดชอบความพร้อมใช้งาน ความปลอดภัย หรือการจัดการข้อมูลที่ลูกค้าส่งไปยังบริการดังกล่าว",
        },
      ],
    },
    {
      id: "beta",
      heading: "19. ฟีเจอร์รุ่นทดลองและรุ่นพรีวิว",
      blocks: [
        {
          p: "Certrace อาจเปิดให้ใช้ฟีเจอร์ที่กำกับว่า “beta” “early access” “preview” “experimental” หรือคำในทำนองเดียวกัน (แต่ละรายการเรียกว่า “ฟีเจอร์รุ่นทดลอง”) ฟีเจอร์รุ่นทดลองให้บริการ “ตามสภาพ” และ “เท่าที่มี” โดยไม่มีการรับประกันใด ๆ ไม่อยู่ในข้อผูกพันด้านเวลาให้บริการหรือการสนับสนุน อาจถูกแก้ไขหรือยกเลิกได้ตลอดเวลาโดยไม่ต้องแจ้งล่วงหน้า และอาจให้ผลลัพธ์ที่ไม่ถูกต้อง ความรับผิดรวมทั้งสิ้นของ Certrace ที่เกิดจากหรือเกี่ยวข้องกับฟีเจอร์รุ่นทดลองจะไม่เกินหนึ่งพันบาท (1,000 บาท) ลูกค้าต้องไม่ใช้ฟีเจอร์รุ่นทดลองเป็นฐานของการยื่นต่อหน่วยงานกำกับดูแลหรือของข้อผูกพันทางการค้า และข้อมูลเกี่ยวกับฟีเจอร์รุ่นทดลองที่ยังไม่เปิดตัวถือเป็นข้อมูลที่เป็นความลับของ Certrace",
        },
      ],
    },
    {
      id: "term",
      heading: "20. ระยะเวลา การระงับ และการยุติ",
      blocks: [
        {
          p: "**20.1 ระยะเวลา** ข้อกำหนดฉบับนี้มีผลตราบเท่าที่ลูกค้ายังคงมีบัญชีหรือใบสั่งซื้อที่ยังมีผลกับ Certrace",
        },
        {
          p: "**20.2 การยุติโดยความสะดวก** คู่สัญญาฝ่ายใดฝ่ายหนึ่งอาจเลือกไม่ต่ออายุระยะเวลาการสมัครสมาชิกโดยแจ้งตามข้อ 6.5",
        },
        {
          p: "**20.3 การยุติเพราะเหตุผิดสัญญา** คู่สัญญาฝ่ายใดฝ่ายหนึ่งอาจยุติข้อกำหนดฉบับนี้หรือใบสั่งซื้อที่เกี่ยวข้อง หากอีกฝ่ายผิดสัญญาในสาระสำคัญและมิได้แก้ไขภายในสามสิบ (30) วันหลังได้รับหนังสือแจ้งที่ระบุการผิดสัญญานั้น (หรือทันที ในกรณีที่ลูกค้าไม่ชำระเงินหลังพ้นระยะเวลาแจ้งตามข้อ 6.4 หรือลูกค้าฝ่าฝืนข้อ 13) คู่สัญญาฝ่ายใดฝ่ายหนึ่งอาจยุติสัญญาได้ทันทีเช่นกัน หากอีกฝ่ายมีหนี้สินล้นพ้นตัว เข้าสู่กระบวนการชำระบัญชีหรือฟื้นฟูกิจการ หรือโอนทรัพย์สินทั่วไปเพื่อประโยชน์ของเจ้าหนี้",
        },
        {
          p: "**20.4 การระงับบริการ** Certrace อาจระงับการเข้าถึงแพลตฟอร์มของลูกค้าทั้งหมดหรือบางส่วน โดยแจ้งเท่าที่ทำได้ตามสมควร หาก Certrace เชื่อโดยมีเหตุอันสมควรว่าการเข้าถึงต่อไปก่อความเสี่ยงด้านความปลอดภัย อาจทำให้ Certrace ผู้เข้าร่วมฝ่ายซัพพลายเออร์ หรือบุคคลภายนอกต้องรับผิด หรือเป็นการฝ่าฝืนข้อ 13 Certrace จะคืนการเข้าถึงโดยเร็วเมื่อเหตุนั้นได้รับการแก้ไข",
        },
        {
          p: "**20.5 ผลของการยุติ** เมื่อยุติหรือสิ้นสุดสัญญา สิทธิ์ในการเข้าถึงแพลตฟอร์มของลูกค้าสิ้นสุดลง และลูกค้ายังคงต้องรับผิดในค่าธรรมเนียมทั้งหมดที่เกิดขึ้นก่อนวันที่การยุติมีผล ระยะเวลาส่งออกข้อมูลตามข้อ 9.5 ใช้บังคับ ข้อ 2, 5, 9.1, 9.5, 10.3, 11, 12, 14.1, 14.2, 14.3, 15, 16, 21, 22, 23 และ 26 ยังคงมีผลต่อไปหลังการยุติ พร้อมกับข้อกำหนดอื่นใดที่โดยสภาพควรมีผลต่อไป",
        },
      ],
    },
    {
      id: "warranties",
      heading: "21. การรับประกันและข้อจำกัดความรับผิด",
      blocks: [
        {
          p: "**21.1 คำรับรองร่วม** คู่สัญญาแต่ละฝ่ายรับรองว่าตนมีอำนาจตามกฎหมายในการเข้าทำข้อกำหนดฉบับนี้",
        },
        {
          p: "**21.2 ข้อปฏิเสธการรับประกัน** เว้นแต่ที่ระบุไว้อย่างชัดแจ้งในข้อกำหนดฉบับนี้ แพลตฟอร์มและรายงานและผลลัพธ์ทั้งหมดให้บริการ “ตามสภาพ” และ “เท่าที่มี” โดยไม่มีการรับประกันใด ๆ ไม่ว่าโดยชัดแจ้ง โดยปริยาย หรือโดยผลของกฎหมาย รวมถึงการรับประกันด้านความสามารถในเชิงพาณิชย์ ความเหมาะสมกับวัตถุประสงค์เฉพาะ ความถูกต้อง การไม่ละเมิดสิทธิ หรือว่าแพลตฟอร์มจะทำงานต่อเนื่อง ปราศจากข้อผิดพลาด หรือปลอดภัย เท่าที่กฎหมายอนุญาตสูงสุด โดยไม่จำกัดความข้างต้น Certrace ไม่รับประกันความถูกต้อง ความเป็นปัจจุบัน หรือความเพียงพอทางกฎหมายของข้อมูลอ้างอิง ค่าเริ่มต้น ค่าการปล่อยก๊าซ การจับคู่รหัสจำแนกประเภท การคำนวณ ตัวชี้วัดความพร้อม หรือผลลัพธ์ที่ใช้ AI ใด ๆ",
        },
      ],
    },
    {
      id: "indemnification",
      heading: "22. การชดใช้ค่าเสียหาย",
      blocks: [
        {
          p: "**22.1 โดย Certrace** Certrace จะแก้ต่างให้ลูกค้าในข้อเรียกร้องของบุคคลภายนอกที่กล่าวหาว่าแพลตฟอร์มตามที่ Certrace จัดหาให้และใช้ตามข้อกำหนดฉบับนี้ ละเมิดสิทธิในทรัพย์สินทางปัญญาของบุคคลภายนอกนั้น และจะชดใช้ค่าเสียหายที่ศาลตัดสินถึงที่สุด ทั้งนี้ลูกค้าต้องแจ้ง Certrace โดยพลัน ให้ Certrace ควบคุมการต่อสู้คดีและการประนีประนอมยอมความแต่เพียงผู้เดียว และให้ความร่วมมือตามสมควร หน้าที่นี้ไม่ใช้กับข้อเรียกร้องที่เกิดจาก (ก) ข้อมูลลูกค้า (ข) การดัดแปลงแพลตฟอร์มที่มิได้กระทำโดย Certrace (ค) การใช้แพลตฟอร์มร่วมกับผลิตภัณฑ์ที่ Certrace มิได้จัดหา ซึ่งการละเมิดจะไม่เกิดขึ้นหากไม่มีการใช้ร่วมกันนั้น (ง) ฟีเจอร์รุ่นทดลอง หรือ (จ) การใช้งานที่ฝ่าฝืนข้อกำหนดฉบับนี้ หากแพลตฟอร์มตกเป็นหรือ Certrace เชื่อว่าอาจตกเป็นเป้าของข้อเรียกร้องดังกล่าว Certrace อาจเลือกจัดหาสิทธิ์ให้ใช้งานต่อ ดัดแปลงแพลตฟอร์มให้ไม่ละเมิด หรือยุติบริการส่วนที่ได้รับผลกระทบโดยแจ้งพร้อมคืนค่าธรรมเนียมที่ชำระล่วงหน้าตามสัดส่วน ข้อนี้เป็นความรับผิดทั้งหมดของ Certrace และเป็นสิทธิเยียวยาเดียวของลูกค้าในเรื่องการละเมิดทรัพย์สินทางปัญญา",
        },
        {
          p: "**22.2 โดยลูกค้า** ลูกค้าจะแก้ต่างและชดใช้ค่าเสียหายให้ Certrace บริษัทในเครือ และบุคลากรของบุคคลเหล่านั้น สำหรับข้อเรียกร้องของบุคคลภายนอก ตลอดจนค่าเสียหาย ค่าปรับ และค่าใช้จ่ายทางกฎหมายตามสมควรที่เกิดขึ้น อันเกิดจาก (ก) ข้อมูลลูกค้า รวมถึงข้อมูลที่ผู้เข้าร่วมฝ่ายซัพพลายเออร์ส่งผ่านสมาร์ทลิงก์ที่ออกจากบัญชีของลูกค้า (ข) การที่ลูกค้าหรือผู้ใช้ที่ได้รับอนุญาตฝ่าฝืนข้อกำหนดฉบับนี้หรือกฎหมาย รวมถึงกฎหมายคุ้มครองข้อมูลส่วนบุคคล (ค) การที่ลูกค้าใช้รายงานหรือผลลัพธ์ในลักษณะที่ขัดกับข้อ 5 หรือ 11 รวมถึงการนำเสนอในฐานะการยื่นต่อหน่วยงาน ความเห็นการทวนสอบ หรือภาระหนี้ที่กำหนดแน่นอนแล้ว (ง) ข้อเรียกร้องใด ๆ จากผู้เข้าร่วมฝ่ายซัพพลายเออร์ ผู้ซื้อ ผู้นำเข้า ผู้ทวนสอบ หรือหน่วยงานกำกับดูแล ที่เกี่ยวกับข้อมูลที่ลูกค้าเก็บรวบรวม ยอมรับ หรือส่งผ่านแพลตฟอร์ม หรือ (จ) การที่ลูกค้าไม่ได้รับความยินยอมหรือไม่ได้แจ้งตามที่กฎหมายกำหนด",
        },
      ],
    },
    {
      id: "liability",
      heading: "23. การจำกัดความรับผิด",
      blocks: [
        {
          p: "**23.1 การยกเว้นความเสียหายทางอ้อม** เท่าที่กฎหมายอนุญาตสูงสุด คู่สัญญาฝ่ายใดฝ่ายหนึ่งจะไม่รับผิดต่อความเสียหายทางอ้อม ความเสียหายโดยบังเอิญ ความเสียหายพิเศษ ความเสียหายสืบเนื่อง หรือค่าเสียหายเชิงลงโทษ หรือการสูญเสียกำไร รายได้ ชื่อเสียง โอกาสทางธุรกิจ หรือข้อมูล ที่เกิดจากหรือเกี่ยวข้องกับข้อกำหนดฉบับนี้หรือแพลตฟอร์ม แม้จะได้รับแจ้งถึงความเป็นไปได้ของความเสียหายดังกล่าวแล้วก็ตาม",
        },
        {
          p: "**23.2 การยกเว้นเฉพาะเรื่อง** โดยไม่จำกัดข้อ 23.1 Certrace จะไม่รับผิดต่อ ค่าปรับ เบี้ยปรับ ดอกเบี้ย การปรับปรุงตัวเลข การบวกเพิ่มจากค่าเริ่มต้น หรือต้นทุนใบรับรอง CBAM หรือต้นทุนคาร์บอนใด ๆ ที่ลูกค้าหรือบุคคลภายนอกต้องรับภาระ การที่ผู้ทวนสอบ ผู้ซื้อ ผู้นำเข้า ผู้สอบบัญชี หรือหน่วยงานผู้มีอำนาจปฏิเสธชุดข้อมูล รายงาน หรือผลลัพธ์ใด การสูญเสียความสัมพันธ์กับลูกค้า คำสั่งซื้อ หรือการประมูล การพลาดกำหนดเวลาใด ๆ หรือการตัดสินใจใดที่กระทำโดยอาศัยค่าประมาณต้นทุน ความเสี่ยงทางการเงิน หรือค่ามาตรฐานเทียบเคียง",
        },
        {
          p: "**23.3 เพดานความรับผิด** ยกเว้น (ก) หน้าที่ชดใช้ค่าเสียหายตามข้อ 22 (ข) การที่ฝ่ายใดฝ่ายหนึ่งผิดข้อ 15 (การรักษาความลับ) (ค) หน้าที่ชำระเงินของลูกค้า หรือ (ง) ความประมาทเลินเล่ออย่างร้ายแรง การฉ้อฉล หรือการจงใจกระทำผิดของฝ่ายใดฝ่ายหนึ่ง ความรับผิดรวมทั้งสิ้นของแต่ละฝ่ายที่เกิดจากหรือเกี่ยวข้องกับข้อกำหนดฉบับนี้จะไม่เกินค่าธรรมเนียมรวมที่ลูกค้าชำระหรือต้องชำระให้ Certrace ในสิบสอง (12) เดือนก่อนเหตุการณ์ที่ก่อให้เกิดข้อเรียกร้อง เพดานตามข้อ 7.5, 8.5 และ 19 ใช้บังคับแทนเพดานนี้สำหรับเรื่องที่ข้อเหล่านั้นครอบคลุม",
        },
        {
          p: "**23.4 เพดานเดียว** การมีข้อเรียกร้องมากกว่าหนึ่งข้อไม่ทำให้เพดานสูงขึ้น ข้อเรียกร้องของลูกค้าและของบริษัทในเครือหรือผู้ใช้ที่ได้รับอนุญาตของลูกค้าให้นับรวมกันเพื่อวัตถุประสงค์ของข้อนี้",
        },
        {
          p: "**23.5 อายุความตามสัญญา** ห้ามยื่นข้อเรียกร้องที่เกิดจากหรือเกี่ยวข้องกับข้อกำหนดฉบับนี้เมื่อพ้นสิบสอง (12) เดือนนับแต่ผู้เรียกร้องได้ทราบหรือควรได้ทราบตามสมควรถึงข้อเท็จจริงที่ก่อให้เกิดข้อเรียกร้องนั้น เว้นแต่กฎหมายห้ามการกำหนดระยะเวลาเช่นว่า",
        },
        {
          p: "**23.6 ฐานของข้อตกลง** คู่สัญญารับทราบว่าข้อจำกัดในข้อ 23 นี้เป็นฐานสำคัญของข้อตกลง ว่าค่าธรรมเนียมกำหนดขึ้นโดยอาศัยข้อจำกัดเหล่านี้ และว่าข้อจำกัดเหล่านี้ใช้บังคับแม้สิทธิเยียวยาที่จำกัดไว้จะไม่บรรลุวัตถุประสงค์สำคัญของมัน ไม่มีข้อความใดในข้อกำหนดฉบับนี้ที่ยกเว้นหรือจำกัดความรับผิดที่กฎหมายไม่อนุญาตให้ยกเว้นหรือจำกัด",
        },
      ],
    },
    {
      id: "force-majeure",
      heading: "24. เหตุสุดวิสัย",
      blocks: [
        {
          p: "คู่สัญญาฝ่ายใดฝ่ายหนึ่งจะไม่รับผิดต่อความล่าช้าหรือการไม่ปฏิบัติหน้าที่ (นอกเหนือจากหน้าที่ชำระเงิน) อันเกิดจากเหตุที่อยู่นอกเหนือการควบคุมตามสมควรของตน รวมถึงภัยธรรมชาติ โรคระบาดหรือการระบาดใหญ่ สงคราม ความไม่สงบทางการเมือง การก่อการร้าย การกระทำของรัฐหรือหน่วยงานกำกับดูแล การห้ามค้าหรือมาตรการคว่ำบาตร ข้อพิพาทแรงงาน ไฟฟ้า อินเทอร์เน็ต หรือโทรคมนาคมขัดข้อง การโจมตีแบบปฏิเสธการให้บริการ หรือความขัดข้องของโครงสร้างพื้นฐานของผู้ให้บริการโฮสต์หรือผู้ประมวลผลช่วง",
        },
      ],
    },
    {
      id: "compliance-laws",
      heading: "25. การควบคุมการส่งออก มาตรการคว่ำบาตร และการต่อต้านการทุจริต",
      blocks: [
        {
          p: "**25.1 การควบคุมทางการค้า** คู่สัญญาแต่ละฝ่ายจะปฏิบัติตามกฎหมายควบคุมการส่งออก กฎหมายศุลกากร และมาตรการคว่ำบาตรทางเศรษฐกิจที่ใช้บังคับ ลูกค้ารับรองว่าตนไม่ได้เป็น ไม่ได้ถูกเป็นเจ้าของหรือควบคุมโดย และไม่ได้กระทำการในนามของ บุคคลที่ถูกกำหนดในบัญชีรายชื่อมาตรการคว่ำบาตรที่ใช้บังคับ และจะไม่เปิดให้บุคคลดังกล่าวหรือดินแดนที่ถูกห้ามค้าเข้าถึงแพลตฟอร์ม Certrace อาจระงับหรือยุติการเข้าถึงได้ทันทีหากข้อเท็จจริงนี้เปลี่ยนแปลงไป",
        },
        {
          p: "**25.2 การต่อต้านการให้สินบน** คู่สัญญาแต่ละฝ่ายจะปฏิบัติตามกฎหมายต่อต้านการให้สินบนและการทุจริตที่ใช้บังคับ รวมถึงพระราชบัญญัติประกอบรัฐธรรมนูญว่าด้วยการป้องกันและปราบปรามการทุจริตของไทย UK Bribery Act 2010 และ US Foreign Corrupt Practices Act และจะไม่เสนอหรือรับการจ่ายเงินโดยมิชอบใด ๆ ที่เกี่ยวข้องกับข้อกำหนดฉบับนี้",
        },
        {
          p: "**25.3 ไม่สนับสนุนการแจ้งข้อมูลเท็จ** ลูกค้าจะไม่ใช้แพลตฟอร์มในการจัดทำ นำเสนอ หรือส่งข้อมูลที่ตนรู้หรือสงสัยว่าเป็นเท็จต่อหน่วยงานกำกับดูแล ผู้ทวนสอบ หน่วยงานศุลกากร ผู้นำเข้า หรือผู้ซื้อ Certrace อาจรายงานต่อบุคคลที่เกี่ยวข้องและอาจยุติสัญญาได้ทันที หากมีเหตุอันควรเชื่อว่าแพลตฟอร์มถูกใช้เพื่อการดังกล่าว",
        },
      ],
    },
    {
      id: "general",
      heading: "26. บททั่วไป",
      blocks: [
        {
          p: "**26.1 กฎหมายที่ใช้บังคับและเขตอำนาจศาล** ข้อกำหนดฉบับนี้อยู่ภายใต้กฎหมายแห่งราชอาณาจักรไทย โดยไม่คำนึงถึงหลักการขัดกันแห่งกฎหมาย และไม่นำอนุสัญญาสหประชาชาติว่าด้วยสัญญาซื้อขายสินค้าระหว่างประเทศมาใช้บังคับ คู่สัญญายอมรับเขตอำนาจแต่เพียงผู้เดียวของศาลที่มีเขตอำนาจในกรุงเทพมหานคร ประเทศไทย สำหรับข้อพิพาทที่เกิดจากหรือเกี่ยวข้องกับข้อกำหนดฉบับนี้ เว้นแต่คู่สัญญาฝ่ายใดฝ่ายหนึ่งอาจขอมาตรการคุ้มครองชั่วคราวจากศาลที่มีเขตอำนาจใดก็ได้เพื่อคุ้มครองทรัพย์สินทางปัญญาหรือข้อมูลที่เป็นความลับของตน",
        },
        {
          p: "**26.2 การเจรจายกระดับ** ก่อนเริ่มดำเนินคดี คู่สัญญาจะพยายามโดยสุจริตในการระงับข้อพิพาทโดยยกระดับให้ผู้บริหารระดับสูงของแต่ละฝ่ายพิจารณาเป็นเวลาสามสิบ (30) วัน ทั้งนี้ไม่ใช้กับการขอมาตรการคุ้มครองชั่วคราวหรือการเรียกร้องค่าธรรมเนียมที่ค้างชำระ",
        },
        {
          p: "**26.3 การโอนสิทธิ** ลูกค้าจะโอนข้อกำหนดฉบับนี้ไม่ได้หากไม่ได้รับความยินยอมเป็นหนังสือล่วงหน้าจาก Certrace เว้นแต่โอนให้ผู้รับโอนกิจการหรือทรัพย์สินเกือบทั้งหมดของตน Certrace อาจโอนข้อกำหนดฉบับนี้ในกรณีการควบรวม การเข้าซื้อกิจการ การปรับโครงสร้าง หรือการขายทรัพย์สิน หรือโอนให้บริษัทในเครือ โดยไม่ต้องได้รับความยินยอมจากลูกค้า",
        },
        {
          p: "**26.4 ความสัมพันธ์ของคู่สัญญา** คู่สัญญาเป็นผู้ประกอบการอิสระ ไม่มีข้อความใดในข้อกำหนดฉบับนี้ที่ก่อให้เกิดห้างหุ้นส่วน กิจการร่วมค้า ตัวแทน หรือความสัมพันธ์นายจ้างลูกจ้าง",
        },
        {
          p: "**26.5 ไม่มีผู้รับประโยชน์ภายนอก** เว้นแต่ที่ระบุไว้อย่างชัดแจ้งในข้อ 8.5 และ 22 ข้อกำหนดฉบับนี้ไม่ให้สิทธิใดแก่บุคคลที่มิใช่คู่สัญญา",
        },
        {
          p: "**26.6 การปฏิบัติตามกฎหมาย** คู่สัญญาแต่ละฝ่ายจะปฏิบัติตามกฎหมายที่ใช้บังคับในส่วนที่เกี่ยวกับข้อกำหนดฉบับนี้ โดยให้ข้อ 25 ใช้บังคับเพิ่มเติม",
        },
        {
          p: `**26.7 การแจ้ง** การแจ้งตามข้อกำหนดฉบับนี้ต้องทำเป็นลายลักษณ์อักษรและส่งทางอีเมลไปที่ ${CONTACT_EMAIL} (สำหรับ Certrace) หรือไปยังผู้ติดต่อหลักของบัญชีที่ลูกค้ากำหนด และถือว่าได้แจ้งเมื่อมีการยืนยันการได้รับ การแจ้งเชิงปฏิบัติการ — รวมถึงการแจ้งเปลี่ยนผู้ประมวลผลช่วง การบำรุงรักษา และการเตือนเรื่องเพดาน — อาจแจ้งภายในแพลตฟอร์มได้`,
        },
        {
          p: "**26.8 ความเป็นโมฆะบางส่วน** หากข้อกำหนดใดในสัญญาฉบับนี้ถูกวินิจฉัยว่าเป็นโมฆะหรือบังคับใช้ไม่ได้ ข้อกำหนดที่เหลือยังคงมีผลสมบูรณ์ และข้อกำหนดที่เป็นโมฆะจะถูกปรับแก้เท่าที่จำเป็นน้อยที่สุดเพื่อให้บังคับใช้ได้โดยยังคงเจตนาทางพาณิชย์ไว้",
        },
        {
          p: "**26.9 การไม่สละสิทธิ** การที่คู่สัญญาฝ่ายใดไม่ใช้หรือใช้สิทธิล่าช้าตามข้อกำหนดฉบับนี้ ไม่ถือเป็นการสละสิทธิดังกล่าว",
        },
        {
          p: "**26.10 ภาษา** ข้อกำหนดฉบับนี้จัดทำเป็นภาษาอังกฤษ ฉบับแปลจัดทำขึ้นเพื่อความสะดวกเท่านั้น หากมีข้อความใดไม่สอดคล้องกัน ให้ยึดฉบับภาษาอังกฤษเป็นหลัก",
        },
        {
          p: "**26.11 ข้อตกลงทั้งหมด** ข้อกำหนดฉบับนี้ พร้อมใบสั่งซื้อทั้งหมด ข้อตกลงการประมวลผลข้อมูล และนโยบายความเป็นส่วนตัว ประกอบกันเป็นข้อตกลงทั้งหมดระหว่างคู่สัญญาเกี่ยวกับแพลตฟอร์ม และแทนที่ข้อตกลงและความเข้าใจก่อนหน้าทั้งหมด ไม่ว่าเป็นลายลักษณ์อักษรหรือด้วยวาจา รวมถึงข้อความใดบนเว็บไซต์ของ Certrace หรือในการสนทนาเชิงการขาย ในกรณีที่ข้อกำหนดฉบับนี้ขัดกับใบสั่งซื้อ ให้ยึดใบสั่งซื้อในส่วนของเงื่อนไขเชิงพาณิชย์เฉพาะที่ใบสั่งซื้อนั้นกล่าวถึง ใบสั่งซื้อหรือเงื่อนไขที่ลูกค้าออกเองไม่มีผลบังคับ",
        },
        {
          p: "**26.12 การคงอยู่ของข้อกำหนด** ข้อกำหนดที่โดยสภาพควรมีผลต่อไปหลังการยุติ จะยังคงมีผลต่อไป — ดูข้อ 20.5",
        },
      ],
    },
    {
      id: "contact",
      heading: "27. ข้อมูลการติดต่อ",
      blocks: [
        {
          p: `คำถามหรือหนังสือบอกกล่าวทางกฎหมายเกี่ยวกับข้อกำหนดฉบับนี้ กรุณาติดต่อ **${CONTACT_EMAIL}** Certrace ดำเนินกิจการจากกรุงเทพมหานคร ประเทศไทย`,
        },
      ],
    },
  ],
};
