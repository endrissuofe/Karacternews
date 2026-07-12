import type { CollectionBeforeChangeHook } from 'payload'

import { extractLexicalText } from '@/utilities/extractLexicalText'

// Keeps the hidden `searchText` field in sync with the article body
// (Increment 3 — Postgres full-text search). Title and excerpt live in
// their own columns and are weighted separately by the generated tsvector
// column (see the increment-3 migration); searchText only carries the
// flattened Lexical body.
export const syncSearchText: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const body = data.body ?? originalDoc?.body

  if (body !== undefined) {
    data.searchText = extractLexicalText(body)
  }

  return data
}
