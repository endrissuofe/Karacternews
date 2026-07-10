import type { Access } from 'payload'

import type { User } from '@/payload-types'

// Admins can read/update any user document. Anyone else may only
// read/update their own profile (used for the Users collection).
export const isSelfOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false

  if ((user as User).role === 'admin') return true

  return {
    id: {
      equals: user.id,
    },
  }
}
