import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { anyone } from '../access/anyone'
import { isEditorOrAdmin } from '../access/isEditorOrAdmin'

// Per CLAUDE.md §6 (Increment 5). Podcasts are curated output: editors and
// admins manage shows; everyone can read them.
export const PodcastShows: CollectionConfig = {
  slug: 'podcast-shows',
  labels: {
    singular: 'Podcast Show',
    plural: 'Podcast Shows',
  },
  access: {
    create: isEditorOrAdmin,
    delete: isEditorOrAdmin,
    read: anyone,
    update: isEditorOrAdmin,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Shown on the podcast index and in podcast apps (RSS).',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Square artwork, ideally 3000×3000 (podcast apps require ≥1400×1400).',
      },
    },
    slugField(),
  ],
}
