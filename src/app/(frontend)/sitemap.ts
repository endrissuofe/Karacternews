import type { MetadataRoute } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'

// Native Next.js sitemap route — served at /sitemap.xml. Works in `pnpm dev`
// too (no postbuild step required), unlike the old next-sitemap setup.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config: configPromise })
  const siteUrl = getServerSideURL()

  const [articles, categories] = await Promise.all([
    payload.find({
      collection: 'articles',
      overrideAccess: false,
      where: { status: { equals: 'published' } },
      depth: 0,
      limit: 1000,
      pagination: false,
      select: { slug: true, updatedAt: true },
    }),
    payload.find({
      collection: 'categories',
      overrideAccess: false,
      depth: 0,
      limit: 1000,
      pagination: false,
      select: { slug: true, updatedAt: true },
    }),
  ])

  return [
    {
      url: siteUrl,
      changeFrequency: 'hourly',
      priority: 1,
    },
    ...articles.docs.map((article) => ({
      url: `${siteUrl}/article/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'never' as const,
      priority: 0.8,
    })),
    ...categories.docs.map((category) => ({
      url: `${siteUrl}/category/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.5,
    })),
  ]
}
