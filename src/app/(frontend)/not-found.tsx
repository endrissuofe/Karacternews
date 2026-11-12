import type { Metadata } from 'next'

import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { PageHeader } from '@/components/PageHeader'
import { SearchForm } from '@/components/SearchForm'
import { SectionChips } from '@/components/SectionChips'
import { SectionHeading } from '@/components/SectionHeading'
import { StoryRow } from '@/components/story/StoryRow'
import type { StoryData } from '@/components/story/shared'

export const metadata: Metadata = {
  title: 'Page not found | Karacter News',
}

// The newest stories, so a broken link still lands on something to read.
// A failure here must never turn a 404 into a 500, hence the catch.
async function getLatest(): Promise<StoryData[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'articles',
      overrideAccess: false,
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 1,
      limit: 4,
      pagination: false,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        category: true,
        publishedAt: true,
      },
    })
    return result.docs
  } catch {
    return []
  }
}

export default async function NotFound() {
  const latest = await getLatest()

  return (
    <main className="pb-16 pt-8">
      <PageHeader kicker="Error 404" title="Page not found" />

      <div className="container">
        <div className="max-w-2xl">
          <p className="font-serif text-lg leading-relaxed text-foreground">
            The story may have been moved or unpublished, or the link may be mistyped. Search for
            it, pick a section, or head back to the{' '}
            <Link className="text-scarlet underline underline-offset-2" href="/">
              front page
            </Link>
            .
          </p>

          <SearchForm className="mt-6" />

          <div className="mt-8">
            <SectionChips />
          </div>
        </div>

        {latest.length > 0 && (
          <section aria-label="Latest stories" className="mt-12 max-w-3xl">
            <SectionHeading>Latest</SectionHeading>
            <ul className="divide-y divide-border">
              {latest.map((story) => (
                <li key={story.id} className="py-4 first:pt-0">
                  <StoryRow headingLevel="h3" story={story} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
