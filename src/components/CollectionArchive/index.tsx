import React from 'react'

import { Card, CardPostData } from '@/components/Card'

export type Props = {
  posts: CardPostData[]
  /** Hide the section label, e.g. on a section's own page */
  showCategories?: boolean
}

// A listing of stories. Phones get a one-column list divided by hairlines;
// wider screens get a two- then three-column grid of the same cards.
export const CollectionArchive: React.FC<Props> = ({ posts, showCategories = true }) => {
  return (
    <div className="container">
      <ul className="grid divide-y divide-border sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 sm:divide-y-0 lg:grid-cols-3">
        {posts?.map((result, index) => {
          if (typeof result !== 'object' || result === null) return null

          return (
            <li key={index} className="py-4 first:pt-0 sm:py-0">
              <Card doc={result} relationTo="articles" showCategories={showCategories} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
