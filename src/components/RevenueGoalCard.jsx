function formatCompactBRL(value) {
  const abs = Math.abs(value)
  let formatted
  if (abs >= 1_000_000) {
    formatted = `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}M`
  } else if (abs >= 1_000) {
    formatted = `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  } else {
    formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value)
  }
  return formatted
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/25 mb-3 font-700">
        Meta de receita
      </p>
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white/20 bg-white/[0.03] border border-dashed border-white/10 mb-4">
        —
      </div>
      <p className="text-white/50 text-sm font-600 mb-1">Meta não configurada</p>
      <p className="text-white/30 text-xs leading-relaxed max-w-[280px]">
        Defina o valor de meta de receita para este programa em config/pipedrive.js para visualizar este indicador.
      </p>
    </div>
  )
}

export function RevenueGoalCard({ program }) {
  if (!program?.revenueGoal) {
    return <EmptyState />
  }

  const { name, accentColor, totalWonValue, forecast, revenueGoal, price } = program

  const wonPct = Math.min(100, (totalWonValue / revenueGoal) * 100)
  const forecastPct = Math.min(100 - wonPct, (forecast / revenueGoal) * 100)
  const remaining = Math.max(0, revenueGoal - totalWonValue)
  const remainingStudents = price ? Math.ceil(remaining / price) : 0

  const axisMarks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    label: formatCompactBRL(revenueGoal * p),
    position: p * 100,
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-2">
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-700">
          Meta de receita · <span className="text-white/50">{name}</span>
        </p>

        <div className="flex items-start gap-4 text-right">
          <div>
            <p className="font-display font-700 text-sm text-white/90 leading-none">
              {formatCompactBRL(totalWonValue)}
            </p>
            <p className="text-[8px] uppercase tracking-widest text-white/30 mt-1">
              Ganho
            </p>
          </div>
          <div>
            <p className="font-display font-700 text-sm text-white/70 leading-none">
              {formatCompactBRL(forecast)}
            </p>
            <p className="text-[8px] uppercase tracking-widest text-white/30 mt-1">
              Forecast
            </p>
          </div>
          <div>
            <p className="font-display font-700 text-sm text-red-400/80 leading-none">
              − {formatCompactBRL(remaining)}
            </p>
            <p className="text-[8px] text-white/30 mt-1">
              <span className="uppercase tracking-widest">Faltante</span>
              <span className="text-white/25 normal-case tracking-normal ml-1">
                ({remainingStudents} {remainingStudents === 1 ? 'aluno' : 'alunos'})
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* % atingido + descrição */}
      <div className="mb-3 mt-1">
        <p
          className="font-display font-800 leading-none"
          style={{ color: accentColor, fontSize: '40px' }}
        >
          {Math.round(wonPct)}%
        </p>
        <p className="text-[11px] text-white/50 mt-1.5">
          da meta de {formatCompactBRL(revenueGoal)} atingida
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="mt-auto">
        <div className="relative h-2.5 bg-teal-700/30 rounded-full overflow-hidden flex">
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${wonPct}%`, background: accentColor }}
          />
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${forecastPct}%`, background: accentColor, opacity: 0.4 }}
          />
        </div>

        {/* Marcadores do eixo */}
        <div className="relative h-4 mt-1">
          {axisMarks.map((m) => (
            <span
              key={m.position}
              className="absolute text-[8px] text-white/30 -translate-x-1/2"
              style={{ left: `${m.position}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: accentColor }}
            />
            <span className="text-[9px] text-white/55">
              Ganho: {formatCompactBRL(totalWonValue)} ({Math.round(wonPct)}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: accentColor, opacity: 0.4 }}
            />
            <span className="text-[9px] text-white/55">
              Forecast: {formatCompactBRL(forecast)} ({Math.round(forecastPct)}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-700/50" />
            <span className="text-[9px] text-white/55">
              Meta: {formatCompactBRL(revenueGoal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
