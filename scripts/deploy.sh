#!/bin/sh
# Docker-only, maintenance-window deployment. No reset/push/volume deletion.
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
backup_dir=${1:?Usage: ./scripts/deploy.sh /absolute/private/backup-directory}
case "$backup_dir" in /*) ;; *) echo "Backup directory must be absolute." >&2; exit 1;; esac
umask 077
mkdir -p "$backup_dir"
# Also prevents concurrent deployment scripts using this backup directory.
lock="$backup_dir/.deployment-lock"
mkdir "$lock" || { echo "Deployment already active (or stale lock: $lock)." >&2; exit 1; }
clone=""
complete=false
cleanup() {
  status=$?
  if [ -n "$clone" ]; then docker rm -fv "$clone" >/dev/null 2>&1 || true; fi
  rmdir "$lock"
  if [ "$complete" != true ]; then
    echo "Deployment did not complete (exit $status). Inspect the output before restarting services. Any completed backup has been retained." >&2
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

docker compose config --quiet
# Build the paired release before stopping existing services.
docker compose build migrate backend frontend
docker compose up -d --wait database
database_id=$(docker compose ps -q database)
network=$(docker inspect "$database_id" --format '{{range $name, $network := .NetworkSettings.Networks}}{{println $name}}{{end}}' | awk 'NF { print; exit }')
test -n "$network"

# All application writers must be stopped for a consistent cutover. On failure,
# leave them stopped; restarting an old release after a partial upgrade is unsafe.
docker compose stop frontend backend
stamp=$(date -u +%Y%m%dT%H%M%SZ)-$$
backup="$backup_dir/before-deploy-$stamp.dump"
echo "Backing up database to $backup"
docker compose exec -T database pg_dump -U certrace -d certrace --format=custom > "$backup.partial"
docker compose exec -T database pg_restore --list < "$backup.partial" > /dev/null
mv "$backup.partial" "$backup"

# Actually restore and migrate the backup before changing the real database.
# The clone has no published port and uses its own disposable anonymous volume.
clone="certrace-rehearsal-$stamp"
docker run -d --name "$clone" --network "$network" \
  -e POSTGRES_USER=certrace -e POSTGRES_DB=certrace \
  -e POSTGRES_PASSWORD=rehearsal-only postgres:18-alpine > /dev/null
attempt=0
until docker exec "$clone" pg_isready -U certrace -d certrace >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then echo "Rehearsal database did not become ready." >&2; exit 1; fi
  sleep 1
done
# pg_dump includes role grants but not cluster roles. This is the one custom
# NOLOGIN role in the committed schema; database owner is created by the image.
docker exec "$clone" psql -U certrace -d certrace -v ON_ERROR_STOP=1 \
  -c 'CREATE ROLE certrace_reporting NOLOGIN NOSUPERUSER NOBYPASSRLS;'
docker exec -i "$clone" pg_restore -U certrace -d certrace --exit-on-error --single-transaction < "$backup"
echo "Rehearsing migrations on the restored backup."
docker compose run --rm --no-deps -e "DATABASE_URL=postgresql://certrace:rehearsal-only@$clone:5432/certrace" migrate
docker rm -fv "$clone" > /dev/null
clone=""

echo "Rehearsal passed. Applying the same migration image to the deployment database."
docker compose up --no-deps --force-recreate --exit-code-from migrate migrate
docker compose up -d --wait --wait-timeout 180 backend frontend
complete=true
echo "Deployment complete. Retain and copy this backup off-host: $backup"
