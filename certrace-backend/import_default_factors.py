"""Import EU CBAM default emission factors into PostgreSQL.

Expected CSV columns, case-insensitive:
cn_code, reporting_year, country_of_origin, sector, route, specific_embedded_emissions,
source_reference, regulatory_data_version, effective_from, effective_to

The official EU file is published as XLSX. Export the relevant sheet/range to
CSV with the columns above, then run this importer against DATABASE_URL.
"""

from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path

from app.config import DATABASE_URL_ENV, REGULATORY_DATA_VERSION, load_env_file_value

try:
    import psycopg
except ModuleNotFoundError:  # pragma: no cover - runtime dependency guard.
    psycopg = None


VALID_SECTORS = {"IRON_STEEL", "ALUMINIUM"}
VALID_UNITS = {"TCO2E_PER_TNE"}
SUPPORTED_CHAPTERS = ("72", "73", "76")

HEADER_ALIASES = {
    "cn": "cn_code",
    "cn8": "cn_code",
    "cn code": "cn_code",
    "cn_code": "cn_code",
    "commodity code": "cn_code",
    "reporting year": "reporting_year",
    "reporting_year": "reporting_year",
    "year": "reporting_year",
    "country": "country_of_origin",
    "country of origin": "country_of_origin",
    "origin country": "country_of_origin",
    "country_of_origin": "country_of_origin",
    "third country": "country_of_origin",
    "sector": "sector",
    "route": "route",
    "production route": "route",
    "specific embedded emissions": "specific_embedded_emissions",
    "specific_embedded_emissions": "specific_embedded_emissions",
    "default value": "specific_embedded_emissions",
    "default_value": "specific_embedded_emissions",
    "unit": "unit",
    "source": "source_reference",
    "source reference": "source_reference",
    "source_reference": "source_reference",
    "regulatory data version": "regulatory_data_version",
    "regulatory_data_version": "regulatory_data_version",
    "effective from": "effective_from",
    "effective_from": "effective_from",
    "effective to": "effective_to",
    "effective_to": "effective_to",
}


@dataclass(frozen=True)
class DefaultFactorRow:
    cn_code: str
    reporting_year: int
    country_of_origin: str
    sector: str
    route: str | None
    specific_embedded_emissions: Decimal
    unit: str
    source_reference: str
    regulatory_data_version: str
    effective_from: str
    effective_to: str | None


class ImportValidationError(ValueError):
    pass


def canonical_header(header: str) -> str:
    normalized = " ".join(header.strip().lower().replace("-", " ").split())
    return HEADER_ALIASES.get(normalized, normalized.replace(" ", "_"))


def require_value(row: dict[str, str], key: str, row_number: int) -> str:
    value = (row.get(key) or "").strip()
    if not value:
        raise ImportValidationError(f"Row {row_number}: {key} is required.")
    return value


def optional_value(row: dict[str, str], key: str) -> str | None:
    value = (row.get(key) or "").strip()
    return value or None


def parse_decimal(value: str, row_number: int) -> Decimal:
    try:
        parsed = Decimal(value.replace(",", ""))
    except InvalidOperation as exc:
        raise ImportValidationError(
            f"Row {row_number}: specific_embedded_emissions must be decimal."
        ) from exc
    if not parsed.is_finite() or parsed < 0:
        raise ImportValidationError(
            f"Row {row_number}: specific_embedded_emissions must be non-negative."
        )
    return parsed


def normalize_country_of_origin(value: str | None) -> str:
    if value is None:
        return "UNSPECIFIED"
    normalized = "_".join(value.strip().upper().replace("-", " ").split())
    return normalized or "UNSPECIFIED"


