import { formatDate } from './format'

export function WonDealsModal({ program, onClose }) {
  if (!program) return null
  const deals = program.wonDeals ?? []

  return (
    <div className="pkt-ad-detail-overlay" onClick={onClose}>
      <div className="pkt-won-deals" onClick={(e) => e.stopPropagation()}>
        <button className="pkt-ad-detail__close" onClick={onClose}>✕</button>
        <div className="pkt-ad-detail__header">
          <div>
            <h3 className="pkt-ad-detail__title">{program.name} — Convertidos e Ganhos</h3>
            <span className="pkt-ad-detail__subtitle">
              {deals.length} negócio{deals.length === 1 ? '' : 's'} ganho{deals.length === 1 ? '' : 's'} vindo{deals.length === 1 ? '' : 's'} do Meta Ads
            </span>
          </div>
        </div>
        <div className="pkt-won-deals__body">
          {deals.length === 0 && (
            <div className="pkt-ad-detail__state">Nenhum negócio ganho do Meta Ads para este programa ainda.</div>
          )}
          {deals.length > 0 && (
            <div className="pkt-won-deals__list">
              <div className="pkt-won-deals__row pkt-won-deals__row--header">
                <span>Pessoa</span>
                <span>Anúncio</span>
                <span>Ganho em</span>
              </div>
              {deals.map((deal) => (
                <div key={deal.deal_id} className="pkt-won-deals__row">
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
                      <span className="pkt-won-deals__ad-unknown">Anúncio não disponível (ganho antes do rastreamento)</span>
                    )}
                  </span>
                  <span className="pkt-won-deals__date">{formatDate(deal.won_time)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
