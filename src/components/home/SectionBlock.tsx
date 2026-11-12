import Link from 'next/link'
import React from 'react'

import { SectionHeading } from '@/components/SectionHeading'
import { timeAgo } from '@/utilities/formatDateTime'

import { StoryImage } from '@/components/story/StoryImage'
import { StoryRow } from '@/components/story/StoryRow'
import { coverOf, metaClass, stretchedLink, type StoryData } from '@/components/story/shared'

// One section on the homepage: its newest story with a picture, then the
// next few as headlines. The heading links to the full section page.
export const SectionBlock: React.FC<{
  name: string
  slug: string
  stories: StoryData[]
}> = ({ name, slug, stories }) => {
  const [first, ...rest] = stories
  if (!first) return null

  return (
    <section aria-label={name}>
      <SectionHeading href={`/category/${slug}`}>{name}</SectionHeading>
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <article className="group relative">
          <StoryImage
            className="mb-3 aspect-[16/10]"
            image={coverOf(first)}
            size="(max-width: 640px) 100vw, 25vw"
          />
          <h3 className="font-display text-xl font-semibold leading-snug text-foreground group-hover:underline">
            <Link className={stretchedLink} href={`/article/${first.slug}`}>
              {first.title}
            </Link>
          </h3>
          {first.excerpt && (
            <p className="mt-1.5 line-clamp-3 font-serif text-sm leading-relaxed text-muted-foreground">
              {first.excerpt}
            </p>
          )}
          {first.publishedAt && <p className={`mt-2 ${metaClass}`}>{timeAgo(first.publishedAt)}</p>}
        </article>

        {rest.length > 0 && (
          <ul className="divide-y divide-border border-t border-border sm:border-t-0">
            {rest.map((story) => (
              <li key={story.id} className="py-3.5 sm:first:pt-0">
                <StoryRow showCategory={false} showImage={false} size="sm" story={story} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
