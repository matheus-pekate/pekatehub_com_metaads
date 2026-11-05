// Preferência de tema: 'auto' (segue o computador), 'light' ou 'dark'.
// A escolha fica salva no navegador; o atributo data-theme em <html> só é
// definido para 'light'/'dark' — em 'auto' ele é removido e o theme.css usa
// prefers-color-scheme. O mesmo código roda inline no index.html para
// aplicar o tema antes da primeira pintura (sem piscar).
import { useEffect, useState } from 'react'

const KEY = 'pkt-theme'
export const THEME_MODES = ['auto', 'light', 'dark']

export function getThemePreference() {
  try {
    const v = localStorage.getItem(KEY)
    return THEME_MODES.includes(v) ? v : 'auto'
  } catch {
    return 'auto'
  }
}

export function applyTheme(mode) {
  const root = document.documentElement
  if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode)
  else root.removeAttribute('data-theme')
}

export function setThemePreference(mode) {
  try {
    if (mode === 'auto') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, mode)
  } catch {
    /* navegador sem storage: vale só nesta sessão */
  }
  applyTheme(mode)
  window.dispatchEvent(new CustomEvent('pkt-theme-change', { detail: mode }))
}

export function useThemePreference() {
  const [mode, setMode] = useState(getThemePreference)
  useEffect(() => {
    const sync = () => setMode(getThemePreference())
    window.addEventListener('pkt-theme-change', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('pkt-theme-change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return [mode, setThemePreference]
}
