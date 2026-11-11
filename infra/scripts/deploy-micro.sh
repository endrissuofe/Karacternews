#!/usr/bin/env bash
# Karacter News deploy for the Oracle AMD E2.1.Micro (ADR-0005).
# Run on the server from the repo root:
#   bash infra/scripts/deploy-micro.sh            # pull + restart
#   bash infra/scripts/deploy-micro.sh --migrate   # also run migrations
#
# Unlike infra/scripts/deploy.sh this NEVER builds: the micro has 1 GB RAM
# and `next build` will not fit. CI builds and pushes the image to GHCR on
# push to main; this pulls it.
#
# Migrations are opt-in because running them needs a full `pnpm install` in
# a one-off container, which is slow and memory-hungry on a micro. You only
# need --migrate when src/migrations has changed. A fresh restore from
# pg_dump already carries the schema, so the first deploy does not need it.
set -euo pipefail

COMPOSE="docker compose -f infra/docker-compose.micro.yml --env-file .env"
RUN_MIGRATIONS=0

for arg in "$@"; do
  case "$arg" in
    --migrate) RUN_MIGRATIONS=1 ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

# shellcheck disable=SC1091
set -a && source .env && set +a

if [ "${REQUIRE_R2:-}" != "true" ]; then
  echo "WARNING: REQUIRE_R2 is not 'true' in .env. The app will fall back to"
  echo "         local media storage and uploads will be lost on redeploy."
fi

echo "==> Pulling latest code (for compose file, Caddyfile, migrations)"
git pull --ff-only

echo "==> Pulling application image"
$COMPOSE pull app

echo "==> Starting postgres"
$COMPOSE up -d postgres
$COMPOSE exec -T postgres sh -c 'until pg_isready -U karacter; do sleep 1; done'

if [ "$RUN_MIGRATIONS" -eq 1 ]; then
  echo "==> Running migrations (one-off container; slow on a micro)"
  # Share the postgres container's network namespace so the database is
  # reachable at 127.0.0.1 without publishing a port to the host.
  PG_CID="$($COMPOSE ps -q postgres)"
  if [ -z "$PG_CID" ]; then
    echo "Could not find the postgres container" >&2
    exit 1
  fi
  docker run --rm \
    --network "container:${PG_CID}" \
    -v "$PWD":/app -w /app \
    -e DATABASE_URL="postgres://karacter:${POSTGRES_PASSWORD}@127.0.0.1:5432/karacter" \
    -e PAYLOAD_SECRET="$PAYLOAD_SECRET" \
    node:22-alpine sh -c "corepack enable pnpm && pnpm install --frozen-lockfile && pnpm payload migrate"
else
  echo "==> Skipping migrations (pass --migrate if src/migrations changed)"
fi

echo "==> Starting app + caddy"
$COMPOSE up -d

echo "==> Containers:"
$COMPOSE ps

echo "==> Memory:"
free -h

echo
echo "==> Done. Verify:"
echo "    curl -s -o /dev/null -w '%{http_code}\\n' https://${SITE_DOMAIN:-localhost}/"
