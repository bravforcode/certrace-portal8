# Exporter input gaps against EU CBAM requirements

This compares the **data collection screens and fields** in the current Certrace verification flow with [Commission Implementing Regulation (EU) 2025/2547](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547). The regulation, particularly Annex II A.5 and Annex IV sections 1.1, 1.1.1 and 1.2, is the baseline. The [complete input inventory](/Users/kanamafu/Documents/ceatrace/docs/CBAM-OER-INPUT-REQUIREMENTS.md) gives each field's applicability and legal reference. This comparison is based on static inspection of the current code on 15 October 2026.

**Who enters data:** The report concerns the **installation operator**. An exporter who is a trader must get operating and monitoring records from that operator or its precursor suppliers. The application should ask the exporter to enter, import, or request the underlying data once, then reuse it for the Operator's Emissions Report (OER), Operator's Summary Emissions Report (OSER), and an applicable declarant-specific addendum. Report totals, intensities, percentages and rankings should be calculated from supported inputs, not requested as unrelated numbers to type.

**Legend:** **Collected** means the active verification flow has a usable field or upload. **Partial** means some inputs exist but the regulation calls for a more complete or better linked record. **Missing** means there is no dedicated active input path. Conditional requirements apply only when the relevant good, equipment, method, transfer or transaction exists. Internal record IDs, review metadata and convenient form fields are product design choices, not additional legal requirements.

## COMPANY

| EU-based operator input | Current collection | What the exporter/operator needs to provide |
|---|---|---|
| Operator legal name | Partial | Select the **actual legal operator** for each installation; a supplier-company name or the logged-in exporter's name may be a different party. |
| Operator corporate/activity registration number | Missing | Registration identifier of that operator. |
| Operator full address in English | Missing at company level | Complete English-transcribed address of that operator. Installation address alone is a different field. |
| Operator contact and exporter/operator relationship | Partial; contacts exist | Useful for requests and corrections. Relationship is a Certrace workflow field, not a separate Annex IV OER minimum item. |

The current [supplier company](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/supplier-companies.ts:31) and [organisation](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/org.ts:18) records provide names, country and contacts but not the complete legal-operator identity above. Annex IV 1.1(1) is the source.

## INSTALLATION A — repeat for every installation

### 1. Installation Profile

| EU-based installation input | Current collection | What to add or clarify |
|---|---|---|
| Name, English address, UN/LOCODE, main emission-source latitude/longitude | Collected | Keep these tied to the installation and check that the coordinates locate the **main emission source**. |
| Installation identifier in the CBAM Registry, where assigned | Partial | Store this separately from Certrace's internal installation reference; record registration status if no identifier has yet been assigned. |
| Operator linked to this installation | Partial | Link the actual operator record above. |
| Installation description, units, boundaries and diagram | Partial | Existing methodology description and diagram can be reused; make the installation/process relationships explicit. |
| New-installation monitoring duration | Missing | Ask whether the installation is new and capture actual monitoring start/end and number of months where applicable. |
| Commercial reason for a split into multiple installations | Missing, conditional | Capture reason and supporting record only if the operator uses the Article 4(7) split. |

The [installation model](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/installations.ts:45) contains the location fields and internal ID. Annex IV 1.1(1), (8), Annex II A.5(2), (13), and Article 4(7) supply the requirements.

### 2. Reporting Period — 2026

| EU-based period input | Current collection | What to add or clarify |
|---|---|---|
| Calendar reporting year | Collected | Reuse 2026 for this annual reporting period. The system can set 1 January–31 December. |
| Actual monitoring coverage, inactive intervals and data gaps | Partial | Identify months/intervals with genuine zero activity, delayed start or missing measurements; record the replacement method and supporting facts for gaps. |
| Production or methodology changes during the period | Partial | Record the effective date, reason, affected processes/streams and corresponding plan version. |
| Evidence for a production period different from the presumed year | Missing, conditional | Collect only when the operator rebuts the Article 7 presumption for a later import year; electricity uses import year. |

