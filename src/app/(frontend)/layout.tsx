import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { IBM_Plex_Mono, Oswald, Source_Serif_4 } from 'next/font/google'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { BreakingTickerServer } from '@/components/BreakingTicker/Server'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

const oswald = Oswald({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-oswald',
  weight: ['500', '600', '700'],
})

const sourceSerif = Source_Serif_4({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-source-serif',
  weight: ['400', '600'],
})

const plexMono = IBM_Plex_Mono({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['500', '600'],
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <html
      className={cn(oswald.variable, sourceSerif.variable, plexMono.variable)}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header />
          <BreakingTickerServer />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
}
