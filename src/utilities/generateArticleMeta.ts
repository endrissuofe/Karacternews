import type { Metadata } from 'next'

import type { Article, Media } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | number | string | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url
    url = ogUrl ? serverUrl + ogUrl : serverUrl + (image.url || '')
  }

  return url
}

export const generateArticleMeta = async (args: {
  doc: Partial<Article> | null
}): Promise<Metadata> => {
  const { doc } = args

  const ogImage = getImageURL(doc?.seo?.image || doc?.coverImage)

  const title = doc?.seo?.title
    ? `${doc.seo.title} | Karacter News`
    : doc?.title
      ? `${doc.title} | Karacter News`
      : 'Karacter News'

  const description = doc?.seo?.description || doc?.excerpt || undefined

  return {
    description,
    openGraph: mergeOpenGraph({
      description: description || '',
      images: ogImage ? [{ url: ogImage }] : undefined,
      title,
      type: 'article',
      url: doc?.slug ? `/article/${doc.slug}` : '/',
    }),
    title,
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}
