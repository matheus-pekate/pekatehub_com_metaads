import { formatCompactBRL, formatRelativeDate } from './format.js'

const RANK_VARIANTS = ['b', 'a', 'c']

function EmptyTeam({ programShortName }) {
  return (
    <aside className="pkt-team pkt-team--empty">
      <header className="pkt-team__head">
        <span className="pkt-team__eyebrow">Time comercial · {programShortName}</span>
        <h3 className="pkt-team__title">Quem está fechando</h3>
      </header>
      <div className="pkt-team__empty-body">
        <p>Sem vendedores ativos neste programa.</p>
      </div>
    </aside>
  )
}

export function TeamCard({ program, allSellers }) {
  if (!program) return null

  const programId = program.id

  const programSellers = (allSellers || [])
    .map((s) => ({
      id: s.id,
      name: s.name,
      avatarUrl: s.avatarUrl,
      ...(s.programs?.[programId] || { converted: 0, convertedValue: 0, active: 0, lastActivity: null }),
    }))
    .filter((s) => s.converted > 0 || s.active > 0)
    .sort((a, b) => b.converted - a.converted)

  if (programSellers.length === 0) {
    return <EmptyTeam programShortName={program.shortName} />
  }

  const top = programSellers[0]
  const rest = programSellers.slice(1, 4)
  const topValue = top.convertedValue || top.converted * (program.price || 0)

  return (
    <aside className="pkt-team">
      <header className="pkt-team__head">
        <span className="pkt-team__eyebrow">Time comercial · {program.shortName}</span>
        <h3 className="pkt-team__title">Quem está fechando</h3>
      </header>

      <div className="pkt-podium">
        <div className="pkt-podium__photo">
          {top.avatarUrl ? (
            <img src={top.avatarUrl} alt={top.name} className="pkt-podium__img" />
          ) : (
            <span className="pkt-podium__initial">{top.name?.charAt(0)?.toUpperCase() || '—'}</span>
          )}
        </div>
        <div className="pkt-podium__info">
          <span className="pkt-podium__rank">Top performer</span>
          <div className="pkt-podium__name">{top.name}</div>
          <div className="pkt-podium__stats">
            <strong>{top.converted}</strong> {top.converted === 1 ? 'lead convertido' : 'leads convertidos'} · última mov. <strong>{formatRelativeDate(top.lastActivity)}</strong>
          </div>
        </div>
        <div className="pkt-podium__convert">
          <div className="pkt-podium__convert-num">{formatCompactBRL(topValue)}</div>
          <div className="pkt-podium__convert-label">Valor convertido</div>
        </div>
      </div>

      <div className="pkt-team__list">
        {rest.map((s, i) => (
          <div key={s.id} className="pkt-rank">
            <span className="pkt-rank__pos">{i + 2}º</span>
            <div className={`pkt-rank__avatar pkt-rank__avatar--${RANK_VARIANTS[i % RANK_VARIANTS.length]}`}>
              {s.avatarUrl ? (
                <img src={s.avatarUrl} alt={s.name} className="pkt-rank__avatar-img" />
              ) : (
                <span>{s.name?.charAt(0)?.toUpperCase() || '—'}</span>
              )}
            </div>
            <div className="pkt-rank__main">
              <span className="pkt-rank__name">{s.name}</span>
              <span className="pkt-rank__meta">
                <i></i> <strong>{s.converted}</strong> {s.converted === 1 ? 'convertido' : 'convertidos'} · última mov. {formatRelativeDate(s.lastActivity)} · {s.active} {s.active === 1 ? 'lead ativo' : 'leads ativos'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
