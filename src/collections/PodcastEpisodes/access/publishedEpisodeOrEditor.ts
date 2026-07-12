import type { Access, Where } from 'payload'

import type { User } from '@/payload-types'

// Public reads only episodes whose publishedAt has passed; editors/admins
// see everything (Increment 5).
export const publishedEpisodeOrEditor: Access = ({ req: { user } }) => {
  const role = (user as User | null | undefined)?.role
  if (role === 'admin' || role === 'editor') return true

  const published: Where = {
    publishedAt: {
      less_than_equal: new Date().toISOString(),
    },
  }

  return published
}
