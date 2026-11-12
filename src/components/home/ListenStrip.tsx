import Link from 'next/link'
import React from 'react'

import type { PodcastEpisode, PodcastShow } from '@/payload-types'

import { PlayEpisodeButton } from '@/components/PlayEpisodeButton'

// The audio band on the homepage (brand direction "Voice", CLAUDE.md §11).
// A permanently dark surface with the amber on-air dot; amber is reserved
// for audio. Renders nothing until there is at least one episode.
export const ListenStrip: React.FC<{ episodes: PodcastEpisode[] }> = ({ episodes }) => {
  const playable = episodes
    .map((episode) => ({
      episode,
      show: typeof episode.show === 'object' ? (episode.show as PodcastShow) : null,
      audio: typeof episode.audio === 'object' ? episode.audio : null,
    }))
    .filter(({ show }) => show !== null)

  if (playable.length === 0) return null

  return (
    <section aria-label="Listen" className="surface-ink bg-ink py-10 text-paper">
      <div className="container">
        <div className="mb-6 flex items-center gap-3">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-amber" />
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-paper">
            Listen
          </h2>
          <span aria-hidden="true" className="h-px flex-1 bg-paper/15" />
          <Link
            className="font-mono text-[11px] font-semibold uppercase tracking-wider text-paper hover:underline"
            href="/podcasts"
          >
            All podcasts →
          </Link>
        </div>
        <ul className="grid gap-x-8 gap-y-6 md:grid-cols-3">
          {playable.map(({ episode, show, audio }) => {
            const href = `/podcasts/${show!.slug}/${episode.slug}`
            return (
              <li key={episode.id} className="flex flex-col items-start gap-3">
                <div>
                  <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber">
                    {show!.title}
                    {episode.duration && episode.duration >= 60 ? (
                      <> &nbsp;·&nbsp; {Math.floor(episode.duration / 60)} min</>
                    ) : null}
                  </p>
                  <h3 className="font-display text-lg font-semibold leading-snug text-paper">
                    <Link className="hover:underline" href={href}>
                      {episode.title}
                    </Link>
                  </h3>
                </div>
                {audio?.url && (
                  <PlayEpisodeButton
                    className="inline-flex items-center gap-2 rounded-md bg-paper px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-amber"
                    track={{ src: audio.url, title: episode.title, showTitle: show!.title, href }}
                  />
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
