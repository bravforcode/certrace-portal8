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
| `CERTRACE_EMAIL_DELIVERY` | No | `resend`, `console`, or `off`. Defaults to `resend` once a key and sender exist, `off` otherwise. |
| `RESEND_API_KEY` | Only to send mail | Resend API key. The same secret the outreach script at the repository root uses. |
| `CERTRACE_EMAIL_SENDER` | Only to send mail | From address, on a domain verified in Resend, e.g. `Certrace <contact@certrace.co>`. |
| `CERTRACE_EMAIL_REPLY_TO` | No | Reply-to address, when it differs from the sender. |
| `CERTRACE_EMAIL_LOGO_URL` | No | Public PNG/JPG shown at the top of each email. Omit for no logo. |
| `CERTRACE_JWT_SECRET` | Yes whenever `DATABASE_URL` is set | HS256 signing key for portal session tokens. Startup fails without it rather than sign with a key that changes on every restart and instance. Generate with `python -c "import secrets; print(secrets.token_urlsafe(48))"`. |
| `CERTRACE_MAX_UPLOAD_BYTES` | No (default `15728640`, i.e. 15 MB) | Largest evidence file accepted. The ceiling is memory, not the platform: Cloud Run caps a request body at 32 MiB, but eight concurrent uploads at the limit have to fit in 512 MiB alongside everything else. Raise it and raise `--memory` with it. |
| `CERTRACE_APP_BASE_URL` | No (default `https://app.certrace.co`) | Where minted supplier smart links point — the portal serving `/s/<token>`, never this API. The default is **not** the live portal: production must set `https://portal.certrace.co` or every link mailed to a supplier lands on a host that does not exist. |

`.env` is ignored by Git. Use [`.env.example`](.env.example) as the safe,
committable template.

## Email notifications

Three modules, deliberately separate ([why](app/services/email.py)):

| Module | Owns |
| --- | --- |
| `app/services/email.py` | Talking to Resend — retries, timeouts, the dev transports. |
| `app/services/email_templates.py` | What each message says, in English and Thai. |
| `app/services/notifications.py` | Which message goes to whom, and when we stay quiet. |

Categories match `certrace-portal/lib/notification-prefs.ts` one for one, so
the preference check is already written for the day preferences move off the
browser and onto the account. Security mail (`password_reset`,
`password_changed`) cannot be switched off.

To read a reset code locally with no Resend key, set
`CERTRACE_EMAIL_DELIVERY=console` — the whole message, code included, goes to
the application log.

Adding a notification is three edits: copy in both locales in
`email_templates.TEMPLATES`, a `NotificationType` in `notifications.CATALOG`,
and a `background_tasks.add_task(notifications.send_quietly, ...)` at the point
in the router where the thing actually happens.

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

