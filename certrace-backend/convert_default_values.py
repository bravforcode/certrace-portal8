"""Convert the official CBAM definitive default-values workbook to importer CSV.

The European Commission workbook is organized as one sheet per country. This
script extracts Certrace's current scope only: iron/steel and aluminium codes
in chapters 72, 73, and 76 - at whatever granularity the Commission actually
published a value (CN8, or a 4- or 6-digit heading when there is no finer
breakdown; see BACK-10). A code with no numeric value in the Total column
("see below") is skipped, because its breakdown is captured separately.

As of the August 2026 correcting act (Implementing Regulation (EU) 2026/1740,
amending Annexes I and IV of (EU) 2025/2621), the workbook no longer carries a
value per reporting year - each row has one flat Direct/Indirect/Total figure
instead of the 2026-2030 columns an earlier version of this script assumed.
For every row Certrace imports (chapters 72, 73, 76), Indirect is always
"N/A" and Direct always equals Total, which is expected: these chapters are
Annex II goods under Regulation (EU) 2023/956, so the Commission publishes
direct-emissions defaults only. This script therefore reads the Total column
and writes it for REPORTING_YEAR alone - it does not extrapolate a value for
later years, because the Commission's published mark-up schedule for later
years was not verified against an authoritative source at the time this was
written. A future regulatory update needs a deliberate decision (and a
verified figure), not a guess baked into this converter.

Column F ("Underlying production route determining CBAM BM") carries a
lettered code such as "(A)" or "(K)" with no legend anywhere in the workbook,
the Overview sheet, the Version History sheet, or the Annex IV summary sheet.
It is written through to the CSV verbatim, unmapped, purely so the source
data is not discarded. It is not required for correctness: no CN code in
scope repeats within a country sheet, and
``app/repositories/database.py::lookup_default_factor`` filters only by
cn_code, reporting_year and country_of_origin - route only breaks ties via
``.nullsfirst()`` and is never matched against a requested production route.
"""

from __future__ import annotations

import argparse
import csv
import re
from decimal import Decimal, InvalidOperation
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

NAMESPACES = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
SUPPORTED_CHAPTERS = ("72", "73", "76")
SUPPORTED_CODE_LENGTHS = (4, 6, 8)
NON_COUNTRY_SHEETS = {"Overview", "Version History", "Annex IV"}
REPORTING_YEAR = 2026
TOTAL_EMISSIONS_COLUMN = 5
ROUTE_COLUMN = 6
CSV_FIELDS = [
    "cn_code",
    "reporting_year",
    "country_of_origin",
    "sector",
    "route",
    "specific_embedded_emissions",
    "unit",
    "source_reference",
    "regulatory_data_version",
    "effective_from",
    "effective_to",
]


def column_index(cell_reference: str) -> int:
    letters = "".join(character for character in cell_reference if character.isalpha())
    total = 0
    for character in letters:
        total = total * 26 + ord(character.upper()) - 64
    return total


def normalize_country(value: str) -> str:
    if value.lstrip("_") == "Other Countries and Territories":
        return "OTHER_COUNTRIES"
    return (
        "_".join(value.strip().lstrip("_").upper().replace("-", " ").split())
        or "UNSPECIFIED"
    )


def normalize_cn_code(value: object) -> str:
    return re.sub(r"\D", "", str(value or ""))


def sector_for_cn_code(cn_code: str) -> str:
    return "IRON_STEEL" if cn_code.startswith(("72", "73")) else "ALUMINIUM"


def parse_decimal(value: object) -> Decimal | None:
    raw = str(value or "").strip()
    if not raw or raw.lower() in {"n/a", "na"} or raw.lower().startswith("see"):
        return None
    # The workbook uses a comma as the decimal separator ("4,881" = 4.881),
    # not a thousands separator - every value in scope is a single-digit-to-
    # low-double-digit tCO2e/tonne figure, never in the thousands.
    try:
        return Decimal(raw.replace(",", "."))
    except InvalidOperation:
        return None


