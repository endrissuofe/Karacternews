const normalise = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[…\s]+/g, ' ')
    .replace(/\.+$/, '')
    .trim()

const textOf = (node: unknown): string => {
  if (node == null || typeof node !== 'object') return ''
  const record = node as Record<string, unknown>
  const own = typeof record.text === 'string' ? record.text : ''
  const children = Array.isArray(record.children) ? record.children.map(textOf).join('') : ''
  return own + children
}

/*
 * The summary to show under an article headline, or null.
 * Many excerpts are simply the article's opening sentence. Printing that as
 * a standfirst and then again as the first paragraph reads as a mistake, so
 * the excerpt is only used when the body does not already open with it.
 */
export const standfirstFor = (excerpt: string | null | undefined, body: unknown): string | null => {
  const summary = excerpt?.trim()
  if (!summary) return null

  const root = (body as { root?: { children?: unknown[] } } | null)?.root
  const opening = normalise(textOf(root?.children?.find((child) => textOf(child).trim() !== '')))
  const wanted = normalise(summary)

  if (opening && (opening.startsWith(wanted) || wanted.startsWith(opening))) return null

  return summary
}
