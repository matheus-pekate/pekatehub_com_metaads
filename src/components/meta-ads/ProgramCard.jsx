import { formatBRL, formatCompactNumber } from './format'
import { BestAdCard } from './BestAdCard'

export function ProgramCard({ program }) {
  const { name, hasActiveCampaigns, totalLeads, cplMedio, totalReach, bestAd, ads } = program

  return (
    <div className={`pkt-meta-card ${hasActiveCampaigns ? '' : 'pkt-meta-card--empty'}`}>
      <div className="pkt-meta-card__header">
        <h3 className="pkt-meta-card__title">{name}</h3>
        {hasActiveCampaigns ? (
          <span className="pkt-meta-card__badge">{ads.length} anúncio{ads.length === 1 ? '' : 's'} ativo{ads.length === 1 ? '' : 's'}</span>
        ) : (
          <span className="pkt-meta-card__badge pkt-meta-card__badge--muted">Sem campanha ativa</span>
        )}
      </div>

      <div className="pkt-meta-card__stats">
        <div className="pkt-meta-card__stat">
          <span className="pkt-meta-card__stat-value">{hasActiveCampaigns ? totalLeads : '—'}</span>
          <span className="pkt-meta-card__stat-label">Leads</span>
        </div>
        <div className="pkt-meta-card__stat">
          <span className="pkt-meta-card__stat-value">{hasActiveCampaigns ? formatBRL(cplMedio) : '—'}</span>
          <span className="pkt-meta-card__stat-label">CPL médio</span>
        </div>
        <div className="pkt-meta-card__stat">
          <span className="pkt-meta-card__stat-value">{hasActiveCampaigns ? formatCompactNumber(totalReach) : '—'}</span>
          <span className="pkt-meta-card__stat-label">Alcance</span>
        </div>
      </div>

      {hasActiveCampaigns && <BestAdCard ad={bestAd} />}
    </div>
  )
}
