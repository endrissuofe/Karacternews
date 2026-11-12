import Link from 'next/link'
import React from 'react'

import { timeAgo } from '@/utilities/formatDateTime'
import { cn } from '@/utilities/ui'

import { StoryImage } from './StoryImage'
import {
  categoryOf,
  coverOf,
  kickerClass,
  metaClass,
  stretchedLink,
  type StoryData,
} from './shared'

// A story as a row: text on the left, small picture on the right. Used for
// the stories beside the lead, the Latest list and inside section blocks.
// Rows are separated by hairlines by their parent list, not boxed.
export const StoryRow: React.FC<{
  story: StoryData
  /** Show the summary under the headline; 'desktop' hides it on phones */
  showExcerpt?: boolean | 'desktop'
  showCategory?: boolean
  showImage?: boolean
  size?: 'md' | 'sm'
  /** Picture size; defaults to match `size` */
  thumb?: 'md' | 'sm'
  headingLevel?: 'h2' | 'h3'
}> = ({
  story,
  showExcerpt = false,
  showCategory = true,
  showImage = true,
  size = 'md',
  thumb = size,
  headingLevel: Heading = 'h3',
}) => {
  const category = categoryOf(story)
  const cover = showImage ? coverOf(story) : null

  return (
    <article className="group relative flex gap-4">
      <div className="min-w-0 flex-1">
        {showCategory && category && <p className={`mb-1 ${kickerClass}`}>{category.name}</p>}
        <Heading
          className={cn(
            'font-display font-semibold leading-snug text-foreground group-hover:underline',
            size === 'md' ? 'text-lg lg:text-xl' : 'text-base',
          )}
        >
          <Link className={stretchedLink} href={`/article/${story.slug}`}>
            {story.title}
          </Link>
        </Heading>
        {showExcerpt && story.excerpt && (
          <p
            className={cn(
              'mt-1.5 line-clamp-2 font-serif text-sm leading-relaxed text-muted-foreground',
              showExcerpt === 'desktop' && 'hidden sm:[display:-webkit-box]',
            )}
          >
            {story.excerpt}
          </p>
        )}
        {story.publishedAt && <p className={`mt-2 ${metaClass}`}>{timeAgo(story.publishedAt)}</p>}
      </div>
      {cover && (
        <StoryImage
          className={cn(
            'shrink-0 self-start',
            thumb === 'md' ? 'aspect-[4/3] w-28 sm:w-36' : 'aspect-square w-20',
          )}
          image={cover}
          size="144px"
        />
      )}
    </article>
  )
}