def parse_default_factor_row(
    row: dict[str, str],
    row_number: int,
    *,
    steel_aluminium_only: bool,
) -> DefaultFactorRow:
    cn_code = require_value(row, "cn_code", row_number).replace(" ", "")
    if len(cn_code) != 8 or not cn_code.isdigit():
        raise ImportValidationError(
            f"Row {row_number}: cn_code must be exactly 8 digits."
        )
    if steel_aluminium_only and not cn_code.startswith(SUPPORTED_CHAPTERS):
        raise ImportValidationError(
            f"Row {row_number}: cn_code {cn_code} is outside chapters 72, 73, and 76."
        )

    try:
        reporting_year = int(require_value(row, "reporting_year", row_number))
    except ValueError as exc:
        raise ImportValidationError(
            f"Row {row_number}: reporting_year must be integer."
        ) from exc
    if reporting_year < 2024 or reporting_year > 2030:
        raise ImportValidationError(
            f"Row {row_number}: reporting_year is outside 2024-2030."
        )

    sector = require_value(row, "sector", row_number).upper()
    if sector not in VALID_SECTORS:
        raise ImportValidationError(
            f"Row {row_number}: sector must be IRON_STEEL or ALUMINIUM."
        )

    unit = optional_value(row, "unit") or "TCO2E_PER_TNE"
    if unit not in VALID_UNITS:
        raise ImportValidationError(f"Row {row_number}: unit must be TCO2E_PER_TNE.")

    return DefaultFactorRow(
        cn_code=cn_code,
        reporting_year=reporting_year,
        country_of_origin=normalize_country_of_origin(
            optional_value(row, "country_of_origin")
        ),
        sector=sector,
        route=optional_value(row, "route"),
        specific_embedded_emissions=parse_decimal(
            require_value(row, "specific_embedded_emissions", row_number),
            row_number,
        ),
        unit=unit,
        source_reference=require_value(row, "source_reference", row_number),
        regulatory_data_version=optional_value(row, "regulatory_data_version")
        or REGULATORY_DATA_VERSION,
        effective_from=require_value(row, "effective_from", row_number),
        effective_to=optional_value(row, "effective_to"),
    )


def read_default_factor_csv(
    path: Path,
    *,
    steel_aluminium_only: bool = True,
) -> list[DefaultFactorRow]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        if reader.fieldnames is None:
            raise ImportValidationError("CSV has no header row.")
        reader.fieldnames = [canonical_header(header) for header in reader.fieldnames]
        rows = [
            parse_default_factor_row(
                dict(row),
                index,
                steel_aluminium_only=steel_aluminium_only,
            )
            for index, row in enumerate(reader, start=2)
        ]
    if not rows:
        raise ImportValidationError("CSV contains no default factor rows.")
    return rows


def upsert_default_factors(database_url: str, rows: list[DefaultFactorRow]) -> int:
    if psycopg is None:
        raise RuntimeError("psycopg is required to import default factors.")
    with psycopg.connect(database_url) as connection, connection.cursor() as cursor:
        cursor.executemany(
            """
            insert into default_emission_factors (
              cn_code,
              reporting_year,
              country_of_origin,
              sector,
              route,
              specific_embedded_emissions,
              unit,
              source_reference,
              regulatory_data_version,
              effective_from,
              effective_to
            )
            values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            on conflict (cn_code, reporting_year, route, country_of_origin) do update set
              sector = excluded.sector,
              specific_embedded_emissions = excluded.specific_embedded_emissions,
              unit = excluded.unit,
              source_reference = excluded.source_reference,
              regulatory_data_version = excluded.regulatory_data_version,
              effective_from = excluded.effective_from,
              effective_to = excluded.effective_to
            """,
            [
                (
                    row.cn_code,
                    row.reporting_year,
                    row.country_of_origin,
                    row.sector,
                    row.route,
                    row.specific_embedded_emissions,
                    row.unit,
                    row.source_reference,
                    row.regulatory_data_version,
                    row.effective_from,
                    row.effective_to,
                )
                for row in rows
            ],
        )
    return len(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", type=Path)
    parser.add_argument("--database-url", default=load_env_file_value(DATABASE_URL_ENV))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--allow-all-chapters",
        action="store_true",
        help="Allow imports outside CN chapters 72, 73, and 76.",
    )
    args = parser.parse_args()

    rows = read_default_factor_csv(
        args.csv_path,
        steel_aluminium_only=not args.allow_all_chapters,
    )
    if args.dry_run:
        print(f"Validated {len(rows)} default factor rows; no database changes made.")
        return 0

    if not args.database_url:
        raise SystemExit("DATABASE_URL is required unless --dry-run is used.")
    imported = upsert_default_factors(args.database_url, rows)
    print(f"Imported {imported} default factor rows.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
