import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Article } from '../../../payload-types'

// The discovery surfaces (sitemap, Google News sitemap, RSS) are cached
// independently of the article pages, so publishing has to invalidate them
// explicitly. Without this they stay frozen and Google never learns about
// new articles — /sitemap.xml is statically generated at build time, and
// news-sitemap.xml is tagged but had nothing triggering its tag.
const revalidateDiscoverySurfaces = () => {
  revalidatePath('/sitemap.xml')
  revalidateTag('news-sitemap', 'max')
  revalidateTag('rss-feed', 'max')
}

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
      revalidateDiscoverySurfaces()
    }

    if (previousDoc?.status === 'published' && doc.status !== 'published') {
      const oldPath = `/article/${previousDoc.slug}`
      payload.logger.info(`Revalidating old article at path: ${oldPath}`)
      revalidatePath(oldPath)
      revalidatePath('/')
      revalidateDiscoverySurfaces()
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
    revalidateDiscoverySurfaces()
  }

  return doc
}
