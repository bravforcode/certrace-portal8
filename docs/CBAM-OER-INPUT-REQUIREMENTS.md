# CBAM OER OSER and declarant addendum input requirements

The Certrace collection flow is **Company → Installation → Reporting Period → Production Structure → Monitoring Methodology → Installation Monitoring Data → Precursor Data and Emissions → Supporting Evidence → Emissions Calculation and Validation → Reporting and Verification**. Each installation and reporting period has separate records, calculations, evidence and report versions.

This specification maps Commission Implementing Regulation (EU) 2025/2547 into that structure. It covers the 35 minimum OER content requirements in Annex IV section 1.1, the 22 monitoring-plan requirements in Annex II A.5, their underlying monitoring inputs, the OSER requirements in Annex IV section 1.2 and the electricity addendum in Annex IV section 1.1.1. It defines data collection; it is not a report layout or an implemented application change.

**Source:** [Official English regulation on EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547), published 22 December 2025, reviewed 14 October 2026. [Authentic Official Journal PDF](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202502547).

References below to “Annex II” or “Annex IV” mean annexes to **2025/2547**, unless another regulation is named. In particular, Annex II to the base Regulation **2023/956** is a different annex: its membership determines whether goods' own indirect emissions are included.

## How to interpret the inputs

- **Required:** collect for an applicable report using actual emissions.
- **Conditional:** collect when the specified technology, material, method or transaction applies.
- **Calculated:** derive from recorded inputs and retain the calculation trail. A report requirement does not necessarily mean a field the exporter must type.
- **Recommended:** a proposed Certrace workflow field or a regulatory recommended improvement, identified as such. It must not become a universal legal requirement.

The legal reporting party is the **installation operator**. An exporter or trader who is not the operator must obtain the installation data from that operator. The Company record may represent the exporter; an installation must identify its actual operator separately where different. Collecting only shipment quantities or EU sales is insufficient: the installation's relevant production, emissions and resource flows are needed for the reporting period.

Article 10 requires OER and OSER when embedded emissions are calculated using actual emissions. Actual production-process data can be combined with default precursor values under Article 15. The **declarant-specific addendum applies to electricity imported into the EU using actual values**, separately for each relevant authorised CBAM declarant. Ordinary exports of steel, aluminium, cement, fertilisers or hydrogen do not trigger that addendum merely because they have an EU buyer.

## Input structure at a glance: Annex IV OER and OSER templates

This tree incorporates every content group in the supplied Annex IV OER outline (1.1, items 1–35), OSER outline (1.2, items 1–16), and the conditional addendum (1.1.1, items 1–3). The numbered coverage tables below were checked against all 35 + 16 + 3 groups in the supplied template; they describe the **input specification**, not proof that every field is already present in the web UI. The detailed tables define applicability and sources. **Once** means enter when creating the operator/installation and update if it changes; **yearly** means confirm or enter for each reporting period; **monthly** is Certrace's suggested collection interval for underlying records, not a legal requirement to produce monthly OER/OSER reports; **calculated** means review the generated result; **conditional** means display only when relevant.

```text
COMPANY / ACTUAL INSTALLATION OPERATOR
├── Once: legal name, corporate/activity registration number, full address in English
└── Once: exporter/operator relationship, if they differ (Certrace workflow field)

INSTALLATION A — repeat independently for every installation
├── 1. Installation Profile
│   ├── Once: name, assigned CBAM Registry ID/status, UN/LOCODE,
│   │         full address in English, main-emission-source coordinates
│   ├── Once; update on change: physical units, boundaries, process connections
│   └── Conditional yearly: new-installation monitoring duration in months
│
└── 2. Reporting Period — calendar year
    ├── 2.1 Production Structure
    │   ├── Yearly; update on change: all CBAM and non-CBAM processes,
    │   │         production routes/technologies and linked production units
    │   ├── Yearly: goods per process/route, exact CN codes, descriptions,
    │   │         applicable compositions and legal functional units
    │   ├── Monthly records → yearly total: each good's output per process,
    │   │         route, CN code and functional unit; non-CBAM output where relevant
    │   ├── Calculated: five largest goods by mass in each process
    │   ├── Conditional: joint-process treatment and same-process precursor exclusion
    │   └── Conditional: relevant precursor types/CN codes and producing sources
    │
    ├── 2.2 Monitoring Methodology
    │   ├── Yearly; update on change: English monitoring plan/version, process
    │   │         boundaries, source streams, measurement/calculation methods,
    │   │         emission factors, allocation and data-quality procedures
    │   ├── Calculated: five largest fuels by energy; five largest process-emission
    │   │         materials by emissions; CEMS gases/five largest monitored sources
    │   ├── Conditional: zero-rated fuel method, heat/waste-gas/CO2 transfer methods
    │   ├── Conditional: indirect-electricity actual/default method and eligibility;
    │   │         own-generation method, CHP/separate and fossil/renewable source
    │   └── Yearly per good: applicable CBAM benchmark and method used for
    │             specific embedded free allocation (OSER)
    │
    ├── 2.3 Installation Monitoring Data
    │   ├── Monthly underlying records: fuel/material activity, calculation
    │   │         factors, process/source identity and measurement evidence
    │   ├── Conditional at measurement frequency: CEMS gases, sources,
    │   │         operating time and measured emissions; other-method emissions
    │   ├── Monthly: electricity from each source, supplier installation/country,
    │   │         quantity and factor; consumption by process and relevant goods
    │   ├── Monthly: own electricity produced, used and exported; CHP/separate;
    │   │         fossil/renewable source
    │   ├── Monthly if applicable: measurable heat and waste gases imported,
    │   │         produced, consumed and exported by process, with counterparties
    │   ├── Monthly if applicable: CO2 captured, received/transferred, quantity,
    │   │         destination and responsible recipient contact
    │   ├── Monthly: CBAM and relevant non-CBAM goods output, route quantities,
    │   │         stock movements and sector-specific parameter measurements
    │   └── Conditional: missing intervals and supported estimates
    │
    ├── 2.4 Precursor Data and Emissions
    │   ├── Once per source; update on change: precursor name/CN code,
    │   │         internal process or external origin operator/installation,
    │   │         assigned Registry ID and origin country where required
    │   ├── Monthly use records: quantity of each type used by installation
    │   │         and by process; distinguish own production from external supply
    │   ├── Conditional default path: applicable official default value
    │   ├── Conditional actual path: source reporting period, whether based on
    │   │         default reporting period or actual production time, year used
    │   │         in the complex good, verified direct/indirect intensities
    │   ├── Conditional: one CN code spanning several production periods;
    │   │         quantity-weighted intensity under Article 14(1)
    │   ├── Conditional: one CN code from several installations; normal
    │   │         Article 14(2) method or justified source/subset under 14(3)
    │   └── Calculated: installation/process precursor totals; exclude
    │             precursors produced within the same joint process under 4(9)
    │
    ├── 2.5 Supporting Evidence
    │   ├── Upload/link: monitoring plan, meters, fuel/lab/production records,
    │   │         source factors, zero-rating and heat/waste-gas/CO2 evidence
    │   ├── Conditional upload/link: precursor producer's verified report or
    │   │         the official default-value reference
    │   ├── Conditional upload/link: actual indirect-electricity evidence and
    │   │         actual imported-electricity evidence
    │   └── Yearly confirmation: which required evidence was sent to verifier;
    │             an upload alone does not establish submission
    │
    ├── 2.6 Emissions Calculation and Validation
    │   ├── Calculated: installation total direct emissions, direct process
    │   │         emissions, applicable installation indirect emissions
    │   ├── Calculated: process activity level and attributed direct/indirect
    │   │         emissions; imported/produced/used/exported flow balances
    │   ├── Calculated per good/composition: direct embedded intensity,
    │   │         applicable indirect intensity, default-value share and
    │   │         indirect actual/default shares
    │   ├── Calculated: actual electricity factors, including PPA factor
    │   │         where relevant, and source-weighted factor
    │   ├── Calculated per good: specific embedded free allocation using the
    │   │         applicable benchmark/method (OSER)
    │   └── Review: all applicable sector parameters, estimates, data gaps,
    │             process/precursor source periods, units and route totals
    │
    └── 2.7 Reporting and Verification
        ├── Generate OER: complete Annex IV 1.1 detail from this dataset
        ├── Generate OSER: Annex IV 1.2 subset from the same validated data,
        │         including free allocation and benchmark/method confirmation
        ├── Conditional: one addendum per authorised declarant importing
        │         electricity into the EU with actual values; enter EORI,
        │         criteria/evidence-submission confirmations and eligible
        │         imported electricity quantity for that declarant
        └── Record independent verification report received from verifier;
                  the operator does not author the verifier's conclusion
```

The detailed OER and OSER coverage tables near the end of this document trace each numbered template item to these nodes. A requested report field can be a calculated result or an operator confirmation; it does not automatically require another manual input box.

## COMPANY

| User input | Status and use | Reference |
|---|---|---|
| Operator legal name | Required; identify the entity operating each installation | Annex IV 1.1(1)(a) |
| Operator corporate or activity registration number | Required; preserve as an identifier, not a number for arithmetic | Annex IV 1.1(1)(b) |
| Operator full address in English | Required; collect street, locality, postcode and country as appropriate | Annex IV 1.1(1)(c) |
| Relationship between exporter and installation operator | Recommended product field; distinguish operator, exporter and trader where necessary | Certrace workflow design |
| Reporting contact name, role and contact details | Recommended product field for collecting and correcting data; not a universal OER field in this regulation | Certrace workflow design |

A shared operator record may be reused across installations, but the report must retain the operator identity applicable to its installation and reporting period.

## INSTALLATION A

The following structure repeats independently for Installation B and every other installation. Shared supplier references may be reused; consumption and emissions remain attached to the receiving installation and period.

### 1 Installation Profile

| User input | Status and use | Reference |
|---|---|---|
| Installation name | Required | Annex IV 1.1(1)(d) |
| Installation CBAM Registry identifier | Listed in the OER minimum contents; collect the assigned identifier and registry status. Do not invent an identifier for an unregistered operator | Annex IV 1.1(1)(d); Article 10(2)–(3) |
| Applicable UN/LOCODE | Required location code; do not substitute an internal factory code | Annex IV 1.1(1)(d) |
| Full installation address in English transcription | Required | Annex IV 1.1(1)(d) |
| Latitude and longitude of the main emission source | Required; this is the main emission source's location | Annex IV 1.1(1)(d) |
| Actual operator linked to the installation | Required for correct report identity | Annex IV 1.1(1) |
| Installation description and site/system-boundary diagram | Required for the monitoring plan; identify production units, processes, connections and boundaries | Annex II A.5(2), (13) |
| New-installation status and monitoring start/end dates | Conditional; report the monitoring duration in months for a new installation | Annex IV 1.1(8) |
| Commercial justification and evidence for a split into installations | Conditional when Article 4(7) applies; splitting routes must have valid commercial reasons | Article 4(7) |

