"""Convert the official CBAM definitive default-values workbook to importer CSV.

The European Commission workbook is organized as one sheet per country. This
script extracts Certrace's current scope only: iron/steel and aluminium CN8
codes in chapters 72, 73, and 76.
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
YEAR_COLUMNS = ((2026, 6), (2027, 7), (2028, 8), (2029, 8), (2030, 8))
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
    if not raw or raw.lower().startswith("see"):
        return None
    try:
        return Decimal(raw)
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


def route_value(description: str, workbook_route: str) -> str:
    cleaned_route = workbook_route.strip().replace("\xa0", " ")
    if cleaned_route:
        return cleaned_route
    normalized_description = re.sub(r"[^A-Z0-9]+", "_", description.upper()).strip("_")[
        :80
    ]
    return f"DESC_{normalized_description}" if normalized_description else "UNSPECIFIED"


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
            if sheet_name in {"Overview", "Version History"}:
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
                if len(cn_code) != 8 or not cn_code.startswith(SUPPORTED_CHAPTERS):
                    continue
                description = str(row.get(2, "")).strip()
                route = route_value(description, str(row.get(9, "")))
                for reporting_year, column in YEAR_COLUMNS:
                    factor = parse_decimal(row.get(column))
                    if factor is None:
                        continue
                    key = (cn_code, reporting_year, route, country)
                    if key in seen_keys:
                        continue
                    seen_keys.add(key)
                    records.append(
                        {
                            "cn_code": cn_code,
                            "reporting_year": str(reporting_year),
                            "country_of_origin": country,
                            "sector": sector_for_cn_code(cn_code),
                            "route": route,
                            "specific_embedded_emissions": format(
                                factor.normalize(), "f"
                            ),
                            "unit": "TCO2E_PER_TNE",
                            "source_reference": f"EU_DEFAULT_DEFINITIVE:{input_path.name}:{country}:{cn_code}:{reporting_year}",
                            "regulatory_data_version": "EU-CBAM-2026.1",
                            "effective_from": f"{reporting_year}-01-01",
                            "effective_to": f"{reporting_year}-12-31"
                            if reporting_year < 2030
                            else "",
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
