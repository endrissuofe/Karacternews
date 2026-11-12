'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef } from 'react'

import type { SectionLink } from '@/utilities/getSections'

import { cn } from '@/utilities/ui'

type Item = { href: string; label: string }

// Client only for the current-section highlight; the links themselves are
// plain anchors and work without JavaScript.
export const SectionNavClient: React.FC<{ sections: SectionLink[] }> = ({ sections }) => {
  const pathname = usePathname()
  const listRef = useRef<HTMLUListElement>(null)

  // On a phone the current section can sit off-screen to the right; bring it
  // into view. Only the bar's own scroll position moves, never the page's.
  useEffect(() => {
    const list = listRef.current
    const active = list?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!list || !active) return
    list.scrollLeft = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2
  }, [pathname])

  const items: Item[] = [
    ...sections.map((section) => ({ href: `/category/${section.slug}`, label: section.name })),
    { href: '/podcasts', label: 'Podcasts' },
  ]

  return (
    <nav aria-label="Sections" className="border-b border-border bg-background">
      {/* One row that scrolls sideways on narrow screens, like a newspaper
          section bar; the fade hints that there is more to the right. */}
      <div className="container relative">
        <ul
          ref={listRef}
          className="relative -mx-1 flex gap-x-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative block px-2.5 py-3 font-mono text-[11px] font-semibold uppercase tracking-wider hover:text-scarlet',
                    active ? 'text-scarlet' : 'text-foreground',
                  )}
                >
                  {label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-2.5 bottom-0 h-0.5 bg-scarlet-brand"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent md:hidden"
        />
      </div>
    </nav>
  )
}
