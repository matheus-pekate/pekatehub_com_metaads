import { useState } from 'react'
import { formatDate } from './format'

const MS_PER_DAY = 86400000

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: '1d', label: 'Último dia' },
  { key: '7d', label: 'Última semana' },
]

function filterByWindow(leads, key) {
  if (key === 'all') return leads
  const days = key === '1d' ? 1 : 7
  const cutoff = Date.now() - days * MS_PER_DAY
  return leads.filter((l) => l.add_time && new Date(l.add_time).getTime() >= cutoff)
}

export function LeadsListModal({ program, initialFilter = 'all', onClose }) {
  const [filter, setFilter] = useState(initialFilter)
  if (!program) return null

  const allLeads = program.leadsList ?? []
  const leads = filterByWindow(allLeads, filter)
  const sorted = [...leads].sort((a, b) => new Date(b.add_time) - new Date(a.add_time))

  return (
    <div className="pkt-ad-detail-overlay" onClick={onClose}>
      <div className="pkt-won-deals" onClick={(e) => e.stopPropagation()}>
        <button className="pkt-ad-detail__close" onClick={onClose}>✕</button>
        <div className="pkt-ad-detail__header">
          <div>
            <h3 className="pkt-ad-detail__title">{program.name} — Leads</h3>
            <span className="pkt-ad-detail__subtitle">
              {sorted.length} lead{sorted.length === 1 ? '' : 's'} do Meta Ads
            </span>
          </div>
        </div>

        <div className="pkt-leads-list__tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`pkt-leads-list__tab ${filter === f.key ? 'pkt-leads-list__tab--active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="pkt-leads-list__tab-count">{filterByWindow(allLeads, f.key).length}</span>
            </button>
          ))}
        </div>

        <div className="pkt-won-deals__body">
          {sorted.length === 0 && (
            <div className="pkt-ad-detail__state">Nenhum lead do Meta Ads neste período ainda.</div>
          )}
          {sorted.length > 0 && (
            <div className="pkt-won-deals__list">
              <div className="pkt-won-deals__row pkt-won-deals__row--header">
                <span>Pessoa</span>
                <span>Anúncio</span>
                <span>Capturado em</span>
              </div>
              {sorted.map((lead) => (
                <div key={lead.record_id} className="pkt-won-deals__row">
                  <span className="pkt-won-deals__person" title={lead.person_name}>
                    {lead.person_name}
                  </span>
                  <span className="pkt-won-deals__ad">
                    {lead.ad_name ? (
                      <>
                        <span className="pkt-won-deals__ad-name">{lead.ad_name}</span>
                        {(lead.campaign_name || lead.adset_name) && (
                          <span className="pkt-won-deals__ad-meta">
                            {[lead.campaign_name, lead.adset_name].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="pkt-won-deals__ad-unknown">Anúncio não disponível</span>
                    )}
                  </span>
                  <span className="pkt-won-deals__date">{formatDate(lead.add_time)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
