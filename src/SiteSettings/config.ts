import type { GlobalConfig } from 'payload'

import { isEditorOrAdmin } from '@/access/isEditorOrAdmin'

// Per CLAUDE.md §6 SiteSettings global: site name, logo, social links,
// homepage featured slots. Primary nav is intentionally left to the
// existing `header`/`footer` globals (already wired into working nav
// components) rather than duplicated here — see the Increment 1
// reconciliation plan.
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
    update: isEditorOrAdmin,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      defaultValue: 'Karacter News',
      required: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'socialLinks',
      type: 'group',
      fields: [
        { name: 'x', type: 'text', label: 'X (Twitter)' },
        { name: 'instagram', type: 'text' },
        { name: 'linkedin', type: 'text' },
      ],
    },
    {
      name: 'homepageFeatured',
      type: 'group',
      label: 'Homepage Featured Slots',
      fields: [
        {
          name: 'hero',
          type: 'relationship',
          relationTo: 'articles',
          admin: {
            description: 'Optional. If unset, the home page falls back to the latest article.',
          },
        },
        {
          name: 'breaking',
          type: 'relationship',
          relationTo: 'articles',
          hasMany: true,
          admin: {
            description: 'Optional manual override. Otherwise the home page shows any article flagged isBreaking.',
          },
        },
        {
          name: 'featuredCategories',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
        },
      ],
    },
  ],
}
