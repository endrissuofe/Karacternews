# Karacter News — production image.
# Host-neutral. Target is now the Oracle AMD E2.1.Micro (x86_64, ADR-0005);
# built by CI, never on the box, which has only 1 GB RAM.
#
# NOTE: `next build` prerenders pages through Payload, so it needs a
# reachable Postgres AT BUILD TIME, and next/font/google downloads the three
# brand fonts, so it needs outbound network too. CI provides both (a Postgres
# service container plus `docker build --network=host`).
#
# Debian slim, NOT alpine. On node:22-alpine (musl) Turbopack failed to
# resolve the next/font/google files with "Can't resolve
# '@vercel/turbopack-next/internal/font/google/font'", while the identical
# code builds fine on glibc — which is what both CI's `build` job and local
# development use. Matching libc to where the build is known to work removes
# the whole class of native-binary differences; the larger base image only
# costs disk, and Always Free gives 200 GB.

FROM node:22-slim AS base
RUN corepack enable pnpm

# --- deps ---
FROM base AS deps
WORKDIR /app
# pnpm-workspace.yaml carries allowBuilds (sharp, esbuild) — without it
# pnpm refuses their install scripts and the install fails.
# .npmrc matters: it carries legacy-peer-deps and enable-pre-post-scripts.
# Without it the install here differs from local development and from CI's
# `build` job, which is exactly the kind of divergence that made the font
# failure above hard to pin down.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
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

# A Docker build has no TTY, so any pnpm prompt is a hard failure.
# .dockerignore is what actually keeps the host's node_modules out of the
# context (that mismatch is why pnpm wanted to purge here); this is the
# belt-and-braces so a prompt can never block the build again.
ENV CI=true
RUN pnpm build

# --- runtime ---
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NODE_OPTIONS=--no-deprecation
# Debian's adduser/addgroup, not BusyBox's -S/-G flags.
RUN addgroup --system nodejs && adduser --system --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Media actually lives in R2 (src/plugins/index.ts covers both `media` and
# `podcast-audio`), confirmed against the live bucket; REQUIRE_R2=true
# enforces it. This directory is the safety net for pre-R2 legacy files and
# is mounted as a volume in compose.
RUN mkdir -p public/media && chown -R nextjs:nodejs public

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