Period-specific changes to the description, configuration, technology and boundaries must be recorded in the applicable monitoring-plan version. Stable profile details can be prefilled.

### 2 Reporting Period 2026

| User input or system value | Status and use | Reference |
|---|---|---|
| Reporting calendar year | Required; 2026 for the initial flow | Article 1(5); Article 7 |
| Period start and end | Calculated from the year: 1 January to 31 December. Keep actual monitoring coverage separately for new installations | Article 7; Annex IV 1.1(8) |
| Monitoring coverage and missing intervals | Conditional; distinguish absent data from an actual zero | Annex IV 1.1(16)(e); Annex II A.2 |
| Actual production-time evidence | Conditional for later import years when rebutting the default production-year presumption | Article 7(1) |
| Production, method and configuration changes during the year | Conditional; effective dates, reasons and affected data | Annex II A.2(2)–(3) |

Goods imported in 2026 use reporting period 2026 under Article 7(1). For later years, import year is the default unless sufficient evidence establishes the actual production period. Electricity always uses its year of import. Article 13 separately governs precursor reporting periods. Do not offer arbitrary quarters as the legal annual OER period; shorter internal collection intervals can roll up into it.

### 2.1 Production Structure

Create repeatable **Production Process → Production Route(s) → Product/CN Code → Production Steps → Relevant Precursor Sources**, with **Other Inputs/Source Streams** linked to the step or process where they are used. Production steps make the physical flow and monitoring boundary understandable; the regulation requires descriptions of processes, routes, units and source streams, but does not prescribe a fixed five-step form for every plant.

#### Production process inputs

| User input | Status and use | Reference |
|---|---|---|
| Process name, description and internal identifier | Description required; internal identifier is a product design field | Annex II A.5(2), (4) |
| CBAM or non-CBAM process classification | Required to cover the installation and allocate shared resources correctly | Annex IV 1.1(2)(a)–(b) |
| Goods produced and applicable CN codes | Required; use the Annex I category mapping | Annex II A.5(3)–(5); Annex IV 1.1(13)–(14), (31) |
| Production routes/technologies and associated units | Required where routes apply | Article 4; Annex IV 1.1(2)(a), (34) |
| Included operations and process boundary diagram | Required; map source streams, emission sources, goods and transfers | Annex I section 3; Annex II A.5(13) |
| Shared units, co-products and connections to other processes | Conditional; enable correct multifunctional allocation | Article 4(8); Annex II A.4; Annex III A |
| Joint precursor/complex-good production arrangement | Conditional; record which precursor is included and whether it is sold or used elsewhere | Article 4(9) |
| Relevant precursor types, CN codes and sources | Conditional for complex goods; record internal process or external producing installation | Annex II A.5(14); E |

**Rules for grouping:** goods with the same functional unit produced by different routes in one installation belong to a single production process encompassing those routes. Route quantities are still collected. A multifunctional process is mandatory for the cases in Annex II A.4: specified steel/aluminium goods differing only in size or shape with the same precursor types, quantities and proportions, and specified fertiliser goods differing only in concentration. A joint process for an internal precursor and complex good is permitted only under Article 4(9)'s conditions.

#### Worked example: hot-rolled steel from an EAF-based chain

This is an **illustrative input record**, not a preapproved CN classification or a fixed legal boundary. The operator selects the exact eight-digit code and confirms the physical route and applicable precursor list for the goods actually produced.

```text
INSTALLATION A → REPORTING PERIOD 2026 → 2.1 PRODUCTION STRUCTURE
└── Production Process 1: Hot-Rolled Steel Production
    ├── Aggregated goods category: Iron or steel products
    ├── Production Route 1: EAF-based integrated route, if joint treatment is allowed
    │   └── Technology: Electric arc furnace steelmaking feeding hot rolling
    ├── Product 1: Hot-Rolled Steel
    │   ├── CN code: 7208 XXXX — illustrative; select the exact eight-digit code
    │   ├── Description: Flat-rolled iron or non-alloy steel, hot-rolled,
    │   │   with the actual width, thickness, finish and specifications
    │   ├── Output: tonnes by CN code, route and reporting period
    │   └── Production steps / units
    │       ├── 1. Prepare scrap and other metallic inputs
    │       ├── 2. Melt inputs in the electric arc furnace
    │       ├── 3. Refine molten steel
    │       ├── 4. Cast semi-finished steel
    │       └── 5. Reheat and roll into the hot-rolled product
    ├── Relevant CBAM precursors — only if applicable to the actual route
    │   ├── Crude/semi-finished steel from a separate process or supplier
    │   │   ├── Exact applicable CN code, source process/installation
    │   │   ├── Exporter: quantity used in this hot-rolling process
    │   │   └── Producer: source-period emissions data and verification
    │   ├── Pig iron, if used and relevant
    │   │   ├── CN heading 7201; determine exact code and producing source
    │   │   ├── Exporter: quantity used in this production process
    │   │   └── Producer: installation, route, period and verified values
    │   └── Ferro-alloy, if used and relevant
    │       ├── Determine the actual CN code and producing source
    │       ├── Check whether the specific code is a CBAM precursor
    │       └── Request producer's data only if it is a relevant precursor
    └── Other inputs / source streams — classify by monitoring role
        ├── Electricity: kWh/MWh consumed, source and evidence basis
        ├── Natural gas: quantity, unit and applicable emission parameters
        ├── Scrap, electrodes, graphite, carbonates or alloying materials:
        │   quantities and carbon/process data where the method requires them
        └── Refractory materials: record relevant consumption or emissions
            data only where the applicable boundary/method requires it
```

**Boundary check for this example:** CN heading 7208 belongs to the *iron or steel products* category. EAF melting, secondary metallurgy and casting can form an upstream *crude steel* production process; hot rolling of 7208 is in the iron-or-steel-products boundary. If the upstream crude steel is separately produced or obtained, create and link that process or supplier as a relevant precursor source. Treat the complete chain as one joint process only if Article 4(9)'s conditions are met: the precursor is made in the same installation and is not transferred out for sale or use in another production process. A physical step list may show the full chain even when the legal monitoring boundary separates it into two processes. [Article 4(9), Annex I table and sections 3.15–3.16.](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547)

For each step, the product form should let the operator identify the unit/technology, inputs and outputs, the emission source or stream if any, and which production process boundary owns it. The five step names above are examples. In an EAF route, electrodes, electrode paste, carbon in scrap/alloys, relevant fuel and carbonate use, and carbon remaining in product/slag/waste may affect direct emissions under the chosen monitoring method. Electricity and natural gas are **other inputs/source streams**; they do not automatically become CBAM precursor goods. A ferro-alloy or refractory is likewise not a CBAM precursor merely because it is purchased: classification and relevance must be checked for its exact CN code and the production route. [Annex I sections 3.15.2.2 and 3.16.2; Annex II A.5 and E.](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547)

#### Product and production quantity inputs

Collect each good's name, CN code, process, route, composition/grade where relevant, total output in tonnes, output in its legal functional unit, quantity delivered or used as a precursor and measurement source. Include non-CBAM output quantities where relevant to the process. If quantity is calculated from movements, collect incoming/outgoing quantities, opening/closing stocks and returns to the same process. Keep off-spec products, by-products, wastes and scrap separately so they are not added to activity levels. Only saleable goods or goods directly usable as a precursor count; avoid counting both an internal precursor and the final output in a joint process. [Annex II B.4.1 and F; Annex IV 1.1(13)–(14), (30)–(31), (34).](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547)

| Product | Functional unit to apply | Additional user data |
|---|---|---|
| General case | Tonnes of goods classified under the same CN code | Product mass |
| Electricity | kWh | Net electricity output; convert consistently from monitored MWh |
| Fertilisers under CN 2808 00 00, 2814 and 3105 | Kilograms of nitrogen contained in the goods | Nitrogen content and goods mass |
| Other fertiliser CN codes | Applicable supplementary unit under Regulation (EEC) 2658/87 | Composition and data needed for that supplementary unit |
| CN 2523 10 00, 2523 21 00, 2523 29 00 and 2523 90 00 | Tonnes of clinker contained in the goods | Clinker content and goods mass |

Source: Article 4(2)–(5). Store both physical goods mass and the functional-unit quantity. CN validation, category mapping, applicable greenhouse gases and functional-unit selection should be system functions using versioned official reference data.

#### Sector specific product inputs

These are the complete categories in Annex IV section 2. They are conditional on the good produced and also apply to precursor information where Annex II E requires it.

| Aggregated goods category | User input or calculated report value |
|---|---|
| Calcined clay | No additional parameter in this table; normal monitoring requirements still apply |
| Cement clinker | No additional parameter in this table; clinker functional-unit and monitoring requirements still apply |
| Cement | Clinker consumed and cement produced; calculate clinker-to-cement mass ratio as a percentage |
| Aluminous cement | No additional parameter in this table |
| Hydrogen | No additional parameter in this table |
| Urea | Urea purity/mass percentage, nitrogen percentage and nitrogen content |
| Nitric acid | Concentration by mass and nitrogen content |
| Ammonia | Concentration if an aqueous solution; nitrogen content |
| Mixed fertilisers | Nitrogen as ammonium, nitrate, urea and other organic forms; total nitrogen content |
| Sintered ore | No additional parameter in this table |
| Pig iron | Main reducing agent; mass percentages of Mn, Cr, Ni and total other alloy elements |
| FeMn | Mass percentages of Mn and carbon |
| FeCr | Mass percentages of Cr and carbon |
| FeNi | Carbon mass percentage is explicit. The English source omits the other element's name; see the source issue below |
| DRI | Main reducing agent; mass percentages of Mn, Cr, Ni and total other alloy elements |
| Crude steel | Precursor's main reducing agent if known; Mn, Cr, Ni and total other alloy mass percentages; tonnes of scrap per tonne of crude steel; percentage of scrap that is pre-consumer |
| Iron or steel products | Main reducing agent in precursor production if known; Mn, Cr, Ni and total other alloy mass percentages; tonnes of scrap per tonne of product; percentage of scrap that is pre-consumer |
| Unwrought aluminium | Tonnes of scrap per tonne of product; percentage of scrap that is pre-consumer; total percentage of non-aluminium elements if their total exceeds 1% |
| Aluminium products | Same scrap and non-aluminium composition parameters as unwrought aluminium |

For scrap ratios, collect scrap quantity and pre-consumer scrap quantity plus product output; calculate the ratios. For clinker/nitrogen composition ranges, collect the range, average content and quantities represented. Ranges cannot exceed 10%. Custom compositions require a content declaration and emissions calculation for each consignment under Annex III B; this is separate from the electricity declarant-specific addendum.

**Source issue:** the authentic English PDF, page 84, prints the FeNi entry as “Mass % of and carbon.” Nickel is a plausible intended missing word, but must not be represented as an unambiguous requirement from this sentence. Nickel content is independently relevant to the NPI classification thresholds in Annex I 3.12–3.13. Collect it when needed for classification; confirm the defective reporting wording before finalising FeNi-specific report validation.

### 2.2 Monitoring Methodology

