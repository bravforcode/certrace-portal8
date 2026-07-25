# Certrace Backend

FastAPI backend for CBAM calculation previews and declaration drafts.

## Project structure

```text
app/
  core/           # CORS validation and security middleware
  models/         # API request models
  repositories/   # PostgreSQL access
  routers/        # Health, calculation, and declaration endpoints
  services/       # Sector MRV calculation engine
migrations/       # Alembic schema revisions; source of truth for the database
main.py           # Stable ASGI entry point: main:app
```

## Local setup

```powershell
Copy-Item .env.example .env
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-test.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

The API is available at `http://127.0.0.1:8000`; interactive documentation is
available at `http://127.0.0.1:8000/docs`.

Activate the virtual environment when you want to run backend commands manually:

```bash
# Git Bash
source .venv/Scripts/activate
```

```powershell
# PowerShell
.\.venv\Scripts\Activate.ps1
```

From this `certrace-backend` directory, the same backend commands are available through
`startup.py`:

```bash
python startup.py            # start the backend API
python startup.py migrate    # run Alembic migrations
python startup.py downgrade  # roll back the latest Alembic migration
python startup.py ready      # check /readyz
```

The `startup.py` commands use `.venv` directly when it exists,
so you do not need to activate the virtual environment first.

Run tests in a separate terminal:

```powershell
.\.venv\Scripts\python.exe -m pytest -q -p no:cacheprovider
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | No for local previews; yes for persistence | Supabase pooled PostgreSQL connection URI. Never commit its password. |
| `CERTRACE_CORS_ALLOWED_ORIGINS` | No | Comma-separated exact browser origins, such as `http://localhost:3000`. Production origins must use HTTPS. |

`.env` is ignored by Git. Use [`.env.example`](.env.example) as the safe,
committable template.

## Supabase setup

1. Put the pooled PostgreSQL URI in `.env`:

```env
DATABASE_URL=postgresql://...
```

2. Create the database schema from the first migration:

```powershell
.\.venv\Scripts\alembic.exe upgrade head
```

Or from the `certrace-backend` directory:

```bash
python startup.py migrate
```

3. Check database readiness:

```powershell
@'
from fastapi.testclient import TestClient
from main import app
client = TestClient(app)
print(client.get("/readyz").json())
'@ | .\.venv\Scripts\python.exe -
```

Or, when the local API is running:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/readyz
```

Or from the `certrace-backend` directory:

```bash
python startup.py ready
```

When the database is configured and reachable, the response includes
`"databaseConfigured": true`.

## API routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/healthz` | Liveness check; does not contact PostgreSQL. |
| `GET` | `/readyz` | Readiness check; returns 503 when configured PostgreSQL is unavailable. |
| `POST` | `/api/v1/calculate` | Run a CBAM calculation preview. |
| `POST` | `/api/v1/declarations` | Calculate and create a declaration draft. |
| `GET` | `/api/v1/declarations` | List declaration drafts. |
| `GET` | `/api/v1/declarations/{id}` | Read one declaration draft. |

## Import EU default values

The European Commission publishes the definitive-period default values as an
Excel file for information purposes. The legally binding values are in
Commission Implementing Regulation (EU) 2025/2621.

Source page:
https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-legislation-and-guidance_en

Export the relevant official sheet/range to CSV using these columns:

```csv
cn_code,reporting_year,country_of_origin,sector,route,specific_embedded_emissions,unit,source_reference,regulatory_data_version,effective_from,effective_to
```

`country_of_origin` is normalized during import, for example `Other Countries`
becomes `OTHER_COUNTRIES`. If the column is omitted for an older local seed file,
the importer stores `UNSPECIFIED`.

To convert the official Excel workbook into the CSV accepted by the importer:

```bash
python convert_default_values.py data/DVs_as_adopted_v20260204.xlsx data/default_factors_official_steel_aluminium.csv
```

The converter keeps only Certrace's current scope: CN chapters `72`, `73`, and
`76`, and expands the workbook's `2028 and onwards` column into 2028-2030 rows.

Validate without changing the database:

```powershell
.\.venv\Scripts\python.exe import_default_factors.py path\to\defaults.csv --dry-run
```

Import into Supabase using `DATABASE_URL` from `.env`:

```powershell
.\.venv\Scripts\python.exe import_default_factors.py path\to\defaults.csv
```

By default the importer only allows CN chapters `72`, `73`, and `76`.

## Calculation contract

`POST /api/v1/calculate` returns calculation totals, trace records, and route
warnings. Missing route-specific inputs are reported as `BLOCKER` warnings so
draft calculations can still be saved while remaining visibly incomplete.

The response also includes `materialMix`, which reports scrap mass, actual
precursor mass, default precursor mass, scrap ratio, and the weighted-average
embedded emission of the material mix. Scrap inputs are assigned
`0 TCO2E_PER_TNE` in that weighted-average calculation.

## Schema migrations

Alembic is the only source of truth for the Certrace database schema. The first
revision creates the complete schema for an empty Supabase database. For every
future schema change, add a migration with both `upgrade()` and `downgrade()`,
then deploy with:

```powershell
.\.venv\Scripts\alembic.exe upgrade head
```

To roll back one future schema revision:

```powershell
.\.venv\Scripts\alembic.exe downgrade -1
```

Or from the `certrace-backend` directory:

```bash
python startup.py downgrade
```

Downgrades run against the configured `DATABASE_URL` and may drop or alter
tables according to the migration's `downgrade()` function.

Do not run a separate schema SQL file against the real environment. This keeps
each database version visible in `migrations/versions/`.
