import React from 'react'

// Privacy-friendly YouTube embed (youtube-nocookie.com, lazy-loaded).
// §5 exception (2026-07-12): embeds only — we never host or proxy video.
export const YouTubeEmbed: React.FC<{ videoId: string; title: string }> = ({ videoId, title }) => {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface">
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