The [workspace](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/workspace.ts:262) and [methodology](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/workspace-mmd.ts:467) store year and some gap/version data. The current [readiness checks](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/readiness.ts:129) demand positive production, electricity and fuel in each month; the form needs an explicit valid-zero/not-applicable state so users are not pushed to invent data. Article 7 and Annex II A.2 govern the period and gaps.

### 2.1 Production Structure

The exporter must be able to add **Production Process → Route(s) → Products/CN Codes → Production Steps → Relevant Precursor CN Codes and Sources → Other Inputs/Source Streams**, with repeated processes and goods under the *same installation-year*. The detailed [EAF-to-hot-rolled-steel example](/Users/kanamafu/Documents/ceatrace/docs/CBAM-OER-INPUT-REQUIREMENTS.md) shows step records, conditional precursor sources, electricity, gas and other monitored materials. The steps describe the physical chain; the operator must still identify the regulatory process boundary. For example, EAF crude-steel production may be a separate upstream process from hot rolling of CN 7208 goods unless Article 4(9) permits a joint process.

| EU-based process/product input | Current collection | What to add or clarify |
|---|---|---|
| Every CBAM and relevant non-CBAM production process, technology/route and associated unit | Partial | Repeatable process records and route-to-process links; include non-CBAM production affecting shared resources. |
| Every good's name, CN code and production route | Partial | Repeatable goods under each process; current workspace has a single product and route. |
| Production steps, order and linked units, inputs/outputs and monitoring sources | Partial narrative/diagram only | Add repeatable steps such as scrap preparation, EAF melting, refining, casting and rolling; show which legal process owns each step. The five example steps are not a mandatory list for all installations. |
| Total saleable output per good/process/route, with legal functional unit | Partial | Current monthly production is tonnes for one product. Support electricity kWh; specified fertiliser kilograms of N/supplementary units; specified cement tonnes of clinker contained; retain physical mass too. |
| Quantity by route, co-products and non-CBAM outputs | Missing or descriptive only | Quantities needed to allocate shared emissions; non-CBAM goods currently have descriptions without output quantities. |
| Shared units and allocation basis; joint precursor/complex-good arrangement | Missing, conditional | Identify shared streams, process boundaries and the quantities/facts used for multifunctional allocation or the permitted joint process. |
| Goods movement/stock/returns used to determine production | Missing, conditional | Opening/closing stock, deliveries, transfers and returns when output comes from a balance rather than direct metering. |
| Relevant precursor types, CN codes, internal/external sources | Partial | Link each precursor to the consuming **process** and an actual source process/installation; current internal `sourceProcessId` is free text. |
| Other inputs/source streams such as electricity, gas, scrap, electrodes and relevant materials | Partial across monthly and methodology forms | Link each applicable input to the step/process and chosen monitoring method. Do not classify every purchased material as a CBAM precursor. |
| Sector-specific composition and raw quantities | Partial for steel; missing in other sectors | Cement clinker content/ratio; fertiliser N content, purity/concentration and N forms; steel/ferroalloy reducing agent, alloy content and scrap quantities; aluminium scrap and non-Al content where applicable. |

See [workspace creation](/Users/kanamafu/Documents/ceatrace/certrace-portal/app/(portal)/workspaces/new/page.tsx:425), [precursor source field](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/precursor-suppliers.ts:233), [steel parameter model](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/workspace-mmd.ts:442), and [sector availability](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/config.ts:192). Steel and aluminium are enabled; cement, fertilisers, hydrogen and electricity are currently unavailable in the product flow. Relevant law: Article 4, Annex II A.4–A.5, Annex IV 1.1(2), (13)–(14), (30)–(34) and section 2.

### 2.2 Monitoring Methodology

