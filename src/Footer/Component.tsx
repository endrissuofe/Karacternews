import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { NewsletterForm } from '@/components/NewsletterForm'

export async function Footer() {
  const footerData = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="surface-ink mt-auto bg-ink text-paper">
      {/* Brand accent hairline (non-text scarlet, ADR-0001) */}
      <div aria-hidden="true" className="h-0.5 bg-scarlet-fill" />
      <div className="container grid gap-10 py-12 md:grid-cols-2 md:gap-16">
        <div className="flex flex-col items-start gap-4">
          <Link className="flex items-center" href="/">
            <Logo />
          </Link>
          <p className="font-display text-lg font-semibold tracking-wide text-paper/90">
            News with character.
          </p>
          <nav className="flex flex-wrap gap-x-6 gap-y-3">
            {navItems.map(({ link }, i) => {
              return (
                <CMSLink
                  className="font-mono text-[11px] font-semibold uppercase tracking-wider text-paper hover:underline"
                  key={i}
                  {...link}
                  appearance="inline"
                />
              )
            })}
          </nav>
        </div>

        <div className="md:justify-self-end">
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="container flex flex-wrap items-center justify-between gap-4 py-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-paper/60">
            &copy; {new Date().getFullYear()} Karacter News. All rights reserved.
          </p>
          <ThemeSelector />
        </div>
      </div>
    </footer>
  )
}
