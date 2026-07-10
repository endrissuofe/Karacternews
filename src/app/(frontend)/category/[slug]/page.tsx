import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import type { CardPostData } from '@/components/Card'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

const PAGE_SIZE = 12

type Args = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function CategoryPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { slug } = await paramsPromise
  const { page: pageParam } = await searchParamsPromise
  const page = Math.max(1, Number(pageParam) || 1)

  const payload = await getPayload({ config: configPromise })

  const category = await payload
    .find({
      collection: 'categories',
      overrideAccess: false,
      where: { slug: { equals: slug } },
      limit: 1,
    })
    .then((r) => r.docs?.[0] || null)

  if (!category) return notFound()

  const articles = await payload.find({
    collection: 'articles',
    overrideAccess: false,
    where: {
      and: [{ category: { equals: category.id } }, { status: { equals: 'published' } }],
    },
    sort: '-publishedAt',
    depth: 1,
    page,
    limit: PAGE_SIZE,
  })

  return (
    <main className="pb-16 pt-8">
      <div className="container mb-8">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground md:text-4xl">
          {category.name}
        </h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {articles.totalDocs} {articles.totalDocs === 1 ? 'story' : 'stories'}
        </p>
      </div>

      {articles.docs.length > 0 ? (
        <CollectionArchive posts={articles.docs as CardPostData[]} />
      ) : (
        <div className="container">No articles in this category yet.</div>
      )}

      {articles.totalPages > 1 && (
        <div className="container mt-10 flex gap-6">
          {page > 1 && (
            <Link
              href={`/category/${slug}?page=${page - 1}`}
              className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground hover:text-scarlet"
            >
              ← Previous
            </Link>
          )}
          {page < articles.totalPages && (
            <Link
              href={`/category/${slug}?page=${page + 1}`}
              className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground hover:text-scarlet"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug } = await paramsPromise
  const payload = await getPayload({ config: configPromise })
  const category = await payload
    .find({
      collection: 'categories',
      overrideAccess: false,
      where: { slug: { equals: slug } },
      limit: 1,
    })
    .then((r) => r.docs?.[0] || null)

  const title = category ? `${category.name} | Karacter News` : 'Karacter News'

  return {
    title,
    openGraph: mergeOpenGraph({
      title,
      url: `/category/${slug}`,
    }),
  }
}
