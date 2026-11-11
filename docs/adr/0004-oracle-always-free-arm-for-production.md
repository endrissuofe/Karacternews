# ADR-0004: Oracle Cloud Always Free ARM as production host

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decision maker:** Drix
- **Amends:** CLAUDE.md §2 "Host" (locked: one Hetzner ARM CAX VPS)
- **Relates to:** ADR-0002 (chose Oracle for UAT; never provisioned),
  ADR-0003 (Render detour, superseded unadopted)

## Context

The Hetzner VPS was **suspended for non-payment on or about 2026-10-23**.
The site returned Cloudflare **522** (origin TCP timeout) on every path for
roughly 19 days before anyone noticed — it was discovered by opening the
site, not by an alert. The invoice has since been settled; the account was
still suspended at the time of writing.

Nothing was lost. All recovery material lives off the box:

- Code — GitHub
- Database — `backups/karacter-20261023-021501.sql.gz` in R2, written at
  02:15:01 UTC by the nightly cron, i.e. the last moment the box was alive
- Media — the `media/` prefix in R2, confirmed present against the live
  bucket

So the backups did their job. What failed was **everything around them**:
no alert when the site died, no alert when the nightly backup stopped, and
no monthly restore test despite CLAUDE.md §3.5 mandating one.

The owner's requirement now is to remove the standing monthly cost. Note
that cost was never the problem — ~₦8–10k/month sits well inside the
§3.2 budget of ≤₦50k. The failure was billing attention, not affordability.
The decision to move is a deliberate choice to trade some reliability for
₦0, taken with that understood.

## Decision

Host production on an **Oracle Cloud Always Free ARM (Ampere A1) VM**,
running the existing Docker Compose stack **unchanged**.

This revives ADR-0002's choice and promotes it from UAT to production.
ADR-0002 judged Oracle *"acceptable for UAT, not for production"* on
idle-reclamation risk. That judgement is **deliberately reversed** here, on
the basis that a host-neutral stack plus working backups plus the alerting
added alongside this ADR make a reclaimed box a ~30-minute rebuild rather
than a loss — which is ADR-0002's own "treat the box as disposable"
framing, now actually true.

## Consequences

- ₦0/month, indefinitely.
- **Zero code changes.** The in-process `autoRun` jobs runner
  (`src/payload.config.ts:114`) keeps working because the box is always on;
  Caddy, compose, `deploy.sh` and `backup.sh` all run as-is; §3.3
  self-host/portability is preserved.
- 4 OCPU / 24 GB available vs the CAX11's 2 vCPU / 4 GB — the on-box
  `next build` that needed 3 GB of swap gets real headroom.
- **Accepted risks:** ARM capacity is frequently unavailable at
  provisioning time; Oracle may reclaim idle Always Free compute; signup
  requires card verification that often rejects Nigerian cards.
- **Required mitigations** (shipped with this ADR, not optional):
  - `backup.sh` pings healthchecks.io on success and `/fail` on failure, so
    a backup that stops running alerts instead of going quiet
  - uptime monitoring on the homepage, which also supplies the baseline
    activity that reduces idle-reclamation risk
  - a second copy of the newest dump kept outside `backups/`
- If ARM capacity cannot be obtained, fall back per "Alternatives" below
  rather than waiting indefinitely.

## Alternatives considered

- **Hetzner again (~₦8–10k/mo)** — rejected on the owner's cost
  requirement. It is the status quo that just failed, though it failed on
  billing attention rather than on the hosting.
- **Vercel Hobby + Neon free** — rejected again, for the same three reasons
  ADR-0002 gave: the Hobby plan's non-commercial ToS collides directly with
  the monetization plans discussed in Nov 2026; serverless breaks the
  in-process jobs runner (an external cron pinging
  `/api/payload-jobs/run` would be required — the `Bearer CRON_SECRET`
  access check at `src/payload.config.ts:101-109` already supports this);
  and it diverges from §3.3. **Documented as the fallback** if Oracle
  provisioning fails, accepted knowingly.
- **Oracle AMD E2.1.Micro (2× 1 OCPU / 1 GB)** — easier to provision than
  ARM but too small for an on-box `next build` alongside Postgres. Viable
  only with images built in CI and Postgres moved to Neon free; a
  within-Oracle fallback, not a first choice.
