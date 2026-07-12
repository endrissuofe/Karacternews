import type { Payload } from 'payload'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Bumps an article's view counter with a single atomic UPDATE (Increment 4).
// Deliberately raw SQL, not payload.update():
// - no hooks fire (no revalidation storm, no updatedAt churn, no workflow
//   checks on a system-managed counter)
// - atomic increment, safe under concurrent reads
// Fire-and-forget: callers must not await-block rendering on this, and a
// failed count must never break the article page.
export function incrementViewCount(payload: Payload, articleId: number | string): void {
  const db = payload.db as unknown as PostgresAdapter

  void db.drizzle
    .execute(sql`UPDATE articles SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ${articleId}`)
    .catch((err: unknown) => {
      payload.logger.warn(`incrementViewCount failed for article ${articleId}: ${String(err)}`)
    })
}
