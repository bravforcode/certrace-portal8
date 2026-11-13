# Standard data map: workspace sheets 00-09 and regulation maps

The workspace holds one central data set. A field that two or more standards ask for lives in a
shared sheet (00-09). A field only one standard asks for lives in that standard's regulation map.

Sources read for this map (November 2026):

- EU CBAM: Regulation (EU) 2023/956, Implementing Regulations 2025/2083, 2025/2546 (verification),
  2025/2547 (embedded emissions), 2025/2620 (benchmarks), 2025/2621 (default values), and the CBAM
  Communication template for installations (sheets A_InstData, B_EmInst, C_Emissions&Energy,
  D_Processes, E_PurchPrec).
- TGO CFP: forms TGO/CFP-V02-2014 Fr-01 to Fr-06.2 in ten customer CFP workbooks, the HWA Fong tire
  and tube CFP workbooks with their SP document, and the A.J. Plast BOPA verification sheet and deck.
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

## TGO CFP map (tabs C1 and C2)

| Tab | Column | Form reference |
|---|---|---|
| C1 TGO CFP product | CN code (from 01) | links the CFP to a product |
| C1 | Functional unit | Fr-01 |
| C1 | Scope (B2C or B2B) | Fr-01 |
| C1 | PCR | Fr-01; SP section 2 |
| C1 | Sales volume, unit | Fr-01 |
| C2 TGO CFP factors | Life-cycle stage | Fr-04.1 column A; Fr-05 rows |
| C2 | Item (from 03, 04, 06, 07) | Fr-04.1 column B |
| C2 | Quantity per FU, unit | Fr-04.1 LCI quantity per FU |
| C2 | EF (kgCO2e/unit) | Fr-04.1 EF column |
| C2 | EF source (Self collect, Supplier, PCR Gen., TGO EF, Int. DB, Others) | Fr-04.1 row 9 |
| C2 | EF reference | Fr-04.1 EF reference (e.g. a TGO EF list version) |
| C2 | Allocation % | Fr-04.1 allocation |
| C2 | Cut-off | Fr-04.1 cut-off |

## Not yet mapped

These fields are not in any tab yet:

- CFP:
  - Fr-04.2 tkm parameters (load %, return %, vehicle class, EF per tkm or per km)
  - Fr-04.3 support units
  - Fr-04.4 land use change (yield, tenure, location, before and after use)
  - Fr-06.1 base-year comparison and reduction measures
  - Fr-06.2 benchmark
- CBAM 2025/2546: verification report items (site visit type, materiality threshold, verification
  statement). The template covers verifier identity only.
