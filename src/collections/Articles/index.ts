import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { publishedOrAuthenticated } from '../../access/publishedOrAuthenticated'
import { isOwnArticleOrEditorOrAdmin } from '../../access/isOwnArticleOrEditorOrAdmin'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { setDefaultsAndPublishedAt } from './hooks/setDefaultsAndPublishedAt'
import { revalidateArticle, revalidateArticleDelete } from './hooks/revalidateArticle'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'

// Per CLAUDE.md §6. Public reads only status=published (publishedOrAuthenticated);
// authors/contributors CRUD their own (isOwnArticleOrEditorOrAdmin on
// update/delete); editors/admins CRUD all.
export const Articles: CollectionConfig<'articles'> = {
  slug: 'articles',
  access: {
    create: authenticated,
    delete: isOwnArticleOrEditorOrAdmin,
    read: publishedOrAuthenticated,
    update: isOwnArticleOrEditorOrAdmin,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    excerpt: true,
    category: true,
    coverImage: true,
    isBreaking: true,
    publishedAt: true,
  },
  admin: {
    defaultColumns: ['title', 'status', 'author', 'publishedAt', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'Short summary shown in listings and used as a fallback SEO description.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'body',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: true,
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'category',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              relationTo: 'categories',
            },
            {
              name: 'tags',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'tags',
            },
            {
              name: 'author',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              relationTo: 'users',
            },
          ],
          label: 'Meta',
        },
        {
          // Note: CLAUDE.md calls this group's image field `ogImage`; the SEO
          // plugin's MetaImageField() names it `image` — same purpose, kept as
          // the plugin default rather than fighting its field name.
          name: 'seo',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'seo.title',
              descriptionPath: 'seo.description',
              imagePath: 'seo.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'seo.title',
              descriptionPath: 'seo.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'In Review', value: 'in_review' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      required: true,
    },
    {
      name: 'isBreaking',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
        description: 'Marks this article as breaking news (surfaced starting Increment 4).',
      },
      defaultValue: false,
      label: 'Breaking news',
    },
    {
      name: 'viewCount',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'System-managed. Incrementing logic arrives with Increment 4 (Trending).',
      },
      defaultValue: 0,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    slugField(),
  ],
  hooks: {
    beforeChange: [setDefaultsAndPublishedAt],
    afterChange: [revalidateArticle],
    afterDelete: [revalidateArticleDelete],
  },
}
