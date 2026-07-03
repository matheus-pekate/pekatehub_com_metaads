import { formatBRL, formatCompactNumber } from './format'
import { AdsList } from './AdsList'

export function ProgramDetail({ program }) {
  if (!program) return null
  const { name, hasActiveCampaigns, totalLeads, cplMedio, totalReach, ads, leadsLast1Day, leadsLast7Days } = program

  return (
    <div className="pkt-meta-detail">
      <div className="pkt-meta-detail__header">
        <h2 className="pkt-meta-detail__title">{name}</h2>
        {hasActiveCampaigns ? (
          <span className="pkt-meta-detail__badge">{ads.length} anúncio{ads.length === 1 ? '' : 's'} ativo{ads.length === 1 ? '' : 's'}</span>
        ) : (
          <span className="pkt-meta-detail__badge pkt-meta-detail__badge--muted">Sem campanha ativa</span>
        )}
      </div>

      <div className="pkt-meta-detail__stats">
        <div className="pkt-meta-detail__stat">
          <span className="pkt-meta-detail__stat-value">{hasActiveCampaigns ? totalLeads : '—'}</span>
          <span className="pkt-meta-detail__stat-label">Leads</span>
        </div>
        <div className="pkt-meta-detail__stat">
          <span className="pkt-meta-detail__stat-value">{hasActiveCampaigns ? formatBRL(cplMedio) : '—'}</span>
          <span className="pkt-meta-detail__stat-label">CPL médio</span>
        </div>
        <div className="pkt-meta-detail__stat">
          <span className="pkt-meta-detail__stat-value">{hasActiveCampaigns ? formatCompactNumber(totalReach) : '—'}</span>
          <span className="pkt-meta-detail__stat-label">Alcance</span>
        </div>
      </div>

      {hasActiveCampaigns ? (
        <>
          <AdsList ads={ads} />
          <div className="pkt-meta-recent">
            <div className="pkt-meta-recent__card">
              <span className="pkt-meta-recent__value">{leadsLast1Day}</span>
              <span className="pkt-meta-recent__label">Leads no último dia</span>
            </div>
            <div className="pkt-meta-recent__card">
              <span className="pkt-meta-recent__value">{leadsLast7Days}</span>
              <span className="pkt-meta-recent__label">Leads na última semana</span>
            </div>
          </div>
        </>
      ) : (
        <div className="pkt-meta-detail__empty">Nenhuma campanha ativa para este programa no momento.</div>
      )}
    </div>
  )
}
