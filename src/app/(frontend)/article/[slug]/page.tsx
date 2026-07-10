import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import React, { cache } from 'react'

import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import { ShareRow } from '@/components/ShareRow'
import { formatArticleDate } from '@/utilities/formatDateTime'
import { readTimeMinutes } from '@/utilities/readTime'
import { generateArticleMeta } from '@/utilities/generateArticleMeta'
import { articleJsonLd } from '@/utilities/articleJsonLd'
import { getServerSideURL } from '@/utilities/getURL'
import { getPublicAuthorById } from '@/utilities/getPublicAuthor'
import type { Article, Category } from '@/payload-types'

type Args = {
  params: Promise<{ slug: string }>
}

const queryArticleBySlug = cache(async (slug: string) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'articles',
    overrideAccess: false,
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
    },
    depth: 2,
    limit: 1,
  })

  return result.docs?.[0] || null
})

const queryRelated = cache(async (article: Article) => {
  const categoryId =
    typeof article.category === 'object' ? article.category?.id : article.category
  if (!categoryId) return []

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'articles',
    overrideAccess: false,
    where: {
      and: [
        { category: { equals: categoryId } },
        { status: { equals: 'published' } },
        { id: { not_equals: article.id } },
      ],
    },
    sort: '-publishedAt',
    depth: 1,
    limit: 3,
  })

  return result.docs
})

export default async function ArticlePage({ params: paramsPromise }: Args) {
  const { slug } = await paramsPromise
  const article = await queryArticleBySlug(slug)

  if (!article) return notFound()

  const [related, author] = await Promise.all([
    queryRelated(article),
    getPublicAuthorById(article.author),
  ])

  const category = typeof article.category === 'object' ? (article.category as Category) : null
  const shareUrl = `${getServerSideURL()}/article/${article.slug}`

  return (
    <main>
      <article className="pb-16 pt-6">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(article)) }}
      />

      <div className="container max-w-3xl">
        {category && (
          <Link
            href={`/category/${category.slug}`}
            className="font-mono text-[11px] font-semibold uppercase tracking-wider text-scarlet"
          >
            {category.name}
          </Link>
        )}

        {article.isBreaking && (
          <span className="ml-2 inline-block rounded-[3px] bg-scarlet-fill px-1.5 py-0.5 align-middle font-mono text-[10px] font-semibold uppercase tracking-wider text-paper">
            Breaking
          </span>
        )}

        <h1 className="mb-3 mt-2.5 font-display text-[26px] font-bold leading-[1.1] text-foreground md:text-4xl lg:text-[2.75rem]">
          {article.title}
        </h1>

        <div className="mb-4 flex flex-wrap gap-x-2 border-b border-border pb-3.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {author && (
            <>
              <span>
                By{' '}
                <Link className="text-foreground hover:underline" href={`/author/${author.slug}`}>
                  {author.name}
                </Link>
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          {article.publishedAt && (
            <>
              <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
              <span aria-hidden>·</span>
            </>
          )}
          <span>{readTimeMinutes(article.body)} min read</span>
        </div>

        {article.coverImage && typeof article.coverImage === 'object' && (
          <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-xl bg-surface">
            <Media fill imgClassName="object-cover" priority resource={article.coverImage} />
          </div>
        )}

        <div className="font-serif text-foreground">
          {article.body && <RichText data={article.body} enableGutter={false} />}
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="mb-6 mt-8 flex flex-wrap gap-2">
            {article.tags.map((tag) =>
              typeof tag === 'object' ? (
                <span
                  key={tag.id}
                  className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
                >
                  {tag.name}
                </span>
              ) : null,
            )}
          </div>
        )}

        <div className={article.tags && article.tags.length > 0 ? '' : 'mt-8'}>
          <ShareRow title={article.title} url={shareUrl} />
        </div>

        {related.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-foreground">
              Related
            </h2>
            <div className="flex flex-col gap-4">
              {related.map((rel) => {
                const relCategory =
                  typeof rel.category === 'object' ? (rel.category as Category) : null
                const relCover = typeof rel.coverImage === 'object' ? rel.coverImage : null
                return (
                  <Link
                    className="group flex gap-3"
                    href={`/article/${rel.slug}`}
                    key={rel.id}
                  >
                    <div className="relative h-16 w-[84px] flex-none overflow-hidden rounded-lg bg-surface">
                      {relCover && (
                        <Media fill imgClassName="object-cover" resource={relCover} size="84px" />
                      )}
                    </div>
                    <div>
                      {relCategory && (
                        <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-scarlet">
                          {relCategory.name}
                        </p>
                      )}
                      <p className="font-display text-sm font-semibold leading-snug text-foreground group-hover:underline">
                        {rel.title}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
      </article>
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug } = await paramsPromise
  const article = await queryArticleBySlug(slug)
  return generateArticleMeta({ doc: article })
}
