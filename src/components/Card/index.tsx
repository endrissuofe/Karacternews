import Link from 'next/link'
import React from 'react'

import type { Article } from '@/payload-types'

import { StoryImage } from '@/components/story/StoryImage'
import { kickerClass, metaClass, stretchedLink } from '@/components/story/shared'
import { timeAgo } from '@/utilities/formatDateTime'
import { cn } from '@/utilities/ui'

export type CardPostData = Pick<
  Article,
  'slug' | 'category' | 'coverImage' | 'excerpt' | 'publishedAt' | 'seo' | 'title'
>

// The standard story card, used by every listing (sections, authors,
// search, archive blocks). Flat: no border, shadow or lift.
// One markup, two shapes: on a phone it is a row — text left, small
// picture right — so a listing reads as a dense one-column list; from
// `sm` up it stacks into a picture-over-text card for the grid.
export const Card: React.FC<{
  className?: string
  doc?: CardPostData
  relationTo?: 'articles'
  showCategories?: boolean
  title?: string
}> = ({ className, doc, showCategories, title: titleFromProps }) => {
  const { slug, category, coverImage, excerpt, publishedAt, seo, title } = doc || {}

  const categoryName = category && typeof category === 'object' ? category.name : null
  const titleToUse = titleFromProps || title
  const image =
    (coverImage && typeof coverImage === 'object' ? coverImage : null) ||
    (seo?.image && typeof seo.image === 'object' ? seo.image : null)

  return (
    <article className={cn('group relative flex gap-4 sm:flex-col sm:gap-0', className)}>
      <StoryImage
        className="order-last aspect-[4/3] w-28 shrink-0 self-start sm:order-none sm:mb-3 sm:aspect-[16/10] sm:w-full"
        image={image}
        size="(max-width: 640px) 112px, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="min-w-0 flex-1">
        {showCategories && categoryName && <p className={`mb-1 ${kickerClass}`}>{categoryName}</p>}
        {titleToUse && (
          <h3 className="font-display text-lg font-semibold leading-snug text-foreground group-hover:underline sm:text-xl">
            <Link className={stretchedLink} href={`/article/${slug}`}>
              {titleToUse}
            </Link>
          </h3>
        )}
        {excerpt && (
          <p className="mt-1.5 hidden font-serif text-sm leading-relaxed text-muted-foreground sm:line-clamp-2">
            {excerpt}
          </p>
        )}
        {publishedAt && <p className={`mt-2 ${metaClass}`}>{timeAgo(publishedAt)}</p>}
      </div>
    </article>
  )
}
