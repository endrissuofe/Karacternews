#!/usr/bin/env bash
# Monthly restore test (CLAUDE.md §3.5): downloads the newest R2 backup and
# restores it into a throwaway Postgres container. A backup that has never
# been restored is a wish, not a backup.
#   bash infra/scripts/restore-test.sh
set -euo pipefail

# shellcheck disable=SC1091
set -a && source .env && set +a

echo "==> Finding newest backup"
LATEST=$(AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  aws s3 ls "s3://${R2_BUCKET}/backups/" --endpoint-url "$R2_ENDPOINT" --region auto \
  | sort | tail -1 | awk '{print $4}')
[ -n "$LATEST" ] || { echo "No backups found"; exit 1; }
echo "    ${LATEST}"

AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3 cp "s3://${R2_BUCKET}/backups/${LATEST}" /tmp/restore-test.sql.gz \
  --endpoint-url "$R2_ENDPOINT" --region auto

echo "==> Restoring into throwaway container"
docker rm -f karacter-restore-test 2>/dev/null || true
docker run -d --name karacter-restore-test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=karacter postgres:16-alpine
sleep 5
gunzip -c /tmp/restore-test.sql.gz | docker exec -i karacter-restore-test psql -U postgres karacter

echo "==> Sanity check: article count"
COUNT=$(docker exec karacter-restore-test psql -U postgres -t -A karacter -c 'SELECT count(*) FROM articles;')
echo "    articles in restored DB: ${COUNT}"

docker rm -f karacter-restore-test
rm -f /tmp/restore-test.sql.gz
echo "==> Restore test PASSED (${LATEST}, ${COUNT} articles)"
