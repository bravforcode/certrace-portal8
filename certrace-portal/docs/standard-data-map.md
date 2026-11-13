# Standard data map: workspace sheets 00-09 and regulation maps

The workspace holds one central data set. A field that two or more standards ask for lives in a
shared sheet (00-09). A field only one standard asks for lives in that standard's regulation map.

Sources read for this map (November 2026):

- EU CBAM: Regulation (EU) 2023/956, Implementing Regulations 2025/2083, 2025/2546 (verification),
  2025/2547 (embedded emissions), 2025/2620 (benchmarks), 2025/2621 (default values), and the CBAM
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
| 02 Process steps | Step, what happens, main input, output | A_InstData 4(b) production processes P1-P10 | Fr-03 process diagram |
| 03 Raw materials | Step, item, precursor CN, quantity, unit | A_InstData 5 purchased precursors; E_PurchPrec (a)-(c) | Fr-03 inputs; Fr-04.1 item and LCI quantity |
| 04 Energy | Step, fuel or electricity, quantity, unit | B_EmInst activity data; D_Processes (j) electricity consumption | Fr-03 utilities; Fr-04.1 energy rows |
| 05 Material flow | From, to, material, quantity | D_Processes (c) consumed in other processes | Fr-03 intermediates; mass balance |
| 06 Output & waste | Step, product, co-product, waste, quantity | D_Processes (a)-(d) | Fr-03 outputs; Fr-04.1 end-of-life |
| 07 Transport | Route, mode, distance | Not required by CBAM | Fr-04.2 distance |
| 08 Evidence | Certificate, coverage, issuer, validity | 2025/2546 verification evidence | Verification sheet evidence |
| 09 Documents | Uploaded files | Any | Any |

## EU CBAM map (CBAM tab)

The CBAM tab already holds every CBAM-only field, one cell per field of the Communication template,
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