The user must prepare an English monitoring plan, not merely select an emissions factor. Collect the following repeatable methodology records and documents. [Article 5; Annex II A.3–A.5.](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547)

| User input | Applicability |
|---|---|
| Monitoring-plan date, version, file and effective dates | Required; retain historical versions |
| Installation/process descriptions, boundaries, goods and routes | Required; reuse 1 and 2.1 |
| Applicable CBAM benchmarks for each relevant good | Required monitoring-plan content; reference the applicable free-allocation rules/data |
| Source streams and emission sources per process, with descriptions | Required; distinguish a fuel/material stream from an emitting unit/stack |
| Monitoring method for each stream/source | Required: calculation standard method, carbon mass balance, CEMS or relevant sector method |
| Calculation formulae, input variables and parameter determination methods | Required for calculation methods |
| Measurement-system identity, exact instrument locations and monitored variables | Required where measurement systems are used |
| Continuous/batch metering choice and stock-determination method | Required where quantities are monitored |
| Factor source and method | Required for relevant factors: standard value, laboratory analysis or empirical correlation |
| Sampling method/plan per applicable source stream | Required plan content where applicable; enhanced sampling plans/frequencies are recommended improvements under B.5.4.2 |
| Standards applied; units and wet/dry/material-state basis | Required to support suitable, consistent measurements and factors |
| Instrument uncertainty, calibration and quality-control procedures | Required where applicable; retain proof |
| Supplier measurement-system use and reason | Conditional when instruments are outside the operator's control |
| Correlation/proxy model, valid range, validation date and review | Conditional; validate empirical correlations at least annually |
| Zero-rating method and sustainability evidence | Conditional for a claimed zero-rated biomass fraction |
| Heat monitoring/allocation and external installation identities | Conditional for relevant heat flows |
| Electricity generation type, technical links/PPAs and actual-factor evidence plan | Conditional for relevant electricity |
| PFC monitoring method and factors | Conditional for primary aluminium |
| Waste gas monitoring and counterpart installations | Conditional |
| CO2 capture/storage/use and transfer monitoring, receiving/supplying parties and responsible contacts | Conditional |
| Technical infeasibility or unreasonable-cost justification | Conditional; document the case and reassessment |
| Data-quality control system | Required; record the eight controls below |

The control system includes measurement-equipment quality assurance; risk assessment of errors in data flows; IT quality assurance; segregation of duties and competence; internal reviews/validation; corrections and corrective actions; control of outsourced processes; and records/document-version management. Collect procedures, responsible roles, review records and evidence as appropriate; the role fields are a practical implementation of the documented controls.

Do not treat all improvements as minimum requirements. Examples include the recommended activity-data uncertainty targets in B.4.4, sampling frequencies in B.5.4.2 and greater use of accredited laboratories. CEMS has minimum uncertainty requirements in B.6.5. Standard-factor selection must respect B.5.2: Type I values are applicable only when no Type II value is available for the same parameter and fuel/material. Past analyses have different age limits: five years for Type I and two years for Type II.

For CEMS, record full-period uncertainty against the 7.5% minimum requirement, or the permitted 10% for minor sources/exceptional circumstances with the applicable justification. The 2.5% target for sources above 100,000 tonnes fossil CO2e is a recommended improvement. For installation-specific PFC factors, record uncertainty against the maximum ±15% and the determination/review date; factors are determined at least every three years or sooner after relevant changes. For analyses, the weekly/daily and mass-based frequencies in B.5.4.2 are recommendations with stated alternatives, not unconditional hard gates.

For a claimed unreasonable cost, retain estimated cost, depreciation/equipment lifetime where applicable, affected emissions and uncertainty improvement. Annex II A.3(8) uses an EUR 80/tCO2e benefit reference and says improvements up to an accumulated EUR 4,000/year are not deemed unreasonable. This is a monitoring-method assessment, not a carbon price paid input.

### 2.3 Installation Monitoring Data

Each reading/import should identify installation, period, process, route where relevant, stream/source, quantity/value, unit, time or batch, method, factor version and evidence. Internal IDs, import timestamps and reviewers are recommended traceability fields rather than individually enumerated report requirements.

#### Fuel combustion and process material records

| Data to collect | When needed | Reference |
|---|---|---|
| Fuel/material name, stream identity and linked sources/processes | Each relevant stream | Annex II B.1–B.3; Annex IV 1.1(16)(a) |
| Quantity consumed/produced and unit | All applicable streams; use tonnes, normal cubic metres or energy as appropriate | Annex II B.3–B.4 |
| Deliveries in/out, opening/closing stock, returns and metering dates | When batch/stock accounting is used | Annex II B.4.1 |
| Fuel EF in tCO2/t or tCO2/m³ | Minimum standard combustion method with a suitable quantity-based factor | Annex II B.3.4(a) |
| Fuel NCV and EF in tCO2/TJ | Energy-based combustion calculation; NCV is not universally mandatory if a suitable quantity-based EF is used | Annex II B.3.1.1 |
| Oxidation factor, or documented conservative value 1 | When applying the combustion formula; measured factors are an improvement | Annex II B.3.1.1; B.3.4 |
| Material/process EF and activity quantity | Standard process-emissions method | Annex II B.3.1.2; B.3.4(b) |
| Conversion factor, or documented conservative value 1 | Applicable process-emissions calculation | Annex II B.3.1.2 |
| Carbon content and signed incoming/outgoing material quantities | Carbon mass balance; outputs subtract carbon retained in products/slags/waste | Annex II B.3.2; B.3.4(c) |
| Organic/inorganic carbon or total preliminary factor | Conditional for mixed-carbon inputs, according to chosen method | Annex II B.3.1.2 |
| Biomass fraction, preliminary EF/carbon content, qualifying biomass amount and evidence | Conditional when biomass zero-rating is claimed; unknown/non-qualifying fractions are treated conservatively | Annex II B.3.3 |
| Laboratory results, batch/period represented, moisture, purity, composition, density and factor derivation as applicable | When analyses support quantity or factor determination | Annex II B.5 |
| Normal-operation, start-up, shutdown and emergency fuel/material use | Include applicable stationary emissions during the whole period | Annex II B.1 |

Exclude transport-purpose mobile-machinery emissions under B.1(c) and equipment/infrastructure purchase and maintenance under Annex I 3.1. Sector boundaries can exclude specific finishing operations; apply those boundaries rather than asking for every company emission.

Specifically, the iron/steel-products boundary excludes plating, cutting, welding and finishing, and the aluminium-products boundary excludes cutting, welding and finishing. Their upstream included operations and precursor emissions still need assessment. Apply exclusions to the relevant process boundary rather than removing a whole precursor or all installation activity.

#### Continuous emissions measurement records

Conditional for CEMS. N2O monitoring requires a measurement-based methodology. CO2 CEMS requires evidence that it yields more accurate data than the calculation-based method. Collect:

- Emission source, stack/measurement point, greenhouse gas, instrument/system, method and units.
- Hourly or shorter-period greenhouse-gas concentration and flue-gas volume/flow; operating periods and all available data points.
- Direct or indirect concentration determination; other measured components where concentration is inferred.
- Gas-state basis and normalisation; biomass CO2 deduction data and method where eligible.
- Missing/invalid periods, data availability and substitute-data method/inputs. The 80% availability rule determines use of remaining observations or substituted data.
- Annual source totals, uncertainty, calibration/QA evidence and corroborating CO2 calculations.

For N2O, preserve tonnes to three decimal places before conversion to annual CO2e. Annex II G supplies GWPs: N2O 265, CF4 6,630 and C2F6 11,100. The system selects these regulatory factors. [Annex II B.6 and G.](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547)

#### Electricity records

For applicable indirect emissions, collect total installation consumption and consumption for relevant CBAM goods/processes. Collect quantities per source, supplier/producing-installation name, country of origin, installation identity, EF, EF source, actual/default basis and applicable period. Preserve internally produced, imported, transferred, consumed and exported amounts and flags for CHP, separate generation, fossil/renewable generation and export outside a process boundary. Collect PPA identity, physical-delivery quantities, factor information and linked evidence where applicable. [Annex IV 1.1(3)–(4), (9)–(12), (17), (26), (32)–(33); Annex II D.](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547)

Meter **active/real electricity**, not apparent or reactive power. For generated electricity, collect gross generation and own consumption so the system can establish net electricity leaving the generation boundary. Calculation data use MWh and tCO2/MWh; the electricity functional unit is kWh, so report conversions must be explicit.

For an actual generator factor, collect fuel quantities, NCVs, EFs, flue-gas-cleaning emissions and net output; CHP also needs net heat and efficiency/allocation data. Grid electricity normally uses the applicable official country-grid default. Multiple sources normally use the weighted installation average under Article 9; restricting a process to a source/subset requires evidence that only those sources served it. A PPA or renewable claim alone does not establish the required actual-value evidence.

#### Heat and cogeneration records

Conditional for heat flows. Collect net heat imported, produced, consumed, transferred and exported per process, source/destination installation or unit, medium, measurement method, factor/method and evidence. For measurement, collect transmitted/returned flow, temperature, pressure, physical state/saturation and enthalpy inputs. For proxies, collect fuel energy, measured/design efficiency, part-load curve/load factor and maximum input as applicable. Record condensate return, losses and exothermic heat separately. [Annex II C; Annex III A.2.2; Annex IV 1.1(2)(h), (17).](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547)

CHP additionally needs fuel mix, emissions including scrubbing, net heat, net electricity/mechanical energy, heat/electric efficiencies, construction year, fuel reference-efficiency category, hot-water/steam/exhaust-gas mode and condensate-return treatment. These select the reference efficiencies in Annex III C and determine allocation. Imported heat needs supplier emissions/verification data where available, or the prescribed fallback fuel/efficiency basis. Reconcile heat losses so flows are neither omitted nor counted twice.

#### Waste gases and CO2 transfers

| Data to collect | Applicability | Reference |
|---|---|---|
| Waste gas produced, consumed, imported, transferred and exported | Conditional; quantities per process and counterpart installation | Annex IV 1.1(5), (17) |
| Waste-gas volume, NCV, composition, carbon/inherent CO2 and factor evidence | Conditional for monitoring and allocation | Annex II B; Annex III A.2.3 |
| Receiving process, end use and evidence for exported-gas correction | Conditional | Annex III A.2.3 |
| CO2 received, captured, used and transferred amounts | Conditional; preserve received and outgoing quantities separately | Annex IV 1.1(6), (16)(d); Annex II B.8 |
| Supplying/receiving installation or transport entity and responsible person's identity/contact | Conditional; include both incoming and outgoing counterparties in the plan | Annex II B.8.3 |
| Storage/use destination, chain of custody and fraction actually stored/permanently bound | Conditional for any deduction | Annex II B.8.2 |
| Transfer measurements; binding reactions, stoichiometry and mass-balance inputs | Conditional; transferred CO2 uses measurement, permanent chemical binding uses calculation | Annex II B.8.3 |

