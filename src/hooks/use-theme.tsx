import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const THEME_KEY = 'pedidos3d_theme'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY)
    const initialTheme: Theme = stored === 'dark' ? 'dark' : 'light'
    setThemeState(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme: (nextTheme) => {
      setThemeState(nextTheme)
      window.localStorage.setItem(THEME_KEY, nextTheme)
      applyTheme(nextTheme)
    },
    toggleTheme: () => {
      const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'
      setThemeState(nextTheme)
      window.localStorage.setItem(THEME_KEY, nextTheme)
      applyTheme(nextTheme)
    },
  }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
