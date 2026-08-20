import { formatBRL, formatCompactNumber } from './format'
import { AdsList } from './AdsList'
import { ProgramDailyChart } from './ProgramDailyChart'

export function ProgramDetail({ program, onSelectAd, onOpenWonDeals, onOpenLostDeals, onOpenOpenDeals, onOpenLeadsList }) {
  if (!program) return null
  const { id, name, hasActiveCampaigns, totalLeads, cplMedio, totalReach, totalLifetimeSpend, ads, leadsLast1Day, leadsLast7Days, totalWon, totalLost, totalOpen } = program

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
        <div className="pkt-meta-detail__stats-left">
          <div className="pkt-meta-detail__stats-group">
            <span className="pkt-meta-detail__stats-group-caption">Todo o histórico do Meta Ads</span>
            <div className="pkt-meta-detail__stat">
              <span className="pkt-meta-detail__stat-value">{totalLeads}</span>
              <span className="pkt-meta-detail__stat-label">Leads (ganhos + perdidos + em aberto)</span>
            </div>
          </div>
          <div className="pkt-meta-detail__stats-group">
            <span className="pkt-meta-detail__stats-group-caption">Últimos 30 dias</span>
            <div className="pkt-meta-detail__stats-group-row">
              <div className="pkt-meta-detail__stat">
                <span className="pkt-meta-detail__stat-value">{hasActiveCampaigns ? formatBRL(cplMedio) : '—'}</span>
                <span className="pkt-meta-detail__stat-label">CPL médio</span>
              </div>
              <div className="pkt-meta-detail__stat">
                <span className="pkt-meta-detail__stat-value">{hasActiveCampaigns ? formatCompactNumber(totalReach) : '—'}</span>
                <span className="pkt-meta-detail__stat-label">Alcance</span>
              </div>
            </div>
          </div>
          <div className="pkt-meta-detail__stats-group">
            <span className="pkt-meta-detail__stats-group-caption">
              {hasActiveCampaigns ? 'Desde o início da campanha' : 'Última campanha · encerrada'}
            </span>
            <div className="pkt-meta-detail__stat">
              <span className="pkt-meta-detail__stat-value">{formatBRL(totalLifetimeSpend)}</span>
              <span className="pkt-meta-detail__stat-label">Investido</span>
            </div>
          </div>
        </div>

        <div className="pkt-meta-detail__stats-right">
          <span className="pkt-meta-detail__stats-right-caption">Desde o início da campanha</span>
          <div className="pkt-meta-detail__stats-right-row">
            <div
              className={`pkt-meta-detail__stat ${totalWon > 0 ? 'pkt-meta-detail__stat--clickable' : ''}`}
              onClick={totalWon > 0 ? () => onOpenWonDeals(program) : undefined}
            >
              <span className="pkt-meta-detail__stat-value">{totalWon}</span>
              <span className="pkt-meta-detail__stat-label">Convertidos e Ganhos</span>
            </div>
            <div
              className={`pkt-meta-detail__stat ${totalLost > 0 ? 'pkt-meta-detail__stat--clickable' : ''}`}
              onClick={totalLost > 0 ? () => onOpenLostDeals(program) : undefined}
            >
              <span className="pkt-meta-detail__stat-value">{totalLost}</span>
              <span className="pkt-meta-detail__stat-label">Perdidos</span>
            </div>
            <div
              className={`pkt-meta-detail__stat ${totalOpen > 0 ? 'pkt-meta-detail__stat--clickable' : ''}`}
              onClick={totalOpen > 0 ? () => onOpenOpenDeals(program) : undefined}
            >
              <span className="pkt-meta-detail__stat-value">{totalOpen}</span>
              <span className="pkt-meta-detail__stat-label">Em Aberto</span>
            </div>
          </div>
        </div>
      </div>

      {hasActiveCampaigns ? (
        <>
          <AdsList ads={ads} groupByCampaign={id === 'outros'} onSelectAd={onSelectAd} />
          <div className="pkt-meta-recent">
            <div className="pkt-meta-recent__card pkt-meta-recent__card--clickable" onClick={() => onOpenLeadsList(program, '1d')}>
              <span className="pkt-meta-recent__value">{leadsLast1Day}</span>
              <span className="pkt-meta-recent__label">Leads no último dia</span>
            </div>
            <div className="pkt-meta-recent__card pkt-meta-recent__card--clickable" onClick={() => onOpenLeadsList(program, '7d')}>
              <span className="pkt-meta-recent__value">{leadsLast7Days}</span>
              <span className="pkt-meta-recent__label">Leads na última semana</span>
            </div>
          </div>
          <ProgramDailyChart programId={id} accentColor={program.accentColor} />
        </>
      ) : (
        <div className="pkt-meta-detail__empty">Nenhuma campanha ativa para este programa no momento.</div>
      )}
    </div>
  )
}
