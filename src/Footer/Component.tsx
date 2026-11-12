import { getCachedGlobal } from '@/utilities/getGlobals'
import { getSections } from '@/utilities/getSections'
import Link from 'next/link'
import React from 'react'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { NewsletterForm } from '@/components/NewsletterForm'

const headingClass = 'mb-4 font-display text-sm font-bold uppercase tracking-wider text-paper'
const linkClass = 'font-serif text-sm text-paper/75 hover:text-paper hover:underline'

export async function Footer() {
  const [footerData, siteSettings, sections] = await Promise.all([
    getCachedGlobal('footer', 1)(),
    getCachedGlobal('site-settings', 0)(),
    getSections(),
  ])

  const navItems = footerData?.navItems || []

  const follow = [
    { label: 'X', href: siteSettings?.socialLinks?.x },
    { label: 'Instagram', href: siteSettings?.socialLinks?.instagram },
    { label: 'LinkedIn', href: siteSettings?.socialLinks?.linkedin },
    { label: 'YouTube', href: siteSettings?.youtube?.channelUrl },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href))

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
        </div>

        <div className="md:justify-self-end">
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="container grid grid-cols-2 gap-x-8 gap-y-10 py-10 md:grid-cols-4">
          {sections.length > 0 && (
            <nav aria-label="Footer sections" className="col-span-2">
              <h2 className={headingClass}>Sections</h2>
              <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5 sm:grid-cols-3">
                {sections.map((section) => (
                  <li key={section.slug}>
                    <Link className={linkClass} href={`/category/${section.slug}`}>
                      {section.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <nav aria-label="Listen and follow">
            <h2 className={headingClass}>Listen</h2>
            <ul className="space-y-2.5">
              <li>
                <Link className={linkClass} href="/podcasts">
                  Podcasts
                </Link>
              </li>
              <li>
                <a className={linkClass} href="/feed.xml">
                  RSS feed
                </a>
              </li>
              {follow.map(({ label, href }) => (
                <li key={label}>
                  <a className={linkClass} href={href} rel="noopener noreferrer" target="_blank">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Editor-managed links (Admin → Globals → Footer): About, Contact… */}
          {navItems.length > 0 && (
            <nav aria-label="About Karacter">
              <h2 className={headingClass}>Karacter</h2>
              <ul className="space-y-2.5">
                {navItems.map(({ link }, i) => (
                  <li key={i}>
                    <CMSLink className={linkClass} {...link} appearance="inline" />
                  </li>
                ))}
              </ul>
            </nav>
          )}
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
