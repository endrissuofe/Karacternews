import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import type { CardPostData } from '@/components/Card'
import { Media } from '@/components/Media'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

type Args = {
  params: Promise<{ slug: string }>
}

// Users' collection-level read access is self-or-admin only (see
// src/collections/Users/index.ts), so a public author profile page can't
// just do a normal `find`. Instead we deliberately use overrideAccess with
// an explicit `select` allowlist — only the fields CLAUDE.md says are
// public (name, bio, avatar, socials, slug) are ever fetched here. Email
// and role are never selected, so they can't leak onto this page.
async function getPublicAuthor(slug: string) {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'users',
    overrideAccess: true,
    where: { slug: { equals: slug } },
    select: {
      name: true,
      slug: true,
      bio: true,
      avatar: true,
      socials: true,
    },
    limit: 1,
  })

  return result.docs?.[0] || null
}

export default async function AuthorPage({ params: paramsPromise }: Args) {
  const { slug } = await paramsPromise
  const author = await getPublicAuthor(slug)

  if (!author) return notFound()

  const payload = await getPayload({ config: configPromise })
  const articles = await payload.find({
    collection: 'articles',
    overrideAccess: false,
    where: {
      and: [{ author: { equals: author.id } }, { status: { equals: 'published' } }],
    },
    sort: '-publishedAt',
    depth: 1,
    limit: 20,
  })

  return (
    <main className="pt-16 pb-24">
      <div className="container mb-10 flex items-center gap-4">
        {author.avatar && typeof author.avatar === 'object' && (
          <div className="w-16 h-16 rounded-full overflow-hidden">
            <Media resource={author.avatar} />
          </div>
        )}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{author.name}</h1>
          {author.bio && <p className="mt-2 max-w-2xl opacity-80">{author.bio}</p>}
        </div>
      </div>

      {articles.docs.length > 0 ? (
        <CollectionArchive posts={articles.docs as CardPostData[]} />
      ) : (
        <div className="container">No published articles yet.</div>
      )}
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug } = await paramsPromise
  const author = await getPublicAuthor(slug)

  const title = author ? `${author.name} | Karacter News` : 'Karacter News'

  return {
    title,
    description: author?.bio || undefined,
    openGraph: mergeOpenGraph({
      title,
      url: `/author/${slug}`,
    }),
  }
}
