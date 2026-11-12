import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

import type { Category } from '@/payload-types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { Media } from '@/components/Media'
import { SectionHeading } from '@/components/SectionHeading'
import type { CardPostData } from '@/components/Card'
import { timeAgo } from '@/utilities/formatDateTime'
import { getPublicAuthorById } from '@/utilities/getPublicAuthor'
import { getServerSideURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

// A news homepage must not be frozen at build time. Without this it was
// fully static, so it only ever changed when revalidateArticle fired
// revalidatePath('/') — anything else (SiteSettings featured slots, a
// scheduled publish that didn't revalidate) left it stale indefinitely.
// It also breaks CI-built images: the image is built against a throwaway
// empty database, so a build-time-frozen homepage would ship empty.
// ISR regenerates it against the real database shortly after deploy; the
// publish hook still refreshes it immediately.
export const revalidate = 300

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  const [latest, trending] = await Promise.all([
    payload.find({
      collection: 'articles',
      overrideAccess: false,
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 1,
      limit: 13,
    }),
    // Trending: most-viewed articles published in the last 7 days
    // (Increment 4 decision, 2026-07-12). viewCount is bumped per article
    // view — see incrementViewCount.
    payload.find({
      collection: 'articles',
      overrideAccess: false,
      where: {
        and: [
          { status: { equals: 'published' } },
          {
            publishedAt: {
              greater_than_equal: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
          { viewCount: { greater_than: 0 } },
        ],
      },
      sort: '-viewCount',
      select: { title: true, slug: true, viewCount: true },
      limit: 5,
    }),
  ])

  const [heroArticle, ...restArticles] = latest.docs
  const heroCategory =
    heroArticle && typeof heroArticle.category === 'object'
      ? (heroArticle.category as Category)
      : null
  const heroAuthor = heroArticle ? await getPublicAuthorById(heroArticle.author) : null
  const heroCover =
    heroArticle && typeof heroArticle.coverImage === 'object' ? heroArticle.coverImage : null

  return (
    <main className="pb-16">

      {heroArticle && (
        <section className="container pb-8 pt-5">
          <Link className="group block" href={`/article/${heroArticle.slug}`}>
            {heroCover ? (
              // Newsroom hero: headline sits on the image over an ink scrim.
              // The overlay panel is a permanently-dark surface → surface-ink
              // so text tokens resolve to their dark-surface variants (ADR-0001).
              <div className="surface-ink relative overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
                <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/10]">
                  <Media
                    fill
                    imgClassName="object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    priority
                    resource={heroCover}
                  />
                </div>
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-9">
                  {heroCategory && (
                    <span className="mb-3 inline-block rounded-full bg-scarlet-fill px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-paper">
                      {heroCategory.name}
                    </span>
                  )}
                  <h1 className="max-w-4xl font-display text-[26px] font-bold leading-[1.06] text-paper group-hover:underline sm:text-4xl lg:text-5xl">
                    {heroArticle.title}
                  </h1>
                  <p
                    className="mt-3 font-mono text-[11px] uppercase tracking-wide text-paper/70"
                    suppressHydrationWarning
                  >
                    {heroAuthor?.name && <>{heroAuthor.name} &nbsp;·&nbsp; </>}
                    {heroArticle.publishedAt && timeAgo(heroArticle.publishedAt)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-b border-border pb-6">
                {heroCategory && (
                  <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-scarlet">
                    {heroCategory.name}
                  </p>
                )}
                <h1 className="font-display text-[27px] font-bold leading-[1.08] text-foreground group-hover:underline md:text-4xl lg:text-5xl">
                  {heroArticle.title}
                </h1>
                <p
                  className="mt-2.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
                  suppressHydrationWarning
                >
                  {heroAuthor?.name && <>{heroAuthor.name} &nbsp;·&nbsp; </>}
                  {heroArticle.publishedAt && timeAgo(heroArticle.publishedAt)}
                </p>
              </div>
            )}
          </Link>
        </section>
      )}

      {trending.docs.length > 0 && (
        <section className="container pb-8" aria-label="Trending stories">
          <SectionHeading>Trending</SectionHeading>
          <ol className="grid gap-x-8 gap-y-4 md:grid-cols-2 lg:grid-cols-5">
            {trending.docs.map((article, i) => (
              <li key={article.id} className="flex gap-3 border-t-2 border-border pt-3">
                <span
                  aria-hidden="true"
                  className="font-display text-2xl font-bold leading-none text-scarlet"
                >
                  {i + 1}
                </span>
                <Link
                  className="font-serif text-sm leading-snug text-foreground hover:underline"
                  href={`/article/${article.slug}`}
                >
                  {article.title}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {restArticles.length > 0 && (
        <section className="pt-2">
          <div className="container">
            <SectionHeading>Latest</SectionHeading>
          </div>
          <CollectionArchive posts={restArticles as CardPostData[]} />
        </section>
      )}
    </main>
  )
}

export function generateMetadata(): Metadata {
  const title = 'Karacter News — News with character.'
  return {
    title,
    description: 'Fast, SEO-strong news and podcasts.',
    openGraph: mergeOpenGraph({
      title,
      url: '/',
    }),
    alternates: {
      canonical: getServerSideURL(),
    },
  }
}
