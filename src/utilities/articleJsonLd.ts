import type { Article, Media, User } from '../payload-types'

import { getServerSideURL } from './getURL'

const imageURL = (image?: Media | number | string | null) => {
  if (image && typeof image === 'object' && 'url' in image && image.url) {
    return `${getServerSideURL()}${image.url}`
  }
  return undefined
}

// Google News / Article structured data. See CLAUDE.md §3.6.
export const articleJsonLd = (article: Article) => {
  const serverUrl = getServerSideURL()
  const author = typeof article.author === 'object' ? (article.author as User) : null
  const image = imageURL(article.coverImage)

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt || undefined,
    image: image ? [image] : undefined,
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: author
      ? {
          '@type': 'Person',
          name: author.name,
          url: author.slug ? `${serverUrl}/author/${author.slug}` : undefined,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Karacter News',
      logo: {
        '@type': 'ImageObject',
        url: `${serverUrl}/favicon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${serverUrl}/article/${article.slug}`,
    },
  }
}
