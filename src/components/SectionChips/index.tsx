import Link from 'next/link'
import React from 'react'

import { getSections } from '@/utilities/getSections'

// Links to every section, for pages that would otherwise be a dead end
// (no search results, page not found — §3.1).
export async function SectionChips({ heading = 'Browse sections' }: { heading?: string }) {
  const sections = await getSections()

  if (sections.length === 0) return null

  return (
    <nav aria-label={heading}>
      <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {heading}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <li key={section.slug}>
            <Link
              className="block rounded-md border border-border px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground hover:border-foreground"
              href={`/category/${section.slug}`}
            >
              {section.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
