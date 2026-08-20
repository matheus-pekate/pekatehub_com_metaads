import { formatBRL, formatDate } from './format'
import { buildPipedriveDealUrl } from '../../config/pipedrive'

export function InvestidoRetornoModal({ program, onClose }) {
  if (!program) return null
  const { totalLifetimeSpend, totalWonValue, wonDeals } = program
  const invested = totalLifetimeSpend || 0
  const returned = totalWonValue || 0
  const roi = invested > 0 ? returned / invested : null
  const profit = returned - invested
  const deals = [...(wonDeals ?? [])].sort((a, b) => (b.deal_value || 0) - (a.deal_value || 0))

  return (
    <div className="pkt-ad-detail-overlay" onClick={onClose}>
      <div className="pkt-won-deals" onClick={(e) => e.stopPropagation()}>
        <button className="pkt-ad-detail__close" onClick={onClose}>✕</button>
        <div className="pkt-ad-detail__header">
          <div>
            <h3 className="pkt-ad-detail__title">{program.name} — Investido x Retorno</h3>
            <span className="pkt-ad-detail__subtitle">
              Retorno somado a partir do valor de cada negócio ganho no Pipedrive vindo do Meta Ads
            </span>
          </div>
        </div>

        <div className="pkt-roi__summary">
          <div className="pkt-roi__stat">
            <span className="pkt-roi__stat-value">{formatBRL(invested)}</span>
            <span className="pkt-roi__stat-label">Investido</span>
          </div>
          <div className="pkt-roi__stat pkt-roi__stat--return">
            <span className="pkt-roi__stat-value">{formatBRL(returned)}</span>
            <span className="pkt-roi__stat-label">Retorno</span>
          </div>
          <div className={`pkt-roi__stat ${profit >= 0 ? 'pkt-roi__stat--positive' : 'pkt-roi__stat--negative'}`}>
            <span className="pkt-roi__stat-value">
              {roi != null ? `${roi.toFixed(1)}x` : '—'}
            </span>
            <span className="pkt-roi__stat-label">Retorno sobre investido</span>
          </div>
        </div>

        <div className="pkt-won-deals__body">
          {deals.length === 0 && (
            <div className="pkt-ad-detail__state">Nenhum negócio ganho do Meta Ads para este programa ainda.</div>
          )}
          {deals.length > 0 && (
            <div className="pkt-won-deals__list">
              <div className="pkt-won-deals__row pkt-won-deals__row--header pkt-won-deals__row--won">
                <span>Pessoa</span>
                <span>Anúncio</span>
                <span>Valor</span>
                <span>Ganho em</span>
                <span>Última atividade</span>
              </div>
              {deals.map((deal) => (
                <div key={deal.deal_id} className="pkt-won-deals__row pkt-won-deals__row--won">
                  <a
                    className="pkt-won-deals__person pkt-lost-deals__person-link"
                    href={buildPipedriveDealUrl(deal.deal_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={deal.deal_title}
                  >
                    {deal.person_name || deal.deal_title}
                  </a>
                  <span className="pkt-won-deals__ad">
                    {deal.ad_name ? (
                      <>
                        <span className="pkt-won-deals__ad-name">{deal.ad_name}</span>
                        {(deal.campaign_name || deal.adset_name) && (
                          <span className="pkt-won-deals__ad-meta">
                            {[deal.campaign_name, deal.adset_name].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="pkt-won-deals__ad-unknown">Anúncio não disponível (ganho antes do rastreamento)</span>
                    )}
                  </span>
                  <span className="pkt-won-deals__date">{deal.deal_value != null ? formatBRL(deal.deal_value) : '—'}</span>
                  <span className="pkt-won-deals__date">{formatDate(deal.won_time)}</span>
                  <span className="pkt-won-deals__date">
                    {deal.last_activity_date ? formatDate(deal.last_activity_date) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
