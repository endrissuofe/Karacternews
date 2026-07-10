# CLAUDE.md — Karacter News Online

> **This file is the source of truth for building Karacter News Online.**
> Any agent (Fable via Cowork or Claude Code) or human contributor must read this file **before writing any code** and must **not build outside what it defines**. If a task seems to require going beyond this file, **stop and ask** instead of guessing or expanding scope.

> **Local reference:** the Payload CMS scaffold also bundled implementation reference docs at `.claude/skills/payload/` (start with `SKILL.md`, details in `reference/`). Use it for Payload API/config specifics — it does not override this file; this file remains the source of truth for scope and decisions.

---

## 0. How to use this file (agent instructions)

- Read this file fully before starting any task.
- Build **one increment at a time** (see §9 Roadmap). Do not start the next increment until the current one meets its Definition of Done (§8).
- **Never add scope.** Deferred features (§5) are OUT until explicitly moved in.
- **Never add a new paid service, dependency, or piece of infrastructure without asking first.** Cost is the primary constraint.
- **Keep the site usable at all times.** New work is additive or sits behind a feature flag. A reader must never hit a dead end because something is half-built.
- When something is ambiguous or conflicts with this file, ask one concise question rather than guessing.
- Prefer the smallest change that satisfies the task. Do not refactor unrelated code.

---

## 1. What we're building (one paragraph)

Karacter News Online is a mobile-first multimedia news platform for Nigerian readers, engineered to scale globally without a rewrite. It publishes fast, SEO-strong articles, plus podcasts, with live radio as a later feature. It runs cheaply (target ≤ ₦50,000/month, launching well under ₦10,000) on a single VPS, fully containerised, self-hosted, and free-and-open-source wherever possible.

---

## 2. Locked decisions (change only via an ADR in `/docs/adr`)

| Area | Decision |
|------|----------|
| Framework | **Next.js (App Router) + Payload CMS 3 in the same app.** TypeScript everywhere. |
| CMS / API / Auth | **Payload** provides the admin UI at `/admin`, authentication, access control (RBAC), and data APIs (Local API in Server Components, plus REST/GraphQL). **Do NOT build a custom CMS or a separate backend service.** |
| Database | **PostgreSQL** (Payload Postgres adapter). |
| Media storage | **Cloudflare R2** via Payload's S3 storage adapter. Code only against the **S3 API** (portable to MinIO/B2). |
| Edge | **Cloudflare** (DNS, CDN, SSL, WAF, free tier). Origin TLS via **Caddy + Let's Encrypt**. |
| Host | **One Hetzner ARM (CAX) VPS**, **Docker Compose**. Kubernetes is a later phase, not now. |
| Email | **Brevo** free tier (transactional + early newsletter). |
| Search | **PostgreSQL full-text search** first. Meilisearch only when explicitly triggered. |
| Package manager | **pnpm**. |
| Brand & design | **Voice** direction locked. Tagline "News with character." Tokens + logos in §11. Visual design via Claude Design → Claude Code handoff (§12). |

If a change to any of the above seems necessary, write an ADR and get sign-off first.

---

## 3. Non-negotiable rules (guardrails)

1. **Always usable.** Never ship a change that leaves a reader at a dead end.
2. **Cost discipline.** No new paid service, dependency, or infra without approval. Prefer free/OSS.
3. **Self-host + portable.** S3 API only for storage. Avoid lock-in-heavy SDKs.
4. **Security.** RBAC enforced server-side via Payload access control. Secrets in env vars, never committed. Least-privilege DB user. Validate all input. Sanitise rich-text HTML server-side.
5. **Data safety.** Migrations are code and reviewed. **Set the migration strategy at the start and never mix Payload dev-mode auto-push with prod migrations** (this causes schema drift). Nightly `pg_dump` to R2 + a monthly restore test.
6. **SEO is a feature, not an afterthought.** Article content is server-rendered (SSR/SSG), never client-only. Every article ships metadata, `NewsArticle` JSON-LD, Open Graph/Twitter cards. Sitemap + news sitemap + robots.txt exist.
7. **Performance budget.** Mobile LCP < 2.5s, CLS < 0.1, INP < 200ms. Ship minimal JavaScript. Images served from R2/Cloudflare as WebP/AVIF with width/height set.
8. **Accessibility.** WCAG 2.1 AA on reading surfaces. Visible keyboard focus. Respect reduced-motion.
9. **No secrets, tokens, or PII in logs.**
10. **Git hygiene.** Conventional Commits. Protected `main`. PR + green CI before merge.

---

## 4. Scope — CURRENT INCREMENT

