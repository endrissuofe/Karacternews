'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []

  return (
    <nav className="flex items-center gap-5">
      {navItems.map(({ link }, i) => {
        return (
          <CMSLink
            key={i}
            {...link}
            appearance="inline"
            className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground hover:text-scarlet"
          />
        )
      })}
      {/* Plain GET form — search works without JavaScript (Increment 3). */}
      <form action="/search" method="get" role="search" className="flex items-center">
        <label htmlFor="header-search" className="sr-only">
          Search articles
        </label>
        <input
          id="header-search"
          name="q"
          type="search"
          placeholder="Search…"
          className="w-24 rounded-full border border-border bg-muted px-3 py-1.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:w-36 focus:border-scarlet focus:outline-none motion-safe:transition-all md:w-32 md:focus:w-48"
        />
      </form>
    </nav>
  )
}
