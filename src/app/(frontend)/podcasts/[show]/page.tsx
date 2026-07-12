import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import React, { cache } from 'react'

import { Media } from '@/components/Media'
import { formatArticleDate } from '@/utilities/formatDateTime'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

// Not listed in §7's route table, but the /podcasts index links show cards
// somewhere and episodes need a parent listing — omitting this page would
// leave readers at a dead end (§3.1 "always usable").

type Args = {
  params: Promise<{ show: string }>
}

const queryShowBySlug = cache(async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'podcast-shows',
    overrideAccess: false,
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  return result.docs?.[0] || null
})

export default async function PodcastShowPage({ params: paramsPromise }: Args) {
  const { show: showSlug } = await paramsPromise
  const show = await queryShowBySlug(showSlug)

  if (!show) return notFound()

  const payload = await getPayload({ config: configPromise })
  const episodes = await payload.find({
    collection: 'podcast-episodes',
    overrideAccess: false,
    where: { show: { equals: show.id } },
    sort: '-publishedAt',
    depth: 0,
    limit: 100,
  })

  const cover = typeof show.coverImage === 'object' ? show.coverImage : null

  return (
    <main className="pb-16 pt-8">
      <div className="container mb-8 flex flex-wrap items-start gap-6">
        {cover && (
          <div className="relative aspect-square w-36 shrink-0 overflow-hidden rounded-xl bg-surface md:w-44">
            <Media fill imgClassName="object-cover" resource={cover} size="176px" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-scarlet">
            Podcast
          </p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground md:text-4xl">
            {show.title}
          </h1>
          <p className="mt-2 max-w-2xl font-serif text-sm text-foreground">{show.description}</p>
          <p className="mt-3">
            <a
              className="font-mono text-[11px] font-semibold uppercase tracking-wider text-scarlet hover:underline"
              href={`/podcasts/${show.slug}/rss.xml`}
            >
              RSS feed
            </a>
          </p>
        </div>
      </div>

      <section className="container border-t border-border pt-6">
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-foreground">
          Episodes
        </h2>
        {episodes.docs.length === 0 ? (
          <p className="font-serif text-muted-foreground">No episodes yet — stay tuned.</p>
        ) : (
          <ul className="divide-y divide-border">
            {episodes.docs.map((ep) => (
              <li key={ep.id} className="py-3.5">
                <Link
                  className="font-serif text-base text-foreground hover:underline"
                  href={`/podcasts/${show.slug}/${ep.slug}`}
                >
                  {ep.title}
                </Link>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  {ep.publishedAt && formatArticleDate(ep.publishedAt)}
                  {ep.duration ? (
                    <>
                      {' '}
                      &nbsp;·&nbsp; {Math.floor(ep.duration / 60)}:
                      {String(ep.duration % 60).padStart(2, '0')}
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { show: showSlug } = await paramsPromise
  const show = await queryShowBySlug(showSlug)
  const title = show ? `${show.title} | Karacter News Podcasts` : 'Podcasts | Karacter News'

  return {
    title,
    description: show?.description,
    openGraph: mergeOpenGraph({
      title,
      url: `/podcasts/${showSlug}`,
    }),
  }
}