**Do this once by hand, then let CI take over.** Every merge to `main` that
touches `certrace-backend/` runs the same build, migration, and deploy from
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) — see
[Deploy from CI](#deploy-from-ci) at the end of this section. What follows is
what that job does, in the order it does it, and what only a human can do:
create the secrets, and map the domain.

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

Create a dedicated runtime identity and grant it access to the three secrets the
service reads. `DATABASE_URL` holds the complete pooled Supabase URI;
`CERTRACE_JWT_SECRET` signs portal sessions and the app refuses to start without
it once a database is configured; `RESEND_API_KEY` is the same credential the
outreach script at the repository root uses:

```bash
gcloud iam service-accounts create certrace-backend-runner --display-name="Certrace backend Cloud Run"

printf '%s' 'postgresql://REPLACE_WITH_REAL_POOLED_URI' | gcloud secrets create certrace-database-url --data-file=-
python -c "import secrets; print(secrets.token_urlsafe(48), end='')" | gcloud secrets create certrace-jwt-secret --data-file=-
printf '%s' 're_REPLACE_WITH_REAL_KEY' | gcloud secrets create certrace-resend-api-key --data-file=-

for secret in certrace-database-url certrace-jwt-secret certrace-resend-api-key; do
  gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:certrace-backend-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

`end=''` on the key matters: a trailing newline inside the secret is invisible
in every console and dashboard, travels into the signing key, and produces a
service whose tokens are all valid — until someone regenerates the secret
without it and every session breaks at once.

Build an immutable image:

```bash
gcloud builds submit --tag "${IMAGE}:$(git rev-parse --short HEAD)" .
export IMAGE_TAG="${IMAGE}:$(git rev-parse --short HEAD)"
```

Do not run Alembic in the web container startup command. Create or update a
Cloud Run Job using the same immutable image, then execute it before deploying
the web revision that needs the new schema. The job needs only the database URI
— [`migrations/env.py`](migrations/env.py) imports the models, never
`create_app`, so no signing key is bound here:

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

Then deploy the service. Every value below is load-bearing; the two that fail
quietly are called out underneath:

```bash
gcloud run deploy "$SERVICE" \
  --image="$IMAGE_TAG" \
  --region="$REGION" \
  --service-account="certrace-backend-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
  --allow-unauthenticated \
  --set-secrets="DATABASE_URL=certrace-database-url:1,CERTRACE_JWT_SECRET=certrace-jwt-secret:1,RESEND_API_KEY=certrace-resend-api-key:1" \
  --set-env-vars="^|^CERTRACE_CORS_ALLOWED_ORIGINS=https://portal.certrace.co|CERTRACE_APP_BASE_URL=https://portal.certrace.co|CERTRACE_REQUIRE_DATABASE=true|CERTRACE_ENABLE_API_DOCS=false|CERTRACE_EMAIL_DELIVERY=resend|CERTRACE_EMAIL_SENDER=Certrace <contact@certrace.co>|CERTRACE_EMAIL_REPLY_TO=contact@certrace.co|DATABASE_POOL_SIZE=2|DATABASE_MAX_OVERFLOW=0" \
  --cpu=1 --memory=512Mi --concurrency=8 \
  --min=0 --max=3 \
  --startup-probe="httpGet.path=/healthz,initialDelaySeconds=0,timeoutSeconds=3,periodSeconds=5,failureThreshold=12"
```

`^|^` switches `--set-env-vars` to a pipe delimiter, because the sender address
contains a comma. With the default delimiter gcloud splits
`Certrace <contact@certrace.co>` in half and the deploy fails on a malformed
pair.

`CERTRACE_APP_BASE_URL` is the one with no error mode. Leave it out and the
service still starts, still passes every probe, and mints supplier smart links
pointing at the default `https://app.certrace.co` — a host that does not exist.
Nobody finds out until a supplier opens the link in the mail we sent them. The
portal is what serves `/s/<token>`, so this is the portal origin, never the
API's.

`--allow-unauthenticated` is required here, not a shortcut. The portal is a
browser client and cannot present a Cloud Run IAM identity token, so a private
service would refuse every request it makes. An earlier version of this file
said to keep the service private because the portal had no identity authority of
its own; that is no longer true. The API issues and verifies its own JWTs
([`app/core/tokens.py`](app/core/tokens.py)), rotates refresh tokens
server-side, rate-limits the auth routes, and puts every exporter-facing route
behind `current_account`
([`app/routers/declarations.py`](app/routers/declarations.py),
[`app/routers/links.py`](app/routers/links.py)). What is still missing is
role/action authorization: today the only question the server asks is whether
the caller owns the row. That gap is tracked in
[`PROJECT_STATUS.md`](../PROJECT_STATUS.md) §5 and is a prerequisite for paying
customers, not for a design partner.

Smoke-test the deployed revision. The service exposes `/`, `/healthz`, and
`/readyz`. There is no `/health` — asking for one gets a 404 that reads like a
dead service:

```bash
export SERVICE_URL="$(gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)')"
curl --fail --show-error "$SERVICE_URL/healthz"
curl --fail --show-error "$SERVICE_URL/readyz"
```

`/readyz` is the one that matters: it returns 503 when
`CERTRACE_REQUIRE_DATABASE=true` and the pooled URI cannot be reached, which is
the usual first-deploy outcome when the Supabase password or the
`?sslmode=require` suffix is wrong.

### Point `api.certrace.co` at the service

Until this is done the hostname resolves to a Cloudflare record with nothing
behind it and every call returns 403 from the edge — which reads like an
application rejection and is not one:

```bash
gcloud beta run domain-mappings create --service="$SERVICE" --domain=api.certrace.co --region="$REGION"
```

Add the records it prints to Cloudflare DNS as **DNS only** (grey cloud).
Proxying Cloud Run through the orange cloud breaks the managed certificate
handshake while the mapping is still provisioning. Then confirm the portal's own
origin is what CORS allows; a mismatch here surfaces in the browser as a failed
preflight with nothing at all in the server log:

```bash
curl -sS -o /dev/null -D - -X OPTIONS https://api.certrace.co/api/auth/login \
  -H 'Origin: https://portal.certrace.co' \
  -H 'Access-Control-Request-Method: POST' | grep -i access-control
```

### Request size

[`docs/API-CONTRACT.md`](../docs/API-CONTRACT.md) §4 requires the API to accept
at least 8 MB, because supplier evidence still travels as base64 inside the
smart-link save payload. Cloud Run caps an HTTP/1 request body at 32 MiB, so
there is nothing to configure on the service itself — the limit to watch is
whatever proxy ends up in front of it.

### Secret versions

The commands above pin `:1` because a hand-run deploy is a moment you are
watching: you choose when a rotated secret goes live. CI uses `:latest` instead,
so rotating a key is one `gcloud secrets versions add` plus a redeploy rather
than a pull request against the workflow. Cloud Run resolves the version when an
instance starts, so a rotation reaches the service on the next deploy or the
next cold start, not instantly.

### Connection budget

With the defaults above, the target PostgreSQL usage is approximately six pooled
connections (`3 instances * 2 connections`); Cloud Run documents that the
configured maximum can be exceeded briefly during some events. Leave headroom
in the Supabase pooler limit before increasing `--max`, concurrency, or the
database pool settings.

### Deploy from CI

The `backend` job in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
runs the whole sequence above — tests, image, migration job, service, then a
check that `api.certrace.co` answers and that CORS lets the portal in. It
authenticates with Workload Identity Federation, so no service-account key is
stored in the repository; the token it uses is minted per run and expires with
it.

Until the repository variables below exist the job skips with a notice instead
of failing, so a backend change never turns `main` red before GCP is
provisioned. Fill them in and the next merge ships.

Create the pool and the identity GitHub impersonates:

```bash
gcloud iam workload-identity-pools create github --location=global --display-name="GitHub Actions"
gcloud iam workload-identity-pools providers create-oidc github \
  --location=global --workload-identity-pool=github \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='certrace/Certrace'"

gcloud iam service-accounts create certrace-deployer --display-name="Certrace GitHub deploys"
export POOL="$(gcloud iam workload-identity-pools describe github --location=global --format='value(name)')"
gcloud iam service-accounts add-iam-policy-binding "certrace-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/${POOL}/attribute.repository/certrace/Certrace"
```

The `--attribute-condition` is what stops any other repository on GitHub from
requesting a token for this account. Do not drop it — and keep the capital C:
GitHub sends the repository name exactly as it stores it (`certrace/Certrace`),
and the comparison is case-sensitive.

`certrace-deployer` needs `roles/run.admin`, `roles/cloudbuild.builds.editor`,
`roles/artifactregistry.writer`, and `roles/iam.serviceAccountUser` on
`certrace-backend-runner` (that last one is what lets it deploy a service that
*runs as* the runtime account). The runtime account keeps only
`roles/secretmanager.secretAccessor` on the three secrets — a deploy identity
that could also read secrets would make every workflow change a secret-exposure
question.

Then set these under **Settings → Secrets and variables → Actions → Variables**.
They are repository *variables*, not secrets: none is confidential, and having
them readable in the log is what makes a failed deploy diagnosable.

| Variable | Example | Notes |
| --- | --- | --- |
| `GCP_PROJECT_ID` | `certrace-prod` | Required. |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/123456789/locations/global/workloadIdentityPools/github/providers/github` | Required. Full resource name, numeric project number. |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | `certrace-deployer@certrace-prod.iam.gserviceaccount.com` | Required. The identity GitHub impersonates. |
| `GCP_RUNTIME_SERVICE_ACCOUNT` | `certrace-backend-runner@certrace-prod.iam.gserviceaccount.com` | Required. The identity the service runs as. |
| `GCP_REGION` | `asia-southeast1` | Optional, defaults to `asia-southeast1`. |
| `GCP_SERVICE` | `certrace-backend` | Optional, defaults to `certrace-backend`. |
| `GCP_ARTIFACT_REPOSITORY` | `certrace` | Optional, defaults to `certrace`. |
| `PORTAL_ORIGIN` | `https://portal.certrace.co` | Optional. Sets both the CORS allowlist and where smart links point. |
| `API_URL` | `https://api.certrace.co` | Optional. The domain the post-deploy check calls. |
| `CERTRACE_EMAIL_SENDER` | `Certrace <contact@certrace.co>` | Optional. Must be on a Resend-verified domain. |
| `CERTRACE_EMAIL_REPLY_TO` | `contact@certrace.co` | Optional. |

To ship the backend without touching its files — after rotating a secret, say —
run the workflow from the Actions tab and pick `backend` under *Which apps to
deploy*.
