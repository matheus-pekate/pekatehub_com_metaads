export function formatCompactBRL(value) {
  if (value == null || isNaN(value)) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) {
    return `${sign}R$ ${(abs / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}M`
  }
  if (abs >= 1_000) {
    return `${sign}R$ ${(abs / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatBRL(value) {
  if (value == null || isNaN(value)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'hoje'
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return `${diffDays}d atrás`
  return `${Math.floor(diffDays / 7)}sem atrás`
}

export function daysUntilDate(dateStr) {
  if (!dateStr) return 0
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24))
}
