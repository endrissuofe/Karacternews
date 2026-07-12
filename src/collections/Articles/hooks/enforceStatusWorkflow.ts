import type { CollectionBeforeValidateHook } from 'payload'
import { APIError, ValidationError } from 'payload'

import type { User } from '@/payload-types'

// Editorial workflow rules (Increment 2, CLAUDE.md §6/§9):
// - authors/contributors may only set status to 'draft' or 'in_review'
//   (submitting for review). Everything past review is an editor decision.
// - 'scheduled' requires a publishedAt date, and it must be in the future
//   at the time of scheduling (editors/admins only, enforced above).
// Collection-level access already stops non-editors from touching articles
// they don't own or that are past review; this hook stops them from
// *promoting* their own work past review.
const AUTHOR_ALLOWED_STATUSES = ['draft', 'in_review']

export const enforceStatusWorkflow: CollectionBeforeValidateHook = ({ data, req, originalDoc }) => {
  if (!data) return data

  const user = req.user as User | null | undefined

  // No user = trusted server-side Local API call (e.g. the scheduled-publish
  // job, seeding). Unauthenticated *external* requests never reach hooks —
  // collection access control rejects them first.
  if (!user) return data

  const role = user.role
  const isEditor = role === 'admin' || role === 'editor'

  const nextStatus: string | undefined = data.status ?? originalDoc?.status

  if (!isEditor && nextStatus && !AUTHOR_ALLOWED_STATUSES.includes(nextStatus)) {
    throw new APIError('Only editors can schedule, publish, or archive articles.', 403)
  }

  if (data.status === 'scheduled' && originalDoc?.status !== 'scheduled') {
    const publishedAt = data.publishedAt ?? originalDoc?.publishedAt
    if (!publishedAt || new Date(publishedAt) <= new Date()) {
      throw new ValidationError({
        errors: [
          {
            path: 'publishedAt',
            message: 'A scheduled article needs a publish date in the future.',
          },
        ],
      })
    }
  }

  return data
}
