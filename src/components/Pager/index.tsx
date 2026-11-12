import Link from 'next/link'
import React from 'react'

const linkClass =
  'rounded-md border border-border px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground hover:border-foreground'

// Previous / next links for a paginated listing, with the position between
// them. Plain links, so paging works without JavaScript. Renders nothing
// when there is only one page.
export const Pager: React.FC<{
  page: number
  totalPages: number
  hrefFor: (page: number) => string
  /** Chronological listings read better as Newer / Older */
  previousLabel?: string
  nextLabel?: string
}> = ({ page, totalPages, hrefFor, previousLabel = 'Previous', nextLabel = 'Next' }) => {
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="Pagination"
      className="container mt-10 flex items-center justify-between gap-4 border-t border-border pt-6"
    >
      {/* Empty spans keep the position centred on the first and last page. */}
      {page > 1 ? (
        <Link className={linkClass} href={hrefFor(page - 1)} rel="prev">
          ← {previousLabel}
        </Link>
      ) : (
        <span />
      )}
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      {page < totalPages ? (
        <Link className={linkClass} href={hrefFor(page + 1)} rel="next">
          {nextLabel} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
