import type { TaskConfig } from 'payload'

// Flips 'scheduled' articles to 'published' once their publishedAt time
// has passed (Increment 2). Self-queues every minute via `schedule`; the
// matching `autoRun` entry in payload.config.ts executes the queue
// in-process — no external cron, no new infra (CLAUDE.md §3.2).
//
// The status update goes through payload.update(), so the existing
// afterChange hook (revalidateArticle) fires and the reader-facing cache
// revalidates exactly as if an editor had hit Publish.
export const publishScheduledArticles: TaskConfig = {
  slug: 'publishScheduledArticles',
  label: 'Publish scheduled articles',
  schedule: [
    {
      cron: '* * * * *',
      queue: 'scheduled-publish',
    },
  ],
  retries: 1,
  handler: async ({ req }) => {
    const { payload } = req

    const due = await payload.find({
      collection: 'articles',
      where: {
        and: [
          { status: { equals: 'scheduled' } },
          { publishedAt: { less_than_equal: new Date().toISOString() } },
        ],
      },
      depth: 0,
      limit: 50,
      // id always comes back; slug keeps the payload minimal for logging
      select: { slug: true },
    })

    for (const doc of due.docs) {
      await payload.update({
        collection: 'articles',
        id: doc.id,
        data: { status: 'published' },
        depth: 0,
        req, // keep everything in one transaction
      })
      payload.logger.info(`publishScheduledArticles: published article ${doc.id}`)
    }

    return {
      output: {
        publishedCount: due.docs.length,
      },
    }
  },
  outputSchema: [{ name: 'publishedCount', type: 'number' }],
}
