import React from 'react'

import { AudioProvider } from './Audio'
import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <AudioProvider>{children}</AudioProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
