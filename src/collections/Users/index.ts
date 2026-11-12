import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminFieldAccess } from '../../access/isAdmin'
import { isSelfOrAdmin } from '../../access/isSelfOrAdmin'
import { isSelfOrAdminField } from '../../access/isSelfOrAdminField'
import { slugField } from 'payload'

// Per CLAUDE.md §6: "admins manage all users; any user reads/updates own
// profile; public cannot read admin-only fields." Document-level read/update
// is restricted to the user themself or an admin (not `anyone`) — the public
// /author/[slug] page fetches a safe, explicit subset of fields (name, bio,
// avatar, socials) via a trusted server-side query with overrideAccess, so
// email/role are never exposed over the public API.
export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    /* Payload's `admin` access must return a plain boolean (no query filters) */
    admin: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
    create: isAdmin,
    delete: isAdmin,
    read: isSelfOrAdmin,
    update: isSelfOrAdmin,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'bio',
      type: 'textarea',
      // Bios are public: shown under the byline on every story and on the
      // author page. Editors had put dates of birth here (Nov 2026).
      admin: {
        description:
          'Public: shown under your name on every story and on your author page. One or two lines about your beat, e.g. "Reporter covering Delta State." Do not add personal details such as your date of birth or phone number.',
      },
      maxLength: 300,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'role',
      type: 'select',
      access: {
        // Anyone can see their own role (or an admin can see anyone's);
        // only an admin may change a role (no self-promotion).
        read: isSelfOrAdminField,
        update: isAdminFieldAccess,
      },
      defaultValue: 'contributor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Author', value: 'author' },
        { label: 'Contributor', value: 'contributor' },
      ],
      required: true,
    },
    {
      name: 'socials',
      type: 'group',
      fields: [
        { name: 'x', type: 'text', label: 'X (Twitter)' },
        { name: 'instagram', type: 'text' },
        { name: 'linkedin', type: 'text' },
      ],
    },
    // Not in CLAUDE.md's literal Users field list, but required to make the
    // explicitly-specified `/author/[slug]` route work with readable URLs
    // instead of raw IDs. Generated from `name`.
    slugField({
      position: undefined,
      useAsSlug: 'name',
    }),
  ],
  timestamps: true,
}
