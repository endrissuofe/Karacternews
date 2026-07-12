import type { Access, Where } from 'payload'

import type { User } from '@/payload-types'

// Read access for Articles (Increment 2):
// - public (unauthenticated): only status = 'published'
// - editors/admins: everything
// - authors/contributors: published articles + their own work in any
//   status. They can no longer browse other people's drafts.
export const publishedOrOwnOrEditor: Access = ({ req: { user } }) => {
  if (!user) {
    return {
      status: {
        equals: 'published',
      },
    }
  }

  const role = (user as User).role
  if (role === 'admin' || role === 'editor') return true

  const publishedOrOwn: Where = {
    or: [
      {
        status: {
          equals: 'published',
        },
      },
      {
        author: {
          equals: user.id,
        },
      },
    ],
  }

  return publishedOrOwn
}
