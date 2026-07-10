import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { Article, Page } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

// Note: the search plugin (from the original template) has been removed
// for Increment 1 — full-text search is explicitly Increment 3 scope per
// CLAUDE.md's roadmap. Re-add it there.

const generateTitle: GenerateTitle<Article | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Karacter News` : 'Karacter News'
}

const generateURL: GenerateURL<Article | Page> = ({ doc }) => {
  const url = getServerSideURL()

  if (!doc?.slug) return url

  // Articles have a `category` field, Pages don't — cheap way to tell
  // the two document shapes apart without extra context plumbing.
  const isArticle = 'category' in doc

  return isArticle ? `${url}/article/${doc.slug}` : `${url}/${doc.slug}`
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'articles'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
]
