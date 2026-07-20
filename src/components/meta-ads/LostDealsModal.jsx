import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDate } from './format'
import { buildPipedriveDealUrl } from '../../config/pipedrive'

// Paleta categórica validada (CVD-safe, ordem fixa — ver skill de dataviz).
// Sempre atribuída na mesma ordem, nunca ciclada por valor.
const REASON_COLORS = ['#2a78d6', '#008300', '#e87ba4', '#eda100', '#1baf7a', '#eb6834', '#4a3aa7', '#e34948']

function ReasonTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const { reason, count } = payload[0].payload
  return (
    <div className="pkt-ad-detail__tooltip">
      <p className="pkt-ad-detail__tooltip-label">{reason}</p>
      <p><strong>{count}</strong> negóci{count === 1 ? 'o' : 'os'}</p>
    </div>
  )
}

export function LostDealsModal({ program, onClose }) {
  const [selectedReason, setSelectedReason] = useState(null)
  if (!program) return null

  const deals = program.lostDeals ?? []
  const reasons = program.lostReasons ?? []
  const filteredDeals = selectedReason ? deals.filter((d) => d.lost_reason === selectedReason) : deals

  const toggleReason = (reason) => {
    setSelectedReason((current) => (current === reason ? null : reason))
  }

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
            <span className="pkt-lost-deals__reasons-title">Maiores motivos de perda · clique pra filtrar</span>
            <div className="pkt-lost-deals__reasons-body">
              <div className="pkt-lost-deals__pie">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasons}
                      dataKey="count"
                      nameKey="reason"
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={60}
                      paddingAngle={2}
                      isAnimationActive={false}
                      onClick={(entry) => toggleReason(entry.reason)}
                    >
                      {reasons.map((r, i) => (
                        <Cell
                          key={r.reason}
                          fill={REASON_COLORS[i % REASON_COLORS.length]}
                          opacity={selectedReason && selectedReason !== r.reason ? 0.35 : 1}
                          stroke={selectedReason === r.reason ? '#08373f' : undefined}
                          strokeWidth={selectedReason === r.reason ? 2 : 0}
                          style={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ReasonTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pkt-lost-deals__legend">
                {reasons.map((r, i) => (
                  <div
                    key={r.reason}
                    className={`pkt-lost-deals__legend-row${selectedReason === r.reason ? ' pkt-lost-deals__legend-row--active' : ''}`}
                    onClick={() => toggleReason(r.reason)}
                  >
                    <i className="pkt-lost-deals__legend-swatch" style={{ background: REASON_COLORS[i % REASON_COLORS.length] }} />
                    <span className="pkt-lost-deals__legend-label" title={r.reason}>{r.reason}</span>
                    <span className="pkt-lost-deals__legend-count">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedReason && (
          <div className="pkt-lost-deals__filter-bar">
            <span>
              Filtrando por <strong>{selectedReason}</strong> · {filteredDeals.length} negóci{filteredDeals.length === 1 ? 'o' : 'os'}
            </span>
            <button className="pkt-lost-deals__filter-clear" onClick={() => setSelectedReason(null)}>
              Tirar filtro ✕
            </button>
          </div>
        )}

        <div className="pkt-won-deals__body">
          {filteredDeals.length === 0 && (
            <div className="pkt-ad-detail__state">
              {selectedReason
                ? 'Nenhum negócio perdido com esse motivo.'
                : 'Nenhum negócio perdido do Meta Ads para este programa ainda.'}
            </div>
          )}
          {filteredDeals.length > 0 && (
            <div className="pkt-won-deals__list">
              <div className="pkt-won-deals__row pkt-won-deals__row--header pkt-lost-deals__row--header">
                <span>Pessoa</span>
                <span>Anúncio</span>
                <span>Motivo</span>
                <span>Perdido em</span>
              </div>
              {filteredDeals.map((deal) => (
                <div key={deal.deal_id} className="pkt-won-deals__row pkt-lost-deals__row">
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
