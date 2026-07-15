'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React from 'react'

import type { Article } from '@/payload-types'

import { Media } from '@/components/Media'
import { timeAgo } from '@/utilities/formatDateTime'

export type CardPostData = Pick<
  Article,
  'slug' | 'category' | 'coverImage' | 'excerpt' | 'publishedAt' | 'seo' | 'title'
>

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardPostData
  relationTo?: 'articles'
  showCategories?: boolean
  title?: string
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc, showCategories, title: titleFromProps } = props

  const { slug, category, coverImage, publishedAt, seo, title } = doc || {}

  const hasCategory = category && typeof category === 'object'
  const titleToUse = titleFromProps || title
  const image =
    (coverImage && typeof coverImage === 'object' ? coverImage : null) ||
    (seo?.image && typeof seo.image === 'object' ? seo.image : null)
  const href = `/article/${slug}`

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-200 hover:cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:ring-scarlet/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className,
      )}
      ref={card.ref}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {image && (
          <Media
            fill
            imgClassName="object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            resource={image}
            size="50vw"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 lg:p-4">
        {showCategories && hasCategory && (
          <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-scarlet">
            {category.name}
          </p>
        )}
        {titleToUse && (
          <h3 className="font-display text-[15px] font-semibold leading-snug text-card-foreground group-hover:underline lg:text-base">
            <Link href={href} ref={link.ref}>
              {titleToUse}
            </Link>
          </h3>
        )}
        {publishedAt && (
          <p
            className="mt-auto pt-2.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
            suppressHydrationWarning
          >
            {timeAgo(publishedAt)}
          </p>
        )}
      </div>
    </article>
  )
}