CO2 transfer is not automatically a deduction. Preserve the evidence across the transport/storage/use chain. Inherent CO2 vented/flared after transfer is counted at its originating installation. Urea-specific received CO2 must be considered if not already counted at the originating installation.

#### Additional technology inputs

- **Primary aluminium PFC:** cell technology, slope or overvoltage method, primary aluminium output, anode-effect frequency/duration or minutes per cell-day, or anode-effect overvoltage and current efficiency; CF4 factor, C2F6 fraction, duct collection efficiency, fugitive/non-anode-effect estimate, factor measurements, uncertainty and determination date. Use appropriate technology factors or justified installation factors; do not omit fugitive emissions. [Annex II B.7.]
- **Cement clinker:** input- or output-based method, carbonate/raw-meal composition and quantities or clinker output; kiln/bypass dust quantities and calcination; fuel and non-carbonate carbon; raw-meal/clinker ratio where used; cement deliveries/stock changes, clinker supplies/dispatch/stocks and additives where output is determined by material balance. [Annex II B.9.2.]
- **Nitric acid:** N2O concentration after abatement, abated and unabated operating data, dry-basis gas flow, primary/secondary/seal-air flow and O2 concentration, with ammonia-input or alternative-flow data where justified. [Annex II B.9.3.]
- **Scrubbing/de-NOx/flares:** carbonate consumption or gypsum output for desulphurisation, urea consumption in de-NOx, flare quantity/composition/inherent CO2 and routine/emergency events. [Annex II B.9.1.]
- **Iron/steel/ferroalloys:** reducing-agent use, fuel inputs, carbonate/scrubbing inputs, electrodes/paste, incoming carbon in scrap/alloys and outgoing carbon in product/slag/waste under the applicable mass balance. [Annex I 3.11–3.16.]
- **Other sector routes:** include all relevant fuel/process inputs and associated preparation, drying, heating, calcining, reforming, gasification, synthesis, recycling or scrubbing operations within Annex I section 3 boundaries. Identify any new/unlisted route; the cross-sector rules still apply.

### 2.4 Precursor Data and Emissions

Create repeatable records per **precursor CN code → producing installation/process → production reporting period → receiving production process**. A reseller's name alone does not identify the producing installation.

#### Who supplies the precursor information

The exporter/final-good operator is **not automatically the precursor producer**. Record what the final-good installation **actually used**; if the exporter is only a trader, obtain that use figure from the final-good operator. For an external precursor, request production and emissions information from the **operator of the installation that made it**; a reseller may relay the request but its trading-company address does not replace the producing installation. Certrace should show these as separate parts of one precursor record. [Annex II E(2), Annex II A.1(4)–(5).](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547)

| Part of the record | Who can provide it | Minimum useful fields in the form |
|---|---|---|
| Material and purchase link | Exporter, from purchasing documents | Material name/description; exact CN code after classification; purchase reference; seller/contact; whether it is a relevant CBAM precursor. Purchase reference/contact are Certrace workflow fields. |
| Use in final-good production | Exporter's installation/operator | Receiving production process; quantity actually used, unit, dates/year and supporting stock or production records; split by source if known. Purchased quantity can differ from used quantity. |
| Producing installation | Precursor producer, possibly relayed by seller | Producing operator and installation names; country; CBAM installation ID if available; UN/LOCODE, address in English and coordinates; production route. |
| Precursor production and emissions | Precursor producer | Production reporting-period start/end; applicable sector parameters; specific direct and indirect embedded emissions in tCO2e per tonne; identify the produced CN code and data period. |
| Basis for using actual values | Precursor producer/verifier | Producing-installation verification report, its covered period, verifier identity and accreditation/sector scope sufficient to assess eligibility. These are supplied evidence, not emissions figures invented by the exporter. |
| Default-value path | Certrace, using official reference data | Applicable country/good/period default and its official source/version when eligible actual supplier data is absent or inconclusive. Exporter confirms source identity/origin where known; the system selects the value. |

**Proposed supplier request:** “For precursor [exact CN code/material] used by [our installation] in [reporting year], please identify the *installation that produced it* and provide its country, address, UN/LOCODE, coordinates, production route, relevant sector parameters, production-period dates, specific direct and applicable indirect embedded emissions in tCO2e per tonne, and the verification report covering that period. If you are a trader, please obtain these from the producing operator or identify that operator so we can request them.” Certrace can send or export this request and track `requested → received → eligibility reviewed → actual accepted / default applied`. Those status labels are workflow design, not legal report fields.

**Fictional entry showing the split:** The exporter marks `Pig iron, CN 7201 [exact eight-digit code pending]`, records `100 tonnes used in the 2026 EAF process` from its own inventory, and selects `External source: Example Pig Iron Works (fictional)`. The producer's installation ID, route, reporting period, direct/indirect intensities and verification report stay **pending supplier response**. `100 tonnes used` is made-up example data; no emissions figure is assumed. If the producer cannot provide eligible actual data, Certrace uses the applicable official default for that precursor under Annex II E(3) and A.1(5), with the default's source retained.

For an **internal precursor made in a separate process** at the same installation, the final-good operator already controls both process datasets: link the producing process and determine its specific direct/indirect emissions and the amount transferred into the receiving process. For a permitted **joint process** under Article 4(9), record only additional precursors from outside that joint process so the internal intermediate is not counted twice.

| User input | Status and use | Reference |
|---|---|---|
| Precursor name and CN code | Required for each relevant precursor | Annex IV 1.1(22)–(23) |
| Internal/external source and source production process | Required where applicable; distinguish a joint-process intermediate | Annex II E; Article 4(9) |
| Operator and producing-installation names | Required source identity | Annex IV 1.1(28) |
| CBAM installation identifier where applicable/available | Conditional | Annex IV 1.1(28); Annex II E(2)(b) |
| External source country, UN/LOCODE, full address/English transcription and coordinates | Applicable external-source data; default-value report country is included where known | Annex II E(2); Annex IV 1.1(22)–(23) |
| EU/exempt-country origin and supporting origin information | Conditional; applicable precursor emissions are counted as zero | Annex II E; Annex III B |
| Production route and applicable sector parameters | Conditional according to precursor category | Annex II E(2)(d)–(e) |
| Quantity used at the installation and in each consuming process | Required; internal and external totals separately | Annex IV 1.1(18)–(21), (27) |
| Quantities supplied per source/year and quantities actually used | Required for weighting and any justified source/subset approach | Articles 13–14; Annex II E |
| Actual/default emissions basis | Required; can differ among precursors | Article 15; Annex IV 1.1(22)–(23) |
| Applicable default value and official reference/version | Conditional for defaults; normally selected by the system from authoritative data | Annex IV 1.1(22)(d) |
| Actual specific direct and applicable indirect embedded emissions with units | Conditional for actual values | Annex IV 1.1(23)(e) |
| Production reporting year and start/end dates | Required for actual values | Annex II E(2)(g); Annex IV 1.1(23)(d) |
| Default period or evidenced actual production period | Required period determination for actual values | Article 13; Annex IV 1.1(23)(d) |
| Year precursor was used in the complex good | Needed for OSER | Annex IV 1.2(13)(d) |
| Producing-installation verification report and covered period | Required to use external non-exempt actual data under A.1(4) | Annex II A.1(4)–(5) |
| Verifier identity, accreditation validity at report issue and sector scope | Obtain with report; eligibility is checked by the system/reviewer | Annex II A.1(4)(a) |
| Traceability evidence for a particular source/subset | Conditional for departing from the normal multiple-source average | Article 14(3) |

Default precursor period is the production year of the complex good unless evidence establishes the actual period. The report used for actual precursor emissions must cover that production period; the latest available report is not sufficient solely because it is the latest. Incomplete/inconclusive supplier data or an ineligible verification report requires applicable defaults. Precursors from multiple years/sources are weighted as Articles 14(1)–(3) require. Here “default method” for weighting is not the same thing as using a default emissions value.

Consumption must include precursor amounts lost, cut off, combusted or transformed during production. Do not count only material remaining in the final good. For joint processes, exclude separately adding precursors already covered inside the same process; additional precursors from elsewhere still count. Nested complex precursors are handled recursively. The system calculates specific precursor consumption per functional unit of output. [Annex II E; Annex III B.]

Determine indirect-emissions applicability for the precursor as well as the final good. Annex I 3.1 includes the indirect emissions of a precursor not listed in Annex II to Regulation 2023/956 even where the complex final good is listed there; conversely it excludes indirect emissions of a listed precursor even when the final good is not listed. A single final-product “direct only” flag must not suppress all precursor indirect data.

### 2.5 Supporting Evidence

Collect evidence linked to the value, process, methodology or assertion it supports. Proposed metadata are document name/type, issuer, relevant installation/process/source, period or batch, version, issue date and related data records. Evidence requirements arise throughout Annex II rather than as a single universal upload checklist.

| Evidence bundle | When required |
|---|---|
| Monitoring plan, diagram, configuration changes and control procedures | Applicable actual-emissions monitoring |
| Meter/scale readings, delivery records, stock records, invoices and production logs | According to chosen quantity methods |
| Laboratory reports, sampling records, standards, factor sources and correlations | According to factor methods |
| Calibration, uncertainty, instrument suitability and QA records | According to metering/CEMS methods |
| Biomass sustainability/GHG saving and eligible purchase/cancellation evidence | Claimed zero-rating; apply B.3.3's criteria and exceptions |
| Supplier reports and verifier accreditation/period evidence | External precursor actual values |
| Heat/waste-gas flow records and counterpart data | Applicable flows and corrections |
| CO2 chain-of-custody, storage/permanent-binding and measurement evidence | Claimed CO2 deductions |
| Data-gap explanation, substitute calculation and conservative-estimate support | Missing or unusable monitoring data |
| Justification for method changes, technical infeasibility or unreasonable cost | Where such a case is invoked |
| Evidence restricting electricity/precursors to a specific source/subset | Article 9(2) or Article 14(3) approach |
| Consignment-specific clinker/nitrogen content declarations | Custom compositions under Annex III B |

**Actual indirect electricity emissions, Annex II D.4.3:**

- Direct technical link: single-line connection diagram; producer smart-meter data; consumer smart-meter data matched within periods no longer than one hour; and, for multiple connected installations, the delivery contract or intra-company off-take agreement covering at least the claimed quantity.
- PPA route: physical-delivery PPA between producer and goods installation (a single three-party contract if an intermediary is involved); producer and consumer smart-meter data matched within periods no longer than one hour; and public/reliable evidence of the physical grid connection.

Collect the relevant generator factor calculation as well as these eligibility documents. Record the operator's criteria assertion and whether the evidence was submitted to the verifier, separately from the verifier's conclusion.

**Electricity imported into the EU, Annex II D.2.4:**

- Physical-delivery PPA between the authorised declarant and the third-country generator, valid for the import time and covering at least the claimed quantity; one three-party contract if an intermediary is used.
- A single-line diagram for the direct connection to the EU transmission system, or hourly evidence of no physical network congestion between generator and EU system.
- Data demonstrating fossil-origin emissions do not exceed **550 gCO2/kWh**.
- Interconnector nomination documents covering origin, destination and transit countries, nominated quantity and time interval; smart-meter production data matched to that nomination within a period no longer than one hour.
- Monthly interim reports containing evidence of fulfilment of criteria (a)–(d).

