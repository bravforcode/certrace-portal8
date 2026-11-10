"""Build the read-only precursor default lookup from the Commission's workbook.

Requires openpyxl. Download the corrected August 2026 workbook from SOURCE,
then run this script with its local path. The legally binding text is EU
2025/2621 as corrected by EU 2026/1740; the workbook is informational.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

from openpyxl import load_workbook

SOURCE = "https://taxation-customs.ec.europa.eu/document/download/1c05d211-80cb-4aaa-8ef0-e08005a95d7e_en?filename=DV+correcting+act_final+update_06.08.xlsx"
LEGAL = "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2621"
CORRECTION = "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R1740"


def number(value):
    if isinstance(value, (float, int)):
        return float(value)
    if not isinstance(value, str):
        return None
    candidate = value.strip().replace("\u00a0", "").replace(",", ".")
    try:
        return float(candidate)
    except ValueError:
        return None


def rows(sheet, annex_iv=False):
    output = {}
    for row in list(sheet.iter_rows(values_only=True))[2:]:
        code = re.sub(r"\s", "", str(row[0] or ""))
        if not re.fullmatch(r"\d{4}(?:\d{2}){0,3}", code):
            continue
        if annex_iv:
            value = number(row[2])
            if value is not None:
                output[code] = [None, None, value]
        else:
            direct, indirect, total = (number(row[index]) for index in (2, 3, 4))
            if total is not None:
                output[code] = [direct, indirect, total]
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parent.parent / "lib" / "data" / "eu-precursor-defaults-2026.json")
    args = parser.parse_args()
    workbook = load_workbook(args.input, read_only=True, data_only=True)
    countries = {}
    for sheet in workbook:
        if sheet.title in ("Overview", "Version History", "Annex IV"):
            continue
        key = "OTHER" if sheet.title.startswith("_Other Countries") else sheet.title
        countries[key] = rows(sheet)
    result = {
        "edition": "2026-08-06",
        "source": SOURCE,
        "sourceSha256": hashlib.sha256(args.input.read_bytes()).hexdigest(),
        "legal": LEGAL,
        "correction": CORRECTION,
        "countries": countries,
        "unknownOrigin": rows(workbook["Annex IV"], annex_iv=True),
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"Wrote {args.output}: {len(countries)} origins, {sum(map(len, countries.values()))} rows")


if __name__ == "__main__":
    main()
