# ADR-0003: Render free tier for pre-launch UAT hosting

- **Status:** Superseded 2026-07-15 — client approved the Hetzner VPS
  (the original §2 plan) with domain **karaktermedia.com**; Render was
  never adopted and `render.yaml` was removed. The media→R2 move made
  here stands (it was the locked §2 direction anyway).
- **Date:** 2026-07-13
- **Decision maker:** Drix

## Context

ADR-0002 chose Oracle Cloud Always Free for ₦0 UAT hosting, but account
provisioning proved impractical. A 2026 survey of free tiers: Fly.io ended
its free tier (Oct 2024), Railway is a one-time $5 trial, Koyeb offers one
scale-to-zero service. Render's free tier remains the most complete: a free
web service (512 MB, spins down after 15 idle minutes) plus free Postgres.

## Decision

Host UAT on **Render's free tier** (web service + free Postgres), with:

1. **All media in R2** (images join podcast audio) — Render's filesystem is
   ephemeral. This also completes the §2 media-storage decision early.
2. **External free cron** (e.g. cron-job.org) pinging
   `/api/payload-jobs/run` with the `CRON_SECRET` Bearer token every 10
   minutes — this runs scheduled publishing even though the in-process
   autoRun can't be trusted on a spin-down host, and doubles as a
   keep-alive that minimizes cold starts.
3. `render.yaml` blueprint kept in the repo; deploys on push to main.

Hetzner + Docker Compose (infra/ directory, already written) remains the
production plan at launch, unchanged.

## Consequences

- ₦0/month; persistent UAT URL (<app>.onrender.com) the client can use.
- Accepted degradations, UAT-only: possible 30–60 s cold start if the
  pinger misses; free Postgres has 256 MB RAM and expires if the service
  is deleted; single small instance.
- The infra/ Docker stack is unused until launch but stays maintained (CI
  builds the same code paths).

## Alternatives considered

- **Tunnel demos only** — rejected: client wants self-serve testing.
- **Koyeb** — comparable caveats, thinner track record.
- **Hetzner now** — deferred on the no-standing-costs constraint; becomes
  the plan at launch per ADR-0002.
