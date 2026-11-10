# Cloudflare R2 file storage

Uploaded images, PDFs, spreadsheets and evidence use a private R2 bucket when
`CERTRACE_FILE_STORAGE=r2`. PostgreSQL retains ownership, filenames, hashes and
object references. Static app logos/fonts remain in the frontend image.
The backend authorizes and proxies uploads/downloads; the browser never receives
R2 credentials or a public object URL. No bucket CORS policy or custom domain is
needed for this server-to-server integration.

## 1. Create the bucket and credentials

In Cloudflare Dashboard → R2 Object Storage, create a bucket, for example
`certrace-files`. Keep public access disabled, including the r2.dev URL.
Open Manage R2 API Tokens and create an **Object Read & Write** token scoped
only to this bucket. Save its **Access Key ID** and **Secret Access Key** in your
server's private `.env`; do not commit them or put them in frontend variables.
Use the S3 credential pair, not the API token string.

Copy the bucket's **S3 API endpoint**. The ordinary endpoint is
`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`. If you selected a jurisdiction,
use the endpoint shown for that bucket instead (for example the `.eu.` endpoint).
Use the account endpoint without a bucket path; the bucket name goes in `R2_BUCKET`.

Cloudflare references: [create buckets](https://developers.cloudflare.com/r2/buckets/create-buckets/),
[R2 credentials and endpoints](https://developers.cloudflare.com/r2/api/tokens/).

## 2. Configure your production server

Your production Compose filename is **`docker-compose.yml`**. Keep its existing
services, Caddy settings and database volume. The backend should load the adjacent
`.env` file through `env_file` (Docker Compose 2.24+):

```yaml
services:
  backend:
    env_file:
      - path: .env
        required: false
```

In the `.env` beside that file, set:

```dotenv
CERTRACE_FILE_STORAGE=r2
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_BUCKET=certrace-files
R2_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
```

The repository's Compose templates already load `.env`; R2 credentials need no
individual Compose entries. If upgrading an older Compose file, remove any empty
R2 overrides from `backend.environment` so they do not override the env file.
Missing or invalid R2 settings stop the backend at startup. Storage failures
return a retryable error; uploads do not silently fall back to database storage.

## 3. Deploy the matching backend and migration

Commit/push the application changes and wait for **Publish application images**
to finish. Use the same release tag for migrate, backend and frontend. In your
production directory, pull the images before stopping application writers:

```bash
docker compose -f docker-compose.yml pull migrate backend frontend
docker compose -f docker-compose.yml stop frontend backend
```

Take your PostgreSQL backup before proceeding. Check that the backup command
succeeded. Then run each command only if the preceding command succeeds:

```bash
docker compose -f docker-compose.yml run --rm migrate
docker compose -f docker-compose.yml up -d --wait
docker compose -f docker-compose.yml logs --tail=80 backend migrate
```

Migration `202610280001_r2_files` adds two nullable `object_key` columns and makes
the account file bytes nullable. It does not delete or rewrite existing data.
Keep all eleven migrations. No changes to users or onboarding are required.

Upload a small PDF/image in the app, reload, and download it. Confirm the new
object appears in your R2 bucket. New uploads have an R2 key and no database bytes;
old files without an R2 key remain readable directly from PostgreSQL.

## 4. Copy existing uploads

After the app is working with R2, run:

```bash
docker compose -f docker-compose.yml exec backend \
  bun src/scripts/migrate-files-to-r2.ts
```

This copies existing account and supplier/declaration files, downloads each copy
and checks SHA-256, then saves its object reference. Existing IDs, filenames,
timestamps, ownership and attachment references stay unchanged. The command is
safe to rerun and keeps the old database bytes by default. Concurrent replacements
are not overwritten. A failure stops the command; previous completed copies stay
usable, and files not yet copied still read from PostgreSQL.

After checking downloads and making independent backups, optionally remove the
verified database copies:

```bash
docker compose -f docker-compose.yml exec backend \
  bun src/scripts/migrate-files-to-r2.ts --clear-db-bytes
```

This checks R2 content again before clearing each database copy. Clearing is
optional; it does not immediately shrink PostgreSQL's allocated disk files.
Rows whose contents were already absent remain absent; this cannot recover a
file whose bytes were missing before the switch.

## Backups and recovery

**A PostgreSQL dump no longer contains new R2 file contents.** Back up both the
database and the bucket to independent storage. Keep object keys and bytes intact;
restoring metadata alone cannot restore an absent R2 object. Cloudflare documents
[R2 with rclone](https://developers.cloudflare.com/r2/examples/rclone/) for copying
bucket contents. Retain snapshots of deleted/replaced objects when retaining old
database backups that reference them.

The schema migration is additive. Before enabling R2, old code can still read
existing database files. After R2-only uploads or clearing database bytes, rolling
back to database-only code requires restoring those file bytes as well. Setting
`CERTRACE_FILE_STORAGE=database` in the new code changes future uploads only;
keep R2 credentials configured so existing R2-backed files can still be read.

File replacement/deletion removes its previous R2 object after SQL commits.
If R2 cleanup fails, access is already removed by SQL; a private orphan is
retained and its key is logged for manual cleanup. Do not set a lifecycle rule
that expires active objects. Failed multipart uploads may be handled separately.

## Local verification — 28 October 2026

All 50 backend tests pass, including six R2 integration tests against a local S3
HTTP endpoint. Workspace types/catalogue, API validators and formatting pass;
lint has no errors. Fresh and populated migration/Compose rehearsals pass,
including account/onboarding/file-byte preservation and failure startup gates.
The backend Docker image builds, starts against the disposable database, and
passes native signed S3 upload/download checks on Linux. A real Cloudflare bucket
has not been configured or contacted; complete the upload/download check after
adding your own server credentials and deploying.
