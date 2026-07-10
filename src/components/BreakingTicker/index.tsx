import Link from 'next/link'
import React from 'react'

import type { Article } from '@/payload-types'

type TickerArticle = Pick<Article, 'id' | 'slug' | 'title'>

/*
 * The scarlet breaking-news ticker from the Voice design pass. Pure CSS
 * marquee: the track holds two copies of the content and slides -50%, so it
 * loops seamlessly. The duplicate copy is aria-hidden and unfocusable so
 * screen readers and keyboards only meet each story once.
 */
export const BreakingTicker: React.FC<{ articles: TickerArticle[] }> = ({ articles }) => {
  if (articles.length === 0) return null

  const copy = (ariaHidden: boolean) => (
    <div
      aria-hidden={ariaHidden || undefined}
      className="flex items-center gap-2.5 whitespace-nowrap px-4"
    >
      <span className="rounded-[3px] bg-ink px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber">
        Breaking
      </span>
      {articles.map((article, i) => (
        <React.Fragment key={article.id}>
          {i > 0 && <span className="text-paper/70">·</span>}
          <Link
            className="font-mono text-xs tracking-wide text-paper hover:underline"
            href={`/article/${article.slug}`}
            tabIndex={ariaHidden ? -1 : undefined}
          >
            {article.title}
          </Link>
        </React.Fragment>
      ))}
    </div>
  )

  return (
    <div aria-label="Breaking news" className="overflow-hidden bg-scarlet py-2">
      <div className="flex w-max animate-ticker motion-reduce:animate-none">
        {copy(false)}
        {copy(true)}
      </div>
    </div>
  )
}
