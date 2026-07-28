import { useEffect, useState } from 'react'
import { fetchParticipantesEvento } from '../../services/eventosApi'
import { formatDate } from '../meta-ads/format'
import { STATUS_LABELS, STATUS_COLORS } from '../../config/eventos'

const FILTERS = ['todos', 'curioso', 'lead', 'negocio', 'nao_compareceu']

export function ParticipantsListModal({ evento, onClose }) {
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('todos')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchParticipantesEvento(evento.event_id, evento.start_date)
      .then((list) => { if (!cancelled) { setParticipantes(list); setError(null) } })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [evento.event_id])

  const filtered = filter === 'todos' ? participantes : participantes.filter((p) => p.status === filter)

  return (
    <div className="pkt-eventos-overlay" onClick={onClose}>
      <div className="pkt-eventos-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pkt-eventos-modal__close" onClick={onClose}>✕</button>
        <div className="pkt-eventos-modal__header">
          <h3 className="pkt-eventos-modal__title">{evento.name}</h3>
          <span className="pkt-eventos-modal__subtitle">
            {evento.totalParticipantes} participantes · {formatDate(evento.start_date)}
          </span>
        </div>

        <div className="pkt-eventos-participants__filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`pkt-eventos-filter ${filter === f ? 'pkt-eventos-filter--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'todos' ? 'Todos' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        <div className="pkt-eventos-participants__body">
          {loading && <div className="pkt-eventos-modal__state">Carregando...</div>}
          {error && <div className="pkt-eventos-modal__state">Falha ao carregar: {error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div className="pkt-eventos-modal__state">Nenhum participante nesse filtro.</div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="pkt-eventos-participants__list">
              <div className="pkt-eventos-participants__row pkt-eventos-participants__row--header">
                <span>Nome</span>
                <span>E-mail</span>
                <span>Telefone</span>
                <span>Presença</span>
                <span>Status</span>
                <span>Situação</span>
              </div>
              {filtered.map((p) => (
                <div key={p.participant_id} className="pkt-eventos-participants__row">
                  <span className="pkt-eventos-participants__nome">
                    {[p.first_name, p.last_name].filter(Boolean).join(' ') || '—'}
                    {(p.job_title || p.company) && (
                      <span className="pkt-eventos-participants__cargo">
                        {[p.job_title, p.company].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </span>
                  <span className="pkt-eventos-participants__email" title={p.email}>{p.email || '—'}</span>
                  <span className="pkt-eventos-participants__phone">{p.phone || '—'}</span>
                  <span className="pkt-eventos-presenca" title={p.check_in_date ? formatDate(p.check_in_date) : ''}>
                    {p.check_in ? '✅ Presente' : '❌ Não compareceu'}
                  </span>
                  <span className="pkt-eventos-status" style={{ '--status-color': STATUS_COLORS[p.status] }}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                  <span className="pkt-eventos-situacao">
                    {p.situacao === 'novo' && '🆕 Novo'}
                    {p.situacao === 'existente' && '👤 Já existia'}
                    {!p.situacao && '—'}
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
