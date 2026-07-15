# Karacter News — production image (Increment 5.5, ADR-0002).
# Host-neutral: same image runs on the Oracle UAT box and Hetzner at launch.
# ARM-native (both hosts are ARM); works on x86 too.
#
# NOTE: `next build` prerenders pages through Payload, so it needs a
# reachable Postgres AT BUILD TIME. docker-compose.prod.yml builds with
# network: host and passes DATABASE_URL pointing at localhost:5432 —
# start the postgres service (and run migrations) before building the app.

FROM node:22-alpine AS base
RUN corepack enable pnpm

# --- deps ---
FROM base AS deps
WORKDIR /app
# pnpm-workspace.yaml carries allowBuilds (sharp, esbuild) — without it
# pnpm refuses their install scripts and the install fails.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL
ARG PAYLOAD_SECRET
ARG NEXT_PUBLIC_SERVER_URL
ENV DATABASE_URL=$DATABASE_URL \
    PAYLOAD_SECRET=$PAYLOAD_SECRET \
    NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL \
    BUILD_STANDALONE=1 \
    NODE_OPTIONS=--no-deprecation
RUN pnpm build

# --- runtime ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NODE_OPTIONS=--no-deprecation
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Local-storage upload dirs (media stays local until its own R2 migration;
# mounted as a volume in compose so uploads survive redeploys)
RUN mkdir -p public/media && chown -R nextjs:nodejs public

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
