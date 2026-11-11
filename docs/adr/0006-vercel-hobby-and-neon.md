# ADR-0006: Vercel Hobby + Neon as production host

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decision maker:** Drix
- **Supersedes:** ADR-0005 (Oracle AMD micro), ADR-0004 (Oracle ARM)
- **Amends:** CLAUDE.md §2 "Host" and "Edge"

## Context

The site has been down since ~2026-10-23 (Hetzner billing suspension).
Oracle ARM was never obtainable (ADR-0004) and the owner abandoned the
Oracle AMD micro route (ADR-0005) before it was provisioned. Getting the
site back up now outweighs the reasons ADR-0002, -0004 and -0005 gave for
rejecting Vercel, which they all listed as the fallback.

## Decision

- **App:** Vercel, **Hobby plan now**, region `fra1`. Production deploys
  only; preview builds are skipped (`vercel.json` `ignoreCommand`) because
  they would run against the production database.
- **Database:** Neon free Postgres (Frankfurt), pooled connection string.
  Restored from `backups/karacter-20261023-021501.sql.gz`.
- **Media:** unchanged, Cloudflare R2. Uploads go **browser → R2** via
  presigned URLs (`clientUploads`), because Vercel functions reject request
  bodies over 4.5 MB. The bucket needs a CORS rule for the site origin.
- **Migrations:** `vercel-build` runs `payload migrate` before `next build`
  on each production deploy.
- **Scheduled publishing:** `autoRun` is disabled on Vercel.
  `.github/workflows/scheduled-publish.yml` calls
  `/api/payload-jobs/run?queue=scheduled-publish` every 5 minutes with the
  `CRON_SECRET` bearer.
- **Backups:** `.github/workflows/backup.yml` runs `infra/scripts/backup.sh`
  nightly in its `BACKUP_DATABASE_URL` mode (Neon → R2), with the same
  prune guard and healthcheck pings.
- **Edge:** the domain stays on Cloudflare DNS, but the records pointing at
  Vercel are **DNS only (grey cloud)**. Vercel provides CDN and TLS itself
  and does not support being proxied behind Cloudflare.

## Consequences

- ₦0/month while on Hobby. **Before any ads, sponsorships or other revenue
  go live, upgrade to Pro ($20/month, about ₦30k, inside the §1 budget).**
  Hobby's terms forbid commercial use.
- Scheduled articles go out up to ~15 minutes late (GitHub schedules are
  best-effort). Pro's per-minute Vercel Cron removes that lag.
- GitHub disables scheduled workflows after 60 days without repository
  activity. The backup healthcheck alert is what catches this. Uptime
  monitoring remains mandatory as well.
- Neon free suspends compute when idle, so the first request after a quiet
  spell is slower (well under a second). Its 0.5 GB storage limit is ample
  for now; watch it as the archive grows.
- Cloudflare's WAF and caching no longer sit in front of the origin.
- The Docker stack (`infra/`, GHCR image) is kept, unused, as the route back
  to a VPS. The in-process job runner still switches on there automatically.

## Alternatives considered

- **Oracle AMD micro (ADR-0005):** ₦0 with no terms-of-use limit, but
  abandoned by the owner after repeated provisioning friction.
- **Vercel Pro from the start:** cleaner, but not needed until revenue
  begins.
- **Hetzner again (~₦8–10k/month):** a known-good stack, rejected on the
  owner's preference for ₦0.
