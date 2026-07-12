import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

import type { Category } from '@/payload-types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { Media } from '@/components/Media'
import type { CardPostData } from '@/components/Card'
import { timeAgo } from '@/utilities/formatDateTime'
import { getPublicAuthorById } from '@/utilities/getPublicAuthor'
import { getServerSideURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  const [latest, trending, categories] = await Promise.all([
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
    payload.find({
      collection: 'categories',
      overrideAccess: false,
      sort: 'name',
      limit: 50,
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
        <section className="container border-b border-border pb-6 pt-5">
          <Link className="group block" href={`/article/${heroArticle.slug}`}>
            {heroCover && (
              <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-xl bg-surface lg:aspect-[21/9]">
                <Media fill imgClassName="object-cover" priority resource={heroCover} />
              </div>
            )}
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
          </Link>
        </section>
      )}

      {trending.docs.length > 0 && (
        <section className="container border-b border-border py-5" aria-label="Trending stories">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-foreground">
            Trending
          </h2>
          <ol className="grid gap-x-8 gap-y-2.5 md:grid-cols-2 lg:grid-cols-5">
            {trending.docs.map((article, i) => (
              <li key={article.id} className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="font-display text-lg font-bold leading-6 text-scarlet"
                >
                  {i + 1}
                </span>
                <Link
                  className="font-serif text-sm leading-6 text-foreground hover:underline"
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
        <section className="pt-6">
          <div className="container">
            <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-foreground">
              Latest
            </h2>
          </div>
          <CollectionArchive posts={restArticles as CardPostData[]} />
        </section>
      )}

      {categories.docs.length > 0 && (
        <section className="container mt-12 border-t border-border pt-8">
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {categories.docs.map((category) => (
              <li key={category.id}>
                <Link
                  className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground hover:text-scarlet"
                  href={`/category/${category.slug}`}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
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
