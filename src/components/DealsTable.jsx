import { ArrowUpRight } from 'lucide-react'

function formatRelativeDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays}d atrás`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem atrás`
  return `${Math.floor(diffDays / 30)}m atrás`
}

export function DealsTable({ deals, stages, winStageId, accentColor }) {
  const stageNameMap = {}
  stages.forEach((s) => { stageNameMap[s.id] = s.name })

  // Ordena por estágio mais avançado primeiro
  const stageOrder = stages.reduce((acc, s, idx) => { acc[s.id] = idx; return acc }, {})
  const sorted = [...deals].sort((a, b) => (stageOrder[b.stage_id] || 0) - (stageOrder[a.stage_id] || 0))

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-white/20 text-sm">
        Nenhum deal encontrado neste pipeline
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-teal-700/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-teal-700/30 bg-teal-900/50">
            <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-white/30 font-400">
              Lead
            </th>
            <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-white/30 font-400">
              Etapa
            </th>
            <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-white/30 font-400">
              Responsável
            </th>
            <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-white/30 font-400">
              Atualizado
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((deal, idx) => {
            const isWin = deal.stage_id === winStageId
            const stageName = stageNameMap[deal.stage_id] || '—'
            const ownerName = deal.owner_id?.name || deal.user_id?.name || '—'

            return (
              <tr
                key={deal.id}
                className={`
                  border-b border-teal-700/20 transition-colors hover:bg-teal-800/30
                  ${idx % 2 === 0 ? 'bg-transparent' : 'bg-teal-900/20'}
                `}
              >
                <td className="px-4 py-3 text-white/80 font-400 max-w-[200px] truncate">
                  {deal.title}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded uppercase tracking-widest font-700"
                    style={
                      isWin
                        ? { color: accentColor, background: `${accentColor}20` }
                        : { color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)' }
                    }
                  >
                    {stageName}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/45 text-xs">{ownerName}</td>
                <td className="px-4 py-3 text-right text-white/30 text-xs">
                  {formatRelativeDate(deal.update_time)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
