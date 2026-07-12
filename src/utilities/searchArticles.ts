import type { Payload } from 'payload'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Postgres full-text search over Articles (Increment 3, CLAUDE.md §2:
// "PostgreSQL full-text search first"). Queries the generated, GIN-indexed
// `search_vector` column (see the increment-3 migration) with
// websearch_to_tsquery, which safely parses free-form user input including
// quoted phrases and -exclusions. Only published articles are searchable.
//
// Returns ranked article IDs + total count; the caller hydrates the docs
// through the Payload Local API so normal access control still applies.

export type SearchSort = 'relevance' | 'newest'

type SearchArgs = {
  payload: Payload
  q: string
  categoryId?: number | string
  sort?: SearchSort
  page?: number
  limit?: number
}

type SearchResult = {
  ids: (number | string)[]
  totalDocs: number
  totalPages: number
}

export async function searchArticleIds({
  payload,
  q,
  categoryId,
  sort = 'relevance',
  page = 1,
  limit = 12,
}: SearchArgs): Promise<SearchResult> {
  const offset = (page - 1) * limit

  const categoryFilter = categoryId ? sql`AND category_id = ${categoryId}` : sql``

  const orderBy =
    sort === 'newest'
      ? sql`published_at DESC NULLS LAST`
      : sql`ts_rank(search_vector, websearch_to_tsquery('english', ${q})) DESC, published_at DESC NULLS LAST`

  // payload.db is typed as the base adapter, which doesn't overlap with the
  // concrete Postgres type — hence the double cast. We're Postgres-only by
  // locked decision (CLAUDE.md §2), so this is safe at runtime.
  const db = payload.db as unknown as PostgresAdapter

  const result = await db.drizzle.execute(sql`
    SELECT id, count(*) OVER() AS total
    FROM articles
    WHERE search_vector @@ websearch_to_tsquery('english', ${q})
      AND status = 'published'
      ${categoryFilter}
    ORDER BY ${orderBy}
    LIMIT ${limit}
    OFFSET ${offset}
  `)

  const rows = result.rows as { id: number | string; total: number | string }[]
  const totalDocs = rows.length > 0 ? Number(rows[0].total) : 0

  return {
    ids: rows.map((r) => r.id),
    totalDocs,
    totalPages: Math.max(1, Math.ceil(totalDocs / limit)),
  }
}
