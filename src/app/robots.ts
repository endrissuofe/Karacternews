import type { MetadataRoute } from 'next'

import { getServerSideURL } from '@/utilities/getURL'

// Native Next.js robots route — served at /robots.txt. Must live at the
// true app root (not inside the (frontend) route group) or Next.js 404s it
// — sitemap.ts doesn't have this restriction, only robots.ts does.
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getServerSideURL()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/*',
    },
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/news-sitemap.xml`],
  }
}
