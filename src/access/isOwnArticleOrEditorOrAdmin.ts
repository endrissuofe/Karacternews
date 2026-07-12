import type { Access, Where } from 'payload'

import type { User } from '@/payload-types'

// Editors/admins can update or delete any article. Authors/contributors
// may only update or delete their own articles, and only while those are
// still pre-review ('draft' or 'in_review'). Once an article is scheduled,
// published, or archived it becomes editor-only (Increment 2 decision:
// no silent edits to live stories).
export const isOwnArticleOrEditorOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false

  const role = (user as User).role
  if (role === 'admin' || role === 'editor') return true

  const ownPreReview: Where = {
    and: [
      {
        author: {
          equals: user.id,
        },
      },
      {
        status: {
          in: ['draft', 'in_review'],
        },
      },
    ],
  }

  return ownPreReview
}
