import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
}

/*
 * Karacter monogram (from /public/brand/karacter-monogram.svg), inlined so it
 * renders with zero extra requests and can never 404. The hex values here are
 * intentional: logo colors are fixed brand identity (ink tile, paper K, amber
 * on-air dot) and must NOT follow theme tokens — the tile stays ink even in
 * dark mode. This is the one sanctioned exception to the "no hardcoded hex"
 * rule in CLAUDE.md §11.
 */
export const Logo = ({ className }: Props) => {
  return (
    <span className={clsx('flex items-center gap-2', className)}>
      <svg
        aria-hidden="true"
        className="h-6 w-6 rounded-md"
        viewBox="0 0 240 240"
        xmlns="http://www.w3.org/2000/svg"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        <rect width="240" height="240" rx="52" fill="#16130E" />
        <text x="120" y="176" fontSize="150" fontWeight="900" fill="#F6F7F5" textAnchor="middle">
          K
        </text>
        <circle cx="180" cy="70" r="17" fill="#F2A93B" />
        <rect x="60" y="182" width="8" height="16" rx="4" fill="#F2A93B" />
        <rect x="74" y="174" width="8" height="24" rx="4" fill="#F2A93B" />
        <rect x="88" y="166" width="8" height="32" rx="4" fill="#F2A93B" />
      </svg>
      <span className="font-display text-lg font-bold tracking-wide">KARACTER</span>
    </span>
  )
}
