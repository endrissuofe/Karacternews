// Flattens a Lexical rich-text JSON tree into plain text for search
// indexing (Increment 3). Walks every node, collects `text` values, and
// separates block-level nodes with spaces so words don't fuse together.
type LexicalNode = {
  children?: LexicalNode[]
  text?: string
  type?: string
}

export function extractLexicalText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''

  const root = (value as { root?: LexicalNode }).root
  if (!root) return ''

  const parts: string[] = []

  const walk = (node: LexicalNode): void => {
    if (typeof node.text === 'string' && node.text.trim()) {
      parts.push(node.text)
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(walk)
    }
  }

  walk(root)

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}
