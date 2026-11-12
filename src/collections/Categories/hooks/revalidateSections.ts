import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

// The section bar and footer list categories from a tagged cache
// (src/utilities/getSections.ts); refresh it when a category changes.
export const revalidateSections: CollectionAfterChangeHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) revalidateTag('sections-nav', 'max')
  return doc
}

export const revalidateSectionsDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) revalidateTag('sections-nav', 'max')
  return doc
}
