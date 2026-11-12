import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

export type SectionLink = { name: string; slug: string }

// Top-level categories for the section bar and the footer. Cached with a
// tag so the Categories hooks can refresh it at once; `revalidate` is the
// fallback if a change ever bypasses the hooks.
export const getSections = unstable_cache(
  async (): Promise<SectionLink[]> => {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'categories',
      overrideAccess: false,
      depth: 0,
      limit: 50,
      pagination: false,
      sort: 'name',
      where: { parent: { exists: false } },
      select: { name: true, slug: true },
    })

    return result.docs
      .filter((category) => Boolean(category.slug))
      .map((category) => ({ name: category.name, slug: category.slug as string }))
  },
  ['sections-nav'],
  { tags: ['sections-nav'], revalidate: 600 },
)
