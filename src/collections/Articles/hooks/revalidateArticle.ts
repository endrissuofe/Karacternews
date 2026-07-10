import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Article } from '../../../payload-types'

export const revalidateArticle: CollectionAfterChangeHook<Article> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc.status === 'published') {
      const path = `/article/${doc.slug}`
      payload.logger.info(`Revalidating article at path: ${path}`)
      revalidatePath(path)
      revalidatePath('/')
    }

    if (previousDoc?.status === 'published' && doc.status !== 'published') {
      const oldPath = `/article/${previousDoc.slug}`
      payload.logger.info(`Revalidating old article at path: ${oldPath}`)
      revalidatePath(oldPath)
      revalidatePath('/')
    }
  }

  return doc
}

export const revalidateArticleDelete: CollectionAfterDeleteHook<Article> = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate && doc?.slug) {
    revalidatePath(`/article/${doc.slug}`)
    revalidatePath('/')
  }

  return doc
}
