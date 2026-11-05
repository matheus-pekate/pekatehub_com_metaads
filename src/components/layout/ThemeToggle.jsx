import { Monitor, Sun, Moon } from 'lucide-react'
import { useThemePreference } from '../../lib/theme.js'

const OPTIONS = [
  { value: 'auto', label: 'Automático (segue o computador)', short: 'Auto', Icon: Monitor },
  { value: 'light', label: 'Tema claro', short: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Tema escuro', short: 'Escuro', Icon: Moon },
]

export function ThemeToggle() {
  const [mode, setMode] = useThemePreference()
  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Tema da interface">
      {OPTIONS.map(({ value, label, short, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          title={label}
          className={`theme-toggle__btn${mode === value ? ' is-active' : ''}`}
          onClick={() => setMode(value)}
        >
          <Icon size={13} />
          <span>{short}</span>
        </button>
      ))}
    </div>
  )
}
