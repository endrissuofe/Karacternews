import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Article, User } from '@/payload-types'

export type PublicAuthor = Pick<User, 'id' | 'name' | 'slug' | 'bio' | 'avatar'>

/*
 * Users' collection-level read access is self-or-admin only (see
 * src/collections/Users/index.ts), so the `author` relationship never
 * populates on public article queries. Bylines are public per CLAUDE.md §6,
 * so — mirroring the /author/[slug] page — we use overrideAccess with an
 * explicit `select` allowlist. Only the fields the public author page already
 * shows are fetched (name, slug, bio, avatar); email and role can't leak
 * through here.
 */
export async function getPublicAuthorById(author: Article['author']): Promise<PublicAuthor | null> {
  const id = typeof author === 'object' && author !== null ? author.id : author
  if (!id) return null

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'users',
    overrideAccess: true,
    where: { id: { equals: id } },
    select: {
      name: true,
      slug: true,
      bio: true,
      avatar: true,
    },
    // Populates the avatar upload for the article author block.
    depth: 1,
    limit: 1,
  })

  return result.docs?.[0] || null
}
