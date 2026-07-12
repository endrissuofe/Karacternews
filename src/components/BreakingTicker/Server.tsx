import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { BreakingTicker } from './index'

// Server wrapper so the (frontend) layout can render the ticker on every
// reader page (Increment 4 decision, 2026-07-12). Renders nothing when no
// published article carries the breaking flag.
export async function BreakingTickerServer() {
  const payload = await getPayload({ config: configPromise })

  const breaking = await payload.find({
    collection: 'articles',
    overrideAccess: false,
    where: {
      and: [{ status: { equals: 'published' } }, { isBreaking: { equals: true } }],
    },
    sort: '-publishedAt',
    select: { title: true, slug: true },
    limit: 5,
  })

  if (breaking.docs.length === 0) return null

  return <BreakingTicker articles={breaking.docs} />
}
