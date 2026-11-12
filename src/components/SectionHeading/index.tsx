import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'

// Shared section header (2026-07 polish pass): scarlet tick + spaced label
// + hairline. Scarlet-brand is allowed here as a non-text accent (ADR-0001).
// With `href` the label links to the section and a "More" link closes the row.
export const SectionHeading: React.FC<{
  children: React.ReactNode
  className?: string
  href?: string
}> = ({ children, className, href }) => {
  return (
    <div className={cn('mb-5 flex items-center gap-3', className)}>
      <span aria-hidden="true" className="h-4 w-1.5 rounded-full bg-scarlet-brand" />
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-foreground">
        {href ? (
          <Link className="hover:text-scarlet" href={href}>
            {children}
          </Link>
        ) : (
          children
        )}
      </h2>
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
      {href && (
        <Link
          aria-hidden="true"
          className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-scarlet"
          href={href}
          tabIndex={-1}
        >
          More →
        </Link>
      )}
    </div>
  )
}
