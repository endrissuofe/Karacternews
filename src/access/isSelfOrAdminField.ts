import type { FieldAccess } from 'payload'

import type { User } from '@/payload-types'

// Field-level version of isSelfOrAdmin: lets a user see/edit a field on
// their own document, or lets an admin see/edit it on anyone's document.
export const isSelfOrAdminField: FieldAccess = ({ req: { user }, id }) => {
  if (!user) return false
  if ((user as User).role === 'admin') return true
  return user.id === id
}
