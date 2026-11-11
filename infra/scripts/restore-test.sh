#!/usr/bin/env bash
# Monthly restore test (CLAUDE.md §3.5): downloads the newest R2 backup and
# restores it into a throwaway Postgres container. A backup that has never
# been restored is a wish, not a backup.
#   bash infra/scripts/restore-test.sh
#
# Optional: set RESTORE_TEST_HEALTHCHECK_URL in .env to a healthchecks.io
# ping URL (a ~32-day period). Pinged on pass, <url>/fail on any failure.
set -euo pipefail

# shellcheck disable=SC1091
set -a && source .env && set +a

CONTAINER=karacter-restore-test
DUMP=/tmp/restore-test.sql.gz

ping_healthcheck() {
  [ -n "${RESTORE_TEST_HEALTHCHECK_URL:-}" ] || return 0
  curl -fsS -m 10 --retry 3 "${RESTORE_TEST_HEALTHCHECK_URL}${1:-}" >/dev/null 2>&1 || true
}

cleanup() {
  rc=$?
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  rm -f "$DUMP"
  if [ "$rc" -ne 0 ]; then
    echo "==> Restore test FAILED (exit ${rc})"
    ping_healthcheck /fail
  fi
  exit "$rc"
}
trap cleanup EXIT

aws_r2() {
  AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  aws "$@" --endpoint-url "$R2_ENDPOINT" --region auto
}

echo "==> Finding newest backup"
LATEST=$(aws_r2 s3 ls "s3://${R2_BUCKET}/backups/" | awk '{print $4}' | sort | tail -1)
[ -n "$LATEST" ] || { echo "No backups found"; exit 1; }
echo "    ${LATEST}"

aws_r2 s3 cp "s3://${R2_BUCKET}/backups/${LATEST}" "$DUMP"

echo "==> Restoring into throwaway container"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
# Same role name as production so the dump's OWNER TO statements succeed.
# Memory-capped: this runs beside the live stack on a 1 GB box (ADR-0005).
docker run -d --name "$CONTAINER" --memory 192m \
  -e POSTGRES_USER=karacter -e POSTGRES_PASSWORD=test -e POSTGRES_DB=karacter \
  postgres:16-alpine -c shared_buffers=32MB >/dev/null

# Wait on TCP, not the socket: during first-boot init the entrypoint runs a
# temporary socket-only server, and restoring into that one gets cut off
# when it restarts.
for _ in $(seq 1 60); do
  docker exec "$CONTAINER" pg_isready -q -h 127.0.0.1 -U karacter && break
  sleep 2
done
docker exec "$CONTAINER" pg_isready -q -h 127.0.0.1 -U karacter \
  || { echo "Throwaway Postgres never became ready"; exit 1; }

gunzip -c "$DUMP" | docker exec -i "$CONTAINER" \
  psql -q -v ON_ERROR_STOP=1 -h 127.0.0.1 -U karacter -d karacter >/dev/null

echo "==> Sanity check: article count"
COUNT=$(docker exec "$CONTAINER" psql -h 127.0.0.1 -U karacter -t -A -d karacter \
  -c 'SELECT count(*) FROM articles;')
echo "    articles in restored DB: ${COUNT}"
[ "${COUNT:-0}" -gt 0 ] || { echo "Restored database has no articles"; exit 1; }

ping_healthcheck
echo "==> Restore test PASSED (${LATEST}, ${COUNT} articles)"
