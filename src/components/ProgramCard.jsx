import { Target, Users, Calendar } from 'lucide-react'

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${day} ${months[parseInt(month) - 1]} ${year}`
}

function daysUntil(dateStr) {
  const today = new Date()
  const target = new Date(dateStr + 'T00:00:00')
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Iniciado'
  if (diff === 0) return 'Hoje'
  return `${diff} dias`
}

export function ProgramCard({ program, isSelected, onClick }) {
  const { name, shortName, startDate, goal, converted, totalActive, goalPercent, accentColor } = program

  const barWidth = `${goalPercent}%`
  const daysLeft = daysUntil(startDate)
  const started = daysLeft === 'Iniciado'

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full text-left p-6 rounded-lg border transition-all duration-300 cursor-pointer
        ${isSelected
          ? 'border-brand-orange/60 bg-teal-800/80 shadow-lg shadow-brand-orange/5'
          : 'border-teal-700/40 bg-teal-900/40 hover:border-teal-600/60 hover:bg-teal-800/50'
        }
      `}
    >
      {/* Indicador de seleção */}
      {isSelected && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg"
          style={{ background: accentColor }}
        />
      )}

      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">{shortName}</p>
          <h3 className="font-display font-700 text-xl text-white leading-tight">{name}</h3>
        </div>
        <div className="text-right">
          <p
            className="font-display font-800 text-4xl leading-none"
            style={{ color: accentColor }}
          >
            {converted}
          </p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">convertidos</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] text-white/30 uppercase tracking-widest">
            Progresso para meta
          </span>
          <span className="text-[10px] font-700 text-white/60">
            {converted}/{goal} ({goalPercent}%)
          </span>
        </div>
        <div className="h-1.5 bg-teal-700/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: barWidth, background: accentColor }}
          />
        </div>
      </div>

      {/* Rodapé */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-white/40">
          <Users size={11} />
          <span className="text-xs">{totalActive} no funil</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={11} className={started ? 'text-brand-orange/60' : 'text-white/30'} />
          <span className={`text-xs ${started ? 'text-brand-orange/70' : 'text-white/40'}`}>
            {started ? 'Turma iniciada' : `Início em ${daysLeft}`}
          </span>
        </div>
      </div>
    </button>
  )
}
