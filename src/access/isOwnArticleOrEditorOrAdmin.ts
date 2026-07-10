import type { Access } from 'payload'

import type { User } from '@/payload-types'

// Editors/admins can update or delete any article. Authors/contributors
// may only update or delete articles where they are the listed author.
export const isOwnArticleOrEditorOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false

  const role = (user as User).role
  if (role === 'admin' || role === 'editor') return true

  return {
    author: {
      equals: user.id,
    },
  }
}
