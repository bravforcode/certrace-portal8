# CBAM report input structure and collection frequency

The current field numbers used in the web UI are listed in the [numbered input structure](CBAM-NUMBERED-INPUT-STRUCTURE.md). It gives every reference its collection frequency, current/planned tab and **(missing)** status. Use those numbers when referring to a field; the sections below retain the detailed requirement context.

This is the proposed Certrace input structure for the **Operator's Emissions Report (OER)**, **Operator's Summary Emissions Report (OSER)**, and the **declarant-specific addendum for imported electricity**, based on the supplied text of Annex IV sections 1.1, 1.1.1 and 1.2 of [Commission Implementing Regulation (EU) 2025/2547](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202502547). It covers the 35 OER, 16 OSER and 3 addendum numbered content groups. The [detailed requirements and numbered coverage tables](CBAM-OER-INPUT-REQUIREMENTS.md) provide monitoring-method and sector-specific detail. This is a proposed input design, **not a claim that the current web UI already implements it**. Items marked `[PDF ADDITION]` were added after comparison with **K' Kritanat (6).pdf**; many support calculations, evidence or workflow and are conditional rather than extra mandatory report fields.

## Input tree in the agreed structure

The labels below identify **when Certrace asks for data**. Each input also names its current web location. **Partial** means the page has some related fields but cannot collect the complete item; **No dedicated web input yet** is a real product gap, not a field hidden under Readiness. `[MONTHLY]` means a convenient upload/review cycle; keep the original batch, transaction or meter interval. `[AUTO]` is generated from supported data, not a free-text answer.

**Navigation:** Verification → Company → Installation → **Installation profile** or **Reporting period** → Readiness, Setup, Monthly data, Precursor sources, Settings. **Monitoring method** is opened from Setup and has its own page. General document upload and sample-document review are in **Readiness**; month pages show document coverage and link back there. Producer verification reports are uploaded in **Precursor sources**, and method-specific files remain beside their related fields. The old Documents and Evidence URLs redirect to Readiness. A location marked **partial** does not mean every field or report calculation in that line is implemented.

## Output-template coverage check

