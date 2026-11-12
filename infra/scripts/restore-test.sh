#!/usr/bin/env bash
# Monthly restore test (CLAUDE.md §3.5): downloads the newest R2 backup and
# restores it into a throwaway Postgres container. A backup that has never
# been restored is a wish, not a backup.
#   bash infra/scripts/restore-test.sh
#
# The point of this script is to FAIL when a backup is not restorable, so it
# is deliberately strict: psql stops on the first SQL error, and a restore
# that lands implausibly few articles is treated as a failure rather than
# reported as a pass.
set -euo pipefail

# .env locally; in GitHub Actions the vars come from secrets (as backup.sh).
# shellcheck disable=SC1091
if [ -f .env ]; then set -a && source .env && set +a; fi

CONTAINER=karacter-restore-test
DUMP_PATH=/tmp/restore-test.sql.gz

# Must be at least as new as the server that produced the dump. backup.sh
# dumps Neon with postgres:17-alpine, and restoring a newer pg_dump's output
# into an older server is not supported: pg_dump 17 emits
# `SET transaction_timeout = 0`, which Postgres 16 rejects outright with
# `unrecognized configuration parameter`. Keep this in step with the image
# in backup.sh.
PG_IMAGE=postgres:17-alpine

# A restore that produces far fewer rows than the live site has is a failed
# restore, not a passing test. Live was 212 published articles in Nov 2026;
# this floor only needs to catch an empty or badly truncated dump.
MIN_ARTICLES=50

cleanup() {
  rc=$?
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  rm -f "$DUMP_PATH"
  if [ "$rc" -ne 0 ]; then
    echo "==> Restore test FAILED (exit ${rc})"
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
LATEST=$(aws_r2 s3 ls "s3://${R2_BUCKET}/backups/" | sort | tail -1 | awk '{print $4}')
[ -n "$LATEST" ] || { echo "No backups found"; exit 1; }
echo "    ${LATEST}"

aws_r2 s3 cp "s3://${R2_BUCKET}/backups/${LATEST}" "$DUMP_PATH"

echo "==> Starting throwaway ${PG_IMAGE}"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" \
  -e POSTGRES_PASSWORD=test -e POSTGRES_DB=karacter "$PG_IMAGE" >/dev/null

# Poll instead of `sleep 5`: the old fixed wait raced the container on a slow
# machine and failed as though the backup were bad.
echo "==> Waiting for Postgres"
for _ in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -U postgres -q 2>/dev/null; then break; fi
  sleep 1
done
docker exec "$CONTAINER" pg_isready -U postgres -q || {
  echo "Postgres did not become ready"; exit 1; }

# ON_ERROR_STOP is what makes this a test. Without it psql reports SQL errors
# and still exits 0, so a partial restore printed "PASSED".
echo "==> Restoring"
gunzip -c "$DUMP_PATH" \
  | docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d karacter >/dev/null

echo "==> Sanity check: article count"
COUNT=$(docker exec "$CONTAINER" psql -U postgres -t -A -d karacter \
  -c 'SELECT count(*) FROM articles;')
echo "    articles in restored DB: ${COUNT}"

if ! [ "$COUNT" -ge "$MIN_ARTICLES" ] 2>/dev/null; then
  echo "    expected at least ${MIN_ARTICLES} — treating this as a FAILED restore"
  exit 1
fi

echo "==> Restore test PASSED (${LATEST}, ${COUNT} articles)"
