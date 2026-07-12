'use client'

import React from 'react'

import { useAudio, type AudioTrack } from '@/providers/Audio'

// Starts (or pauses) an episode in the persistent audio bar (Increment 5).
export const PlayEpisodeButton: React.FC<{ track: AudioTrack; className?: string }> = ({
  track,
  className,
}) => {
  const { track: current, isPlaying, play, toggle } = useAudio()
  const isCurrent = current?.src === track.src
  const showPause = isCurrent && isPlaying

  return (
    <button
      type="button"
      onClick={() => (isCurrent ? toggle() : play(track))}
      className={
        className ||
        'inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-paper hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-scarlet dark:bg-paper dark:text-ink'
      }
    >
      <span
        aria-hidden="true"
        className={
          showPause
            ? 'h-2 w-2 rounded-full bg-scarlet-brand animate-onair motion-reduce:animate-none'
            : 'h-2 w-2 rounded-full bg-scarlet-brand'
        }
      />
      {showPause ? 'Pause' : isCurrent ? 'Resume' : 'Play episode'}
    </button>
  )
}
