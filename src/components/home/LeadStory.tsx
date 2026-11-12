import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'
import { timeAgo } from '@/utilities/formatDateTime'

import {
  categoryOf,
  coverOf,
  kickerClass,
  metaClass,
  stretchedLink,
  type StoryData,
} from './shared'

// The top story: picture first, then a headline large enough to be
// unmistakably the lead, with its summary. Text sits under the image, not
// over it, so a weak or busy photo cannot make the headline unreadable.
export const LeadStory: React.FC<{ story: StoryData; authorName?: string | null }> = ({
  story,
  authorName,
}) => {
  const category = categoryOf(story)
  const cover = coverOf(story)

  return (
    <article className="group relative">
      {cover && (
        <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-lg bg-surface sm:aspect-[16/9]">
          <Media
            fill
            imgClassName="object-cover"
            priority
            resource={cover}
            size="(max-width: 1024px) 100vw, 66vw"
          />
        </div>
      )}
      {category && <p className={`mb-2 ${kickerClass} text-[11px]`}>{category.name}</p>}
      <h1 className="font-display text-[28px] font-bold leading-[1.08] text-foreground group-hover:underline sm:text-4xl lg:text-[44px]">
        <Link className={stretchedLink} href={`/article/${story.slug}`}>
          {story.title}
        </Link>
      </h1>
      {story.excerpt && (
        <p className="mt-3 max-w-3xl font-serif text-base leading-relaxed text-muted-foreground sm:text-lg">
          {story.excerpt}
        </p>
      )}
      <p className={`mt-3 ${metaClass} text-[11px]`}>
        {authorName && <>{authorName} &nbsp;·&nbsp; </>}
        {story.publishedAt && timeAgo(story.publishedAt)}
      </p>
    </article>
  )
}
