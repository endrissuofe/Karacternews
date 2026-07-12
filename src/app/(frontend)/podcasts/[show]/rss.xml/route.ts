import { getPayload } from 'payload'
import config from '@payload-config'

import { getServerSideURL } from '@/utilities/getURL'
import type { Media, PodcastAudio } from '@/payload-types'

// Podcast RSS per show (CLAUDE.md §7, Increment 5). RSS 2.0 with the
// itunes namespace — the minimum tag set Apple Podcasts and Spotify
// require for submission: channel artwork, explicit flag, per-item
// enclosure (absolute URL, byte length, mime type) and duration.

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(_req: Request, { params }: { params: Promise<{ show: string }> }) {
  const { show: showSlug } = await params
  const payload = await getPayload({ config })
  const siteUrl = getServerSideURL()

  const show = await payload
    .find({
      collection: 'podcast-shows',
      overrideAccess: false,
      where: { slug: { equals: showSlug } },
      depth: 1,
      limit: 1,
    })
    .then((r) => r.docs?.[0] || null)

  if (!show) {
    return new Response('Not found', { status: 404 })
  }

  const episodes = await payload.find({
    collection: 'podcast-episodes',
    overrideAccess: false,
    where: { show: { equals: show.id } },
    sort: '-publishedAt',
    depth: 1,
    limit: 300,
  })

  const cover = typeof show.coverImage === 'object' ? (show.coverImage as Media) : null
  const coverUrl = cover?.url ? `${siteUrl}${cover.url}` : ''
  const showUrl = `${siteUrl}/podcasts/${show.slug}`

  const items = episodes.docs
    .map((ep) => {
      const audio = typeof ep.audio === 'object' ? (ep.audio as PodcastAudio) : null
      if (!audio?.url || !ep.publishedAt) return ''

      const epUrl = `${siteUrl}/podcasts/${show.slug}/${ep.slug}`
      const audioUrl = `${siteUrl}${audio.url}`
      const duration = ep.duration ?? audio.duration ?? 0

      return `    <item>
      <title>${escapeXml(ep.title)}</title>
      <link>${escapeXml(epUrl)}</link>
      <guid isPermaLink="true">${escapeXml(epUrl)}</guid>
      <pubDate>${new Date(ep.publishedAt).toUTCString()}</pubDate>
      <enclosure url="${escapeXml(audioUrl)}" length="${audio.filesize ?? 0}" type="${escapeXml(audio.mimeType || 'audio/mpeg')}"/>
      <itunes:duration>${duration}</itunes:duration>
    </item>`
    })
    .filter(Boolean)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(show.title)}</title>
    <link>${escapeXml(showUrl)}</link>
    <description>${escapeXml(show.description)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(`${showUrl}/rss.xml`)}" rel="self" type="application/rss+xml"/>
    <itunes:author>Karacter News</itunes:author>
    <itunes:summary>${escapeXml(show.description)}</itunes:summary>
    <itunes:explicit>false</itunes:explicit>
    ${coverUrl ? `<itunes:image href="${escapeXml(coverUrl)}"/>` : ''}
    <itunes:category text="News"/>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml',
      'Cache-Control': 'public, max-age=600',
    },
  })
}
