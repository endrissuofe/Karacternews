import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import type { CardPostData } from '@/components/Card'
import { getServerSideURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  const [latest, categories, siteSettings] = await Promise.all([
    payload.find({
      collection: 'articles',
      overrideAccess: false,
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 1,
      limit: 13,
    }),
    payload.find({
      collection: 'categories',
      overrideAccess: false,
      sort: 'name',
      limit: 50,
    }),
    payload.findGlobal({ slug: 'site-settings' }),
  ])

  const articles = latest.docs as CardPostData[]
  const [heroArticle, ...restArticles] = articles
  const breaking = articles.filter(
    (a) => (a as unknown as { isBreaking?: boolean }).isBreaking,
  )

  return (
    <main className="pt-16 pb-24">
      <div className="container mb-12">
        <h1 className="text-3xl md:text-5xl font-bold">{siteSettings?.siteName || 'Karacter News'}</h1>
        <p className="text-sm mt-2 opacity-70">News with character.</p>
      </div>

      {breaking.length > 0 && (
        <div className="container mb-10">
          <div className="border-l-4 border-red-600 pl-4">
            <p className="uppercase text-sm font-semibold text-red-600 mb-2">Breaking</p>
            <ul className="space-y-1">
              {breaking.map((a) => (
                <li key={a.id}>
                  <Link className="underline" href={`/article/${a.slug}`}>
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {heroArticle && (
        <div className="container mb-12">
          <Link href={`/article/${heroArticle.slug}`} className="block">
            <h2 className="text-2xl md:text-4xl font-semibold hover:underline">
              {heroArticle.title}
            </h2>
          </Link>
          {heroArticle.excerpt && <p className="mt-3 max-w-3xl">{heroArticle.excerpt}</p>}
        </div>
      )}

      {restArticles.length > 0 && <CollectionArchive posts={restArticles} />}

      {categories.docs.length > 0 && (
        <div className="container mt-16">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <ul className="flex flex-wrap gap-3">
            {categories.docs.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="inline-block border border-border rounded-full px-4 py-1 text-sm hover:bg-card"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
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
