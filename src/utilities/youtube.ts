// Extracts a YouTube video ID from the URL shapes editors actually paste
// (Increment 5.5 §5 exception — embeds only, we never host video).
// Supported: watch?v=, youtu.be/, /live/, /shorts/, /embed/.
const PATTERNS = [
  /youtube\.com\/watch\?.*v=([\w-]{6,20})/,
  /youtu\.be\/([\w-]{6,20})/,
  /youtube\.com\/live\/([\w-]{6,20})/,
  /youtube\.com\/shorts\/([\w-]{6,20})/,
  /youtube\.com\/embed\/([\w-]{6,20})/,
]

export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null
  for (const re of PATTERNS) {
    const m = url.match(re)
    if (m) return m[1]
  }
  return null
}

export function validateYouTubeUrl(value: string | null | undefined): true | string {
  if (!value) return true // optional field
  return getYouTubeId(value)
    ? true
    : 'Enter a YouTube URL (watch, youtu.be, live, or shorts link).'
}
