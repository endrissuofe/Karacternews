import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { isEditorOrAdmin } from '../access/isEditorOrAdmin'
import { slugField } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  access: {
    create: isEditorOrAdmin,
    delete: isEditorOrAdmin,
    read: anyone,
    update: isEditorOrAdmin,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    slugField({
      position: undefined,
      useAsSlug: 'name',
    }),
  ],
}
