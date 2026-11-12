import React from 'react'

// The Karacter monogram as drawn for the favicon (public/favicon.svg): ink
// tile, paper K drawn as strokes so it never depends on a font, amber on-air
// dot. Brand hex values are fixed identity, the same exception as Logo.tsx.
export const Monogram: React.FC<{ size: number }> = ({ size }) => (
  <svg
    aria-hidden="true"
    height={size}
    style={{ display: 'block', flexShrink: 0 }}
    viewBox="0 0 240 240"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <clipPath id="karacter-k-baseline">
        <rect height="114" width="240" y="62" />
      </clipPath>
    </defs>
    <rect fill="#16130E" height="240" rx="52" width="240" />
    <path
      clipPath="url(#karacter-k-baseline)"
      d="M84 60V182M84 148.5L166 62M110 102L170 182"
      fill="none"
      stroke="#F6F7F5"
      strokeWidth="30"
    />
    <circle cx="180" cy="66" fill="#F2A93B" r="19" />
  </svg>
)
