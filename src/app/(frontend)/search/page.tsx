import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import type { CardPostData } from '@/components/Card'
import { searchArticleIds, type SearchSort } from '@/utilities/searchArticles'

const PAGE_SIZE = 12

type Args = {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>
}

export const metadata: Metadata = {
  title: 'Search | Karacter News',
  // Search result pages should not be indexed (§3.6 SEO hygiene).
  robots: { index: false, follow: true },
}

export default async function SearchPage({ searchParams: searchParamsPromise }: Args) {
  const params = await searchParamsPromise
  const q = (params.q || '').trim().slice(0, 100)
  const categorySlug = params.category || ''
  const sort: SearchSort = params.sort === 'newest' ? 'newest' : 'relevance'
  const page = Math.max(1, Number(params.page) || 1)

  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    overrideAccess: false,
    limit: 100,
    sort: 'name',
    depth: 0,
  })

  const activeCategory = categorySlug
    ? categories.docs.find((c) => c.slug === categorySlug) || null
    : null

  let results: { docs: CardPostData[]; totalDocs: number; totalPages: number } = {
    docs: [],
    totalDocs: 0,
    totalPages: 1,
  }

  if (q) {
    const { ids, totalDocs, totalPages } = await searchArticleIds({
      payload,
      q,
      categoryId: activeCategory?.id,
      sort,
      page,
      limit: PAGE_SIZE,
    })

    if (ids.length > 0) {
      // Hydrate through the Local API with access control on, then restore
      // the ranked order (payload.find gives no ordering guarantee for `in`).
      const found = await payload.find({
        collection: 'articles',
        overrideAccess: false,
        where: { id: { in: ids } },
        depth: 1,
        limit: PAGE_SIZE,
        pagination: false,
      })
      const byId = new Map(found.docs.map((d) => [String(d.id), d]))
      results = {
        docs: ids
          .map((id) => byId.get(String(id)))
          .filter(Boolean) as unknown as CardPostData[],
        totalDocs,
        totalPages,
      }
    }
  }

  // Preserves current query values across pagination links.
  const buildQuery = (p: number) => {
    const usp = new URLSearchParams()
    if (q) usp.set('q', q)
    if (categorySlug) usp.set('category', categorySlug)
    if (sort !== 'relevance') usp.set('sort', sort)
    if (p > 1) usp.set('page', String(p))
    const s = usp.toString()
    return s ? `/search?${s}` : '/search'
  }

  return (
    <main className="pb-16 pt-8">
      <div className="container mb-8">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground md:text-4xl">
          Search
        </h1>

        {/* Plain GET form — works without JavaScript (§3.7 minimal JS). */}
        <form action="/search" method="get" className="mt-5 flex max-w-2xl flex-wrap gap-2">
          <label htmlFor="search-q" className="sr-only">
            Search articles
          </label>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search stories…"
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 font-serif text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <label htmlFor="search-category" className="sr-only">
            Category
          </label>
          <select
            id="search-category"
            name="category"
            defaultValue={categorySlug}
            className="rounded-md border border-border bg-background px-2 py-2 font-mono text-[11px] uppercase tracking-wider text-foreground"
          >
            <option value="">All categories</option>
            {categories.docs.map((c) => (
              <option key={c.id} value={c.slug ?? ''}>
                {c.name}
              </option>
            ))}
          </select>
          <label htmlFor="search-sort" className="sr-only">
            Sort
          </label>
          <select
            id="search-sort"
            name="sort"
            defaultValue={sort}
            className="rounded-md border border-border bg-background px-2 py-2 font-mono text-[11px] uppercase tracking-wider text-foreground"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-ink px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-paper hover:opacity-90"
          >
            Search
          </button>
        </form>

        {q && (
          <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            {results.totalDocs} {results.totalDocs === 1 ? 'result' : 'results'} for “{q}”
            {activeCategory ? ` in ${activeCategory.name}` : ''}
          </p>
        )}
      </div>

      {q && results.docs.length > 0 && <CollectionArchive posts={results.docs} />}

      {q && results.docs.length === 0 && (
        <div className="container font-serif text-foreground">
          No stories matched your search. Try different keywords, or drop the category filter.
        </div>
      )}

      {!q && (
        <div className="container font-serif text-muted-foreground">
          Type something above to search every published story.
        </div>
      )}

      {q && results.totalPages > 1 && (
        <div className="container mt-10 flex gap-6">
          {page > 1 && (
            <Link
              href={buildQuery(page - 1)}
              className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground hover:text-scarlet"
            >
              ← Previous
            </Link>
          )}
          {page < results.totalPages && (
            <Link
              href={buildQuery(page + 1)}
              className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground hover:text-scarlet"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </main>
  )
}