The proposed input structure below maps every numbered group in the supplied output outline: **OER 1–35**, **OSER 1–16**, and the **conditional electricity addendum 1–3**. The item-by-item [OER coverage table](CBAM-OER-INPUT-REQUIREMENTS.md#complete-oer-content-coverage) and the OSER/addendum mappings in that document explain where each output is derived. **This is design coverage, not current web-form completeness.** One annual dataset should generate OER and OSER; the operator should review calculated values instead of typing report totals twice.

The current UI still needs these input or calculation capabilities before it can reliably populate every output field:

| Output items | Remaining collection/calculation gap |
|---|---|
| OER 2(b)–(f), 13–14, 31, 34; OSER 3 | Complete non-CBAM process/good records, route and functional-unit output, and the three top-five rankings; CEMS gas/source records where used. |
| OER 3–6, 9–12, 16–17, 26, 32–33; OSER 6–11 | Electricity by source and process, on-site generation classification, heat/waste-gas/CO2 transfers and counterparties, actual/PPA factors, source-stream activity and process balances. Some fields exist, but the source-level and allocation detail is incomplete. |
| OER 7, 15, 29–30, 35; OSER 4–6 | Complete process/good/composition emissions allocation, default and actual shares, indirect-emissions eligibility/evidence assertions, sector parameters, specific embedded free allocation and benchmark-method result. Current summary calculations do not cover every case. |
| OER 8, 16(e) | Explicit new-installation monitoring duration and complete source-linked data-gap/estimate records. |
| OER 18–25, 27–28; OSER 12–16 | Internal precursor use and same-process exclusion; multiple production periods/sources and Article 14 method; precursor use year and full source identity. The current external-source form covers only part of this. |
| OER 15(e)–(f); OSER 4(c)–(d); addendum 1–3 | Separate operator confirmations that legal criteria are met **and** required evidence was sent to the verifier; where imported electricity uses actual values, declarant EORI, eligible electricity quantity and one addendum per declarant. A file upload is not this confirmation. |

Item **OER 35** refers to the sector-specific parameters in Annex IV section 2, outside the supplied 1.1/1.1.1/1.2 outline. The applicable sector section must be checked for each good before claiming full product-level completeness.

```text
COMPANY / ACTUAL INSTALLATION OPERATOR
├── [ONCE/COMPANY] Legal name (Web: Setup; account company name is also in Settings → Organisation)
├── [ONCE/COMPANY] Corporate or activity registration number (Web: Setup)
├── [ONCE/COMPANY] Full legal address in English (Web: Setup)
├── [ONCE/COMPANY; UPDATE ON CHANGE] Registered address, country of
│   establishment, operator contact name/email/phone [PDF ADDITION] (Web: No dedicated web input yet)
├── [ONCE/COMPANY; UPDATE ON CHANGE] Person responsible for emissions
│   monitoring and reporting [PDF ADDITION] (Web: No dedicated web input yet)
├── [ONCE/COMPANY; UPDATE ON CHANGE] Company's ownership or operating
│   relationship to each installation [PDF ADDITION] (Web: No dedicated web input yet)
├── [ONCE/COMPANY, IF DIFFERENT] Exporter ↔ actual operator relationship (Web: No dedicated web input yet)

├── INSTALLATION A — Factory A
│   ├── 1. Installation Profile
│   │   ├── [ONCE/INSTALLATION] Name and actual operator (Web: Installation profile (name); Setup (operator))
│   │   ├── [ONCE/INSTALLATION] Assigned CBAM Registry ID/status (Web: Setup)
│   │   ├── [ONCE/INSTALLATION] UN/LOCODE and full English address (Web: Installation profile)
│   │   ├── [ONCE/INSTALLATION] Main-emission-source latitude/longitude (Web: Installation profile)
│   │   ├── [ONCE/INSTALLATION; UPDATE ON CHANGE] Local address, country
│   │   │   and operator contact [PDF ADDITION] (Web: Installation profile)
│   │   ├── [YEARLY] Operating status during the period [PDF ADDITION] (Web: No dedicated web input yet)
│   │   ├── [ONCE/INSTALLATION; UPDATE ON CHANGE] Units, connections and boundaries (Web: Setup → Monitoring method (partial))
│   │   └── [YEARLY, IF NEW INSTALLATION] Monitoring start/end and months covered (Web: Setup → Monitoring method (partial))
│   │
│   ├── 2. Reporting Period — 2026
│   │   ├── [YEARLY] Reporting year and monitoring-plan version (Web: Factory → Reporting period / Monitoring method)
│   │   ├── [ON CHANGE] Method, process, route and boundary changes/effective dates (Web: Setup → Monitoring method (partial))
│   │   ├── [ON CHANGE] Control-system changes and dates [PDF ADDITION] (Web: No dedicated web input yet)
│   │   └── [AS NEEDED] Missing-data periods and supported estimates (Web: Setup → Monitoring method)
│   │
│   │   ├── 2.1 Production Structure
│   │   │   ├── Production Process 1
│   │   │   │   ├── [YEARLY] Process name; CBAM or non-CBAM classification (Web: Setup (partial))
│   │   │   │   ├── [YEARLY] Boundary, units and production steps (Web: Setup + Monitoring method (partial))
│   │   │   │   ├── Production Route(s), where applicable
│   │   │   │   │   ├── [YEARLY] Route name/technology and linked units (Web: Setup (route text; linked equipment not structured))
│   │   │   │   │   └── [MONTHLY] Output quantity by route (Web: Monthly data → month (partial; route split is not always shown))
│   │   │   │   ├── Products / CN Codes
│   │   │   │   │   ├── [YEARLY] Every good's name, exact CN code, description (Web: Setup)
│   │   │   │   │   ├── [YEARLY] Legal functional unit; composition/grade if relevant (Web: Setup + Monthly data → Installation & monitoring method (partial))
│   │   │   │   │   ├── [YEARLY] CBAM category, simple/complex classification,
│   │   │   │   │   │   and product emissions boundary [PDF ADDITION] (Web: Setup (category derived; classification/boundary incomplete))
│   │   │   │   │   ├── [MONTHLY] Quantity by good, CN, process, route and unit (Web: Monthly data → month (partial; original product uses one total))
│   │   │   │   │   ├── [MONTHLY IF STOCK-BASED] Deliveries, opening/closing
│   │   │   │   │   │   stock, returns and quantity used as a precursor (Web: No dedicated web input yet)
│   │   │   │   │   ├── [MONTHLY] Off-spec output, by-products, waste and scrap
│   │   │   │   │   │   separately from eligible production activity (Web: No dedicated web input yet)
│   │   │   │   │   ├── [MONTHLY] Relevant non-CBAM goods and quantities (Web: Installation profile (other goods only; no monthly quantity))
│   │   │   │   │   ├── [AUTO] Five largest goods by mass in this process (Web: No dedicated web input yet)
│   │   │   │   │   └── [IF APPLICABLE] Sector parameters: clinker/nitrogen content,
│   │   │   │   │       reducing agent, alloy composition, scrap and pre-consumer
│   │   │   │   │       scrap, or non-aluminium element content (Web: Monthly data → Installation & monitoring method (steel only; other sectors missing))
│   │   │   │   └── Relevant Precursor CN Codes and Sources
│   │   │   │       ├── [YEARLY] Relevant precursor types/CN codes (Web: Precursor sources)
│   │   │   │       ├── [PER SOURCE] Internal process or external producer (Web: Precursor sources (external only))
│   │   │   │       ├── [YEARLY IF COMPLEX] Incorporated precursor without its
│   │   │   │           own production process [PDF ADDITION] (Web: Precursor sources (product link only; no special flag))
│   │   │   │       └── [IF APPLICABLE] Same-process joint-production exclusion (Web: No dedicated web input yet)
│   │   │   └── Production Process 2, 3, ... — repeat the same fields
│   │   │
│   │   ├── 2.2 Monitoring Methodology
│   │   │   ├── [YEARLY] English monitoring plan, date/version and boundaries (Web: Setup → Monitoring method (partial))
│   │   │   ├── [YEARLY] Source streams/emission sources per process (Web: Setup → Monitoring method (partial))
│   │   │   ├── [YEARLY] Quantity measurement, emissions method, formulas,
│   │   │   │   calculation factors, factor sources, sampling/analysis where used (Web: Setup → Monitoring method (partial))
│   │   │   ├── [YEARLY/ON CHANGE] Meter identity/location, calibration,
│   │   │   │   uncertainty, sampling and laboratory method where used (Web: Setup → Monitoring method (partial))
│   │   │   ├── [IF CEMS] Greenhouse gases and monitored sources/method (Web: Setup → Monitoring method (CEMS instrument only; gases missing))
│   │   │   ├── [AUTO] Top five fuels by energy, process-emission materials by
│   │   │   │   emissions, and CEMS sources by emissions (Web: No dedicated web input yet)
│   │   │   ├── [IF APPLICABLE] Zero-rated fuels and qualification method (Web: Monthly data → month (biomass fraction; method/evidence incomplete))
│   │   │   ├── [IF APPLICABLE] Heat, waste-gas and CO2 transfer/allocation method (Web: Setup → Monitoring method (partial))
│   │   │   ├── [IF APPLICABLE] Indirect-electricity actual/default methodology,
│   │   │   │   source attribution and actual-value eligibility basis (Web: Setup → Monitoring method (partial))
│   │   │   ├── [IF APPLICABLE] On-site generation: CHP/separate, fossil/renewable (Web: Setup → Monitoring method (partial))
│   │   │   ├── [YEARLY] Direct/indirect emissions allocation method by process (Web: No dedicated web input yet)
│   │   │   ├── [YEARLY] Data-gap detection, substitute-data method and
│   │   │   │   data-quality/control procedures [PDF ADDITION] (Web: Setup → Monitoring method (partial))
│   │   │   └── [YEARLY PER GOOD] Applicable CBAM benchmark and method for
│   │   │       specific embedded free allocation (needed in OSER) (Web: Setup (benchmark only; method missing))
│   │   │
│   │   ├── 2.3 Installation Monitoring Data
│   │   │   ├── Production
│   │   │   │   └── [MONTHLY FROM BATCH RECORDS] All CBAM/non-CBAM goods,
│   │   │   │       process/route/CN/composition, tonnes and functional units (Web: Monthly data → month (partial))
│   │   │   ├── Fuels, process materials and emissions
│   │   │   │   ├── [MONTHLY FROM SOURCE RECORDS] Quantity, units, process,
│   │   │   │   │   source stream and calculation factors (Web: Monthly data → month (process/source links incomplete))
│   │   │   │   ├── [YEARLY/PER SOURCE] Combustion, process or other emissions
│   │   │   │   │   method and greenhouse gas covered [PDF ADDITION] (Web: Monthly data → month (partial))
│   │   │   │   ├── [MONTHLY/WHEN USED] Fuel/material-specific net calorific
│   │   │   │   │   value, oxidation/conversion factors, carbon content and
│   │   │   │   │   biomass fraction [PDF ADDITION] (Web: Monthly data → month (partial))
│   │   │   │   └── [IF CEMS/OTHER METHOD] Native-frequency readings, gas,
│   │   │   │       source, operating period and emissions; concentration/flow
│   │   │   │       and invalid-data periods for CEMS (Web: No native CEMS reading form yet)
│   │   │   ├── Electricity
│   │   │   │   ├── [MONTHLY] Total installation and per-process consumption (Web: Monthly data → month (partial))
│   │   │   │   ├── [MONTHLY PER SOURCE] Quantity, supplier installation/name,
│   │   │   │   │   origin country and source emission factor where relevant (Web: Monthly data → month (partial))
│   │   │   │   ├── [IF GENERATED ON SITE] Produced, used and exported quantity;
│   │   │   │       gross/own-use/net output, CHP/separate and
│   │   │   │       fossil/renewable characteristics (Web: Setup → Monitoring method (own-generation checkbox only))
│   │   │   │   └── [PER CONTRACT/WHEN USED] PPA identity, factor and source;
│   │   │   │       inter-installation imports/exports [PDF ADDITION] (Web: No dedicated web input yet)
│   │   │   ├── Heat and waste gases
│   │   │   │   ├── [MONTHLY IF APPLICABLE] Imported, produced, consumed and
│   │   │   │       exported quantities per process; counterpart installations (Web: Monthly data → month (partial))
│   │   │   │   └── [MONTHLY IF APPLICABLE] Heat emission factors and their
│   │   │   │       sources [PDF ADDITION]; CHP heat/electricity efficiencies
│   │   │   │       where relevant (Web: No dedicated web input yet)
│   │   │   ├── CO2
│   │   │   │   └── [PER TRANSFER IF APPLICABLE] Captured/received/exported
│   │   │   │       quantity, destination, storage/permanent-binding purpose,
│   │   │   │       recipient identity and responsible contact (Web: Monthly data → month (partial))
│   │   │   └── [AS NEEDED] Data gaps, affected intervals and estimates (Web: Setup → Monitoring method)
│   │   │
│   │   ├── 2.4 Precursor Data and Emissions
│   │   │   ├── Precursor 1, 2, ... — each relevant CBAM precursor
│   │   │   │   ├── [PER TYPE] Name and exact CN code (Web: Precursor sources)
│   │   │   │   ├── [PER TYPE] CBAM category and whether the precursor is
│   │   │   │   │   itself a complex good [PDF ADDITION] (Web: Precursor sources (partial))
│   │   │   │   ├── [PER SOURCE] Internal/external; origin operator/installation,
│   │   │   │   │   Registry ID if assigned, origin country, reporting period (Web: Precursor sources (external only))
│   │   │   │   ├── [PER SOURCE] Supplier company, source location and
│   │   │   │   │   quantity received (separate from quantity used) [PDF ADDITION] (Web: Precursor sources (partial))
│   │   │   │   ├── [MONTHLY USE] Internal amount used at installation/by process (Web: No internal-precursor use form yet)
│   │   │   │   ├── [MONTHLY USE] External amount used at installation/by process (Web: Precursor sources → monthly use)
│   │   │   │   ├── [DEFAULT PATH] Applicable official default value/reference (Web: Precursor sources)
│   │   │   │   ├── [ACTUAL PATH] Producer's verified direct and applicable
│   │   │   │   │   indirect emissions, verification report, production period
│   │   │   │   │   and period basis (default rule or actual production time) (Web: Precursor sources)
│   │   │   │   ├── [ACTUAL PATH] Check report accreditation, validity and
│   │   │   │   │   reporting-period fit before accepting values [PDF ADDITION] (Web: Precursor sources (metadata entered; human validity check))
│   │   │   │   └── [ACTUAL PATH] Year used in the complex good (OSER) (Web: Precursor sources)
│   │   │   ├── [IF MULTIPLE PRODUCTION PERIODS] Quantities/values by period
│   │   │   │   and the applicable combined emissions value (Web: Precursor sources (partial))
│   │   │   ├── [IF MULTIPLE INSTALLATIONS] Quantities/values by source;
│   │   │   │   normal Article 14 method or justified source/subset method (Web: Precursor sources (partial))
│   │   │   ├── [IF PROVIDED] Retain upstream precursor references contained
│   │   │   │   in the supplier's verified report [PDF ADDITION] (Web: Precursor sources (PDF attached; no structured upstream reference))
│   │   │   └── [AUTO] Exclude same-process qualifying joint-production inputs (Web: No dedicated web input yet)
│   │   │
│   │   ├── 2.5 Supporting Evidence
│   │   │   ├── [UPLOAD ON CHANGE] Monitoring plan, production, meter, fuel,
│   │   │   │   laboratory, factor and calculation documents (Web: Readiness general upload + relevant inline uploads)
│   │   │   ├── [PER FILE] Document ID, type/source, issue/upload dates,
│   │   │   │   linked field/calculation/verifier finding, review state and version;
│   │   │   │   flag missing, expired or inconsistent files [PDF ADDITION] (Web: Readiness + inline uploads (metadata partial))
│   │   │   ├── [PER FILE] Evidence owner/supplier and access permissions
│   │   │   │   where confidentiality requires them [PDF ADDITION] (Web: No dedicated web input yet)
│   │   │   ├── [UPLOAD IF APPLICABLE] CN-classification proof, product specs,
│   │   │   │   precursor receipts, PPA and control procedures [PDF ADDITION] (Web: Readiness general upload (category slots partial))
│   │   │   ├── [UPLOAD IF APPLICABLE] Zero-rating, heat/waste-gas, CO2,
│   │   │   │   electricity actual-value and precursor verification evidence (Web: Readiness + Precursor sources (category slots partial))
│   │   │   └── [YEARLY/PER SUBMISSION] Confirm exactly which required evidence
│   │   │       and applicable addenda were actually sent to the verifier (Web: No dedicated web input yet)
│   │   │
│   │   ├── 2.6 Emissions Calculation and Validation
│   │   │   ├── [AUTO/YEARLY] Installation direct total; process direct totals;
│   │   │   │   applicable installation indirect total (Web: Setup / Readiness calculated summary (workspace SEE only))
│   │   │   ├── [AUTO/YEARLY] Process activity levels, attributed direct/indirect
│   │   │   │   emissions and heat/waste-gas/electricity flow balances (Web: No dedicated web input yet)
│   │   │   ├── [AUTO PER GOOD] Direct emissions per functional unit and per
│   │   │   │   composition where applicable; applicable indirect emissions (Web: Setup / Readiness calculated summary (partial))
│   │   │   ├── [AUTO PER GOOD] Default-value share and indirect actual/default
│   │   │   │   shares; data-quality/monitoring-versus-default statement (Web: No dedicated web input yet)
│   │   │   ├── [AUTO] Source/combined electricity factor, actual factor and
│   │   │   │   PPA factor where applicable (Web: Monthly data → month (source factor only; combined/PPA missing))
│   │   │   ├── [AUTO] Precursor intensities across periods/sources and method (Web: Setup / Readiness calculated summary (simple precursor contribution only))
│   │   │   ├── [AUTO PER GOOD] Specific embedded free allocation; benchmark (Web: No dedicated web input yet)
│   │   │   ├── [AUTO/REVIEW] Allocation reconciliations, assumptions,
│   │   │   │   rounding and no-double-counting checks [PDF ADDITION] (Web: No dedicated web input yet)
│   │   │   └── [REVIEW] Units, sector parameters, estimates and missing data (Web: Readiness (partial))
│   │   │
│   │   └── 2.7 Reporting and Verification
│   │       ├── [YEARLY WHEN APPLICABLE] Operator's Emissions Report (OER): full detail (Web: No dedicated web input yet)
│   │       ├── [YEARLY WHEN APPLICABLE] Operator's Summary Emissions Report (OSER): reuse
│   │       │   same dataset; include free allocation/benchmark confirmation (Web: No dedicated web input yet)
│   │       ├── [YEARLY/IF APPLICABLE] Supporting evidence package: linked
│   │       │   source files and calculations [PDF ADDITION] (Web: Readiness (generic upload only))
│   │       ├── [ONLY FOR ACTUAL-VALUED ELECTRICITY IMPORTS] One declarant-
│   │       │   specific addendum per authorised declarant: EORI, applicable
│   │       │   criteria/evidence-submission confirmations, eligible imported
│   │       │   electricity quantity for that declarant and installation
│   │       │   plus declarant name, measurement period, originating-installation
│   │       │   and capacity-nomination criteria, and network-congestion
│   │       │   evidence where relevant [PDF ADDITION]; monthly interim
│   │       │   evidence records when required (Web: No dedicated web input yet)
│   │       ├── [IF ACTUAL-VALUED ELECTRICITY IMPORTS] OER/OSER connection
│   │       │   and emissions-threshold assertions, actual factor, verifier-
│   │       │   evidence submission and addenda-sent status (Web: No dedicated web input yet)
│   │       ├── [AFTER VERIFICATION] Attach verifier-issued independent report (Web: Readiness (generic upload only; no verifier-report slot))
│   │       └── [PER REVIEW/SUBMISSION] Verifier questions, operator responses,
│   │           corrections, report versions, submission dates/status [PDF ADDITION] (Web: Monthly review only; no annual verifier workflow)
│   │
│   └── Other Reporting Periods — each repeats its own 2.1–2.7 records
│
└── INSTALLATION B — Factory B
    ├── Its own Installation Profile
    ├── Its own Reporting Periods
    └── Its own processes, monthly data, precursors, evidence and reports
```

For externally produced precursors, the exporter supplies the Tier 2 source identity, quantities and qualifying verification report, or selects the applicable official default path. Upstream Tier 3 details already covered in a qualifying supplier report should be retained as references when provided; the exporter is not asked to invent those upstream emissions or type arbitrary precursor emission values.

## Frequency and responsibility

| Mark | Meaning |
|---|---|
| **Once/company** | Enter once for each legal installation operator. Reuse across its installations; update on change. The exporter and operator may be different entities. |
| **Once/installation** | Enter when the installation is set up; update on change. Each installation has its own profile. |
| **Yearly** | Select, review or confirm separately for each installation's annual reporting period. |
| **Monthly roll-up** | Certrace's proposed easy collection cycle for activity data. Keep the actual transaction, batch, meter or continuous-measurement frequency in the source record. Annex IV requires annual reports, not monthly OER/OSER reports. |
| **Per event/source** | Record each new supplier, meter, batch, contract, source period, transfer or other event; link its use to the relevant reporting year/month. |
| **Conditional** | Ask only when the relevant good, method, flow or electricity-import case applies. |
| **Auto/review** | Certrace calculates or assembles the report value from supported records; the operator reviews it. |
| **Upload/confirm** | Attach source evidence, and separately confirm which evidence was actually submitted to the verifier. |

The legal OER/OSER party is the **installation operator**. An exporter who is not that operator must obtain the installation data from the operator. One validated annual dataset should generate both reports; users should not retype an OSER after completing an OER.

## COMPANY / OPERATOR

| Input | Frequency | Report use |
|---|---|---|
| Legal operator name | Once/company; yearly confirmation | OER 1(a); OSER 1(a) |
| Corporate or activity registration number | Once/company; yearly confirmation | OER 1(b); OSER 1(b) |
| Full legal address in English | Once/company; yearly confirmation | OER 1(c); OSER 1(c) |
| Registered business address and country of establishment (reuse the English address if identical) | Once/company; update on change | PDF supporting identity record |
| Operator contact name, email and phone; person responsible for emissions monitoring/reporting | Once/company; update on change | PDF supporting contact and accountability record |
| Company ownership or operating relationship to each installation | Once/company; update on change | PDF supporting operator-to-installation link |
| Exporter-to-operator relationship, if different | Once/company; update on change | Certrace linking field; do not replace the actual operator with the trader |

## INSTALLATION A — repeat for every installation

### 1. Installation Profile

| Input | Frequency | Report use |
|---|---|---|
| Installation name | Once/installation; yearly confirmation | OER 1(d); OSER 2(a) |
| Unique CBAM Registry installation ID and assignment status | Once/installation; update when assigned | OER 1(d); OSER 2(b); never fabricate an unassigned ID |
| Applicable UN/LOCODE | Once/installation; update on change | OER 1(d); OSER 2(c) |
| Full physical address in English transcription | Once/installation; update on change | OER 1(d); OSER 2(d) |
| Original/local installation address and country; installation operator contact | Once/installation; update on change | PDF supporting identity record; reuse existing profile values when identical |
| Whether the installation operated during the reporting year | Yearly | PDF supporting status record |
| Latitude/longitude of **main emission source** | Once/installation; update on change | OER 1(d); OSER 2(e) |
| Physical units, process connections and installation boundaries | Once/installation; update on change | Monitoring-plan and allocation support |
| New-installation status; actual monitored start/end and number of months | Conditional/yearly | OER 8 |

### 2. Reporting Period — e.g. 2026

| Input | Frequency | Report use |
|---|---|---|
| Reporting calendar year and period | Yearly | Identifies the annual dataset |
| Monitoring-plan version and effective dates | Yearly; on change | OER 2 summary and methods |
| Process, route, technology or boundary changes with effective dates | Per event; yearly review | Correct year-specific method and allocation |
| Changes to the monitoring control system, with effective dates | Per event; yearly review | PDF monitoring history and evidence |
| Missing-data intervals and estimate method/evidence | Per event; yearly review | OER 16(e) |

### 2.1 Production Structure

Create **Production Process → Route(s) → Goods/CN Codes → Relevant Precursor Types/Sources**. A physical production-step list may help users describe the factory, but the legal production-process boundaries must control allocation.

| Input or result | Frequency | Report use |
|---|---|---|
| Every CBAM production process and every route within it | Yearly; update on change | OER 2(a); OSER 3 |
| Every relevant non-CBAM production process | Yearly; update on change | OER 2(b) |
| Goods linked to each process and route; name, exact CN code, description and composition/grade where applicable | Yearly; update on change | OER 2(c), 13, 14, 31, 34; OSER 3–4 |
| CBAM goods category, simple/complex classification and emissions system boundary for each good | Yearly per good; update on change | PDF product and calculation context |
| Applicable legal functional unit for each CN code; physical tonnes and unit conversion inputs if the functional unit differs | Yearly setup; monthly roll-up of quantity | OER 15(a), 31, 34 |
| Quantity of **each** CBAM and relevant non-CBAM good produced at installation/process/route/CN level | Monthly roll-up from production records; yearly total | OER 13, 14, 31, 34 |
| Deliveries, opening/closing stocks, returns and precursor use when output is stock-derived; off-spec output, by-products, waste and scrap kept separate | Conditional/monthly roll-up | Supports eligible activity level and prevents double counting |
| Five largest goods **by mass per process**, with CN code | Auto/review from all production rows | OER 2(c); do not limit underlying goods to five |
| Relevant internally or externally produced precursor types, exact CN codes and linked consuming processes | Yearly setup; per source on change | OER 18–28; OSER 12–16 |
| Relevant precursor incorporated in a complex good without a separate production process | Conditional/yearly | PDF product-to-precursor relationship |
| Same-process joint production under Article 4(9), with separately produced/used precursor relationships | Conditional/yearly | Exclude same-process precursor from separate precursor rows while retaining relevant goods/functional units; OER 18, 19, 22, 23, 27, 31; OSER 12–13 |
| Sector-specific product parameters needed for the actual good | Conditional/monthly or batch measurement; yearly result | OER 35; details in the sector table of the linked requirements document |

### 2.2 Monitoring Methodology

| Input or result | Frequency | Report use |
|---|---|---|
| English monitoring plan; version/date; process boundaries, diagrams and allocation method | Yearly; update on change | OER 2, 15(c), 29 |
| Source streams and emission sources linked to the correct processes | Yearly; update on change | OER 16(a)–(c), 29 |
| For each source stream: activity-data measurement or stock method; calculation factors, units, value source, sample/analysis method where applicable | Yearly; update on change | OER 16(a) |
| Measurement instrument identity/location, calibration, uncertainty, sampling and laboratory method where used | Conditional/yearly; update on change | Monitoring-method support and evidence |
| Calculation-based, mass-balance, continuous measurement or other applicable method per source | Yearly; update on change | OER 15(c), 16(a)–(c) |
| For continuous emissions measurement: greenhouse gases measured and monitored sources | Conditional/yearly; readings remain at native frequency | OER 2(f), 16(b) |
| Five largest fuels **by energy provided** and five largest process-emission materials **by emissions** | Auto/review from complete underlying stream data | OER 2(d)–(e) |
| Five largest continuously monitored emission sources | Conditional/auto from complete source data | OER 2(f) |
| Zero-rated fuel identity, claimed method and demonstration/evidence | Conditional/yearly; evidence on change | OER 2(g); OSER 8 |
| Methods and counterpart installations for measurable heat; waste-gas production/use/import/export | Conditional/yearly; update on change | OER 2(h), 5, 17; OSER 7, 9 |
| CO2 capture/transfer/storage/permanent-binding measurement method and recipient identification/contact | Conditional/yearly; update on change | OER 6, 16(d); OSER 10 |
| Indirect-emissions method: eligible actual versus default factor, source attribution, Article 9 combined factor and applicable actual-value criteria | Conditional/yearly; update on change | OER 3, 9–12, 15(e), 32–33; OSER 4(c), 6 |
| On-site electricity generation: cogeneration/separate; fossil/renewable; process-boundary export | Conditional/yearly; update on change | OER 4; OSER 11 |
| Method for detecting data gaps; substitute-data method; quality-control procedures | Yearly; update on change | PDF monitoring plan and evidence |
| Applicable CBAM benchmark(s), source/version and method for specific embedded free allocation by good | Yearly per good | OSER 4(e)–(f); benchmark also belongs in monitoring plan |

### 2.3 Installation Monitoring Data

| Underlying record | Frequency | Report use |
|---|---|---|
| Fuel/material quantities, source stream, process, units, date/batch, calculation factors and factor evidence | Per transaction/batch or meter interval; monthly roll-up | OER 16(a); top-five rankings |
| Emission type (combustion/process/other), method and greenhouse gas for each source | Per source; review yearly | PDF source-level emissions context |
| Net calorific value, oxidation/conversion factors, carbon content and biomass fraction when relevant | Per stream/value period; monthly roll-up where values change | PDF calculation-factor detail; zero-rating support |
| CEMS emissions by source and gas, native measurement interval and operating coverage | Conditional; retain native interval, monthly roll-up | OER 16(b), 2(f) |
| CEMS concentration and flue-gas flow, invalid periods and substitute data | Conditional; retain native interval | Underlying emissions calculation and data-gap evidence |
| Emissions determined by other methods and their supported activity data | Conditional; monthly roll-up | OER 16(c) |
| Electricity **consumed from each source**: quantity, supplier installation/name and country where relevant, source country, source factor | Conditional; meter/contract interval, monthly roll-up | OER 3, 11–12 |
| Installation total electricity consumption and electricity consumed to make goods to which indirect emissions apply | Conditional; monthly roll-up | OER 9–10; OSER 6 |
| Electricity consumed by **each production process** | Conditional; monthly roll-up | OER 26 |
| On-site electricity produced, consumed and exported; generation technology, CHP/separate and fossil/renewable classification | Conditional; meter interval, monthly roll-up | OER 4, 17; OSER 11 |
| Gross generation, own use and net generation; CHP heat/electricity efficiencies where applicable | Conditional; meter interval and annual method | Electricity factor and cogeneration allocation |
| PPA counterparty/source, contract and factor; electricity transferred to/from another installation | Conditional; per contract/transfer, monthly roll-up of quantities | PDF electricity source and allocation support |
| Measurable heat imported, produced, consumed and exported **per process**, with external counterpart installation | Conditional; meter/transaction interval, monthly roll-up | OER 2(h), 17; OSER 7 |
| Heat emission factors, factor sources and calculation parameters | Conditional; per source/value period | PDF heat calculation support |
| Waste gases produced, imported, consumed and exported **per process**, with external counterpart installation | Conditional; meter/transaction interval, monthly roll-up | OER 5, 17; OSER 9 |
| CO2 captured, received and transferred: amount, time, receiving installation/infrastructure/entity and responsible contact; geological-storage or permanently-bound-product purpose | Conditional; per transfer, monthly roll-up | OER 6, 16(d); OSER 10 |
| Goods output, physical mass and applicable functional-unit quantity by process, route, CN and composition | Production/batch records; monthly roll-up | OER 13–14, 30–31, 34; OSER 3–4 |
| Measurements for applicable sector-specific parameters (e.g. clinker/nitrogen content, alloy/reducing agent, scrap and pre-consumer scrap shares) | Conditional; relevant batch/period, yearly result | OER 35 |
| Missing readings, data gaps, estimates, reason and evidence | Per gap; yearly review | OER 16(e) |

### 2.4 Precursor Data and Emissions

Only **relevant CBAM precursors** under the applicable calculation rules belong here. Non-CBAM materials can still be fuel/material source streams in 2.3. For an external precursor, the receiving operator records its use and obtains the producing operator's verified data where actual values are used; it does not invent that producer's emissions.

| Input or result | Frequency | Report use |
|---|---|---|
| Precursor good name, exact CN code, internal/external production status and relevant consuming process | Per precursor type; review yearly | OER 18–23; OSER 12–13 |
| CBAM goods category and whether the precursor is itself a complex good | Per precursor type; review yearly | PDF precursor classification |
| Origin operator and installation name, unique Registry ID if applicable, origin country where required, applicable reporting period | Per source/period; review yearly | OER 22–23, 28; OSER 12–13, 16 |
| Supplier company if different from operator; source installation location; quantity received separately from quantity consumed | Per source/receipt; monthly roll-up of quantities | PDF source and material-flow traceability |
| Quantity of each type **produced at this installation and used by this installation** | Production/use events; monthly roll-up | OER 18 |
| Internal precursor quantity used by **each production process**, excluding production within the same qualifying joint process | Use events; monthly roll-up | OER 19, 27 |
| Quantity of each type **produced outside** and used by this installation | Receipt/use events; monthly roll-up | OER 20 |
| External precursor quantity used by **each production process** | Use events; monthly roll-up | OER 21 |
| **Default path:** applicable official default value, CN code/name, external country if known, reference/version | Per precursor source/value period; yearly review | OER 22; OSER 12 |
| **Actual path:** source's verified direct and applicable indirect specific embedded emissions, report period, and whether that period follows the default-period rule or proven actual production time | Per verified report/period; yearly review | OER 23; OSER 13 |
| Verification report accreditation, validity and reporting-period eligibility check before accepting actual values | Per verified source report; yearly review | PDF precursor verification control |
| Year in which the actual-valued precursor was **used** to produce the complex good | Use events; yearly total | OSER 13; distinct from precursor production year |
| Same CN code from one external installation across different production periods: quantities by period and applicable direct/indirect intensity | Conditional/per source period; auto weighting | OER 24; OSER 14 |
| Same CN code from multiple installations: quantities/source and normal Article 14(2) method or justified installation/subset method under Article 14(3) | Conditional/per source; auto result plus method confirmation | OER 25; OSER 15 |
| Verified producer report and evidence of source/period/quantity; or official default reference | Conditional/upload per source | Supports actual/default path and report assertions |
| Upstream precursor references already documented in the supplier's qualifying report | If provided with source report | Retain PDF chain traceability; no exporter-entered Tier 3 emissions |

### 2.5 Supporting Evidence and Assertions

| Evidence or confirmation | Frequency | Report use |
|---|---|---|
| Monitoring plan/diagram, production, meter, fuel/material, lab, factor and calculation records | Upload/link per document version; yearly review | Supports OER methods and calculations |
| CN-code classification proof, product specifications, precursor purchase/receipt records, PPA and control procedures | Conditional/upload per source or version | PDF supporting evidence categories |
| Evidence ID, type, source/owner, issue/upload dates, linked report field/calculation/verifier finding, review state and version | Per file; update on review | PDF evidence management and audit history |
| Missing, expired, incomplete or inconsistent evidence flag; confidentiality/access permissions | Per file; update on review | PDF evidence readiness and access control |
| Zero-rating qualification; heat/waste-gas counterpart records; CO2 transfer/storage/permanent-binding evidence | Conditional/upload per event/version | OER 2(g)–(h), 5–6, 16(d); OSER 7–10 |
| Precursor producer's verified report, or official default-value reference | Conditional/upload or system reference per source/period | OER 22–25; OSER 12–16 |
| Actual indirect-electricity criteria evidence, where actual values are claimed | Conditional/upload per evidence period | OER 15(e); OSER 4(c) |
| Actual imported-electricity criteria evidence, if electricity itself is imported into the EU using actual values | Conditional/upload per declarant/import period | OER 15(f); OSER 4(d); addendum 2 |
| **Actual submission record:** which required evidence and addenda were sent to the verifier, when and for which report version | Yearly or per submission; operator confirmation | OER 15(e)–(f); OSER 4(d); addendum 2 |

### 2.6 Emissions Calculation and Validation

These are report results, not free-text numbers for the exporter to guess. Show the method, source data, units and issues for operator review.

| Calculated result or confirmation | Frequency | Report use |
|---|---|---|
| Total direct emissions for installation; direct emissions per process | Auto/yearly | OER 7, 16, 30; OSER 5 |
| Applicable installation indirect emissions | Conditional/auto yearly | OSER 6 |
| Process activity levels and attributed direct/indirect emissions; allocation method explanation | Auto/yearly | OER 29–30 |
| Per-process balance of imported, produced, consumed and exported heat, waste gases and electricity | Conditional/auto yearly | OER 17 |
| Each good's **specific direct embedded emissions per functional unit** and, where applicable, per composition | Auto/yearly | OER 15(a)–(b); OSER 4(a) |
| Data-quality/method statement: fully monitored versus use of defaults; share of embedded emissions using defaults | Auto plus operator review/yearly | OER 15(c)–(d); OSER 4(b) |
| Applicable specific indirect embedded emissions per good and actual/default indirect shares | Conditional/auto yearly | OER 15(e); OSER 4(c) |
| Eligibility assertion for actual indirect values and confirmation evidence was sent to verifier | Conditional/operator confirmation yearly | OER 15(e); OSER 4(c) |
| Electricity quantity/factor per source, calculated Article 9 factor, actual factor and PPA factor where relevant | Conditional/auto yearly | OER 12, 32–33 |
| Precursor direct/indirect intensity across periods and multiple installations; documented method and source subset | Conditional/auto yearly plus method confirmation | OER 24–25; OSER 14–15 |
| Goods totals per installation/process/route/CN/functional unit; top-five rankings | Auto/yearly | OER 2(c)–(f), 13–14, 31, 34 |
| Applicable sector-specific parameters | Conditional/auto or operator-confirmed yearly | OER 35 |
| **Specific embedded free allocation per good**, applicable CBAM benchmark and method confirmation | Auto from governing method and supported inputs; operator reviews yearly | OSER 4(e)–(f) |
| Data gaps and estimates shown with affected result | Conditional/auto review yearly | OER 16(e) |
| Allocation reconciliation, assumptions, rounding and precursor double-counting checks | Auto plus operator review/yearly | PDF calculation validation; not user-entered emissions totals |

### 2.7 Reporting and Verification

| Output or action | Frequency | Input still needed |
|---|---|---|
| **OER**: full Annex IV 1.1 report | Yearly when applicable | Operator checks identity, methods, calculations, applicability and evidence assertions; Certrace assembles items 1–35 |
| **OSER**: Annex IV 1.2 summary from the **same** dataset | Yearly when applicable | Operator checks precursor **use year**, free allocation/benchmark/method and any applicable assertions; Certrace assembles items 1–16 |
| **Declarant-specific addendum**: only for electricity **imported into the EU using actual values** | Conditional/per authorised declarant and import year | Declarant name and **EORI**; producing installation and measurement period; confirmation of applicable point 5(a), 5(d) and, where relevant, no-congestion 5(b) criteria, including originating-installation and capacity-nomination records; monthly interim evidence where required; confirmation D.2.4 evidence was sent to verifier; electricity quantity imported **by that declarant from that installation** for which the criteria are met |
| Supporting evidence package | Yearly/per submission, as applicable | Link relevant source files, records and calculations to the report values; this is not a fourth standard operator report template |
| Applicable actual-electricity assertions in the OER/OSER | Conditional/yearly | Direct-connection 5(b) where relevant, fossil-origin threshold 5(c), evidence sent to verifier, actual electricity factor, and indication applicable addenda were sent |
| Verifier questions, operator responses, findings, corrective actions, revised data/workbooks and report versions | Per review/submission | Record submission dates and status; preserve the correction history and final submitted version |
| Independent verification report | Received after verifier work | Attach the verifier-issued report and findings; the operator does not author its conclusion |

## Completeness check against the supplied template

| Template | Numbered content groups | Where collected |
|---|---:|---|
| OER, Annex IV 1.1 | **35/35** | Company, 1 and 2.1–2.7 above; exact item-by-item mapping in [Complete OER content coverage](CBAM-OER-INPUT-REQUIREMENTS.md#complete-oer-content-coverage) |
| OSER, Annex IV 1.2 | **16/16** | Reused OER dataset plus precursor use year and specific embedded free allocation/benchmark/method; item-by-item mapping in [OSER generation](CBAM-OER-INPUT-REQUIREMENTS.md#oser-generation-under-27-reporting-and-verification) |
| Conditional addendum, Annex IV 1.1.1 | **3/3** | Declarant record and eligible electricity import/evidence; item-by-item mapping in [Addendum generation](CBAM-OER-INPUT-REQUIREMENTS.md#addendum-generation-under-27-reporting-and-verification) |

The template's item 35 points to **sector-specific parameters in Annex IV section 2**, which were not reproduced in the pasted text. The [sector-specific product inputs table](CBAM-OER-INPUT-REQUIREMENTS.md#sector-specific-product-inputs) separately lists those parameters. Other referenced legal conditions and official default/benchmark datasets must be applied from their governing sources; a template field alone does not establish eligibility.
