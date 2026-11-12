import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { isEditorOrAdmin } from '../access/isEditorOrAdmin'
import { slugField } from 'payload'

import { revalidateSections, revalidateSectionsDelete } from './Categories/hooks/revalidateSections'

// Note: the `parent` (self-relationship) and `breadcrumbs` fields are
// added automatically by @payloadcms/plugin-nested-docs (see plugins/index.ts),
// satisfying CLAUDE.md's "parent (self-rel, optional)" requirement without
// hand-rolling it here.
export const Categories: CollectionConfig = {
  slug: 'categories',
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
  hooks: {
    afterChange: [revalidateSections],
    afterDelete: [revalidateSectionsDelete],
  },
}
