import React from 'react'

import { cn } from '@/utilities/ui'

// Shared section header (2026-07 polish pass): scarlet tick + spaced label
// + hairline. Scarlet-brand is allowed here as a non-text accent (ADR-0001).
export const SectionHeading: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('mb-5 flex items-center gap-3', className)}>
      <span aria-hidden="true" className="h-4 w-1.5 rounded-full bg-scarlet-brand" />
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-foreground">
        {children}
      </h2>
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  )
}
