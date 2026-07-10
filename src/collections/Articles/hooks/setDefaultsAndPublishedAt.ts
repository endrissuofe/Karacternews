import type { CollectionBeforeChangeHook } from 'payload'

// - Defaults `author` to the logged-in user if not explicitly set (so
//   authors/contributors always end up owning what they create).
// - Auto-sets `publishedAt` the first time `status` becomes 'published',
//   mirroring the old Payload-native drafts behavior but driven by our
//   own explicit status field (see CLAUDE.md §6 / the Increment-1
//   reconciliation decision to not use Payload's native draft system).
export const setDefaultsAndPublishedAt: CollectionBeforeChangeHook = ({
  data,
  req,
  originalDoc,
}) => {
  if (!data.author && req.user) {
    data.author = req.user.id
  }

  if (data.status === 'published' && !data.publishedAt && originalDoc?.status !== 'published') {
    data.publishedAt = new Date().toISOString()
  }

  return data
}