> **Active increment:** `Increment 0 — Walking Skeleton`
> Update this line as we progress. Only build what the active increment lists in §9. Everything else is OUT.

---

## 5. Explicitly OUT of scope (until moved in via a decision)

- **Live radio** (has its own Feature Plan; do not build until greenlit)
- Comments
- Reader accounts / personalisation
- Full newsletter *sending* at scale (capture only, for now)
- AI features (summaries, semantic search, recommendations, auto-tagging)
- Native mobile app
- Video / VOD
- Internationalisation / multi-language
- Paywall / subscriptions

If a task touches any of these, stop and ask.

---

## 6. Data model (build Payload collections exactly like this)

Access rules are expressed per role: **admin, editor, author, contributor**. Public = unauthenticated reader.

**`Users`** (Payload auth collection)
- Fields: `email`, `password` (auth), `name`, `bio` (textarea), `avatar` (rel → Media), `role` (select: admin/editor/author/contributor), `socials` (group: x, instagram, linkedin).
- Access: admins manage all users; any user reads/updates **own** profile; public cannot read admin-only fields.

**`Articles`**
- Fields: `title`, `slug` (unique, indexed), `excerpt`, `body` (rich text / Lexical), `coverImage` (rel → Media), `category` (rel → Categories), `tags` (rel → Tags, many), `author` (rel → Users), `status` (select: draft/in_review/scheduled/published/archived), `isBreaking` (checkbox), `viewCount` (number, system-managed), `publishedAt` (date), `seo` (group: title, description, ogImage).
- Access: authors/contributors CRUD **own** drafts and submit for review; editors/admins CRUD all; **public reads only `status = published`**.
- Hooks: on publish → sync to search index (Increment 3), regenerate feeds/sitemaps as needed.

**`Categories`**: `name`, `slug` (unique), `parent` (self-rel, optional).

**`Tags`**: `name`, `slug` (unique).

**`Media`** (upload collection → R2): `alt` (required), auto-generated responsive sizes, WebP/AVIF.

**`PodcastShows`** *(Increment 5)*: `title`, `slug`, `description`, `coverImage`.

**`PodcastEpisodes`** *(Increment 5)*: `show` (rel), `title`, `showNotes`, `audio` (upload → R2), `duration` (system), `publishedAt`.

**Globals**
- `SiteSettings`: site name, logo (Media), primary nav, social links, homepage featured slots (breaking, hero, featured categories).

---

## 7. Routes & folder structure

**Reader routes (Next.js App Router):**
```
/                         home
/article/[slug]           article
/category/[slug]          category listing (paginated)
/author/[slug]            author profile + their articles
/search                   search results
/podcasts                 podcast index            (Increment 5)
/podcasts/[show]/[ep]     episode page             (Increment 5)
/admin                    Payload admin (auto)
/sitemap.xml /news-sitemap.xml /robots.txt         SEO
/feed.xml                 site RSS
/podcasts/[show]/rss.xml  podcast RSS              (Increment 5)
```

**Folder layout (Payload-in-Next.js):**
```
app/
  (frontend)/            reader pages (Server Components, Payload Local API)
    page.tsx
    article/[slug]/page.tsx
    category/[slug]/page.tsx
    author/[slug]/page.tsx
    search/page.tsx
  (payload)/
    admin/[[...segments]]/page.tsx   Payload admin (auto-generated)
    api/                              Payload REST/GraphQL (auto)
collections/             Articles.ts, Categories.ts, Tags.ts, Users.ts, Media.ts, ...
globals/                 SiteSettings.ts
access/                  reusable access-control fns (isAdmin, isEditor, isOwner, ...)
lib/                     seo.ts (JSON-LD/metadata), payload helpers, feeds, sitemaps
components/              shared UI (built to the design from Claude Design)
payload.config.ts        wires DB, collections, globals, plugins, storage adapter
payload-types.ts         auto-generated types (do not edit by hand)
infra/                   Dockerfile, docker-compose.yml, Caddyfile, scripts/
docs/adr/                Architecture Decision Records
.env.example             documents every env var
```

---

## 8. Definition of Done (applies to every increment)

- [ ] Meets the active increment's scope exactly, nothing extra.
- [ ] Deployed (or cleanly deployable) to production; the live site is still usable.
- [ ] SEO intact where relevant (metadata, JSON-LD, sitemap).
- [ ] Lighthouse mobile ≥ 90 Performance and ≥ 95 SEO on affected pages.
- [ ] Backups + a tested restore still work (once infra exists).
- [ ] `.env.example` and README updated; an ADR written if a locked decision changed.
- [ ] Commits follow Conventional Commits; CI green.

