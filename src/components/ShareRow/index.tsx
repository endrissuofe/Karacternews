'use client'

import { Check, Link2, MessageCircle } from 'lucide-react'
import React, { useState } from 'react'

/*
 * Share row from the article design: WhatsApp and X matter most for the
 * Nigerian audience, plus copy-link. Quiet surface circles, ink icons.
 */
export const ShareRow: React.FC<{ title: string; url: string }> = ({ title, url }) => {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(title)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable (e.g. non-secure context) — leave the button as-is */
    }
  }

  const circle =
    'flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-ink hover:text-paper'

  return (
    <div className="flex items-center gap-3.5 border-y border-border py-5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Share
      </span>
      <a
        aria-label="Share on WhatsApp"
        className={circle}
        href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      <a
        aria-label="Share on X"
        className={circle}
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="font-display text-sm font-bold">X</span>
      </a>
      <button aria-label="Copy link" className={circle} onClick={copyLink} type="button">
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  )
}
