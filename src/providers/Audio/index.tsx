'use client'

import Link from 'next/link'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// The persistent audio system (CLAUDE.md §11 signature element, built in
// Increment 5). The provider lives in the root layout so the <audio>
// element — and whatever is playing — survives client-side navigation.
// The on-air dot pulses scarlet while a podcast plays; amber is reserved
// for live radio, which arrives with its own feature plan later.

export type AudioTrack = {
  /** Direct URL of the audio file */
  src: string
  title: string
  showTitle?: string
  /** Reader page for the episode, linked from the bar */
  href?: string
}

type AudioContextValue = {
  track: AudioTrack | null
  isPlaying: boolean
  play: (track: AudioTrack) => void
  toggle: () => void
}

const AudioCtx = createContext<AudioContextValue>({
  track: null,
  isPlaying: false,
  play: () => {},
  toggle: () => {},
})

export const useAudio = () => useContext(AudioCtx)

const formatTime = (s: number): string => {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [track, setTrack] = useState<AudioTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const play = useCallback((next: AudioTrack) => {
    const el = audioRef.current
    if (!el) return
    setTrack((prev) => {
      if (prev?.src !== next.src) {
        el.src = next.src
        setCurrentTime(0)
        setDuration(0)
      }
      return next
    })
    void el.play().catch(() => setIsPlaying(false))
  }, [])

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el || !el.src) return
    if (el.paused) {
      void el.play().catch(() => setIsPlaying(false))
    } else {
      el.pause()
    }
  }, [])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTime = () => setCurrentTime(el.currentTime)
    const onMeta = () => setDuration(el.duration)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
    }
  }, [])

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current
    if (!el) return
    el.currentTime = Number(e.target.value)
    setCurrentTime(el.currentTime)
  }

  return (
    <AudioCtx.Provider value={{ track, isPlaying, play, toggle }}>
      {children}

      <audio ref={audioRef} preload="none" />

      {track && (
        <>
          {/* Spacer so the fixed bar never covers footer content */}
          <div aria-hidden="true" className="h-14" />

          <div
            role="region"
            aria-label="Audio player"
            className="surface-ink fixed inset-x-0 bottom-0 z-30 border-t border-paper/15 bg-ink text-paper"
          >
            <div className="container flex h-14 items-center gap-3">
              {/* On-air motif: scarlet pulse while a podcast plays (§11).
                  Amber stays reserved for live radio (later). */}
              <span
                aria-hidden="true"
                className={
                  isPlaying
                    ? 'h-2.5 w-2.5 shrink-0 rounded-full bg-scarlet animate-onair motion-reduce:animate-none'
                    : 'h-2.5 w-2.5 shrink-0 rounded-full bg-paper/40'
                }
              />

              <button
                type="button"
                onClick={toggle}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper text-ink hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-scarlet"
              >
                {isPlaying ? (
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
                    <rect x="3" y="2" width="3.5" height="12" rx="1" />
                    <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
                    <path d="M4 2.5v11a.5.5 0 0 0 .76.43l9-5.5a.5.5 0 0 0 0-.86l-9-5.5A.5.5 0 0 0 4 2.5Z" />
                  </svg>
                )}
              </button>

              <div className="min-w-0 flex-1">
                {track.href ? (
                  <Link
                    href={track.href}
                    className="block truncate font-mono text-xs font-semibold text-paper hover:underline"
                  >
                    {track.title}
                  </Link>
                ) : (
                  <p className="truncate font-mono text-xs font-semibold text-paper">
                    {track.title}
                  </p>
                )}
                {track.showTitle && (
                  <p className="truncate font-mono text-[10px] uppercase tracking-wider text-paper/60">
                    {track.showTitle}
                  </p>
                )}
              </div>

              <label htmlFor="audio-seek" className="sr-only">
                Seek
              </label>
              <input
                id="audio-seek"
                type="range"
                min={0}
                max={Number.isFinite(duration) && duration > 0 ? Math.floor(duration) : 0}
                value={Math.floor(currentTime)}
                onChange={seek}
                className="hidden w-40 accent-[color:var(--scarlet)] md:block lg:w-64"
              />

              <span className="shrink-0 font-mono text-[10px] tabular-nums text-paper/70">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </>
      )}
    </AudioCtx.Provider>
  )
}
