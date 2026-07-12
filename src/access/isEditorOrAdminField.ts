import type { FieldAccess } from 'payload'

import type { User } from '@/payload-types'

// Field-level variant of isEditorOrAdmin (field access is boolean-only).
// Used e.g. to stop authors reassigning the `author` field: incoming
// values from non-editors are ignored, and the beforeChange hook then
// defaults the author to the logged-in user.
export const isEditorOrAdminField: FieldAccess = ({ req: { user } }) => {
  const role = (user as User | undefined)?.role
  return Boolean(user && (role === 'admin' || role === 'editor'))
}
