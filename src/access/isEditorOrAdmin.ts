import type { Access } from 'payload'

import type { User } from '@/payload-types'

export const isEditorOrAdmin: Access = ({ req: { user } }) => {
  const role = (user as User | undefined)?.role
  return Boolean(user && (role === 'admin' || role === 'editor'))
}
