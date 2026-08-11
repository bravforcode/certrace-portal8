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

Run lint before pushing:

```powershell
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m ruff format --check .
```

In Git Bash, the same commands are:

```bash
./.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
./.venv/Scripts/python.exe -m ruff check .
./.venv/Scripts/python.exe -m ruff format --check .
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | No for local previews; yes for persistence | Supabase pooled PostgreSQL connection URI. Never commit its password. |
| `CERTRACE_CORS_ALLOWED_ORIGINS` | No | Comma-separated exact browser origins, such as `http://localhost:3000`. Production origins must use HTTPS. |
| `DATABASE_POOL_SIZE` | No (default `2`) | Persistent PostgreSQL connections per Cloud Run instance. |
| `DATABASE_MAX_OVERFLOW` | No (default `0`) | Additional temporary PostgreSQL connections per instance. |
| `CERTRACE_REQUIRE_DATABASE` | No (default `false`) | Fail startup when persistence is missing; set to `true` on Cloud Run. |
| `CERTRACE_ENABLE_API_DOCS` | No (default `true`) | Expose `/docs`, `/redoc`, and `/openapi.json`; set to `false` in production. |

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

## Deploy to Google Cloud Run

The included `Dockerfile` runs one Uvicorn worker as a non-root user, listens on
Cloud Run's injected `PORT`, and does not copy `.env` or tests into the image.
Run the commands below from `certrace-backend/`.

Choose a region near both users and the Supabase database, then set the shell
variables for your project. These examples use Bangkok's nearby Cloud Run region:

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="asia-southeast1"
export SERVICE="certrace-backend"
export REPOSITORY="certrace"
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE}"
```

Enable the required services and create the Docker repository once:

```bash
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
gcloud artifacts repositories create "$REPOSITORY" --repository-format=docker --location="$REGION"
```

Create a dedicated runtime identity and grant it access to one Secret Manager
secret containing the complete pooled Supabase URI:

```bash
gcloud iam service-accounts create certrace-backend-runner --display-name="Certrace backend Cloud Run"
printf '%s' 'postgresql://REPLACE_WITH_REAL_POOLED_URI' | gcloud secrets create certrace-database-url --data-file=-
gcloud secrets add-iam-policy-binding certrace-database-url \
  --member="serviceAccount:certrace-backend-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Build an immutable image:

```bash
gcloud builds submit --tag "${IMAGE}:$(git rev-parse --short HEAD)" .
export IMAGE_TAG="${IMAGE}:$(git rev-parse --short HEAD)"
```

Do not run Alembic in the web container startup command. Create or update a
Cloud Run Job using the same immutable image, then execute it before deploying
the web revision that needs the new schema:

```bash
gcloud run jobs deploy certrace-backend-migrate \
  --image="$IMAGE_TAG" \
  --region="$REGION" \
  --service-account="certrace-backend-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-secrets="DATABASE_URL=certrace-database-url:1" \
  --command=python --args=-m,alembic,upgrade,head \
  --max-retries=1 --task-timeout=10m
gcloud run jobs execute certrace-backend-migrate --region="$REGION" --wait
```

Deploy the service as private by default. Replace the CORS value with the exact
production portal origin; multiple origins are comma-separated without wildcard
hosts:

```bash
gcloud run deploy "$SERVICE" \
  --image="$IMAGE_TAG" \
  --region="$REGION" \
  --service-account="certrace-backend-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
  --no-allow-unauthenticated \
  --set-secrets="DATABASE_URL=certrace-database-url:1" \
  --set-env-vars="CERTRACE_CORS_ALLOWED_ORIGINS=https://portal.example.com,CERTRACE_REQUIRE_DATABASE=true,CERTRACE_ENABLE_API_DOCS=false,DATABASE_POOL_SIZE=2,DATABASE_MAX_OVERFLOW=0" \
  --cpu=1 --memory=512Mi --concurrency=8 \
  --min=0 --max=3 \
  --startup-probe="httpGet.path=/healthz,initialDelaySeconds=0,timeoutSeconds=3,periodSeconds=5,failureThreshold=12"
```

The current Certrace portal is explicitly a browser-local readiness demo and
does not have an identity authority or server-side tenant authorization. Keep
the service private until those controls exist. A public browser client cannot
use Cloud Run IAM directly as an end-user authentication system. Before changing
to `--allow-unauthenticated`, implement and test application-level authentication,
organization scoping on every database query, and role/action authorization.

Smoke-test the deployed revision:

```bash
export SERVICE_URL="$(gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)')"
export ID_TOKEN="$(gcloud auth print-identity-token)"
curl --fail --show-error -H "Authorization: Bearer $ID_TOKEN" "$SERVICE_URL/healthz"
curl --fail --show-error -H "Authorization: Bearer $ID_TOKEN" "$SERVICE_URL/readyz"
```

With the defaults above, the target PostgreSQL usage is approximately six pooled
connections (`3 instances * 2 connections`); Cloud Run documents that the
configured maximum can be exceeded briefly during some events. Leave headroom
in the Supabase pooler limit before increasing `--max`, concurrency, or the
database pool settings. Use a pinned Secret Manager version and update the
service/job when rotating it.