Some of this evidence comes from the declarant, importer or transmission-system operator rather than the exporter. The monitoring plan must explain how unavailable evidence will be obtained. Preserve access separation between different declarants' addenda. Relevant records/support must be kept for **at least six years after the reporting period** under Annex II A.2(4).

### 2.6 Emissions Calculation and Validation

The following are system results, with methods, factors and evidence retained for review. Users supply the underlying observations, choices and justifications.

| System result | Input basis and reference |
|---|---|
| Each source-stream/source's direct emissions | Standard combustion/process calculations, carbon mass balance, CEMS or sector method; Annex II B |
| Total installation direct emissions | Sum valid source/stream contributions without overlap; Annex IV 1.1(7), (16) |
| Installation and process electricity emissions and applicable weighted EF | Consumption/source quantities and eligible EFs; Article 9; Annex II D |
| Net heat, electricity and waste-gas balances per process | Recorded production/import/consumption/transfer/export; Annex IV 1.1(17) |
| Reconciled process data | Annex III A.1: reconciliation factor = installation total / sum of process data where applicable |
| Emissions allocated among co-products | Physical relationship/functional units or molar ratios; include co-product masses and molar masses where needed; Annex III A.2 |
| CHP heat/electricity allocation | Unit emissions, outputs and actual/design/reference efficiencies; Annex III A.2.2 |
| Attributed direct process emissions | Direct process emissions plus/minus eligible heat and waste-gas terms, minus generation term as applicable; negative result set to zero; Annex III A.3 |
| Attributed indirect process emissions | Applicable electricity-consumption emissions; Annex III A.3 |
| Process activity level | Eligible final output in the correct functional unit; Annex II F |
| Precursor emissions and weighted intensities | Eligible actual/default/exempt values, source/year weights and total consumed quantities; Articles 13–15; Annex III B |
| Specific direct and applicable indirect embedded emissions per good | Attributed emissions plus relevant precursor emissions divided by activity level; Annex III B |
| Composition-specific embedded emissions | Clinker/nitrogen content and range/consignment rules; Annex III B |
| Specific precursor consumption | Quantity consumed / output activity level; Annex III B, equation 61 |
| Share of embedded emissions using defaults | Recorded contribution basis; Annex IV 1.1(15)(d) |
| Actual/default shares for indirect emissions | Preserve calculation basis and source contributions; Annex IV 1.1(15)(e) |
| Five largest goods/fuels/materials/CEMS sources | Rank full records by mass, energy, emissions and source emissions respectively; Annex IV 1.1(2)(c)–(f) |
| Scrap/clinker/composition ratios | Product and input quantities; Annex IV section 2 |
| Specific embedded free allocation and benchmark/method confirmation | Required in OSER and benchmarks in monitoring plan; detailed calculation requires the applicable separate free-allocation rules |

Validation should check applicability and units; source/process completeness; double counting; stocks and flow balances; appropriate functional-unit denominators; precursor report periods and accreditation; weighting/source-subset evidence; actual-electricity eligibility; biomass/CO2 deduction eligibility; composition ranges; and unexplained gaps. Require justified conservative substitutes where data are missing. A missing value must not silently become zero.

Preserve unrounded calculation precision. Annex II A.1(6)–(8) requires full-period emissions in whole tonnes CO2e and specific emissions with all significant digits up to five decimals. Also preserve the functional-unit and composition conversions required by Article 4 and Annex III; do not label every intensity as tCO2e/t goods when the base unit is kWh, kg nitrogen or tonnes clinker.

The regulation contains numeric reference data for fuel/material factors, PFC factors, global warming potentials and heat/electricity efficiencies. These should be versioned system lookup data, with source and units. A user selecting an official factor should not need to copy its number manually. Supplier/laboratory-specific values require their own evidence and method.

### 2.7 Reporting and Verification

Generate reports from the same validated installation/period dataset. Store report version, generation date, monitoring-plan version and dataset snapshot as recommended product metadata. The operator corrects issues identified during verification and provides the final document version; verifier conclusions and the independent verification report belong to the verifier.

#### Operator’s Emissions Report OER

Generate the full English report with every applicable Annex IV 1.1 item and section 2 sector parameter. Include methods, data quality, quantities, source/precursor details, calculation results, data gaps, balances and criteria/evidence-submission assertions. The coverage table below traces all 35 items.

#### Operator’s Summary Emissions Report OSER

**Legal basis:** Article 10(1) and Annex IV section 1.2 of [Regulation 2025/2547](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547). Section 1.2 has 16 numbered requirements. The operator supplies or confirms source data in the agreed structure; Certrace assembles the summary from the installation's reporting-period dataset.

**Reuse** means prefill from the OER dataset and ask for a correction only if necessary. **Supply** means enter/import the information if it is missing. **Calculate** means generate the value from supported inputs. **Confirm** means an operator assertion linked to the relevant basis and evidence; it is not an independent verification opinion.

The following OSER detail preserves the agreed hierarchy. It applies independently to each installation and reporting year. Most inputs are shared with OER. Two fields deserve specific collection checks: the **year an actual-valued precursor was used** and the **specific embedded free allocation plus applicable benchmark/method confirmation**.

##### OSER inputs at Company level

| User-facing field | What the exporter/operator supplies | Handling | OSER reference |
|---|---|---|---|
| Operator legal name | The name of the legal entity operating the installation | Reuse Company/operator record; a trading exporter's name does not replace it | 1.2(1)(a) |
| Corporate or activity registration number | The operator's official registration identifier | Reuse; preserve leading zeros and letters | 1.2(1)(b) |
| Full address in English | Complete operator address, including country | Reuse; confirm the applicable address in the report snapshot | 1.2(1)(c) |

##### OSER inputs at Installation Profile level

| User-facing field | What the exporter/operator supplies | Handling | OSER reference |
|---|---|---|---|
| Installation name | Factory/installation being reported | Reuse the selected installation | 1.2(2)(a) |
| CBAM Registry installation identifier | Assigned unique identifier | Reuse assigned identifier; retain registry status if none has been assigned, without fabricating one | 1.2(2)(b); Article 10(2)–(3) |
| UN/LOCODE | Applicable location code | Reuse validated location data | 1.2(2)(c) |
| Installation address in English | Full physical installation address | Reuse | 1.2(2)(d) |
| Main emission source latitude and longitude | Coordinates of the main source of emissions | Reuse; do not silently substitute exporter-office coordinates | 1.2(2)(e) |

##### OSER inputs under Reporting Period

Select the installation's calendar-year dataset and applicable monitoring-plan/report version. Reporting-year selection and version links are necessary product context for producing period-specific figures, although section 1.2 does not list them as separate numbered identity fields. Reuse the Article 7 reporting-period determination and actual monitoring coverage; do not ask users to choose a new OSER period independently of OER.

##### OSER inputs under 2.1 Production Structure

For **every CBAM production process**, reuse/supply its name and description, all applicable production routes, and the list of goods produced by that process. Link goods to their CN codes, applicable functional units and relevant compositions already collected for OER. The explicit OSER requirement is the list of CBAM processes/routes with goods specified per process. CN codes, functional units, quantities and compositions provide the traceable basis for the product results; they must not be lost when creating the summary. [Annex IV 1.2(3)–(4).]

Keep route-to-process and good-to-process relationships. Multiple routes are not separate reporting periods. Retain non-CBAM processes and co-products in the underlying dataset where needed for correct allocation, even though 1.2(3) asks for the CBAM process list.

##### OSER inputs under 2.2 Monitoring Methodology

Reuse the applicable monitoring plan and methods. The following operator choices and explanations support the summary's status fields and calculations:

| User-facing field | What to enter or confirm | Applicability and OSER reference |
|---|---|---|
| Actual/default data basis | How the product and its precursor contributions were determined | All relevant goods; supports 1.2(4)(a)–(b), (12)–(15) |
| Indirect electricity factor method | Official default or eligible actual factor; identify source and Article 9 averaging/source-subset method | Where indirect emissions apply; supports 1.2(4)(c), (6) |
| Actual indirect-emissions eligibility | Operator confirmation that point 6 of Annex IV to Regulation 2023/956 is met, linked to supporting evidence | Only for indirect emissions determined using actual values; 1.2(4)(c) |
| Zero-rated fuels used | Yes/no, fuel types and explanation of why zero-rating applies | 1.2(8); supply explanation/evidence when yes |
| Measurable heat imported/exported | Separate import and export statuses | 1.2(7) |
| Waste gases produced/used/imported/exported | Separate statuses for each activity | 1.2(9) |
| CO2 capture used | Status and receiving installation/transport infrastructure where applicable | 1.2(10) |
| Internal electricity generation | CHP or separate generation; fossil/renewable source; export outside process boundaries | Where relevant to indirect emissions; 1.2(11) |
| Applicable CBAM benchmark and free-allocation method | Identify benchmark(s), authoritative source/version and calculation method applicable to each good; confirm their use | 1.2(4)(f) |

The heat, waste-gas and electricity flags can describe several activities simultaneously. For example, an installation can both import and export heat, or use both fossil and renewable generation. They must not be reduced to one mutually exclusive dropdown. Derive statuses from complete flow records where possible and allow the operator to review them. “No” should be an explicit answer or supported derivation; a blank field is not evidence of absence.

##### OSER inputs under 2.3 Installation Monitoring Data

Reuse/supply the measured quantities underlying the summary results:

- Relevant fuels, process materials and source-level measurements for total installation and process direct emissions.
- Output quantities and legal functional-unit quantities for each good/process, plus applicable allocation inputs.
- Electricity consumed at installation and process level, quantities from each source, their actual/default basis and applicable EFs; internal generation, consumption and export data where relevant.
- Heat and waste-gas records establishing import/export/production/use statuses and emissions allocation.
- Capture/transfer records identifying the destination of applicable CO2.
- Sector-specific composition, reducing-agent and scrap data already collected for OER, where needed to establish product quantities, intensities or the applicable free-allocation calculation.

These are **underlying inputs**, not additional OSER questions to repeat after OER. Section 1.2(5) requires both total installation direct emissions and total direct emissions per production process. Section 1.2(6) requires installation indirect emissions if the installation produces goods not listed in Annex II to Regulation 2023/956. Do not conflate direct process emissions with product embedded emissions that also contain precursor contributions.

##### OSER inputs under 2.4 Precursor Data and Emissions

Create separate actual/default reporting views of the same precursor records. Exclude precursors already produced inside the joint process under Article 4(9) from the separate precursor entries in 1.2(12)–(13); additional inputs from other processes/installations still require assessment.

