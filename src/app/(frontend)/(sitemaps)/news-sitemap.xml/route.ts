import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { getServerSideURL } from '@/utilities/getURL'

// Google News sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
// Google recommends including only articles published in the last 48 hours.
const getNewsSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const siteUrl = getServerSideURL()
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const results = await payload.find({
      collection: 'articles',
      overrideAccess: false,
      draft: false,
      depth: 0,
      limit: 1000,
      pagination: false,
      where: {
        and: [
          { status: { equals: 'published' } },
          { publishedAt: { greater_than_equal: twoDaysAgo } },
        ],
      },
      select: {
        slug: true,
        title: true,
        publishedAt: true,
      },
    })

    return results.docs
      .filter((a) => Boolean(a.slug) && Boolean(a.publishedAt))
      .map((a) => ({
        loc: `${siteUrl}/article/${a.slug}`,
        title: a.title,
        publishedAt: a.publishedAt as string,
      }))
  },
  ['news-sitemap'],
  { tags: ['news-sitemap'] },
)

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const items = await getNewsSitemap()

  const urls = items
    .map(
      (item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>Karacter News</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${item.publishedAt}</news:publication_date>
      <news:title>${escapeXml(item.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
