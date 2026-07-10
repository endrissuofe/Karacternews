import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

// Builds minimal, valid Lexical JSON from plain paragraphs — no blocks,
// no styling, just readable body copy for seed articles.
export const richText = (paragraphs: string[]): DefaultTypedEditorState =>
  ({
    root: {
      type: 'root',
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text,
            version: 1,
          },
        ],
      })),
    },
  }) as DefaultTypedEditorState
