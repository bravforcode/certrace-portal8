# Standard data map: workspace sheets 00-09 and regulation maps

The workspace holds one central data set. A field that two or more standards ask for lives in a
shared sheet (00-09). A field only one standard asks for lives in that standard's regulation map.

Sources read for this map (November 2026):

- EU CBAM: Regulations (EU) 2023/956 and 2025/2083, Implementing Regulations 2025/2546 (verification),
  2025/2547 (embedded emissions), 2025/2620 (benchmarks), 2025/2621 (default values, corrected by 2026/1740), and the CBAM
  Communication template for installations (sheets A_InstData, B_EmInst, C_Emissions&Energy,
  D_Processes, E_PurchPrec).
- TGO CFP: forms TGO/CFP-V02-2014 Fr-01 to Fr-06.2 in the HWA Fong tire and tube CFP workbooks with
  their SP document, and the A.J. Plast BOPA verification sheet and deck. The ten numbered consumer
  (B2C) CFP workbooks are out of scope and were not used.
- TGO emission factor lists (Thai National LCI database), published July 2565 (in force 1 Jan 2566)
  and 2 Oct 2569 (in force 1 Oct 2569).

## Shared fields (00-09)

| Sheet | Field | EU CBAM source | TGO CFP source |
|---|---|---|---|
| 00 Installation | Name, address, country, UN/LOCODE, coordinates, contact | A_InstData section 2 (i)-(xiv); 2025/2546 Annex (coordinates to 6 decimals) | Fr-01 company; Fr-03 header |
| 00 Installation | Operator name, registration number, address | 2025/2547 Annex IV 1(a)-(c) | Fr-01 company |
| 01 Products | CN code, product name, quantity, unit | A_InstData 4(a); D_Processes (a) total production | Fr-01 product name, sales volume |
| 01 Products | Production route, quantity exported to the EU | D_Processes production route; Reg. 2023/956 Art 35 quantity imported | Fr-03 process description; Fr-01 sales volume |
| 02 Process steps | Step, what happens, main input, output, main equipment, in boundary (Yes/No) | A_InstData 4(b) production processes P1-P10 | Fr-03 process diagram; ISO 14067 6.3.4 system boundary |
| 03 Raw materials | Step, item, precursor CN, quantity, unit, supplier, country of origin, data type (Primary/Secondary) | A_InstData 5 purchased precursors; E_PurchPrec (a)-(c), installation and country of origin | Fr-03 inputs; Fr-04.1 item, LCI quantity and data source; ISO 14067 6.3.5 |
| 04 Energy | Step, fuel or electricity, quantity, unit, GHG scope (Scope 1/Scope 2), supplier, data type | B_EmInst activity data (direct); D_Processes (j) electricity consumption (indirect) | Fr-03 utilities; Fr-04.1 energy rows; ISO 14064-1 categories 1-2 |
| 05 Material flow | From, to, material, quantity | D_Processes (c) consumed in other processes | Fr-03 intermediates; mass balance |
| 06 Output & waste | Step, item, type (Product, Co-product, By-product, Waste, Wastewater, Emission), quantity, unit, destination (Sold, Recycled, Reused on site, Landfill, Incineration, Wastewater treatment) | D_Processes (a)-(d) | Fr-03 outputs; Fr-04.1 end-of-life |
| 07 Transport | Route, mode, item carried, load (t), vehicle, distance | Not required by CBAM | Fr-04.2 distance method (load, vehicle, distance); ISO 14064-1 category 3 |
| 08 Evidence | Certificate, coverage, issuer, reference number, issued on, valid until | 2025/2546 verification evidence | Verification sheet evidence |
| 09 Documents | Uploaded files | Any | Any |

### Row check before a row can be confirmed

A filled row is "To review" until a person clicks its status and the row check
(`lib/workbook/validate.ts`) finds nothing wrong. The confirmation signs the row's
data, so editing any cell afterwards puts the row back to review. The check flags:

- a required cell left empty (Missing data);
- a number that does not parse, is negative, or a quantity of 0;
- a unit the sheet's parsers do not read;
- a CN code that is not a CBAM code (Reg. 2023/956 Annex I), goods not in tonnes, or electricity (CN 2716 00 00) not in MWh;
- exported quantity above production;
- a step in 03-06 that 02 does not list, or a flow from a step to itself;
- a pick-list column (method, mode, scope, data type, in boundary, type, destination) holding a value outside its list;
- a source file that is not in 09 Documents (2025/2546 Art 7 evidence);
- an evidence date that is not a date, or valid until before issued on.

## EU CBAM map (CBAM tab)

The CBAM tab holds CBAM-only fields, one cell per mapped field of the Communication template,
in `lib/cbam/template-fields.ts` (`CBAM_FIELDS`). These include:

- Reporting period and verifier details
- Aggregated goods categories and production routes
- Source-stream parameters: monitoring approach, NCV, EF, carbon content, oxidation and conversion
  factors, biomass content
- PFC and measurement-based sources
- Fuel and GHG balances and data quality
- Measurable heat, waste gases, and electricity EF and source
- Purchased precursor SEE, and the justification for default values

This work did not add a second CBAM map.

The product catalogue includes electrical energy (CN 2716 00 00) in MWh; the product-sheet
picker fills MWh for that code. The tonne-based benchmark table and country defaults do not apply
to electricity. The electricity addendum and electricity-specific reporting remain to be mapped;
the mass-based emissions estimate does not calculate electricity exports. The
supplier form blocks electricity exports until its per-MWh calculation is supported. The
country and precursor defaults still need reconciliation with 2026/1740 before they can be
treated as the corrected schedule; see `docs/EU-CBAM-SOURCES.md`.

## TGO CFP map (tabs C1-C7)

Every CFP tab names its product by CN code (picked from 01) so rows from several products can share a
tab. Column keys are snake_case: the backend refuses any other cell key.

| Tab | Columns | Form reference |
|---|---|---|
| C1 TGO CFP product | CN code, functional unit, scope (B2C or B2B), PCR, sales volume, unit | Fr-01; SP section 2 |
| C1 | Benchmark (kgCO2e), benchmark source | Fr-06.2 |
| C2 TGO CFP factors | Product, life-cycle stage, item (from 03, 04, 06, 07), quantity per FU, unit, EF, EF source (Self collect, Supplier, PCR Gen., TGO EF, Int. DB, Others), EF reference, allocation %, cut-off | Fr-04.1; Fr-05 rows |
| C3 TGO CFP transport | Product, stage, item carried, quantity per FU, unit, distance, vehicle, % loaded out, % loaded back, EF out (kgCO2e/tkm), EF back (kgCO2e/km), EF reference | Fr-04.2 distance method |
| C4 TGO CFP support units | Product, support unit, input or output, item, quantity, unit, quantity per FU, EF, EF source, EF reference | Fr-04.3 |
| C5 TGO CFP land use change | Product, raw material, unit, quantity per unit, yield per rai per year, tenure, district, province, latitude, longitude, year and use before, year and use after, EF (kgCO2e/rai/year), EF reference | Fr-04.4 |
| C6 TGO CFP base year | Product, stage, base year and its kgCO2e, current year and its kgCO2e | Fr-06.1 table 1 |
| C7 TGO CFP reduction measures | Product, measure type (the 13 Fr-06.1 types), detail, result | Fr-06.1 table 2 |

### EF reference

The EF reference cell offers every row of both TGO emission factor lists: 539 rows of the 2569 list
first, then 593 rows of the 2565 list (`lib/cfp/tgo-ef-data.ts`). Each choice reads
`TGO EF <version> #<row> <name> [<unit>]`. Picking one fills the factor if that cell is still empty:
a tkm row fills EF out and a km row fills EF back on C3, and any other row fills EF. It also fills
EF source with "TGO EF" where the tab has that column. Typing narrows the list.

## EU CBAM verification report (tab V1)

One row per verification report, the items of the Implementing Regulation 2025/2546 Annex not held
elsewhere: report identifier, reporting period, verifier address, outsourced offices, accreditation
expiry and scope, team leader, team, site visit team, site visit (Physical, Virtual, Waived), visit
dates, days on site, last physical visit, reason for a virtual visit or waiver, other visits,
objectives and scope, monitoring plan version and date, verification criteria, materiality level
(5%), zero-rated fuels, CO2 capture, verification statement (Reasonable assurance or Not reasonable
assurance), misstatements and non-conformities corrected and remaining, remaining non-compliance,
recommendations, signed by, signed on.

Annex items held elsewhere: installation details (00 and the CBAM tab), verifier name, contact and
accreditation (CBAM tab I45-I53), heat and waste gases (CBAM tab), precursor verifier and statement
(`lib/cbam/precursor-fields.ts`).

## Not yet mapped

- CFP Fr-04.2 fuel method (litres of fuel per trip). None of the source workbooks uses it.
- CBAM 2025/2546 Annex items 3 and 4: the summary report annex and the electricity addendum.

## Data-quality findings in the sources

- HWA Fong TIRE and Tube: the transport total 110158.7754 is the same in Fr-04.2 (R33, R82) and
  Fr-05 R14, and is 99.9989% of the raw-material share. It looks like it was not divided by the
  functional unit, and the Tube workbook appears to copy the TIRE value.
- HWA Fong TIRE and Tube: Fr-06.2 holds placeholder benchmark values (18.5 and 18.2), not a sourced
  benchmark.
- A.J. Plast BOPA: cell A10 of the verification sheet shows `#VALUE!`.
