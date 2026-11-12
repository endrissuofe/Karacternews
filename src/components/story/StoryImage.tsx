import React from 'react'

import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

// Picture frame for a story. Every story picture on the site goes through
// this so they share a shape: the frame fixes the ratio and the photo is
// cropped to fill it, anchored on the focal point set in the admin.
// A story without a picture gets the brand mark on a quiet surface instead
// of a hole in the layout.
export const StoryImage: React.FC<{
  image: MediaType | null
  /** Tailwind aspect + width classes for the frame */
  className?: string
  /** `sizes` hint so phones do not download desktop-sized files */
  size: string
  priority?: boolean
}> = ({ image, className, size, priority }) => {
  return (
    <div className={cn('relative overflow-hidden rounded-md bg-surface', className)}>
      {image ? (
        <Media fill imgClassName="object-cover" priority={priority} resource={image} size={size} />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center [container-type:inline-size]"
        >
          {/* The monogram's K and amber on-air dot, scaled to the frame. */}
          <span className="relative font-display text-[22cqw] font-bold leading-none text-foreground/10">
            K
            <span className="absolute -right-[0.2em] top-[0.06em] h-[0.16em] w-[0.16em] rounded-full bg-amber/60" />
          </span>
        </div>
      )}
    </div>
  )
}