def load_shared_strings(workbook: ZipFile) -> list[str]:
    try:
        root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return [
        "".join(text.text or "" for text in item.findall(".//a:t", NAMESPACES))
        for item in root.findall("a:si", NAMESPACES)
    ]


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    value = cell.find("a:v", NAMESPACES)
    if value is None:
        inline = cell.find("a:is", NAMESPACES)
        return (
            "".join(text.text or "" for text in inline.findall(".//a:t", NAMESPACES))
            if inline is not None
            else ""
        )
    raw = value.text or ""
    return shared_strings[int(raw)] if cell.attrib.get("t") == "s" else raw


def sheet_rows(
    workbook: ZipFile, sheet_path: str, shared_strings: list[str]
) -> list[dict[int, str]]:
    root = ET.fromstring(workbook.read("xl/" + sheet_path))
    rows: list[dict[int, str]] = []
    for row in root.findall(".//a:sheetData/a:row", NAMESPACES):
        rows.append(
            {
                column_index(cell.attrib["r"]): cell_value(cell, shared_strings)
                for cell in row.findall("a:c", NAMESPACES)
            }
        )
    return rows


def route_marker(raw_value: str) -> str:
    """The workbook's own, unexplained route letter - passed through as-is.

    See the module docstring: there is no legend for this anywhere in the
    workbook, and the lookup this feeds does not filter on it, so this is
    provenance, not a value Certrace's route taxonomy can be derived from.
    """

    return raw_value.strip().replace("\xa0", " ")


def convert_workbook(input_path: Path, output_path: Path) -> int:
    records: list[dict[str, str]] = []
    seen_keys: set[tuple[str, int, str, str]] = set()
    with ZipFile(input_path) as workbook:
        shared_strings = load_shared_strings(workbook)
        workbook_root = ET.fromstring(workbook.read("xl/workbook.xml"))
        relationships_root = ET.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
        relationships = {
            relationship.attrib["Id"]: relationship.attrib["Target"]
            for relationship in relationships_root
        }
        for sheet in workbook_root.find("a:sheets", NAMESPACES):
            sheet_name = sheet.attrib["name"]
            if sheet_name in NON_COUNTRY_SHEETS:
                continue
            relationship_id = sheet.attrib[
                "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
            ]
            rows = sheet_rows(workbook, relationships[relationship_id], shared_strings)
            if not rows:
                continue
            country = normalize_country(rows[0].get(1) or sheet_name)
            for row in rows:
                cn_code = normalize_cn_code(row.get(1))
                if len(cn_code) not in SUPPORTED_CODE_LENGTHS or not cn_code.startswith(
                    SUPPORTED_CHAPTERS
                ):
                    continue
                factor = parse_decimal(row.get(TOTAL_EMISSIONS_COLUMN))
                if factor is None:
                    continue
                route = route_marker(str(row.get(ROUTE_COLUMN, "")))
                key = (cn_code, REPORTING_YEAR, route, country)
                if key in seen_keys:
                    continue
                seen_keys.add(key)
                records.append(
                    {
                        "cn_code": cn_code,
                        "reporting_year": str(REPORTING_YEAR),
                        "country_of_origin": country,
                        "sector": sector_for_cn_code(cn_code),
                        "route": route,
                        "specific_embedded_emissions": format(factor.normalize(), "f"),
                        "unit": "TCO2E_PER_TNE",
                        "source_reference": f"EU_DEFAULT_DEFINITIVE:{input_path.name}:{country}:{cn_code}:{REPORTING_YEAR}",
                        "regulatory_data_version": "EU-CBAM-2026.1",
                        "effective_from": f"{REPORTING_YEAR}-01-01",
                        "effective_to": f"{REPORTING_YEAR}-12-31",
                    }
                )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(records)
    return len(records)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_xlsx", type=Path)
    parser.add_argument("output_csv", type=Path)
    args = parser.parse_args()
    count = convert_workbook(args.input_xlsx, args.output_csv)
    print(f"Exported {count} default factor rows to {args.output_csv}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
