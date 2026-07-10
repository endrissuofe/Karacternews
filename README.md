# Karacter News Online

Mobile-first multimedia news platform built with **Next.js (App Router) + Payload CMS 3** in a single app, on **PostgreSQL**. See [`CLAUDE.md`](./CLAUDE.md) for the full product scope, locked decisions, and roadmap — this file is just "how do I run it."

**Status:** Increment 1 — Usable Read Site. Articles/Categories/Tags/Users/Media data model, RBAC, the four reader routes, and SEO baseline are in place. Deploy/CI/backups and visual design are not done yet (see `CLAUDE.md` Increment 0/roadmap).

## Stack

- Next.js App Router + Payload CMS 3, TypeScript
- PostgreSQL (Payload's Postgres adapter), run locally via Docker Compose
- pnpm
- Media uploads stored locally on disk for now (Cloudflare R2 comes later, per `CLAUDE.md`)

## Prerequisites

- Node.js v22+
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`, or `npm install -g pnpm`)
- Docker Desktop (for local Postgres)

## Running it locally

1. **Environment variables**

   Copy `.env.example` to `.env` and fill in real values (a random `POSTGRES_PASSWORD`, matching `DATABASE_URL`, and a `PAYLOAD_SECRET`/`CRON_SECRET`/`PREVIEW_SECRET` — `openssl rand -hex 32` works for the secrets). `.env` is gitignored; never commit it.

2. **Start Postgres**

   ```bash
   docker compose up -d
   ```

   This runs a `postgres:16-alpine` container on port 5432 using the credentials from `.env`. Stop it with `docker compose down` (add `-v` only if you want to wipe the data volume).

3. **Install dependencies and start the app**

   ```bash
   pnpm install
   pnpm dev
   ```

   Open `http://localhost:3000` for the site and `http://localhost:3000/admin` for the CMS. Follow the on-screen prompts to create your first admin user.

4. **Seed sample content (optional)**

   From the admin dashboard, click **"Seed your database"** — this populates a few categories, a couple of tags, one demo author, and 3-4 sample articles so the reader pages have real content to show. See `src/endpoints/seed/index.ts`.

## Data model

| Collection | Key fields | Notes |
|---|---|---|
| **Articles** | `title`, `slug`, `excerpt`, `body` (rich text), `coverImage`, `category`, `tags[]`, `author`, `status` (draft/in_review/scheduled/published/archived), `isBreaking`, `viewCount`, `publishedAt`, `seo` group | Public reads only `status: published`. Authors/contributors can CRUD their own; editors/admins CRUD all. |
| **Categories** | `name`, `slug`, `parent` (self-relation, via nested-docs plugin) | Public read; editor/admin write. |
| **Tags** | `name`, `slug` | Public read; editor/admin write. |
| **Users** | `name`, `email`, `role` (admin/editor/author/contributor), `bio`, `avatar`, `socials`, `slug` | Document-level read/update is self-or-admin only. The public `/author/[slug]` page fetches a safe, explicit field subset (name/bio/avatar/socials) server-side — email/role are never exposed publicly. |
| **Media** | `alt` (required), responsive image sizes (WebP) | Stored on local disk (`public/media`) for now. |

**Globals:** `header` / `footer` (site nav), `site-settings` (site name, logo, social links, homepage featured slots).

**Dormant (from the original Payload template, registered but not used by any route yet):** `Pages`, `Forms`/`Form Submissions`, `Redirects`. Left in place rather than deleted; not part of Increment 1's scope.

## Reader routes

| Route | Purpose |
|---|---|
| `/` | Home — breaking news, latest articles, categories |
| `/article/[slug]` | Article page |
| `/category/[slug]` | Paginated category listing |
| `/author/[slug]` | Author profile + their published articles |

## SEO

- `/sitemap.xml` — all published articles + categories (native Next.js `sitemap.ts`)
- `/news-sitemap.xml` — Google News format, articles published in the last 48 hours
- `/robots.txt` — native Next.js `robots.ts` (must live at the true `app/` root, not inside a route group, or Next.js 404s it)
- `NewsArticle` JSON-LD on every article page, plus Open Graph/Twitter card metadata

## Database migrations

Schema changes go through committed, reviewed migrations — **not** dev-mode auto-push (`push: false` in `payload.config.ts`, per `CLAUDE.md` §3 rule 5: never mix push with migrations against the same database).

When you change a collection/global:

```bash
pnpm payload migrate:create   # generates a migration file in src/migrations/ from your config changes
```

1. **Review** the generated file — read the SQL, make sure it does what you expect.
2. **Commit** it to git.
3. **Run** it:

   ```bash
   pnpm payload migrate
   ```

Useful companions: `pnpm payload migrate:status` (what's applied vs. pending) and `pnpm payload migrate:down` (roll back the last batch — prefer a new forward-fix migration over this in shared/production databases).

## Environment variables

See `.env.example` for the full list with descriptions. In short: `POSTGRES_PASSWORD` + `DATABASE_URL` (local Postgres), `PAYLOAD_SECRET` (JWT signing), `NEXT_PUBLIC_SERVER_URL`, `CRON_SECRET`, `PREVIEW_SECRET`.
