import { formatDate } from './format'

export function LostDealsModal({ program, onClose }) {
  if (!program) return null
  const deals = program.lostDeals ?? []
  const reasons = program.lostReasons ?? []
  const maxCount = reasons.length > 0 ? reasons[0].count : 0

  return (
    <div className="pkt-ad-detail-overlay" onClick={onClose}>
      <div className="pkt-lost-deals" onClick={(e) => e.stopPropagation()}>
        <button className="pkt-ad-detail__close" onClick={onClose}>✕</button>
        <div className="pkt-ad-detail__header">
          <div>
            <h3 className="pkt-ad-detail__title">{program.name} — Perdidos</h3>
            <span className="pkt-ad-detail__subtitle">
              {deals.length} negócio{deals.length === 1 ? '' : 's'} perdido{deals.length === 1 ? '' : 's'} vindo{deals.length === 1 ? '' : 's'} do Meta Ads
            </span>
          </div>
        </div>

        {reasons.length > 0 && (
          <div className="pkt-lost-deals__reasons">
            <span className="pkt-lost-deals__reasons-title">Maiores motivos de perda</span>
            {reasons.map((r) => (
              <div key={r.reason} className="pkt-lost-deals__reason-row">
                <span className="pkt-lost-deals__reason-label" title={r.reason}>{r.reason}</span>
                <div className="pkt-lost-deals__reason-bar-track">
                  <div
                    className="pkt-lost-deals__reason-bar-fill"
                    style={{ width: `${maxCount > 0 ? (r.count / maxCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="pkt-lost-deals__reason-count">{r.count}</span>
              </div>
            ))}
          </div>
        )}

        <div className="pkt-won-deals__body">
          {deals.length === 0 && (
            <div className="pkt-ad-detail__state">Nenhum negócio perdido do Meta Ads para este programa ainda.</div>
          )}
          {deals.length > 0 && (
            <div className="pkt-won-deals__list">
              <div className="pkt-won-deals__row pkt-won-deals__row--header pkt-lost-deals__row--header">
                <span>Pessoa</span>
                <span>Anúncio</span>
                <span>Motivo</span>
                <span>Perdido em</span>
              </div>
              {deals.map((deal) => (
                <div key={deal.deal_id} className="pkt-won-deals__row pkt-lost-deals__row">
                  <span className="pkt-won-deals__person" title={deal.deal_title}>{deal.person_name || deal.deal_title}</span>
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
                      <span className="pkt-won-deals__ad-unknown">Anúncio não disponível (perdido antes do rastreamento)</span>
                    )}
                  </span>
                  <span className="pkt-lost-deals__reason-cell" title={deal.lost_reason}>{deal.lost_reason}</span>
                  <span className="pkt-won-deals__date">{formatDate(deal.lost_time)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
