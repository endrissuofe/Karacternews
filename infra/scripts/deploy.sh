#!/usr/bin/env bash
# Karacter News deploy (Increment 5.5). Run on the server from the repo root:
#   bash infra/scripts/deploy.sh
# Assumes: docker + compose plugin installed, .env present in repo root.
# Order matters: postgres up → migrations → app build (needs DB) → app up.
set -euo pipefail

COMPOSE="docker compose -f infra/docker-compose.prod.yml --env-file .env"

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Starting postgres"
$COMPOSE up -d postgres
$COMPOSE exec postgres sh -c 'until pg_isready -U karacter; do sleep 1; done'

echo "==> Running migrations (one-off container with repo mounted)"
docker run --rm --network host \
  -v "$PWD":/app -w /app \
  --env-file .env \
  -e DATABASE_URL="postgres://karacter:${POSTGRES_PASSWORD:-$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2)}@127.0.0.1:5432/karacter" \
  node:22-alpine sh -c "corepack enable pnpm && pnpm install --frozen-lockfile && pnpm payload migrate"

echo "==> Building and starting app + caddy"
$COMPOSE build app
$COMPOSE up -d

echo "==> Done. Containers:"
$COMPOSE ps
