function formatCompactBRL(value) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}M`
  }
  if (abs >= 1_000) {
    return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${day} ${months[parseInt(month) - 1]} ${year}`
}

function daysUntil(dateStr) {
  const today = new Date()
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

function Cell({ label, value, valueColor, context }) {
  return (
    <div className="flex flex-col justify-center p-3">
      <p className="text-[9px] uppercase tracking-[0.18em] text-white/30 font-700 mb-1.5">
        {label}
      </p>
      <p
        className="font-display font-800 text-2xl leading-none"
        style={{ color: valueColor }}
      >
        {value}
      </p>
      {context && (
        <p className="text-[10px] text-white/35 mt-1.5 leading-tight">{context}</p>
      )}
    </div>
  )
}

export function ProgramTargetsCard({ program }) {
  const { accentColor, goal, converted, revenueGoal, startDate } = program

  const remainingStudents = Math.max(0, goal - converted)
  const goalReached = converted >= goal

  const days = daysUntil(startDate)
  const started = days < 0
  const isToday = days === 0

  let daysValue
  let daysContext
  let daysColor = '#ffffff'
  if (started) {
    daysValue = 'Iniciado'
    daysContext = formatDate(startDate)
    daysColor = '#F26522'
  } else if (isToday) {
    daysValue = 'Hoje'
    daysContext = formatDate(startDate)
    daysColor = accentColor
  } else {
    daysValue = `${days} dias`
    daysContext = formatDate(startDate)
    daysColor = accentColor
  }

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full">
      <div className="bg-teal-900/50 border border-teal-700/40 rounded-md">
        <Cell
          label="Meta de receita"
          value={revenueGoal ? formatCompactBRL(revenueGoal) : '—'}
          valueColor="#ffffff"
          context={revenueGoal ? 'valor-alvo do programa' : 'não configurada'}
        />
      </div>

      <div className="bg-teal-900/50 border border-teal-700/40 rounded-md">
        <Cell
          label="Meta de alunos"
          value={`${goal}`}
          valueColor="#ffffff"
          context="alunos a converter"
        />
      </div>

      <div className="bg-teal-900/50 border border-teal-700/40 rounded-md">
        <Cell
          label="Início do programa"
          value={daysValue}
          valueColor={daysColor}
          context={daysContext}
        />
      </div>

      <div className="bg-teal-900/50 border border-teal-700/40 rounded-md">
        <Cell
          label="Alunos faltantes"
          value={goalReached ? 'Meta batida' : `${remainingStudents}`}
          valueColor={goalReached ? '#4ade80' : accentColor}
          context={`${converted}/${goal} fechados`}
        />
      </div>
    </div>
  )
}
