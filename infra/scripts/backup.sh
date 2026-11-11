#!/usr/bin/env bash
# Nightly pg_dump → Cloudflare R2 (CLAUDE.md §3.5). Install on the server:
#   crontab -e
#   15 2 * * * cd /path/to/karacter && bash infra/scripts/backup.sh >> /var/log/karacter-backup.log 2>&1
# Uses the AWS CLI against R2's S3 endpoint (S3-API-only, per §2).
# Requires: aws cli v2 on the host; .env in repo root.
#
# Optional: set BACKUP_HEALTHCHECK_URL in .env to a healthchecks.io ping URL.
# The script pings it on success and /fail on any failure, so a backup that
# stops running raises an alert instead of failing silently. The Oct 2026
# outage ran 19 days unnoticed because nothing watched this job.
set -euo pipefail

# .env on a server; in GitHub Actions (ADR-0006) the vars come from secrets.
# shellcheck disable=SC1091
if [ -f .env ]; then set -a && source .env && set +a; fi

STAMP=$(date -u +%Y%m%d-%H%M%S)
FILE="karacter-${STAMP}.sql.gz"
DUMP_PATH="/tmp/${FILE}"
# Which compose file this host uses. The AMD micro (ADR-0005) runs
# docker-compose.micro.yml; set KARACTER_COMPOSE in .env to override.
# (Deliberately not named COMPOSE_FILE, which docker compose reads itself.)
# Getting this wrong means pg_dump finds no postgres container and the
# backup fails — loudly now, via the healthcheck ping below.
COMPOSE="docker compose -f ${KARACTER_COMPOSE:-infra/docker-compose.micro.yml} --env-file .env"

# A dump smaller than this means pg_dump produced nothing useful (empty or
# broken database). Never upload one: it would become the newest backup and
# the prune step below could then discard the last good one.
MIN_DUMP_BYTES=1024

# Keep at least this many backups regardless of age, so an empty-but-valid
# restore can't age out every usable copy.
MIN_KEPT_BACKUPS=3

ping_healthcheck() {
  [ -n "${BACKUP_HEALTHCHECK_URL:-}" ] || return 0
  curl -fsS -m 10 --retry 3 "${BACKUP_HEALTHCHECK_URL}${1:-}" >/dev/null 2>&1 || true
}

# Runs on every exit path, including the `set -e` aborts that previously
# skipped cleanup and left an orphaned dump in /tmp every failed night.
cleanup() {
  rc=$?
  [ -n "${DUMP_PATH:-}" ] && rm -f "${DUMP_PATH}"
  if [ "$rc" -ne 0 ]; then
    echo "==> Backup FAILED (exit ${rc})"
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

echo "==> Dumping database"
if [ -n "${BACKUP_DATABASE_URL:-}" ]; then
  # Managed Postgres (Neon, ADR-0006): dump over the network with a client
  # at least as new as the server. Owners and grants are left out so the
  # dump restores into any role (restore-test.sh, a future VPS).
  docker run --rm postgres:17-alpine \
    pg_dump --no-owner --no-privileges "$BACKUP_DATABASE_URL" | gzip > "$DUMP_PATH"
else
  $COMPOSE exec -T postgres pg_dump -U karacter karacter | gzip > "$DUMP_PATH"
fi

DUMP_BYTES=$(wc -c < "$DUMP_PATH")
if [ "$DUMP_BYTES" -lt "$MIN_DUMP_BYTES" ]; then
  echo "==> Dump is only ${DUMP_BYTES} bytes (min ${MIN_DUMP_BYTES}) — refusing to upload"
  exit 1
fi
echo "==> Dump OK (${DUMP_BYTES} bytes)"

echo "==> Uploading to R2 (backups/${FILE})"
aws_r2 s3 cp "$DUMP_PATH" "s3://${R2_BUCKET}/backups/${FILE}"

echo "==> Pruning R2 backups older than 30 days"
CUTOFF=$(date -u -d '30 days ago' +%Y%m%d 2>/dev/null || date -u -v-30d +%Y%m%d)
EXISTING=$(aws_r2 s3 ls "s3://${R2_BUCKET}/backups/" | awk '{print $4}' | grep -c . || true)

if [ "$EXISTING" -le "$MIN_KEPT_BACKUPS" ]; then
  echo "==> Only ${EXISTING} backup(s) present — skipping prune (min ${MIN_KEPT_BACKUPS})"
else
  aws_r2 s3 ls "s3://${R2_BUCKET}/backups/" \
    | awk '{print $4}' \
    | sort \
    | head -n "-${MIN_KEPT_BACKUPS}" \
    | while read -r f; do
        d=$(echo "$f" | sed -E 's/karacter-([0-9]{8}).*/\1/')
        if [[ "$d" =~ ^[0-9]{8}$ ]] && [ "$d" -lt "$CUTOFF" ]; then
          echo "    pruning ${f}"
          aws_r2 s3 rm "s3://${R2_BUCKET}/backups/${f}"
        fi
      done
fi

ping_healthcheck
echo "==> Backup complete: ${FILE}"
