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
      <div className="container flex flex-col gap-6 py-10">
        <Link className="flex items-center" href="/">
          <Logo />
        </Link>

        <NewsletterForm />

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

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-paper/60">
            &copy; {new Date().getFullYear()} Karacter News. All rights reserved.
          </p>
          <ThemeSelector />
        </div>
      </div>
    </footer>
  )
}
