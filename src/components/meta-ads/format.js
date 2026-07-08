export function formatBRL(value) {
  if (value == null || isNaN(value)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCompactNumber(value) {
  if (value == null || isNaN(value)) return '—'
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
  if (abs >= 1_000) return `${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}K`
  return `${value}`
}

export function formatPercent(numerator, denominator) {
  if (!denominator) return '—'
  return `${((numerator / denominator) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

const WEEKDAY_ABBR = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export function getWeekdayAbbr(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (isNaN(d.getTime())) return ''
  return WEEKDAY_ABBR[d.getDay()]
}
