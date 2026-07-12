import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import React, { cache } from 'react'

import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import { PlayEpisodeButton } from '@/components/PlayEpisodeButton'
import { formatArticleDate } from '@/utilities/formatDateTime'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import type { PodcastShow } from '@/payload-types'

type Args = {
  params: Promise<{ show: string; ep: string }>
}

const queryEpisode = cache(async (showSlug: string, epSlug: string) => {
  const payload = await getPayload({ config: configPromise })

  const show = await payload
    .find({
      collection: 'podcast-shows',
      overrideAccess: false,
      where: { slug: { equals: showSlug } },
      depth: 1,
      limit: 1,
    })
    .then((r) => r.docs?.[0] || null)

  if (!show) return { show: null, episode: null }

  const episode = await payload
    .find({
      collection: 'podcast-episodes',
      overrideAccess: false,
      where: {
        and: [{ slug: { equals: epSlug } }, { show: { equals: show.id } }],
      },
      depth: 1,
      limit: 1,
    })
    .then((r) => r.docs?.[0] || null)

  return { show: show as PodcastShow, episode }
})

export default async function PodcastEpisodePage({ params: paramsPromise }: Args) {
  const { show: showSlug, ep: epSlug } = await paramsPromise
  const { show, episode } = await queryEpisode(showSlug, epSlug)

  if (!show || !episode) return notFound()

  const audio = typeof episode.audio === 'object' ? episode.audio : null
  const cover = typeof show.coverImage === 'object' ? show.coverImage : null

  return (
    <main className="pb-16 pt-8">
      <article className="container max-w-3xl">
        <Link
          href={`/podcasts/${show.slug}`}
          className="font-mono text-[11px] font-semibold uppercase tracking-wider text-scarlet hover:underline"
        >
          {show.title}
        </Link>

        <h1 className="mb-3 mt-2 font-display text-[26px] font-bold leading-[1.1] text-foreground md:text-4xl">
          {episode.title}
        </h1>

        <p className="mb-5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {episode.publishedAt && formatArticleDate(episode.publishedAt)}
          {episode.duration ? (
            <>
              {' '}
              &nbsp;·&nbsp; {Math.floor(episode.duration / 60)} min
            </>
          ) : null}
        </p>

        <div className="mb-8 flex items-center gap-4">
          {cover && (
            <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-surface">
              <Media fill imgClassName="object-cover" resource={cover} size="80px" />
            </div>
          )}
          {audio?.url ? (
            <PlayEpisodeButton
              track={{
                src: audio.url,
                title: episode.title,
                showTitle: show.title,
                href: `/podcasts/${show.slug}/${episode.slug}`,
              }}
            />
          ) : (
            <p className="font-serif text-sm text-muted-foreground">Audio coming soon.</p>
          )}
        </div>

        {episode.showNotes && (
          <div className="prose prose-sm max-w-none font-serif dark:prose-invert">
            <RichText data={episode.showNotes} enableGutter={false} />
          </div>
        )}
      </article>
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { show: showSlug, ep: epSlug } = await paramsPromise
  const { show, episode } = await queryEpisode(showSlug, epSlug)
  const title =
    show && episode ? `${episode.title} — ${show.title} | Karacter News` : 'Karacter News Podcasts'

  return {
    title,
    openGraph: mergeOpenGraph({
      title,
      url: `/podcasts/${showSlug}/${epSlug}`,
    }),
  }
}
