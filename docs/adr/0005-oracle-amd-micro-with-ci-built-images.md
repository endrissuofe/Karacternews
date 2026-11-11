# ADR-0005: Oracle AMD E2.1.Micro with CI-built images

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decision maker:** Drix
- **Amends:** ADR-0004 (Oracle ARM Ampere A1) — same provider, different shape
- **Relates to:** ADR-0002, ADR-0003

## Context

ADR-0004 chose the Oracle Always Free **ARM (Ampere A1)** shape. The
account provisioned fine and card verification succeeded, but creating an
A1 instance fails persistently with **"Out of host capacity"** — the shape
is simply unobtainable in the home region, which cannot be changed after
signup. Multiple attempts across days did not succeed.

The site has been down since **2026-10-23**. At this point time-to-live
dominates every other consideration: each day dark costs indexing,
readers and Google News standing on a site whose bottleneck was already
discoverability.

Oracle's **AMD `VM.Standard.E2.1.Micro`** shape is available. Always Free
provides two of them, 1 OCPU and 1 GB RAM each.

## Decision

Host production on an **Oracle Always Free AMD E2.1.Micro**, with the
application image **built in CI instead of on the server**.

The 1 GB constraint drives everything else here. `next build` cannot run
on the box, so:

1. `.github/workflows/ci.yml` gains a `publish-image` job that builds the
   image and pushes it to GHCR on push to `main`. It reuses the existing
   throwaway-Postgres pattern, so build-time credentials are disposable and
   the multi-stage Dockerfile's `runner` stage carries no secrets.
2. `infra/docker-compose.micro.yml` **pulls** that image rather than
   building. Postgres and Caddy are memory-capped so they cannot starve the
   app; the app is deliberately left uncapped so the kernel and swap absorb
   its spikes instead of Docker OOM-killing it.
3. `infra/scripts/deploy-micro.sh` pulls and restarts. Migrations are
   **opt-in** (`--migrate`), because running them needs a full
   `pnpm install` in a one-off container, which is slow on a micro and
   unnecessary unless `src/migrations` changed. A restore from `pg_dump`
   already carries the schema.

This also forced a latent bug into the open. `src/app/(frontend)/page.tsx`
had **no `revalidate` and no `dynamic` export**, so the homepage was fully
static — frozen at build time, changing only when `revalidateArticle`
fired `revalidatePath('/')`. That was masked by building on the server
against the live database. Built in CI against an empty throwaway database
it would have shipped an **empty homepage**. It is now ISR at 300s. A news
homepage should never have been build-time frozen regardless of host.

## Consequences

- ₦0/month with **no overage mechanism at all** — Always Free cannot bill
  you. Given the October suspension, this property matters more than
  convenience.
- Always-on, so no cold starts and the in-process `autoRun` jobs runner
  keeps working. §3.3 portability is preserved: it is still our own Docker
  stack on a plain VM.
- CI-built images are a genuine improvement independent of the constraint:
  builds no longer compete for memory with the running site, and a tagged
  image per commit makes rollback a tag change.
- **Accepted risks:** 1 GB is tight. Expected steady state is roughly
  250–400 MB app, 50–100 MB Postgres, 20 MB Caddy and 100–200 MB host, so
  swap is **required**, not optional. Oracle's idle-reclamation policy
  still applies (7 days under 20% CPU, network and memory), so the uptime
  monitoring remains mandatory.
- **Escape hatch:** Always Free includes a *second* micro. If memory
  pressure proves unmanageable, move Postgres to it over the private VCN
  network rather than reaching for a paid tier.
- Deploying now requires the image to exist, so the first deploy must
  follow a successful `main` build.

## Alternatives considered

- **Google Cloud Run** — rejected on verified figures from Google's
  free-tier documentation: **1 GB outbound transfer per month** (far too
  little for a news site once admin traffic is counted), **no hard
  spending cap** (budgets are alerts, not limits), a billing account
  required even within free limits, and a 90-day trial after which
  resources stop and are deleted unless upgraded to a paid account.
  Artifact Registry's free 0.5 GB is also smaller than this image. For an
  owner who has just lost three weeks to a billing suspension, an uncapped
  account with an egress cliff is the wrong risk.
- **Vercel Hobby + Neon** — rejected again for ADR-0002's reasons, chiefly
  the non-commercial ToS against the monetization plans. It remains the
  documented fallback and is the fastest route to live if this shape also
  becomes unobtainable.
- **Keep retrying ARM A1** — rejected. Weeks are already lost and capacity
  may never appear in a home region that cannot be changed.
- **Both micros from the start** (app on one, Postgres on the other) —
  rejected as premature. It doubles provisioning and firewall work for a
  memory problem that may not materialise. Held as the escape hatch above.