| EU-based monitoring-plan input | Current collection | What to add or clarify |
|---|---|---|
| English plan, date/version, installation boundaries, diagram, included/excluded processes | Partial | Existing versioned methodology and diagram are useful; add explicit process/route/good inventory and applicability by effective date. |
| Applicable CBAM free-allocation benchmark per good | Missing | Select authoritative benchmark and applicable method; preserve supporting reference. |
| Every source stream/emission source and selected monitoring method | Partial | Stable stream/source links to processes; standard combustion, process emissions, mass balance, CEMS or sector method as applicable. |
| Quantity determination, factor determination, samples/analyses, instruments and uncertainty | Partial | Formula and variable definitions; stock/continuous/batch method; sampling plan where applicable; units/basis; uncertainty and calibration/quality-control evidence. |
| Biomass zero-rating approach | Partial, conditional | Method and applicable sustainability/GHG-saving evidence for any zero-rated fraction. |
| Heat, CHP, waste-gas and CO2 transfer methods | Missing, conditional | Flow boundaries, measurement/allocation methods, counterparty installations and contacts for applicable flows. |
| Actual electricity factor and evidence-acquisition method | Partial, conditional | Generator/contract/connection and metering approach; identify who can provide evidence unavailable to the operator. |
| PFC method; N2O/CEMS method | Missing or only metadata, conditional | Applicable primary-aluminium PFC factors/technology and measurement-based N2O or CO2 CEMS methodology. |
| Eight control procedures | Partial | Equipment QA; data-flow risk; IT controls; role competence/separation; internal review; corrections; outsourced-process controls; document/record version control. |

The current [monitoring model](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/workspace-mmd.ts:467) has instruments, fuel selection, electricity type, reviewer, gaps and a single QA choice. Its [validation](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/workspace-mmd.ts:915) universally requires a fuel; the input rule must allow processes with no applicable combustion fuel. Annex II A.5 specifies the plan contents. Recommended improvements in Annex II B, such as enhanced sampling or uncertainty targets, should be labelled as such instead of universal required fields.

### 2.3 Installation Monitoring Data

| EU-based raw input | Current collection | What to add or clarify |
|---|---|---|
| Fuel and process-material quantities; NCV/EF/OF/CF or carbon content when the selected method uses them | Collected/partial | Existing repeatable fuel, standard-process and signed mass-balance rows are a base. Make variables and factors method-dependent: NCV is not always required for a suitable quantity-based combustion EF; OF/CF may use documented value 1. |
| Stream/source/process identity, measurement interval, meter or batch, stock/delivery basis | Partial | Stable links and opening/closing stock, receipts/returns when balances determine quantities. |
| Whole-installation electricity plus process consumption per source | Partial | Existing source rows have type, MWh and EF. Add generator/supplier installation and origin country, actual/default basis, factor source/period, and source-to-process attribution. |
| Own electricity generation, consumption, export and CHP heat | Partial | Distinguish generated net output from own use and export; capture heat quantities/efficiency inputs where CHP applies. |
| Actual electricity claims | Missing detail, conditional | PPA/physical delivery or direct technical link, connected grid, source factor and matched producer/consumer smart-meter intervals no longer than one hour, as applicable under Annex II D.4.3. |
| Heat and waste-gas movement | Missing, conditional | Produced/received/used/exported quantities, source/destination, medium or gas composition and measurement/efficiency inputs. |
| CO2 received, captured, used, stored or transferred | Missing, conditional | Quantity, receiving/supplying parties, measurements and storage/permanent-binding facts for any claimed deduction. |
| Continuous measurement and N2O | Missing active data path, conditional | Concentration, flue-gas flow, intervals, missing-data substitutions, calibration/uncertainty and measured N2O where applicable. |
| Primary-aluminium PFC | Missing active workspace inputs, conditional | Anode-effect/slope or overvoltage observations, factor basis, primary output, collection efficiency and fugitive estimate. A backend model alone is not a form input. |
| Sector-specific physical inputs | Missing outside steel/aluminium base, conditional | Clinker raw meal/dust; nitric-acid N2O and gas flow; process scrubbing/flare; reducing agents and carbon balances as applicable. |

