import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import React, { cache } from 'react'

import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import { SectionHeading } from '@/components/SectionHeading'
import { ShareRow } from '@/components/ShareRow'
import { StoryImage } from '@/components/story/StoryImage'
import { StoryRow } from '@/components/story/StoryRow'
import { formatArticleDate } from '@/utilities/formatDateTime'
import { readTimeMinutes } from '@/utilities/readTime'
import { standfirstFor } from '@/utilities/standfirst'
import { generateArticleMeta } from '@/utilities/generateArticleMeta'
import { articleJsonLd } from '@/utilities/articleJsonLd'
import { getServerSideURL } from '@/utilities/getURL'
import { getPublicAuthorById } from '@/utilities/getPublicAuthor'
import { incrementViewCount } from '@/utilities/incrementViewCount'
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
  const categoryId = typeof article.category === 'object' ? article.category?.id : article.category
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
    limit: 4,
  })

  return result.docs
})

export default async function ArticlePage({ params: paramsPromise }: Args) {
  const { slug } = await paramsPromise
  const article = await queryArticleBySlug(slug)

  if (!article) return notFound()

  // Fire-and-forget view counter (Increment 4) — never blocks rendering.
  const payload = await getPayload({ config: configPromise })
  incrementViewCount(payload, article.id)

  const [related, author] = await Promise.all([
    queryRelated(article),
    getPublicAuthorById(article.author),
  ])

  const category = typeof article.category === 'object' ? (article.category as Category) : null
  const shareUrl = `${getServerSideURL()}/article/${article.slug}`
  const standfirst = standfirstFor(article.excerpt, article.body)
  const cover = typeof article.coverImage === 'object' ? article.coverImage : null
  const avatar = author && typeof author.avatar === 'object' ? author.avatar : null

  return (
    <main>
      <article className="pb-16 pt-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(article)) }}
        />

        {/* The reading column. `max-w-*` cannot sit on `.container` itself:
            the container's per-breakpoint max-widths override it, which left
            articles spanning the full page on desktop. */}
        <div className="container">
          <div className="mx-auto max-w-3xl">
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

            <h1 className="mt-2.5 font-display text-[30px] font-bold leading-[1.08] text-foreground md:text-4xl lg:text-[2.75rem]">
              {article.title}
            </h1>

            {standfirst && (
              <p className="mt-3 font-serif text-lg leading-relaxed text-muted-foreground md:text-xl">
                {standfirst}
              </p>
            )}

            <div className="mb-5 mt-4 flex flex-wrap gap-x-2 border-b border-border pb-3.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {author && (
                <>
                  <span>
                    By{' '}
                    <Link
                      className="text-foreground hover:underline"
                      href={`/author/${author.slug}`}
                    >
                      {author.name}
                    </Link>
                  </span>
                  <span aria-hidden>·</span>
                </>
              )}
              {article.publishedAt && (
                <>
                  <time dateTime={article.publishedAt}>
                    {formatArticleDate(article.publishedAt)}
                  </time>
                  <span aria-hidden>·</span>
                </>
              )}
              <span>{readTimeMinutes(article.body)} min read</span>
            </div>

            {cover && (
              <StoryImage
                className="mb-6 aspect-[16/10]"
                image={cover}
                priority
                size="(max-width: 768px) 100vw, 768px"
              />
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

            {author && (
              <aside
                aria-label="About the author"
                className="flex items-start gap-4 border-b border-border py-6"
              >
                <div className="relative h-14 w-14 flex-none overflow-hidden rounded-full bg-muted">
                  {avatar ? (
                    <Media fill imgClassName="object-cover" resource={avatar} size="56px" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-muted-foreground"
                    >
                      {author.name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    Written by
                  </p>
                  <Link
                    className="font-display text-lg font-semibold text-foreground hover:underline"
                    href={`/author/${author.slug}`}
                  >
                    {author.name}
                  </Link>
                  {author.bio && (
                    <p className="mt-1 line-clamp-3 font-serif text-sm leading-relaxed text-muted-foreground">
                      {author.bio}
                    </p>
                  )}
                </div>
              </aside>
            )}

            {related.length > 0 && category && (
              <section aria-label={`More from ${category.name}`} className="mt-10">
                <SectionHeading href={`/category/${category.slug}`}>
                  More from {category.name}
                </SectionHeading>
                <ul className="divide-y divide-border">
                  {related.map((story) => (
                    <li key={story.id} className="py-4 first:pt-0">
                      <StoryRow showCategory={false} story={story} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
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