| User-facing field | What to supply or reuse | Applicability and OSER reference |
|---|---|---|
| Precursor CN code | Applicable code for each precursor used | Both actual/default; 1.2(12)(a), (13)(a) |
| Precursor name | Name of the good | Both actual/default; 1.2(12)(b), (13)(b) |
| Country of origin | Producing country for external actual-valued precursors; for external default-valued precursors, include where known | 1.2(12)(c), (13)(c) |
| Applicable default value | Official value with the relevant unit, origin and version/reference retained internally | Default basis only; 1.2(12)(d) |
| Precursor production reporting period | Period covered by the applicable actual emissions data | Actual basis; 1.2(13)(d) |
| Year precursor was used | Calendar year it was used to produce the complex good | Actual basis; 1.2(13)(d); distinct from the production reporting period |
| Specific direct embedded emissions | Applicable actual precursor intensity and unit | Actual basis; 1.2(13)(e) |
| Specific indirect embedded emissions | Applicable actual precursor indirect intensity and unit | Where applicable; 1.2(13)(e) |
| Operator of origin | Operator's name | 1.2(16) |
| Installation of origin | Producing installation's name | 1.2(16) |
| Origin installation Registry identifier | Assigned unique identifier where applicable | 1.2(16) |
| Applicable origin reporting period | Period linked to that source installation's data | 1.2(16) |
| Quantities by precursor/source/production period | Received/used quantities needed to apply the relevant weighted calculation | Underlying Article 14 data for 1.2(14)–(15); reuse OER quantities |
| Source averaging method | Normal Article 14 weighting, or justified specific-source/subset calculation | 1.2(15) |
| Source/subset identity and usage evidence | Which sources actually supplied the consuming process, with traceability | Conditional when using Article 14(3) |

**Example of distinct years:** a precursor produced in 2026 and used in a complex good in 2027 can have production reporting period 2026 and use year 2027, if the applicable period determination and evidence support that record. The UI must preserve both years.

For a precursor from the same external installation produced in several periods, calculate and report the applicable specific direct and indirect intensity under Article 14(1). For a precursor type from multiple installations, report the applicable intensity and whether normal weighting or the justified specific-source/subset approach was used. “Default method” in this averaging question means the normal weighting rule; it does not mean the precursor necessarily uses default emissions values.

##### OSER inputs under 2.5 Supporting Evidence

Reuse evidence already linked to OER. The summary is generated from supported data; it does not need a second upload of the same invoice, reading or supplier report.

| Assertion or result | Evidence to retain in the underlying dataset |
|---|---|
| Actual indirect electricity criteria met | Applicable D.4.3 technical-link/PPA, physical-connection and matched smart-meter evidence, plus actual generator-factor support |
| Zero-rating applicable | Applicable biomass sustainability/GHG-saving evidence and explanation under B.3.3 |
| Actual precursor emissions | Producing-installation verification report with correct period and eligible verifier accreditation/scope |
| Precursor period differs from the default | Evidence of actual production time |
| Specific electricity/precursor source or subset used | Traceable quantities and proof that only those sources served the process |
| CO2 capture/transfer deductions used | Measurement and chain-of-custody/storage/permanent-binding evidence under B.8 |
| Free-allocation benchmark/method confirmation | Applicable authoritative benchmark/method reference and traceable calculation inputs/result |

For electricity imported into the EU, retain D.2.4 evidence. The OSER specifically includes the confirmation that threshold-related evidence was submitted to the verifier under 1.2(4)(d). An uploaded document alone does not prove submission: retain which relevant evidence was sent, with the submission record. Extra timestamps/document IDs are product traceability fields.

##### OSER results under 2.6 Emissions Calculation and Validation

| OSER field | User action and Certrace calculation | Reference |
|---|---|---|
| Specific direct embedded emissions of each good | Reuse validated calculation from process allocation, output and precursor contributions; show unit | 1.2(4)(a) |
| Share of embedded emissions using defaults | Calculate from the supported actual/default contribution records; retain the share's basis | 1.2(4)(b) |
| Actual share of indirect emissions | Calculate from the eligible actual/default electricity contribution records and documented methodology | 1.2(4)(c) |
| Default share of indirect emissions | Calculate using the same applicable basis as the actual share | 1.2(4)(c) |
| Actual indirect criteria confirmation | Operator supplies/confirms the assertion with linked evidence; verifier opinion remains separate | 1.2(4)(c) |
| Specific indirect emissions of each good | Reuse the applicable Article 9 calculation and precursor contribution treatment | 1.2(4)(c) |
| Actual imported-electricity emission factor | Calculate/reuse eligible generator emissions divided by appropriate net output, including CHP allocation if applicable | 1.2(4)(d) |
| Specific embedded free allocation of each good | Calculate using the applicable separate free-allocation rules, benchmarks and supported inputs; or import a supported calculation result with its method/reference | 1.2(4)(e) |
| Applicable benchmark/method confirmation | Operator confirms that the specified applicable benchmarks and methods were used, backed by the calculation record | 1.2(4)(f) |
| Total installation direct emissions | Reuse validated installation-level total | 1.2(5) |
| Total direct emissions per production process | Reuse applicable process-level direct emissions, preserving their distinction from embedded precursor-inclusive product intensities | 1.2(5) |
| Installation indirect emissions | Reuse applicable installation electricity-emissions calculation | 1.2(6) |
| Precursor intensity across production periods | Calculate applicable quantity-weighted direct and indirect results | 1.2(14) |
| Precursor intensity across source installations | Calculate applicable normal weighted/source-subset result and include method indication | 1.2(15) |

Check that each good has a supported direct result, that indirect fields are present where applicable, that precursor source/period/use-year relationships are complete, and that the summary agrees with the source dataset and report version. Preserve evidence for criteria assertions, weighting departures and deductions. Do not turn a missing factor, missing year or unresolved assertion into a zero or a positive confirmation.

**Free-allocation dependency:** section 1.2(4)(e)–(f) requires the result and benchmark/method confirmation, while Annex II A.5(6) requires applicable benchmarks in the monitoring plan. This regulation does not provide the complete free-allocation formula and benchmark dataset. Collect/select the applicable benchmark identity/reference, retain the method and its required inputs, and keep a supported result. Final calculation and validation must follow the separate governing free-allocation rules. Do not guess a benchmark or infer free allocation solely from the product's emissions intensity.

##### Conditional OSER fields for electricity imported into the EU

These apply to electricity as the imported good, separately from electricity consumed to manufacture another good.

| User input or assertion | Handling | Reference |
|---|---|---|
| Direct connection to the EU transmission system criterion met | Operator confirmation where relevant, supported by the connection diagram | 1.2(4)(d), first indent |
| Fossil-origin generation emissions threshold met | Operator confirmation supported by data demonstrating no more than 550 gCO2/kWh | 1.2(4)(d), second indent; Annex II D.2.4 |
| Related threshold evidence submitted to the verifier | Operator confirms actual submission; link the relevant evidence/submission record | 1.2(4)(d), second indent |
| Actual electricity emission factor | Calculated/reused from the supported generator dataset | 1.2(4)(d), third indent |

Keep the declarant's EORI, eligible imported quantity and declarant-specific PPA/nomination/congestion assertions in the separate addendum required by 1.1.1. OSER generation does not eliminate that addendum when it is applicable.

##### OSER generation under 2.7 Reporting and Verification

The operator reviews the prefilled identity, process/good list, applicability statuses, criteria assertions, precursor years and free-allocation basis. Certrace produces the summary with the applicable 16 content groups below. The report-generation action is a product workflow step, not a substitute for independent verification.

| OSER item | Minimum summary content | Location supplying it |
|---|---|---|
| 1 | Operator name, registration identifier and English address | Company |
| 2 | Installation name, registry identifier, UN/LOCODE, English address and main-source coordinates | 1 Installation Profile |
| 3 | All CBAM processes/routes with goods by process | 2.1 |
| 4(a) | Specific direct embedded emissions per good | 2.6 |
| 4(b) | Share of embedded emissions using default values | 2.4; 2.6 |
| 4(c) | Applicable indirect actual/default shares, actual-value criteria confirmation and specific indirect emissions per good | 2.2–2.6 |
| 4(d) | Applicable electricity-import connection/threshold confirmations, threshold-evidence submission and actual factor | 2.3; 2.5–2.7 |
| 4(e) | Specific embedded free allocation per good | 2.6 |
| 4(f) | Applicable CBAM benchmark/method confirmation | 2.2; 2.6 |
| 5 | Total installation direct emissions and total direct emissions per process | 2.3; 2.6 |
| 6 | Applicable total installation indirect emissions | 2.3; 2.6 |
| 7 | Heat import/export status | 2.2–2.3 |
| 8 | Zero-rated fuels and demonstration of applicability | 2.2–2.3; 2.5 |
| 9 | Waste-gas production/use/import/export status | 2.2–2.3 |
| 10 | CO2 capture status and receiving installation/transport infrastructure | 2.3; 2.5 |
| 11 | Internal generation: CHP/separate, fossil/renewable and process-boundary export | 2.2–2.3 |
| 12 | Default precursor CN/name/known external origin/default value, with joint-process exclusion | 2.4 |
| 13 | Actual precursor CN/name/external origin/production period/use year/direct and applicable indirect intensities, with joint-process exclusion | 2.4 |
| 14 | Precursor intensity weighted across production periods | 2.4; 2.6 |
| 15 | Precursor intensity across sources plus normal/source-subset method indication | 2.4–2.6 |
| 16 | Precursor-origin operator/installation, applicable registry identifier and reporting period | 2.4 |

OSER should use the same validated source-data versions as the corresponding OER. Registry submission follows Article 10(2) for registered operators and Article 10(3) for unregistered operators. If corrections alter the source data, regenerate the affected summary with a new version and retain the prior version. Version/status fields are recommended Certrace controls.

**Practical extra input check:** after the OER dataset is complete, ask for missing information only: precursor use year, applicable free-allocation benchmark/method and supported result, explicit statuses not established by recorded flows, applicable criteria assertions, and actual evidence-submission confirmation. Reuse all other completed identity, production, monitoring and precursor data. A buyer's EORI and imported-electricity quantity are addendum fields rather than universal OSER inputs.

#### Declarant-specific Addendum to the Operator’s Emissions Report

**Legal basis:** Article 8(3)–(4), Article 10, Annex II D.2.4 and Annex IV section 1.1.1 of [Regulation 2025/2547](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547). Section 1.1.1 has **three numbered minimum-content requirements**. The larger evidence dataset below supports those requirements; every evidence field is not a separately prescribed line in the addendum.

**Trigger:** the authorised CBAM declarant imported electricity from this operator's installation into the EU and wants to use actual emissions values for that electricity. Create a separate addendum for each relevant declarant, linked to the installation, import/reporting year and corresponding OER. Electricity's reporting period is its year of import under Article 7(2). A manufacturing installation's PPA for electricity used to produce steel, cement or another good is handled through the indirect-emissions evidence path in D.4.3; it does not by itself trigger this electricity-import addendum.

##### Addendum applicability and minimum inputs

