import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import React, { cache } from 'react'

import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import { formatDateTime } from '@/utilities/formatDateTime'
import { generateArticleMeta } from '@/utilities/generateArticleMeta'
import { articleJsonLd } from '@/utilities/articleJsonLd'
import type { Category, User } from '@/payload-types'

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

export default async function ArticlePage({ params: paramsPromise }: Args) {
  const { slug } = await paramsPromise
  const article = await queryArticleBySlug(slug)

  if (!article) return notFound()

  const category = typeof article.category === 'object' ? (article.category as Category) : null
  const author = typeof article.author === 'object' ? (article.author as User) : null

  return (
    <article className="pt-16 pb-24">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(article)) }}
      />

      <div className="container max-w-3xl">
        {category && (
          <Link
            href={`/category/${category.slug}`}
            className="uppercase text-sm text-red-600 font-semibold"
          >
            {category.name}
          </Link>
        )}

        {article.isBreaking && (
          <span className="ml-2 inline-block uppercase text-xs font-bold bg-red-600 text-white rounded px-2 py-0.5 align-middle">
            Breaking
          </span>
        )}

        <h1 className="text-3xl md:text-5xl font-bold mt-3 mb-4">{article.title}</h1>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-70 mb-8">
          {author && (
            <Link href={`/author/${author.slug}`} className="underline">
              {author.name}
            </Link>
          )}
          {article.publishedAt && (
            <time dateTime={article.publishedAt}>{formatDateTime(article.publishedAt)}</time>
          )}
        </div>

        {article.coverImage && typeof article.coverImage === 'object' && (
          <div className="mb-8">
            <Media resource={article.coverImage} />
          </div>
        )}

        {article.body && <RichText data={article.body} enableGutter={false} />}

        {article.tags && article.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {article.tags.map((tag) =>
              typeof tag === 'object' ? (
                <span
                  key={tag.id}
                  className="text-xs uppercase border border-border rounded-full px-3 py-1"
                >
                  {tag.name}
                </span>
              ) : null,
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug } = await paramsPromise
  const article = await queryArticleBySlug(slug)
  return generateArticleMeta({ doc: article })
}