The active [monthly model](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/monthly-data.ts:531) and [electricity source row](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/monthly-data.ts:461) show the collected fields. Detailed conditional fields and references are in the [input inventory](/Users/kanamafu/Documents/ceatrace/docs/CBAM-OER-INPUT-REQUIREMENTS.md). Applicable monitoring rules are in Annex II B–D and Annex III.

### 2.4 Precursor Data and Emissions

Split the input experience into **Exporter/final-good operator: material purchased and quantity actually used in each receiving process** and **Precursor producer: producing installation, route, production period, specific direct/indirect emissions and verification report**. An exporter who only trades the finished good obtains the actual-use quantity from its operator. A reseller can pass precursor information along but should not be recorded as the producing installation. The [supplier request and fictional pig-iron example](/Users/kanamafu/Documents/ceatrace/docs/CBAM-OER-INPUT-REQUIREMENTS.md) in the input inventory make this handoff concrete. If eligible actual data is not received, the form should select the applicable official default and keep the source reference; it should not prompt the exporter to fabricate an actual intensity. This division follows Annex II E(2)–(3) and A.1(4)–(5).

| EU-based precursor input | Current collection | What to add or clarify |
|---|---|---|
| CN code, type, internal/external source, producing operator and installation, origin country and route | Largely collected | Link consuming process and, for internal sources, a real producing process; keep production and use records distinct. |
| Quantity **used** by the installation/process, including process losses | Partial | Monthly use or ratio fields exist; attribute use to the receiving process and keep quantities by supplier/source and year. |
| Producing installation identity/location and applicable sector parameters | Partial | Existing names/address/UNLOCODE/coordinates/ID exist; complete sector-specific source data when applicable. |
| Actual/default basis and direct/indirect specific emissions | Partial | For actual data, collect separately with units and period; for defaults, system-select the applicable official country/year/value and retain the reference. Do not ask the exporter to guess a default. |
| Actual precursor production period; year used in complex goods | Partial | Distinguish presumed period from evidenced production period, and preserve use year for OSER. |
| Verification report, its *covered period*, verifier identity, valid accreditation and sector scope | Partial | File and verifier fields exist; add explicit report coverage dates and support comparison with production period. |
| Multiple producing installations/periods; justified source subset | Partial | Quantities per source and production period, plus evidence when a specific subset is used instead of normal weighting. |
| EU/exempt origin or permitted joint process | Partial/conditional | Source/origin evidence and relationship to process; avoid a second precursor contribution when the permitted joint process already includes it. |

The [precursor model](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/precursor-suppliers.ts:111), [editor](/Users/kanamafu/Documents/ceatrace/certrace-portal/components/precursor/supplier-editor.tsx:156), and [verification inputs](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/precursor-suppliers.ts:433) contain much of the base information. The editor currently uses an [indicative comparison table](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/default-values.ts:17) for precursor defaults; the UI needs an authoritative applicable default selector instead. The existing [20% default-share block](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/readiness.ts:180) should not be presented as a general condition of this regulation: Article 15 allows actual process emissions with default values for one or more precursors. Relevant sections: Articles 13–15; Annex II A.1(4)–(5), E; Annex IV 1.1(18)–(28), 1.2(13)–(15).

### 2.5 Supporting Evidence

| Evidence the operator/exporter supplies | Current collection | What to add or clarify |
|---|---|---|
| Meter, calibration, laboratory, biomass, supplier and production-period evidence | Generic uploads and some categories collected | Link each item to installation, period, process, source/stream, relevant interval and claim; reuse one file across reports. |
| Actual indirect electricity evidence under Annex II D.4.3 | Generic PPA upload only; partial | Technical connection or qualifying PPA, physical delivery, grid connection and producer/consumer smart-meter time match, as applicable. |
| Imported electricity evidence under Annex II D.2.4 | Missing dedicated path; conditional | Physical-delivery PPA (including specified single three-party contract where intermediary), direct EU connection or hourly no-congestion proof, fossil-origin ≤550 gCO2/kWh data, origin/destination/transit nominations, matching generator smart-meter periods ≤1 hour and monthly interim reports. |
| Heat, waste-gas and CO2 transfer evidence | Missing dedicated path; conditional | Measurements and counterparty/chain-of-custody/storage or binding evidence supporting applicable amounts and deductions. |
| Verifier handover | Missing explicit confirmation | Record which applicable evidence was actually submitted to the independent verifier; an upload alone does not prove submission. |

