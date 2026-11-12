import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

import { LeadStory } from '@/components/home/LeadStory'
import { NewsletterForm } from '@/components/NewsletterForm'
import { ListenStrip } from '@/components/home/ListenStrip'
import { SectionBlock } from '@/components/home/SectionBlock'
import { StoryRow } from '@/components/home/StoryRow'
import type { StoryData } from '@/components/home/shared'
import { SectionHeading } from '@/components/SectionHeading'
import { getPublicAuthorById } from '@/utilities/getPublicAuthor'
import { getSections } from '@/utilities/getSections'
import { getServerSideURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

// A news homepage must not be frozen at build time. Without this it was
// fully static, so it only ever changed when revalidateArticle fired
// revalidatePath('/') — anything else (SiteSettings featured slots, a
// scheduled publish that didn't revalidate) left it stale indefinitely.
// It also breaks CI-built images: the image is built against a throwaway
// empty database, so a build-time-frozen homepage would ship empty.
// ISR regenerates it against the real database shortly after deploy; the
// publish hook still refreshes it immediately.
export const revalidate = 300

const SECONDARY_COUNT = 3
const LATEST_COUNT = 8
const STORIES_PER_SECTION = 4

const storySelect = {
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  category: true,
  publishedAt: true,
} as const

const relationId = (value: unknown): number | null =>
  typeof value === 'number'
    ? value
    : value && typeof value === 'object' && 'id' in value
      ? (value as { id: number }).id
      : null

// Homepage (Increment 7, phase 2). Top to bottom: the lead story with the
// next stories beside it, the Latest list with Trending in the rail, the
// audio band, then one block per section.
export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })
  const published = { status: { equals: 'published' } } as const
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [siteSettings, latest, trendingWeek, episodes, allSections] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
    payload.find({
      collection: 'articles',
      overrideAccess: false,
      where: published,
      sort: '-publishedAt',
      depth: 1,
      // One spare in case the editor's pick is not among the newest.
      limit: 1 + SECONDARY_COUNT + LATEST_COUNT + 1,
    }),
    // Trending: most-viewed articles published in the last 7 days
    // (Increment 4 decision, 2026-07-12). viewCount is bumped per article
    // view — see incrementViewCount.
    payload.find({
      collection: 'articles',
      overrideAccess: false,
      where: {
        and: [
          published,
          { publishedAt: { greater_than_equal: weekAgo } },
          { viewCount: { greater_than: 0 } },
        ],
      },
      sort: '-viewCount',
      select: { title: true, slug: true },
      limit: 5,
    }),
    payload.find({
      collection: 'podcast-episodes',
      overrideAccess: false,
      sort: '-publishedAt',
      depth: 1,
      limit: 3,
    }),
    getSections(),
  ])

  // Lead: the editor's pick from Site Settings → Homepage Featured Slots,
  // falling back to the newest story. overrideAccess: false means a pick
  // that is no longer published simply isn't found.
  const heroId = relationId(siteSettings?.homepageFeatured?.hero)
  const picked = heroId
    ? (
        await payload.find({
          collection: 'articles',
          overrideAccess: false,
          where: { and: [published, { id: { equals: heroId } }] },
          depth: 1,
          limit: 1,
        })
      ).docs[0]
    : undefined

  const lead = picked ?? latest.docs[0]
  const others = latest.docs.filter((article) => article.id !== lead?.id)
  const secondaries = others.slice(0, SECONDARY_COUNT)
  const latestList = others.slice(SECONDARY_COUNT, SECONDARY_COUNT + LATEST_COUNT)

  // When nothing published this week has been read yet the rail would be
  // empty, so fall back to the most-read stories of any age and say so.
  const trendingIsRecent = trendingWeek.docs.length >= 3
  const mostRead = trendingIsRecent
    ? trendingWeek.docs
    : (
        await payload.find({
          collection: 'articles',
          overrideAccess: false,
          where: { and: [published, { viewCount: { greater_than: 0 } }] },
          sort: '-viewCount',
          select: { title: true, slug: true },
          limit: 5,
        })
      ).docs

  // Section blocks: the editor's featured categories in their chosen order,
  // or every top-level section alphabetically when none are chosen.
  const featuredIds = (siteSettings?.homepageFeatured?.featuredCategories || [])
    .map(relationId)
    .filter((id): id is number => id !== null)
  const sections =
    featuredIds.length > 0
      ? featuredIds
          .map((id) => allSections.find((section) => section.id === id))
          .filter((section) => section !== undefined)
      : allSections

  const [leadAuthor, sectionStories] = await Promise.all([
    lead ? getPublicAuthorById(lead.author) : null,
    Promise.all(
      sections.map((section) =>
        payload.find({
          collection: 'articles',
          overrideAccess: false,
          where: { and: [published, { category: { equals: section.id } }] },
          sort: '-publishedAt',
          depth: 1,
          limit: STORIES_PER_SECTION,
          select: storySelect,
        }),
      ),
    ),
  ])

  return (
    <main className="pb-16">
      {lead && (
        <section className="container grid gap-x-10 gap-y-6 pt-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <LeadStory authorName={leadAuthor?.name} story={lead} />
          </div>
          {secondaries.length > 0 && (
            <ul className="divide-y divide-border border-t border-border lg:col-span-4 lg:border-t-0">
              {secondaries.map((story) => (
                <li key={story.id} className="py-4 lg:first:pt-0">
                  <StoryRow headingLevel="h2" showExcerpt story={story} thumb="sm" />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {latestList.length > 0 && (
        <div className="container mt-12 grid gap-x-10 gap-y-10 lg:grid-cols-12">
          <section aria-label="Latest stories" className="lg:col-span-8">
            <SectionHeading>Latest</SectionHeading>
            <ul className="divide-y divide-border">
              {latestList.map((story) => (
                <li key={story.id} className="py-4 first:pt-0">
                  <StoryRow showExcerpt="desktop" story={story} />
                </li>
              ))}
            </ul>
          </section>

          <aside className="space-y-10 lg:col-span-4">
            {mostRead.length > 0 && (
              <section aria-label={trendingIsRecent ? 'Trending stories' : 'Most read stories'}>
                <SectionHeading>{trendingIsRecent ? 'Trending' : 'Most read'}</SectionHeading>
                <ol className="divide-y divide-border">
                  {mostRead.map((article, i) => (
                    <li key={article.id} className="flex gap-4 py-3.5 first:pt-0">
                      <span
                        aria-hidden="true"
                        className="w-6 shrink-0 font-display text-3xl font-bold leading-none text-scarlet"
                      >
                        {i + 1}
                      </span>
                      <Link
                        className="font-display text-base font-semibold leading-snug text-foreground hover:underline"
                        href={`/article/${article.slug}`}
                      >
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Permanently dark panel, so surface-ink text tokens apply. */}
            <div className="surface-ink rounded-lg bg-ink p-6">
              <NewsletterForm />
            </div>
          </aside>
        </div>
      )}

      {episodes.docs.length > 0 && (
        <div className="mt-14">
          <ListenStrip episodes={episodes.docs} />
        </div>
      )}

      <div className="container mt-14 grid gap-x-12 gap-y-14 lg:grid-cols-2">
        {sections.map((section, i) => (
          <SectionBlock
            key={section.slug}
            name={section.name}
            slug={section.slug}
            stories={sectionStories[i].docs as StoryData[]}
          />
        ))}
      </div>
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
