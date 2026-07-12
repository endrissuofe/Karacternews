import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { getServerSideURL } from '@/utilities/getURL'

// Site RSS feed (CLAUDE.md §7 /feed.xml — adopted into Increment 4).
// RSS 2.0, latest 30 published articles, cached with a tag so it can be
// revalidated alongside the sitemaps if ever needed.
const getFeedItems = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const siteUrl = getServerSideURL()

    const results = await payload.find({
      collection: 'articles',
      overrideAccess: false,
      draft: false,
      depth: 0,
      limit: 30,
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      select: {
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
      },
    })

    return results.docs
      .filter((a) => Boolean(a.slug) && Boolean(a.publishedAt))
      .map((a) => ({
        loc: `${siteUrl}/article/${a.slug}`,
        title: a.title,
        excerpt: a.excerpt || '',
        publishedAt: a.publishedAt as string,
      }))
  },
  ['rss-feed'],
  { tags: ['rss-feed'], revalidate: 600 },
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
  const siteUrl = getServerSideURL()
  const items = await getFeedItems()

  const entries = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.loc)}</link>
      <guid isPermaLink="true">${escapeXml(item.loc)}</guid>
      ${item.excerpt ? `<description>${escapeXml(item.excerpt)}</description>` : ''}
      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
    </item>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Karacter News</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>News with character. Fast, SEO-strong news for Nigerian readers.</description>
    <language>en</language>
    <atom:link href="${escapeXml(`${siteUrl}/feed.xml`)}" rel="self" type="application/rss+xml"/>
${entries}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml' },
  })
}
