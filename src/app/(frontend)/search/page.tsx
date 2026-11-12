import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { PageHeader } from '@/components/PageHeader'
import { Pager } from '@/components/Pager'
import { SearchForm } from '@/components/SearchForm'
import { SectionChips } from '@/components/SectionChips'
import { StoryRow } from '@/components/story/StoryRow'
import type { StoryData } from '@/components/story/shared'
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

  let results: { docs: StoryData[]; totalDocs: number; totalPages: number } = {
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
        docs: ids.map((id) => byId.get(String(id))).filter(Boolean) as unknown as StoryData[],
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

  const selectClass =
    'rounded-md border border-border bg-background px-2.5 py-2 font-mono text-[11px] uppercase tracking-wider text-foreground focus:border-foreground focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <main className="pb-16 pt-8">
      <PageHeader
        kicker="Search"
        meta={
          q
            ? `${results.totalDocs} ${results.totalDocs === 1 ? 'result' : 'results'}${
                activeCategory ? ` in ${activeCategory.name}` : ''
              }`
            : undefined
        }
        title={q ? `\u201c${q}\u201d` : 'Search'}
      >
        <SearchForm className="mt-5" defaultValue={q}>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="search-category">
              Section
            </label>
            <select
              className={selectClass}
              defaultValue={categorySlug}
              id="search-category"
              name="category"
            >
              <option value="">All sections</option>
              {categories.docs.map((c) => (
                <option key={c.id} value={c.slug ?? ''}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="search-sort">
              Sort
            </label>
            <select className={selectClass} defaultValue={sort} id="search-sort" name="sort">
              <option value="relevance">Most relevant</option>
              <option value="newest">Newest first</option>
            </select>
          </div>
        </SearchForm>
      </PageHeader>

      {/* Results read as a list, not a grid: one story per line with its
          summary, so a reader can scan headlines down a single column. */}
      {q && results.docs.length > 0 && (
        <div className="container">
          <ul className="max-w-3xl divide-y divide-border">
            {results.docs.map((story) => (
              <li key={story.id} className="py-5 first:pt-0">
                <StoryRow headingLevel="h2" showExcerpt="desktop" story={story} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {q && results.docs.length === 0 && (
        <div className="container">
          <div className="max-w-2xl">
            <p className="font-serif text-lg leading-relaxed text-foreground">
              No stories matched your search. Try fewer or different words
              {activeCategory ? ', or search all sections' : ''}.
            </p>
            <div className="mt-8">
              <SectionChips />
            </div>
          </div>
        </div>
      )}

      {!q && (
        <div className="container">
          <div className="max-w-2xl">
            <p className="font-serif text-lg leading-relaxed text-muted-foreground">
              Search every published story by headline, summary or text.
            </p>
            <div className="mt-8">
              <SectionChips />
            </div>
          </div>
        </div>
      )}

      {q && <Pager hrefFor={buildQuery} page={page} totalPages={results.totalPages} />}
    </main>
  )
}
