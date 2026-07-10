import type { CollectionSlug, File, Payload, PayloadRequest } from 'payload'

import fs from 'fs'
import path from 'path'

import { richText } from './richText'

const collectionsToClear: CollectionSlug[] = ['articles', 'categories', 'tags']

// Simple, self-contained seed for Increment 1: a few categories, a couple
// of tags, one demo author, and 3-4 sample articles — enough for the
// reader routes (home / article / category / author) to show real
// content. Deliberately does not touch the dormant Pages/Forms
// collections from the original template.
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  payload.logger.info('— Clearing articles, categories, tags...')
  await Promise.all(
    collectionsToClear.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

  await payload.delete({
    collection: 'users',
    depth: 0,
    where: {
      email: {
        equals: 'author@example.com',
      },
    },
  })

  payload.logger.info('— Seeding demo author...')
  const author = await payload.create({
    collection: 'users',
    data: {
      name: 'Amara Okafor',
      email: 'author@example.com',
      password: 'password',
      role: 'author',
      bio: 'Staff reporter covering politics and business.',
      socials: {
        x: 'https://x.com/example',
      },
    },
  })

  payload.logger.info('— Seeding cover image...')
  const coverImageFile = getLocalFile('website-template-OG.webp')
  const coverImage = await payload.create({
    collection: 'media',
    data: { alt: 'Karacter News placeholder cover image' },
    file: coverImageFile,
  })

  payload.logger.info('— Seeding categories...')
  const categoryNames = ['Politics', 'Business', 'Sports', 'Entertainment']
  const categories = await Promise.all(
    categoryNames.map((name) =>
      payload.create({
        collection: 'categories',
        data: { name },
      }),
    ),
  )

  payload.logger.info('— Seeding tags...')
  const tagNames = ['Election', 'Startups']
  const tags = await Promise.all(
    tagNames.map((name) =>
      payload.create({
        collection: 'tags',
        data: { name },
      }),
    ),
  )

  payload.logger.info('— Seeding articles...')
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const articlesData = [
    {
      title: 'National Assembly Passes New Electoral Reform Bill',
      excerpt:
        'Lawmakers voted to approve sweeping changes to how elections are conducted nationwide.',
      category: categories[0].id,
      tags: [tags[0].id],
      isBreaking: true,
      publishedAt: new Date(now).toISOString(),
      body: [
        'The National Assembly on Thursday passed a long-debated electoral reform bill, introducing changes to voter accreditation and result collation.',
        'Supporters say the reforms will improve transparency, while critics argue implementation timelines are too tight ahead of the next election cycle.',
        'The bill now heads to the presidency for assent.',
      ],
    },
    {
      title: 'Tech Startups See Record Investment in First Half of the Year',
      excerpt: 'Local startups raised more funding in six months than in all of last year.',
      category: categories[1].id,
      tags: [tags[1].id],
      isBreaking: false,
      publishedAt: new Date(now - day).toISOString(),
      body: [
        'Fintech and logistics startups led a wave of new investment, according to figures released this week.',
        'Analysts attribute the surge to growing investor confidence and a maturing local venture capital ecosystem.',
        'Founders say access to talent remains the biggest constraint on growth.',
      ],
    },
    {
      title: 'National Team Secures Qualification for Continental Cup',
      excerpt: 'A last-minute goal sealed qualification after a tense final group match.',
      category: categories[2].id,
      tags: [],
      isBreaking: false,
      publishedAt: new Date(now - 2 * day).toISOString(),
      body: [
        'The national football team booked its place at next year’s continental cup after a 2-1 win in their final qualifier.',
        'Fans celebrated across major cities following the result, which came after a difficult qualifying campaign.',
        'The coach praised the squad’s resilience and said preparations for the tournament begin immediately.',
      ],
    },
    {
      title: 'Streaming Platforms Expand Local Content Slate',
      excerpt: 'Major platforms are commissioning more locally produced series and films.',
      category: categories[3].id,
      tags: [],
      isBreaking: false,
      publishedAt: new Date(now - 3 * day).toISOString(),
      body: [
        'Streaming services announced a new round of commissions for locally produced drama series and films.',
        'Industry figures say the investment reflects growing viewership numbers for local-language content.',
        'Several productions are expected to begin filming later this year.',
      ],
    },
  ]

  for (const articleData of articlesData) {
    await payload.create({
      collection: 'articles',
      depth: 0,
      context: { disableRevalidate: true },
      data: {
        title: articleData.title,
        excerpt: articleData.excerpt,
        category: articleData.category,
        tags: articleData.tags,
        author: author.id,
        coverImage: coverImage.id,
        status: 'published',
        isBreaking: articleData.isBreaking,
        publishedAt: articleData.publishedAt,
        body: richText(articleData.body),
      },
    })
  }

  payload.logger.info('— Seeding nav...')
  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: { type: 'custom', label: 'Home', url: '/' },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: { type: 'custom', label: 'Admin', url: '/admin' },
          },
        ],
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}

function getLocalFile(filename: string): File {
  const filePath = path.resolve(process.cwd(), 'public', filename)
  const data = fs.readFileSync(filePath)

  return {
    name: filename,
    data,
    mimetype: 'image/webp',
    size: data.byteLength,
  }
}
