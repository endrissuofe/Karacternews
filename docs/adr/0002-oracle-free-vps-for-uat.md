# ADR-0002: Oracle Cloud Always Free VPS for pre-launch UAT hosting

- **Status:** Accepted
- **Date:** 2026-07-12
- **Decision maker:** Drix
- **Amends:** CLAUDE.md §2 "Host" (locked: one Hetzner ARM CAX VPS)

## Context

The client needs to test all features built through Increment 5 on a real
URL, but the site is pre-revenue and the project constraint is to avoid
standing monthly costs until launch (CLAUDE.md §3.2 cost discipline).
Hetzner CAX11 costs ~€4/month; Oracle Cloud's Always Free tier provides an
ARM VM (up to 4 OCPU / 24 GB) at ₦0/month indefinitely.

## Decision

Host the pre-launch/UAT environment on an **Oracle Cloud Always Free ARM
VM**, running the exact production architecture (Docker Compose: app +
Postgres + Caddy, Cloudflare in front, R2 for media). **Hetzner remains
the production host of record** — we migrate at launch (containers +
`pg_dump` restore; the stack is host-agnostic by design, §3.3).

## Consequences

- ₦0/month until launch; client gets a persistent UAT URL.
- Oracle may reclaim idle Always Free instances — acceptable for UAT,
  not for production. Nightly `pg_dump` to R2 (already planned) protects
  against loss; treat the box as disposable.
- All infra code (Dockerfile, compose, Caddyfile, scripts) is written
  host-neutral so the Hetzner migration is a re-run, not a rewrite.
- Signup requires a payment card (not charged on Always Free resources).

## Alternatives considered

- **Tunnel-only demos from dev PC (₦0)** — rejected: no self-serve UAT.
- **Hetzner now (~₦7k/mo)** — rejected for now purely on the
  no-standing-costs constraint; becomes the plan again at launch.
- **Vercel Hobby (free)** — rejected: non-commercial ToS, serverless
  breaks the in-process jobs runner, and it diverges from the
  self-host/portability principle (§3.3).
