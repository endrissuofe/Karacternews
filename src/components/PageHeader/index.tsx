import React from 'react'

// The masthead of a listing page (section, search, 404): a small label
// with the scarlet tick, the page name set large, and a heavy rule under
// it so the page reads as a section front rather than a list with a title.
// Scarlet-brand is a non-text accent here (ADR-0001).
export const PageHeader: React.FC<{
  /** Small label above the title, e.g. "Section" */
  kicker?: string
  title: string
  /** Short line beside the title on wide screens, e.g. the story count */
  meta?: React.ReactNode
  /** Anything that belongs inside the masthead, e.g. the search form */
  children?: React.ReactNode
}> = ({ kicker, title, meta, children }) => {
  return (
    <header className="container mb-8">
      <div className="border-b-2 border-foreground pb-4">
        {kicker && (
          <p className="mb-2 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span aria-hidden="true" className="h-3 w-1.5 rounded-full bg-scarlet-brand" />
            {kicker}
          </p>
        )}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-wide text-foreground md:text-5xl">
            {title}
          </h1>
          {meta && (
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {meta}
            </p>
          )}
        </div>
        {children}
      </div>
    </header>
  )
}