| User-facing question or field | User supplies or confirms | Handling and reference |
|---|---|---|
| Is electricity imported into the EU from this installation? | Applicable electricity-import activity | Applicability selection, supported by import/delivery data; Article 8(4) |
| Which authorised declarant wants actual values? | Declarant identity and actual-value request for the relevant electricity | Link each relevant declarant; Article 8(4) |
| Authorised declarant EORI | Exact EORI identifying the declarant to whom the addendum relates | Required addendum content; 1.1.1(1) |
| PPA criterion met | Operator assertion that point 5(a) of Annex IV to Regulation 2023/956 is met | Required assertion with D.2.4 support; 1.1.1(2) |
| Nomination/time-matching criterion met | Operator assertion that point 5(d) is met | Required assertion with D.2.4 support; 1.1.1(2) |
| Lack-of-congestion criterion met | Applicable operator assertion for point 5(b), when the lack-of-congestion route is relevant | Conditional assertion with hourly support; 1.1.1(2) |
| Relevant evidence submitted to the verifier | Confirmation that the supporting D.2.4 evidence was actually submitted | Required confirmation; 1.1.1(2) |
| Eligible imported electricity quantity | Quantity imported by this declarant from this installation for which point 5 criteria are met | Required content; establish from supported quantities; 1.1.1(3) |

Keep the operator's criteria assertion, evidence availability, evidence submission and independent verifier conclusion separate. Uploading a contract must not automatically set every criterion to “met,” and collecting a document must not automatically confirm it was submitted.

##### Addendum inputs at Company level

Reuse the operator legal name, registration and English address from the Company/operator record. These identify the OER to which the addendum belongs; section 1.1.1 does not require the user to re-enter them.

Create or select a **declarant record** containing the mandatory EORI. Declarant legal name and contact details are recommended Certrace identification/coordination fields, not extra minimum addendum contents listed in 1.1.1. If the exporter, electricity producer, importer and authorised declarant are different parties, preserve those relationships in the contract/evidence records. A buyer's name or internal customer code does not replace the EORI.

##### Addendum inputs at Installation Profile and Reporting Period level

Reuse the producing-installation identity, Registry identifier where assigned, address, location, generator description and operator. Link the addendum to this installation's OER and the import calendar year. Recommended product metadata include addendum identifier/version, linked OER version and generation date. The record relationship is **Installation → Reporting Period → Declarant → Addendum**, so multiple declarants can have separate addenda under the same annual installation report.

Collect the electricity import/delivery dates or time intervals supporting the claimed quantity. For interval records, retain the recorded timezone or offset so production and nomination times can be compared reliably; this is a proposed data-handling field supporting the required time match, not a separately enumerated legal report field.

##### Addendum inputs under 2.1 Production Structure

Reuse the electricity production process, generation routes/units and electricity good/CN code **2716 00 00** from the installation dataset. Link the claimed electricity to the relevant producing installation. Reuse the net-output definition and boundary; do not substitute total factory electricity consumption for electricity imported by a declarant.

Where there are multiple generating units or PPAs, keep the corresponding unit/contract references on the supporting records so their eligible quantities can be reconciled to the installation report. These references support traceability; the addendum's minimum content is still the three groups above.

##### Addendum inputs under 2.2 Monitoring Methodology

Reuse the generator's monitoring plan and actual-electricity EF method, including CHP allocation where applicable. The plan must explain how the operator will obtain the D.2.4 evidence, including evidence not directly available to it, under Annex II A.5(19).

Collect the applicable connection basis: a direct connection to the EU transmission system, or the relevant lack-of-physical-network-congestion evidence path. Record the methods and sources for generation smart metering, nominated-capacity records, import/delivery quantities and time matching. Evidence availability may depend on the authorised declarant, importer, person nominating capacity or transmission-system operator; the operator must obtain the applicable records rather than invent their contents.

##### Addendum inputs under 2.3 Installation Monitoring Data

| Supporting record | Data to collect | Purpose |
|---|---|---|
| Generator output | Smart-meter electricity quantity and measurement interval, meter/source identity, producing installation/unit | Demonstrate corresponding production in the nomination interval; D.2.4 criterion (d) |
| Declarant import | Imported quantity, declarant EORI, source installation and import time/interval or reference | Establish the declarant-specific quantity; Article 8(4); 1.1.1(3) |
| Capacity nomination | Nominated electricity quantity, nomination start/end time, origin/destination and applicable transit countries | Evidence of nominations in the required countries; D.2.4 criterion (d) |
| Nomination evidence issuer | Person nominating capacity or relevant transmission-system operator, with document reference | Attribute the written nomination evidence |
| PPA coverage | Contract quantity/coverage, effective dates and the import periods it covers | Establish that the PPA is applicable and covers at least the claimed amount; criterion (a) |
| Congestion evidence | Hourly export intervals, network/path covered, absence-of-congestion documentation and issuer | Conditional support for criterion (b) |
| Generator fossil-origin emissions | Relevant monitored emissions, net electricity and threshold calculation basis | Reuse generator data supporting criterion (c) in OER |
| Actual generator EF | Supported factor, unit, period and method | Reuse in OER/OSER; support the actual-value claim |

Store electricity quantities with explicit units. Calculations commonly use MWh; Article 4(3) defines the electricity functional unit as kWh. Preserve conversions, including **1 MWh = 1,000 kWh**. The claimed quantity is electricity imported by the relevant declarant that meets the criteria; it is not automatically the generator's annual output, PPA annual volume or total nominated volume.

##### Addendum inputs under 2.4 Precursor Data and Emissions

Reuse any underlying generator emissions data already required for OER. Section 1.1.1 creates no additional precursor-specific content requirement for this addendum. Fuel and generator-factor information remains in the monitoring/calculation dataset under 2.2–2.3 and 2.6.

##### Addendum inputs under 2.5 Supporting Evidence

The following is the complete D.2.4 evidence mapping. References to criteria (a)–(e) are to point 5 of Annex IV to the base Regulation 2023/956, as referenced in D.2.4.

| Evidence group | What the operator/exporter must obtain | Required checks and location |
|---|---|---|
| PPA, criterion (a) | Contractual evidence of a physical-delivery PPA directly between the authorised declarant and third-country electricity producer | Applicable at the import time; covers at least the quantity claimed. Addendum assertion under 1.1.1(2) |
| PPA through an intermediary | The single contract between all three contracting parties | Conditional when an intermediary is involved; separate disconnected contracts must not be assumed to meet the specified evidence condition |
| Direct connection, criterion (b) | Single-line diagram demonstrating direct connection between generator and EU transmission system | Connection route; assertion in OER under Article 8(3), not the addendum's lack-of-congestion assertion |
| Lack of congestion, criterion (b) | Written documentation from the transmission-system operator or another entity with access to the relevant information | Where relevant: no physical network congestion at any point between the installation and EU transmission system at export time, determined hourly. Addendum assertion under Article 8(4) |
| Fossil-origin threshold, criterion (c) | Data showing no more than **550 gCO2 of fossil origin per kWh** | Reuse generator evidence; assertion/evidence submission in OER under Article 8(3) |
| Nomination, criterion (d) | Written documentation from the nominating person or relevant transmission-system operator | Given quantity nominated in origin, destination and each applicable transit country; documentation identifies nomination time period. Addendum assertion |
| Production time match, criterion (d) | Generator smart-meter data | Corresponding generation occurs in the same measurement period as nomination; period must not exceed **one hour**. Addendum support |
| Monthly interim reports, criterion (e) | Monthly reports containing the above evidence of fulfilment of criteria (a)–(d) | Retain and provide as part of the D.2.4 evidence package; do not omit because 1.1.1 itself has only three numbered entries |

Recommended evidence metadata are document type, issuer, contract/nomination/meter reference, installation, declarant where applicable, period/interval, quantity represented, version and linked assertion. A receipt-only record or generic certificate should not replace the specific evidence described in D.2.4.

Provide the relevant evidence to the verifier and record what was actually sent. A submission timestamp, channel, evidence IDs and recipient are recommended product controls supporting the required submission confirmation. Monthly interim reports support the evidence workflow; they do not change the annual electricity reporting period.

##### Addendum results under 2.6 Emissions Calculation and Validation

Certrace should reconcile the declared import quantities to PPA coverage, nominated quantities and matched generator smart-meter evidence for the applicable periods. The operator supplies/imports the supporting records and criteria assertions; the system computes the supported eligible quantity for that declarant/installation/year and flags unresolved inconsistencies. Quantity-reconciliation checks are proposed implementation controls supporting Article 8(4) and 1.1.1(3), rather than an additional statutory calculation formula.

Recommended checks include:

- EORI, installation and import year are linked to the correct addendum and OER.
- The PPA's parties, physical-delivery nature, effective period and coverage correspond to the claim; any intermediary arrangement has the specified single three-party contract.
- The selected connection/no-congestion evidence path is supported for the claimed intervals.
- Nomination evidence includes origin, destination and each applicable transit country.
- Generation and nomination match within the same period of no more than one hour; time bases and quantity units are consistent.
- The generator threshold and actual EF use supported generator data and the relevant method, including CHP where applicable.
- Eligible quantity does not silently include imports or intervals with missing criterion evidence; discrepancies and exclusions retain their reason.
- Allocations among declarants/contracts reconcile to supported generation/import/nomination records without unsupported duplicate quantities.
- Monthly interim evidence and actual verifier submission records are available.

The 550 gCO2/kWh limit refers to **fossil-origin** generation emissions; retain that basis rather than comparing an unrelated total factory intensity. For unit handling, 550 gCO2/kWh equals 0.55 tCO2/MWh. Threshold compliance is supported by the generator report and does not replace the declarant-specific PPA, nomination and congestion requirements.

A system check can establish consistency of recorded inputs; independent verification remains the verifier's role. If eligibility is unresolved, preserve the issue and affected quantity rather than generating an unsupported positive assertion. Use of default values where actual-value criteria are not met follows Article 11(4) and the applicable default-value rules.

##### Addendum generation under 2.7 Reporting and Verification

Generate one separate document for each relevant declarant within the selected installation/reporting period. Use the operator's supported assertions and reconciled quantity, and retain a link to the corresponding OER version.

| Minimum addendum item | Generated content | Source in the agreed structure |
|---|---|---|
| 1 | Authorised declarant EORI | Company/declarant record linked to installation/year |
| 2 | PPA and nomination criteria assertions, applicable lack-of-congestion assertion, and confirmation the related D.2.4 evidence was submitted to the verifier | 2.2; 2.5; 2.6; submission record in 2.7 |
| 3 | Quantity imported by that declarant from this installation for which the point 5 criteria are met | 2.3; supported quantity in 2.6 |

The following separation keeps the report contents consistent with Articles 8(3)–(4), Annex IV 1.1(15)(f) and 1.1.1:

