import React from 'react'

import { cn } from '@/utilities/ui'

// The site search box. A plain GET form to /search, so it works without
// JavaScript (§3.7). The input is 16px: anything smaller makes iOS Safari
// zoom the page when it takes focus. `children` holds optional filters.
export const SearchForm: React.FC<{
  defaultValue?: string
  className?: string
  children?: React.ReactNode
}> = ({ defaultValue, className, children }) => {
  return (
    <form action="/search" className={cn('max-w-2xl', className)} method="get" role="search">
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="search-q">
          Search stories
        </label>
        <input
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3.5 py-2.5 font-serif text-base text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          defaultValue={defaultValue}
          id="search-q"
          maxLength={100}
          name="q"
          placeholder="Search stories…"
          type="search"
        />
        <button
          className="rounded-md bg-primary px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          type="submit"
        >
          Search
        </button>
      </div>
      {children}
    </form>
  )
}
