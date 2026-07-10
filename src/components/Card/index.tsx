'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React from 'react'

import type { Article } from '@/payload-types'

import { Media } from '@/components/Media'

export type CardPostData = Pick<Article, 'slug' | 'category' | 'seo' | 'title' | 'excerpt'>

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

  const { slug, category, seo, title, excerpt } = doc || {}
  const { description, image: metaImage } = seo || {}

  const hasCategory = category && typeof category === 'object'
  const titleToUse = titleFromProps || title
  const descriptionToUse = (description || excerpt)?.replace(/\s/g, ' ')
  const href = `/article/${slug}`

  return (
    <article
      className={cn(
        'border border-border rounded-lg overflow-hidden bg-card hover:cursor-pointer',
        className,
      )}
      ref={card.ref}
    >
      <div className="relative w-full ">
        {!metaImage && <div className="">No image</div>}
        {metaImage && typeof metaImage !== 'string' && <Media resource={metaImage} size="33vw" />}
      </div>
      <div className="p-4">
        {showCategories && hasCategory && (
          <div className="uppercase text-sm mb-4">
            {typeof category === 'object' ? category.name || 'Untitled category' : ''}
          </div>
        )}
        {titleToUse && (
          <div className="prose">
            <h3>
              <Link className="not-prose" href={href} ref={link.ref}>
                {titleToUse}
              </Link>
            </h3>
          </div>
        )}
        {descriptionToUse && (
          <div className="mt-2">
            <p>{descriptionToUse}</p>
          </div>
        )}
      </div>
    </article>
  )
}
