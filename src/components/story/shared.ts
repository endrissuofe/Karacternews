import type { Article, Category, Media as MediaType } from '@/payload-types'

// The fields every homepage story block needs. Section queries `select`
// exactly these, so the type matches what is actually fetched.
export type StoryData = Pick<
  Article,
  'id' | 'slug' | 'title' | 'excerpt' | 'coverImage' | 'category' | 'publishedAt'
>

export const categoryOf = (story: Pick<Article, 'category'>): Category | null =>
  story.category && typeof story.category === 'object' ? story.category : null

export const coverOf = (story: Pick<Article, 'coverImage'>): MediaType | null =>
  story.coverImage && typeof story.coverImage === 'object' ? story.coverImage : null

export const kickerClass =
  'font-mono text-[10px] font-semibold uppercase tracking-wider text-scarlet'
export const metaClass = 'font-mono text-[10px] uppercase tracking-wide text-muted-foreground'

// The headline link stretches over its whole `relative` story block, so the
// image and summary are clickable without nesting links.
export const stretchedLink = 'after:absolute after:inset-0 after:content-[""]'
