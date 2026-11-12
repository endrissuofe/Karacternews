import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import type { CardPostData } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { Pager } from '@/components/Pager'
import { SectionChips } from '@/components/SectionChips'
import { LeadStory } from '@/components/story/LeadStory'
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

  const lead = page === 1 ? articles.docs[0] : undefined
  const rest = lead ? articles.docs.slice(1) : articles.docs

  return (
    <main className="pb-16 pt-8">
      <PageHeader
        kicker="Section"
        meta={`${articles.totalDocs} ${articles.totalDocs === 1 ? 'story' : 'stories'}${
          page > 1 ? ` \u00b7 page ${page}` : ''
        }`}
        title={category.name}
      />

      {/* The first page opens with the section's newest story as its lead. */}
      {lead && (
        <div className="container mb-10">
          <div className="border-b border-border pb-10">
            <LeadStory headingLevel="h2" layout="split" showCategory={false} story={lead} />
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <CollectionArchive posts={rest as CardPostData[]} showCategories={false} />
      )}

      {articles.docs.length === 0 && (
        <div className="container">
          <div className="max-w-2xl">
            <p className="font-serif text-lg leading-relaxed text-foreground">
              No stories in this section yet.
            </p>
            <div className="mt-8">
              <SectionChips heading="Other sections" />
            </div>
          </div>
        </div>
      )}

      <Pager
        hrefFor={(p) => (p > 1 ? `/category/${slug}?page=${p}` : `/category/${slug}`)}
        nextLabel="Older"
        page={page}
        previousLabel="Newer"
        totalPages={articles.totalPages}
      />
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