| Information | Main OER | Declarant-specific addendum |
|---|---|---|
| Generator/direct-connection criterion where relevant | Required assertion and evidence-submission confirmation | Link/reuse the supporting basis |
| Fossil-origin emissions threshold | Required assertion and evidence-submission confirmation | Link/reuse the supporting basis |
| Actual imported-electricity EF | Reported | Supports the claim; not a separately listed addendum minimum field |
| Relevant addenda sent to verifier | Indication required in OER | Submission/version record supports it |
| Declarant EORI | Addendum relationship retained internally | Required |
| Declarant PPA and nomination assertions | Underlying report/evidence linkage | Required |
| Lack-of-congestion assertion where relevant | Related evidence linkage | Required |
| Relevant declarant evidence submitted | Underlying linkage | Required confirmation |
| Eligible imported quantity for this declarant | Underlying quantity reconciliation | Required |

Registered operators transmit OER, OSER and applicable addenda to the verifier through the CBAM Registry; unregistered operators use other means under Article 10(2)–(3). In Certrace, record the relevant submitted document versions and provide each declarant access only to its own addendum. Recital 16 states that the addendum is not to be disclosed to other authorised declarants. Shared installation evidence may be referenced internally without exposing another declarant's contracts or addendum.

**Practical extra input check:** after OER is complete, the addendum needs the relevant declarant's EORI and actual-value request, its import quantities/periods, applicable physical-delivery PPA, nomination/time-matched generation records, congestion evidence where relevant, monthly interim reports, operator criteria assertions and confirmation of actual evidence submission. Reuse operator/installation identity, monitoring methodology, generator threshold data and actual EF from OER.

#### Submission and independent verification

Registered operators transmit OER, OSER and applicable addenda to the verifier **via the CBAM Registry**; unregistered operators use other means. Record the channel, date, report versions and evidence actually submitted as recommended workflow metadata supporting the required assertions. OER and monitoring plan must be in English. [Article 10(2)–(4); Article 5(6).]

Verifier assignment, findings, requests, correction status and final verification-report attachment are product workflow records. The exporter must not self-enter a “verified” conclusion. Detailed independent-verification obligations and report layout require the referenced verification/accreditation legislation, including 2025/2546 and 2025/2551; this input specification does not substitute for those instruments.

## Complete OER content coverage

Each row corresponds to Annex IV section 1.1. Shared facts are stored once and reused in all applicable report positions.

| OER item | Required content | Location in the agreed structure |
|---|---|---|
| 1 | Operator name, registration, English address; installation name, registry ID, UN/LOCODE, English address, main-source coordinates | Company; 1 |
| 2(a) | All CBAM processes/routes | 2.1 |
| 2(b) | Non-CBAM processes | 2.1 |
| 2(c) | Five largest goods per process by mass, with CN codes | 2.1; calculated ranking in 2.6 |
| 2(d) | Five largest fuels by energy contribution | 2.3; ranking in 2.6 |
| 2(e) | Five largest process-emission materials by emissions | 2.3; ranking in 2.6 |
| 2(f) | CEMS gases and five largest monitored sources | 2.2–2.3; ranking in 2.6 |
| 2(g) | Zero-rated fuels and qualification demonstration | 2.2–2.3; 2.5 |
| 2(h) | Heat imports/exports and counterpart installations | 2.2–2.3 |
| 3 | Electricity source quantities and external supplier names/countries | 2.3 |
| 4 | Internal generation: CHP/separate, fossil/renewable, process-boundary exports | 2.2–2.3 |
| 5 | Waste-gas production/use/import/export and counterpart installations | 2.3 |
| 6 | CO2 transfer status and receiving responsible-party contact/identity | 2.2–2.3 |
| 7 | Total installation direct emissions | 2.6 |
| 8 | New-installation monitoring duration in months | 1; 2 period |
| 9 | Installation total electricity consumption where applicable | 2.3 |
| 10 | Electricity consumed for relevant CBAM goods | 2.3 |
| 11 | Electricity-source installations | 2.3 |
| 12 | Source quantity/country/EF and Article 9 combined EF | 2.3; 2.6 |
| 13 | All goods produced at installation/process level and quantities | 2.1; 2.3 |
| 14 | Relevant non-CBAM goods/quantities per process | 2.1; 2.3 |
| 15(a) | Specific direct embedded emissions per good/functional unit | 2.6 |
| 15(b) | Specific direct emissions by composition where applicable | 2.1; 2.6 |
| 15(c) | Data quality/methods and monitoring/default use | 2.2; 2.4–2.6 |
| 15(d) | Share of embedded emissions using default values | 2.6 |
| 15(e) | Applicable indirect actual/default shares, eligibility and evidence submission, specific indirect emissions | 2.3; 2.5–2.7 |
| 15(f) | Electricity-import direct-connection/threshold criteria, evidence submission, addenda sent, actual EF | 2.3; 2.5–2.7 |
| 16(a) | Process activity data and factors per source stream | 2.3; 2.6 |
| 16(b) | Each measurement-based source's emissions | 2.3; 2.6 |
| 16(c) | Emissions from other methods | 2.2–2.3; 2.6 |
| 16(d) | CO2 received/transferred for storage/permanent binding | 2.3; 2.5 |
| 16(e) | Data gaps and estimates | 2.3; 2.5–2.6 |
| 17 | Process heat/waste-gas/electricity production/import/consumption/export balances | 2.3; 2.6 |
| 18 | Internal precursor quantity produced and used by installation, joint-process exclusions | 2.4 |
| 19 | Internal precursor quantity used per process, joint-process exclusions | 2.4 |
| 20 | External precursor quantity used by installation | 2.4 |
| 21 | External precursor quantity used per process | 2.4 |
| 22 | Default precursor CN/name/known external country/default value | 2.4 |
| 23 | Actual precursor CN/name/external country/period/basis/direct and applicable indirect emissions | 2.4 |
| 24 | Precursor intensity across different production periods | 2.4; 2.6 |
| 25 | Precursor intensity across sources and normal/source-subset method | 2.4–2.6 |
| 26 | Electricity used per process | 2.3 |
| 27 | Internal precursor quantity used per process, excluding same-process production | 2.4 |
| 28 | Precursor operator/installation, applicable registry ID and period | 2.4 |
| 29 | Direct/indirect allocation calculation method per process | 2.2; 2.6 |
| 30 | Process activity level and attributed emissions | 2.6 |
| 31 | Relevant goods/CN/functional units including joint-process precursors | 2.1; 2.6 |
| 32 | Actual electricity factor information | 2.3; 2.5–2.6 |
| 33 | PPA electricity factor information | 2.3; 2.5 |
| 34(a) | Goods quantities by route and CN functional unit | 2.1; 2.3 |
| 34(b) | Process outputs in non-tonne functional units where applicable | 2.1; 2.3; 2.6 |
| 35 | Every applicable sector parameter in Annex IV section 2 | 2.1; 2.3; 2.6 |

## Complete monitoring plan coverage

Each row corresponds to Annex II A.5. The final plan is generated/assembled under 2.2 using the linked inputs.

| Plan item | Minimum content | Input location |
|---|---|---|
| 1 | Plan date and version | 2.2 |
| 2 | Installation/process description | 1; 2.1 |
| 3 | Goods/CN/functional units, clinker/nitrogen composition, joint-process precursors | 2.1 |
| 4 | CBAM processes/routes and goods delivered per process | 2.1 |
| 5 | Relevant non-CBAM goods/quantities | 2.1; 2.3 |
| 6 | Applicable CBAM benchmarks for free-allocation adjustment | 2.2; 2.6 |
| 7 | Process monitoring methods, calculation inputs/formulae and measurement systems/exact locations | 2.2 |
| 8 | Calculation-factor determination and applicable sampling plans | 2.2 |
| 9 | Source streams/sources and descriptions per process | 2.2 |
| 10 | Standard/mass-balance streams and relevant parameter methods | 2.2; 2.3 |
| 11 | Measurement-based sources and B.6 elements | 2.2; 2.3 |
| 12 | Primary-aluminium PFC methodology | 2.2; 2.3 |
| 13 | Diagram/description proving complete boundaries without duplicate emissions | 1; 2.1; 2.5 |
| 14 | Precursors by process and external supplier names/countries | 2.1; 2.4 |
| 15 | Zero-rated fuels and qualification | 2.2; 2.5 |
| 16 | External heat counterparts and process heat-emissions determination | 2.2; 2.3 |
| 17 | Internal electricity generation characteristics | 2.2; 2.3 |
| 18 | Actual indirect-emissions D.4.3 evidence information | 2.2; 2.5 |
| 19 | Actual electricity-import D.2.4 evidence and acquisition plan | 2.2; 2.5; 2.7 |
| 20 | Waste-gas status and external counterpart installations | 2.2; 2.3 |
| 21 | Eligible CO2 capture/storage/use, receiving contacts and transfer method | 2.2; 2.3; 2.5 |
| 22(a) | Equipment QA/calibration/control | 2.2; 2.5 |
| 22(b) | Data-flow risk assessment | 2.2; 2.5 |
| 22(c) | IT system QA | 2.2; 2.5 |
| 22(d) | Segregation of duties and competence | 2.2; 2.5 |
| 22(e) | Internal review/validation | 2.2; 2.6 |
| 22(f) | Corrections/corrective action | 2.2; 2.6–2.7 |
| 22(g) | Outsourced-process control | 2.2; 2.5 |
| 22(h) | Records/documentation/version management | 2.2; 2.5–2.7 |

## Default reference data and scope boundaries

Articles 11–12, Annex II D.2.3/D.4.4 and Annex V cover default-value use and alternatives. For the ordinary exporter flow, collect origin/product/reference period and method; select the legally applicable value from versioned official reference data. Do not offer a free-text “alternative default” that bypasses adoption and applicability conditions.

Electricity alternatives use official/public country datasets and a five-year average. Region-specific alternatives for goods use reliable official datasets covering a calendar year. The actors, submissions to the Commission, 30 June timing and subsequent amendment/effective-year rules in those provisions belong to the relevant alternative-default procedure. A claim of a lower value alone is insufficient. Store the adopted reference, geographical scope and applicable import year if an authorised alternative is selected. These procedures are separate from ordinary installation readings.

The source establishes data requirements but does not supply every dependency needed for final compliance software: current base-regulation product/indirect-emissions/exemption lists; exact supplementary tariff units; official default-value datasets; applicable CBAM benchmarks and free-allocation methodology; verification/accreditation details; and referenced biomass/CO2-storage/permanent-binding criteria must be supplied from their governing instruments. These are reference-data and specialist-rule dependencies, not arbitrary additional exporter fields.

## Proposed form behaviour

1. Select company/operator, installation and reporting year.
2. Define goods, CN codes, routes, process boundaries and precursor relationships.
3. Select the applicable monitoring methods and evidence paths.
4. Show conditional data tables for those methods, sources and products.
5. Import or enter quantities and readings with their evidence; request applicable supplier reports.
6. Calculate and reconcile installation/process/product results; resolve gaps and eligibility issues.
7. Generate OER and OSER, and electricity addenda where triggered; submit the applicable report versions for independent verification.

User input is therefore **identity + production structure + measured activity + chosen methodology and supported factors + precursor/supplier data + evidence and assertions**. Calculation totals, intensities, ratios, rankings, weighted averages and summaries should normally be generated from those inputs.
