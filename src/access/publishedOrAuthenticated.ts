import type { Access } from 'payload'

// Public (unauthenticated) requests may only read articles whose custom
// `status` field is 'published'. Any logged-in editorial user (admin,
// editor, author, contributor) can read articles in any status so they
// can see drafts / in-review / scheduled / archived items in the admin UI.
export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true

  return {
    status: {
      equals: 'published',
    },
  }
}