---

## 9. Roadmap — build in this order

| # | Increment | Scope (build only this) | Result |
|---|-----------|--------------------------|--------|
| 0 | **Walking Skeleton** | Scaffold Next.js + Payload + local Postgres (Docker); one real SSR page; Git + CI to prod; nightly backup wired. | Pipeline proven, site live but quiet |
| 1 | **Usable Read Site** | Article/Category/Author/Media collections + reader pages (home, article, category, author) + SEO baseline. Minimal authoring is fine. | **PUBLIC SOFT-LAUNCH — site is usable** |
| 2 | **Self-Serve CMS** | Full editorial workflow (draft→review→scheduled→published) + RBAC access rules. (Mostly free via Payload.) | Editors publish without a developer |
| 3 | **Search** | Postgres full-text search + results UI + filters. (Meilisearch only if triggered.) | Readers can find stories |
| 4 | **Breaking / Trending / Newsletter capture** | Breaking flag surfacing; simple view-count Trending; email capture via Brevo. | Feels like a live newsroom |
| 5 | **Podcasts** | Show/episode collections + audio→R2 + valid RSS + player. | Multimedia, still ₦0 |
| 6 | **Observability upgrade** | Prometheus/Grafana/Loki + alerts (when the box has room). | See problems before readers do |
| — | **Feature: Live Radio** | Only when earned (editorial commitment + audience + budget for its own box). See Feature Plan. | Deferred |

---

## 10. When to STOP and ask

- A task needs a new paid service, dependency, or piece of infrastructure.
- A task needs a feature that is currently OUT of scope (§5).
- A schema change that is not a clean, reviewed migration.
- Anything that would leave the site unusable, even briefly, for readers.
- Anything ambiguous or in conflict with this file.

---

## 11. Brand & design system (locked)

**Name meaning:** "Karacter" (with a K) = *character* — personality and boldness (news with a voice) and integrity (a publication of character). Direction: **Voice** (audio-forward identity). **Tagline: "News with character."**

**Logo assets** (in `/public` or `/brand`):
- `karacter-wordmark.svg` — primary horizontal wordmark (ink, for light backgrounds).
- `karacter-monogram.svg` — app icon / favicon / avatar (ink tile, white K, amber on-air dot).
- Reversed (paper-on-ink) wordmark for dark surfaces — generate from the primary as needed.

**Signature element — the on-air motif:** the amber dot from the logo also lives in the **persistent audio bar**. It **pulses amber** when live radio is on-air (later) and shows **scarlet** when a podcast is playing. Logo and product breathe together. Build the audio bar to survive navigation.

**Color tokens** (define once as CSS variables + Tailwind theme; use by role, never hardcode hex in components):

| Token | Hex | Role |
|-------|-----|------|
| `--ink` | `#16130E` | Text, trust, dark surfaces |
| `--paper` | `#F6F7F5` | Page background |
| `--surface` | `#ECEEEA` | Cards, dividers, quiet fills |
| `--scarlet` | `#E23140` | Breaking news, links, podcast-playing accent (use sparingly) |
| `--amber` | `#F2A93B` | On-air / audio / now-playing |

**Type roles:** Display = a condensed grotesque used with restraint (headlines). Body = a readable serif for long-form. Utility = a mono/tight sans for bylines, timestamps, data. Set a clear scale with real weight contrast. Self-host fonts, `font-display: swap`, subset.

**Rules:** headline hierarchy is unmistakable; Scarlet is the one loud color, used sparingly; Amber is reserved for audio/on-air; WCAG AA contrast on all text.

---

## 12. Design → code workflow (Claude Design)

Visual design is done in **Claude Design**, then handed to the coding agent. Do not hand-rebuild designs from screenshots.

1. Once a repo exists (Increment 0–1) with the Tailwind theme + brand tokens above, **import this repo's design system into Claude Design** (or upload the brand sheet + logo assets so it designs in-brand from the first prompt).
2. Design/iterate screens on the Claude Design canvas (chat for structure, canvas drag/comments for small tweaks — small tweaks on-canvas avoid burning a full model turn).
3. **Hand off to Claude Code** via the handoff bundle (or `/design` round-trip). Claude Code implements into the real Next.js + Payload components using the tokens above.
4. **Review for token compliance** before merge — Claude Design reads hex values but does not enforce semantic token *roles*, so confirm the output uses `--scarlet`/`--amber` by role, not by accident. This review is part of Definition of Done.

---

*Keep this file updated as the single source of truth. If reality and this file disagree, fix one of them on purpose, not by accident.*