The [evidence store](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/workspace-evidence.ts:124) accepts generic uploads and links, which can be reused. Required evidence should have a clear user-facing request tied to the relevant criterion, with non-applicable criteria omitted. Annex II A.5, B.8, D.2.4 and D.4.3 are the main sources.

### 2.6 Emissions Calculation and Validation — user-supplied inputs only

The system should calculate total installation emissions, process allocations, per-good specific embedded emissions, precursor weighted intensities, actual/default shares and rankings from the records above. Ask the operator for **allocation factors and their supporting production/energy data**, any **permitted source-subset or unusual-method justification**, the **applicable free-allocation benchmark and method reference**, and **documented data-gap or uncertainty explanations**. When the separate free-allocation rules produce a specific embedded free-allocation figure outside Certrace, accept the figure only with its method and supporting calculation record. The current flow has arithmetic and readiness checks, but these upstream user inputs are not yet collected completely. Annex II A.4–A.5, Annex III and Annex IV 1.1/1.2 identify the results and supporting inputs.

### 2.7 Reporting and Verification — confirmations the user actually enters

**OER:** The operator should review and confirm the installation/year/process dataset, applicable actual-value conditions, monitoring-plan version, evidence supplied to the verifier, and any relevant declarant addenda. The operator provides contact/authorised-signatory details as a workflow field. The independent verifier's own report and conclusions come from the verifier, not from exporter-entered values.

**OSER:** Reuse the same source data. The operator confirms that the applicable actual-indirect criteria are met when claimed, and that the specified benchmark and method were used for specific embedded free allocation. No separate second entry of fuels, precursor quantities or already supported emissions totals should be necessary. Annex IV 1.2(4)(c), (e)–(f) identifies these confirmations.

**Declarant-specific addendum:** Ask these questions **only for electricity imported into the EU from the installation using actual values**, once per authorised declarant, under Article 8(4) and Annex IV 1.1.1:

| Addendum input | Current collection | Required user action |
|---|---|---|
| Relevant authorised declarant and EORI | Buyer EORI exists; relationship missing | Select/link the authorised declarant to this installation/year/imported electricity. |
| Imported quantity attributable to that declarant | Missing | Import/delivery quantities and intervals; calculate supported eligible quantity from PPA, nomination and meter data. |
| PPA and nomination/time-match criteria assertion | Missing | Operator confirms each applicable criterion with linked Annex II D.2.4 evidence. |
| Lack-of-congestion assertion | Missing, conditional | Confirm only when the lack-of-congestion route applies, with hourly supporting evidence. |
| Relevant evidence submitted to verifier | Missing | Confirm actual submission and identify the records sent. |

The [buyer record](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/buyers.ts:23) already stores EORI. A steel or aluminium export with an EU buyer does **not** itself need this addendum; a PPA used for a manufacturer's indirect-emissions factor belongs under 2.3/2.5.

## What the input redesign should prioritise

1. Make **installation + year** the collection scope and allow repeatable processes, routes, goods, CN codes and precursor sources, with shared whole-installation monitoring data.
2. Complete operator identity, functional-unit quantities, source/process links and valid zero/not-applicable states.
3. Add the missing conditional raw-data/evidence forms for heat, waste gas, CO2, CEMS/N2O, aluminium PFC, and actual electricity. Show only those relevant to the selected sector and method.
4. Complete precursor source/period/verification input, and replace indicative defaults and the unsupported general 20% gate in the collection experience.
5. Reuse collected data for OER and OSER; ask for the few operator assertions and benchmark inputs those reports need. Show the declarant-specific inputs only on the eligible electricity-import path.

