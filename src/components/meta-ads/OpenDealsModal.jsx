import { formatDate } from './format'
import { buildPipedriveDealUrl } from '../../config/pipedrive'

export function OpenDealsModal({ program, onClose }) {
  if (!program) return null
  const deals = program.openDeals ?? []

  return (
    <div className="pkt-ad-detail-overlay" onClick={onClose}>
      <div className="pkt-won-deals" onClick={(e) => e.stopPropagation()}>
        <button className="pkt-ad-detail__close" onClick={onClose}>✕</button>
        <div className="pkt-ad-detail__header">
          <div>
            <h3 className="pkt-ad-detail__title">{program.name} — Em Aberto</h3>
            <span className="pkt-ad-detail__subtitle">
              {deals.length} negócio{deals.length === 1 ? '' : 's'} em aberto vindo{deals.length === 1 ? '' : 's'} do Meta Ads
            </span>
          </div>
        </div>
        <div className="pkt-won-deals__body">
          {deals.length === 0 && (
            <div className="pkt-ad-detail__state">Nenhum negócio em aberto do Meta Ads para este programa no momento.</div>
          )}
          {deals.length > 0 && (
            <div className="pkt-won-deals__list">
              <div className="pkt-won-deals__row pkt-won-deals__row--header pkt-won-deals__row--with-activity">
                <span>Pessoa</span>
                <span>Anúncio</span>
                <span>Aberto em</span>
                <span>Última atividade</span>
              </div>
              {deals.map((deal) => (
                <div key={deal.deal_id} className="pkt-won-deals__row pkt-won-deals__row--with-activity">
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
                      <span className="pkt-won-deals__ad-unknown">Anúncio não disponível</span>
                    )}
                  </span>
                  <span className="pkt-won-deals__date">{formatDate(deal.add_time)}</span>
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
