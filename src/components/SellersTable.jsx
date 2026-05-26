function formatRelativeDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays}d atrás`
  return `${Math.floor(diffDays / 7)}sem atrás`
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function TopPerformerCard({ seller, accentColor }) {
  return (
    <div
      className="flex flex-col items-center justify-center p-5 rounded-lg border h-full"
      style={{ borderColor: `${accentColor}30`, background: `${accentColor}08` }}
    >
      <p
        className="text-[10px] uppercase tracking-[0.2em] mb-4 font-700"
        style={{ color: `${accentColor}AA` }}
      >
        Melhor performance
      </p>

      {/* Foto */}
      {seller.avatarUrl ? (
        <img
          src={seller.avatarUrl}
          alt={seller.name}
          className="w-24 h-24 rounded-full object-cover mb-3"
          style={{ outline: `3px solid ${accentColor}`, outlineOffset: '3px' }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      ) : (
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-700 mb-3"
          style={{
            background: `${accentColor}25`,
            color: accentColor,
            outline: `3px solid ${accentColor}`,
            outlineOffset: '3px',
          }}
        >
          {seller.name.charAt(0).toUpperCase()}
        </div>
      )}

      <p className="text-white text-base font-700 text-center mt-3 mb-5 leading-tight">
        {seller.name}
      </p>

      <div className="w-full grid grid-cols-2 gap-2">
        <div
          className="rounded-lg px-3 py-3 text-center"
          style={{ background: `${accentColor}18` }}
        >
          <p className="text-[9px] uppercase tracking-wider text-white/40 mb-1.5 leading-tight">
            Leads convertidos
          </p>
          <p className="font-display font-800 text-2xl leading-none" style={{ color: accentColor }}>
            {seller.converted}
          </p>
        </div>
        <div className="rounded-lg px-3 py-3 text-center bg-teal-800/40 flex flex-col justify-between">
          <p className="text-[9px] uppercase tracking-wider text-white/40 mb-1.5 leading-tight">
            Valor de conversão
          </p>
          <p className="font-display font-700 text-sm text-white/85 leading-none">
            {formatCurrency(seller.convertedValue)}
          </p>
        </div>
      </div>
    </div>
  )
}

function EmptyTopPerformerCard() {
  return (
    <div
      className="flex flex-col items-center justify-center p-5 rounded-lg border border-dashed h-full text-center"
      style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/25 mb-4 font-700">
        Melhor performance
      </p>

      <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl text-white/20 bg-white/[0.03] border border-dashed border-white/10 mb-4">
        —
      </div>

      <p className="text-white/50 text-sm font-600 mb-1">Nenhuma conversão ainda</p>
      <p className="text-white/30 text-xs leading-relaxed px-2 max-w-[220px]">
        Quando algum vendedor converter um lead neste programa, ele aparecerá aqui em destaque.
      </p>
    </div>
  )
}

export function SellersTable({ sellers, programId, accentColor, programGoal }) {
  const individualGoal = Math.round(programGoal / 3)

  const programSellers = sellers
    .map((s) => ({
      ...s,
      ...(s.programs[programId] || { converted: 0, convertedValue: 0, active: 0, lastActivity: null }),
    }))
    .filter((s) => s.active > 0 || s.converted > 0)
    .sort((a, b) => b.converted - a.converted)

  if (programSellers.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-white/20 text-sm">
        Nenhum vendedor com deals neste programa
      </div>
    )
  }

  const topSeller = programSellers[0]

  return (
    <div className="flex gap-5 h-full">
      {/* Destaque — melhor vendedor */}
      <div className="w-1/2 flex-shrink-0">
        {topSeller.converted > 0 ? (
          <TopPerformerCard seller={topSeller} accentColor={accentColor} />
        ) : (
          <EmptyTopPerformerCard />
        )}
      </div>

      {/* Lista de todos os vendedores */}
      <div className="flex-1 space-y-3">
        {programSellers.map((seller, idx) => {
          const pct = Math.min(100, Math.round((seller.converted / individualGoal) * 100))
          const isLeading = idx === 0 && seller.converted > 0

          return (
            <div
              key={seller.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-teal-900/30 border border-teal-700/20"
            >
              {/* Avatar */}
              {seller.avatarUrl ? (
                <img
                  src={seller.avatarUrl}
                  alt={seller.name}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  style={isLeading ? { outline: `2px solid ${accentColor}`, outlineOffset: '2px' } : undefined}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-700 flex-shrink-0"
                  style={
                    isLeading
                      ? { background: `${accentColor}30`, color: accentColor }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                  }
                >
                  {seller.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Nome e progresso */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-white/80 truncate">{seller.name}</span>
                  <span className="text-xs text-white/30 ml-2 flex-shrink-0">
                    última mov.: {formatRelativeDate(seller.lastActivity)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 bg-teal-700/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: accentColor }}
                    />
                  </div>
                  <span
                    className="text-xs font-700 flex-shrink-0 w-20 text-right"
                    style={{ color: accentColor }}
                  >
                    {seller.converted}/{individualGoal}
                  </span>
                </div>
              </div>

              {/* Deals ativos */}
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-display font-700 text-white/60">{seller.active}</p>
                <p className="text-[10px] text-white/25 uppercase tracking-widest">no funil</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
