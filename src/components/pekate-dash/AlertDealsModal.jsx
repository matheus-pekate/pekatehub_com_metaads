import { useState } from 'react'
import { buildPipedriveDealUrl } from '../../config/pipedrive'

const ALERT_META = {
  critico: { title: 'Leads críticos', hint: 'Sem movimentação há mais de 14 dias' },
  pendencia: { title: 'Pendências de follow-up', hint: 'Estágio inicial, 3 a 14 dias sem contato' },
  oportunidade: { title: 'Oportunidades avançadas', hint: 'Leads em estágio avançado do funil' },
  semAvanco: { title: 'Leads sem avanço', hint: 'Escolha o tipo para ver os leads' },
}

export function AlertDealsModal({ open, alertKey, alert, onClose }) {
  const [groupKey, setGroupKey] = useState(null)
  if (!open) return null

  const meta = ALERT_META[alertKey]
  // Alertas com grupos (Leads sem avanço) mostram as opções como abas.
  const groups = alert?.groups
  const activeGroup = groups && (groups.find((g) => g.key === groupKey) || groups[0])
  const deals = activeGroup ? activeGroup.deals : alert?.deals || []

  const close = () => {
    setGroupKey(null)
    onClose()
  }

  return (
    <div className="pkt-alert-modal-overlay" onClick={close}>
      <div className="pkt-alert-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pkt-alert-modal__close" onClick={close}>✕</button>

        <header className="pkt-alert-modal__header">
          <span className="pkt-alert-modal__eyebrow">{deals.length} {deals.length === 1 ? 'lead' : 'leads'}</span>
          <h2 className="pkt-alert-modal__title">{meta?.title || 'Detalhes do alerta'}</h2>
          <p className="pkt-alert-modal__hint">{activeGroup?.hint || meta?.hint}</p>
        </header>

        {groups && (
          <div className="pkt-alert-modal__tabs">
            {groups.map((g) => (
              <button
                key={g.key}
                className={`pkt-alert-modal__tab${g.key === activeGroup.key ? ' pkt-alert-modal__tab--active' : ''}`}
                onClick={() => setGroupKey(g.key)}
              >
                <span>{g.label}</span>
                <span className="pkt-alert-modal__tab-count">{g.deals.length}</span>
              </button>
            ))}
          </div>
        )}

        {deals.length === 0 ? (
          <div className="pkt-alert-modal__empty">
            <span className="pkt-alert-modal__empty-icon">✓</span>
            <p>Nenhum lead nessa categoria no momento.</p>
          </div>
        ) : (
          <div className="pkt-alert-modal__list">
            {deals.map((d) => (
              <div key={d.id} className="pkt-alert-modal__deal">
                <a
                  className="pkt-alert-modal__deal-title"
                  href={buildPipedriveDealUrl(d.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {d.title}
                </a>
                <span className="pkt-alert-modal__deal-stage">{d.stageName}</span>
                <span className="pkt-alert-modal__deal-owner">{d.ownerName}</span>
                <span className="pkt-alert-modal__deal-idle">
                  {d.overdue != null
                    ? `atrasada há ${d.overdue} ${d.overdue === 1 ? 'dia' : 'dias'}`
                    : `${d.idle} ${d.idle === 1 ? 'dia' : 'dias'} parado`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
