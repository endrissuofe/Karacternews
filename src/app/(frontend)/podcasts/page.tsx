import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'
import { SectionHeading } from '@/components/SectionHeading'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { formatArticleDate } from '@/utilities/formatDateTime'
import { getYouTubeId } from '@/utilities/youtube'
import type { PodcastShow } from '@/payload-types'

// Rendered per request (like category pages): podcast collections have no
// revalidation hooks, so a static build would freeze this index.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Podcasts | Karacter News',
  description: 'Karacter News podcasts — conversations and stories with character.',
  openGraph: mergeOpenGraph({
    title: 'Podcasts | Karacter News',
    url: '/podcasts',
  }),
}

export default async function PodcastsPage() {
  const payload = await getPayload({ config: configPromise })

  const [shows, episodes, siteSettings] = await Promise.all([
    payload.find({
      collection: 'podcast-shows',
      overrideAccess: false,
      sort: 'title',
      depth: 1,
      limit: 50,
    }),
    payload.find({
      collection: 'podcast-episodes',
      overrideAccess: false,
      sort: '-publishedAt',
      depth: 1,
      limit: 10,
    }),
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
  ])

  const liveVideoId = getYouTubeId(siteSettings?.youtube?.liveStreamUrl)
  const channelUrl = siteSettings?.youtube?.channelUrl || null

  return (
    <main className="pb-16 pt-8">
      <div className="container mb-8">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground md:text-4xl">
          Podcasts
        </h1>
        <p className="mt-2 font-serif text-sm text-muted-foreground">
          Conversations and stories with character.
        </p>
        {channelUrl && (
          <p className="mt-2">
            <a
              className="font-mono text-[11px] font-semibold uppercase tracking-wider text-scarlet hover:underline"
              href={channelUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              YouTube channel ↗
            </a>
          </p>
        )}
      </div>

      {liveVideoId && (
        <section className="container mb-10" aria-label="Live stream">
          <p className="mb-2 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-scarlet">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-scarlet-brand animate-onair motion-reduce:animate-none"
            />
            Live now
          </p>
          <YouTubeEmbed videoId={liveVideoId} title="Live stream" />
        </section>
      )}

      {shows.docs.length === 0 && (
        <div className="container font-serif text-muted-foreground">
          No shows yet — the first one is coming soon.
        </div>
      )}

      {shows.docs.length > 0 && (
        <section className="container mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shows.docs.map((show) => {
            const cover = typeof show.coverImage === 'object' ? show.coverImage : null
            return (
              <article key={show.id} className="group">
                <Link href={`/podcasts/${show.slug}`} className="block">
                  {cover && (
                    <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-surface">
                      <Media
                        fill
                        imgClassName="object-cover"
                        resource={cover}
                        size="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <h2 className="font-display text-lg font-bold leading-tight text-foreground group-hover:underline">
                    {show.title}
                  </h2>
                </Link>
                <p className="mt-1.5 line-clamp-2 font-serif text-sm text-muted-foreground">
                  {show.description}
                </p>
              </article>
            )
          })}
        </section>
      )}

      {episodes.docs.length > 0 && (
        <section className="container border-t border-border pt-8">
          <SectionHeading>Latest episodes</SectionHeading>
          <ul className="divide-y divide-border">
            {episodes.docs.map((ep) => {
              const show = typeof ep.show === 'object' ? (ep.show as PodcastShow) : null
              if (!show) return null
              return (
                <li key={ep.id} className="py-3.5">
                  <Link
                    className="font-serif text-base text-foreground hover:underline"
                    href={`/podcasts/${show.slug}/${ep.slug}`}
                  >
                    {ep.title}
                  </Link>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    {show.title}
                    {ep.publishedAt && <> &nbsp;·&nbsp; {formatArticleDate(ep.publishedAt)}</>}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </main>
  )
}