The other installations and reporting years repeat this structure independently. Shared legal-party and supplier records can be selected again without copying their emissions or quantities into the wrong installation or year.

## Which inputs recur every month?

The OER and OSER cover a calendar year. Monthly collection is Certrace's practical way to obtain the annual underlying data. The active [monthly entry model](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/monthly-data.ts:531), [precursor month form](/Users/kanamafu/Documents/ceatrace/certrace-portal/components/supplier/month-steps.tsx:1368), and [month evidence checklist](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/workspace-evidence.ts:392) show what is already requested. Collect applicable values per month, or at a finer interval where the monitoring method requires it; sum or reconcile them for the annual report.

| Agreed structure | Monthly data needed | Current monthly form | Recommended cadence change |
|---|---|---|---|
| 1 Installation Profile | None routinely | Installation record reused | Update only when identity, location or configuration changes; record effective date. |
| 2 Reporting Period | Month state and actual coverage; data-gap intervals and reasons | Month status, submission and notes; data gaps in methodology | Add explicit active/zero/not-operating/missing-data states; do not equate valid zero with a gap. |
| 2.1 Production Structure | Output quantity by process, route and CN code; stock/transfer data when output is balance-based; changing composition where relevant | One `productionTonnes` value per product workspace | Keep process/route/product definitions as annual versioned records; add monthly quantities for **each** good/process/route and relevant stock/transfer facts. |
| 2.2 Monitoring Methodology | Confirm whether method, boundary, meters and factors remain applicable; enter changes on their effective date | Annual methodology is presented and confirmed in the monthly supplier flow | Prefill the current plan; require only a change/exception or confirmation, not a full re-entry every month. |
| 2.3 Installation Monitoring Data | Fuel/material amounts; process-material amounts; electricity per source; applicable generation/heat/waste-gas/CO2/CEMS/PFC values | Fuel rows, structured process-emission rows, electricity source rows and flue-gas-cleaning amount | Keep the existing relevant monthly readings; add the missing conditional flows and measurement data linked to installation/process/source. |
| 2.4 Precursor Data | **Quantity actually used in each receiving process**, by precursor source; receipts and opening/closing stock if needed to establish use | `monthlyQuantities` UI explicitly asks for **received** tonnes, while the record is later treated as precursor quantity in the chain | Keep receipts as a separate optional trace; collect/derive **used** quantity. Producer identity, annual production period, intensity and verification report are requested when the source/period changes, not retyped monthly. |
| 2.5 Supporting Evidence | Production log, applicable meter/ERP readings, fuel records/invoices, electricity records, precursor-use or stock records and other evidence for claims made that month | Month-linked uploads; checklist includes production, applicable electricity and each fuel row | Link evidence to its actual measurement/claim. Reuse a supplier verification report or standing contract rather than asking for the same file 12 times. |
| 2.6 Emissions Calculation and Validation | Month-specific allocation quantities and explanations of gaps/exceptions | Monthly and annual totals calculated from saved rows | Calculate monthly and annual results; ask only for missing allocation facts and explanations. |
| 2.7 Reporting and Verification | None routinely for OER/OSER; monthly interim evidence for qualifying imported-electricity actual-value claims | Month review/submission states | OER/OSER remain annual. The Annex II D.2.4 monthly interim reports apply only to the qualifying electricity-import evidence path. |

The supplier-producing-precursor **emissions value is not a new value the exporter enters each month**. It belongs to the producing installation and its covered production period; the final-good operator records how much of that precursor its own process used during the month. The current month form says “received this month” and explicitly excludes consumption from stock, so the product needs separate receipt/use/stock fields or a defensible balance. This is the main mismatch between the existing monthly precursor field and Annex II E's quantity-consumed requirement.
