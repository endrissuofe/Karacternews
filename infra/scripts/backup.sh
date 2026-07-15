#!/usr/bin/env bash
# Nightly pg_dump → Cloudflare R2 (CLAUDE.md §3.5). Install on the server:
#   crontab -e
#   15 2 * * * cd /path/to/karacter && bash infra/scripts/backup.sh >> /var/log/karacter-backup.log 2>&1
# Uses the AWS CLI against R2's S3 endpoint (S3-API-only, per §2).
# Requires: aws cli v2 on the host; .env in repo root.
set -euo pipefail

# shellcheck disable=SC1091
set -a && source .env && set +a

STAMP=$(date -u +%Y%m%d-%H%M%S)
FILE="karacter-${STAMP}.sql.gz"
COMPOSE="docker compose -f infra/docker-compose.prod.yml --env-file .env"

echo "==> Dumping database"
$COMPOSE exec -T postgres pg_dump -U karacter karacter | gzip > "/tmp/${FILE}"

echo "==> Uploading to R2 (backups/${FILE})"
AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3 cp "/tmp/${FILE}" "s3://${R2_BUCKET}/backups/${FILE}" \
  --endpoint-url "$R2_ENDPOINT" --region auto

rm -f "/tmp/${FILE}"

echo "==> Pruning R2 backups older than 30 days"
CUTOFF=$(date -u -d '30 days ago' +%Y%m%d 2>/dev/null || date -u -v-30d +%Y%m%d)
AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3 ls "s3://${R2_BUCKET}/backups/" --endpoint-url "$R2_ENDPOINT" --region auto \
  | awk '{print $4}' \
  | while read -r f; do
      d=$(echo "$f" | sed -E 's/karacter-([0-9]{8}).*/\1/')
      if [[ "$d" =~ ^[0-9]{8}$ ]] && [ "$d" -lt "$CUTOFF" ]; then
        AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
        AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
        aws s3 rm "s3://${R2_BUCKET}/backups/${f}" --endpoint-url "$R2_ENDPOINT" --region auto
      fi
    done

echo "==> Backup complete: ${FILE}"
