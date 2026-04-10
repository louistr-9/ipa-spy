"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemeType = 'sky' | 'ebony' | 'rose' | 'gold' | 'monochrome'

interface ThemeContextType {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>('sky')

  useEffect(() => {
    // Load from localStorage
    const savedTheme = localStorage.getItem('ipa-spy-theme') as ThemeType
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    // Apply to html tag
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ipa-spy-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
