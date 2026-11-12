import React from 'react'

import { Monogram } from './Monogram'

// Shown on the admin login screen in place of Payload's logo. Inline styles
// because the admin panel does not load the site's Tailwind CSS; the text
// colour uses Payload's own theme variable so it reads in light and dark.
const Logo: React.FC = () => (
  <div style={{ alignItems: 'center', display: 'flex', gap: '14px' }}>
    <Monogram size={52} />
    <span
      style={{
        color: 'var(--theme-elevation-1000)',
        fontSize: '26px',
        fontWeight: 800,
        letterSpacing: '0.06em',
        lineHeight: 1,
      }}
    >
      KARACTER MEDIA
    </span>
  </div>
)

export default Logo
