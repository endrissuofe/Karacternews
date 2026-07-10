const WORDS_PER_MINUTE = 200

const countWords = (node: unknown): number => {
  if (node == null) return 0
  if (Array.isArray(node)) return node.reduce((sum, child) => sum + countWords(child), 0)
  if (typeof node === 'object') {
    const record = node as Record<string, unknown>
    let count = 0
    if (typeof record.text === 'string') {
      count += record.text.split(/\s+/).filter(Boolean).length
    }
    if (record.children) count += countWords(record.children)
    if (record.root) count += countWords(record.root)
    return count
  }
  return 0
}

/* Estimated reading time in whole minutes (min 1) from a Lexical rich-text value. */
export const readTimeMinutes = (body: unknown): number => {
  return Math.max(1, Math.round(countWords(body) / WORDS_PER_MINUTE))
}
