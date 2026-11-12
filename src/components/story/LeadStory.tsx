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

// The top story of a page: picture, then a headline large enough to be
// unmistakably the lead, with its summary. Text sits beside or under the
// image, never over it, so a weak or busy photo cannot make the headline
// unreadable.
export const LeadStory: React.FC<{
  story: StoryData
  authorName?: string | null
  /** h1 on the homepage; h2 where the page already has its own h1 */
  headingLevel?: 'h1' | 'h2'
  /** 'split' puts the picture beside the text on wide screens */
  layout?: 'stacked' | 'split'
  showCategory?: boolean
}> = ({
  story,
  authorName,
  headingLevel: Heading = 'h1',
  layout = 'stacked',
  showCategory = true,
}) => {
  const category = showCategory ? categoryOf(story) : null
  const split = layout === 'split'

  return (
    <article className={cn('group relative', split && 'lg:grid lg:grid-cols-12 lg:gap-x-10')}>
      <StoryImage
        className={cn('mb-4 aspect-[16/10] sm:aspect-[16/9]', split && 'lg:col-span-7 lg:mb-0')}
        image={coverOf(story)}
        priority
        size={split ? '(max-width: 1024px) 100vw, 58vw' : '(max-width: 1024px) 100vw, 66vw'}
      />
      <div className={cn(split && 'lg:col-span-5 lg:self-center')}>
        {category && <p className={`mb-2 ${kickerClass} text-[11px]`}>{category.name}</p>}
        <Heading
          className={cn(
            'font-display text-[28px] font-bold leading-[1.08] text-foreground group-hover:underline sm:text-4xl',
            split ? 'lg:text-4xl' : 'lg:text-[44px]',
          )}
        >
          <Link className={stretchedLink} href={`/article/${story.slug}`}>
            {story.title}
          </Link>
        </Heading>
        {story.excerpt && (
          <p className="mt-3 max-w-3xl font-serif text-base leading-relaxed text-muted-foreground sm:text-lg">
            {story.excerpt}
          </p>
        )}
        <p className={`mt-3 ${metaClass} text-[11px]`}>
          {authorName && <>{authorName} &nbsp;·&nbsp; </>}
          {story.publishedAt && timeAgo(story.publishedAt)}
        </p>
      </div>
    </article>
  )
}
