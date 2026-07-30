import { useEffect, useState } from 'react'
import { fetchTodosParticipantes } from '../../services/eventosApi'
import { formatDate } from '../meta-ads/format'
import { STATUS_LABELS, STATUS_COLORS } from '../../config/eventos'
import { buildPipedrivePersonUrl } from '../../config/pipedrive'

const FILTERS = ['todos', 'curioso', 'lead', 'negocio', 'nao_compareceu']

const DEAL_STATUS_LABELS = {
  todos: 'Todos',
  won: 'Ganho',
  open: 'Em andamento',
  lost: 'Perdido',
}

function getPipedriveLink(p) {
  if (p.pipedrive_person_id) return buildPipedrivePersonUrl(p.pipedrive_person_id)
  return null
}

function csvEscape(value) {
  const str = String(value ?? '')
  if (/[",;\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function exportParticipantesCsv(participantes) {
  const headers = ['Nome', 'Evento', 'E-mail', 'Telefone', 'Empresa', 'Cargo', 'Ingresso', 'Presença', 'Status', 'Situação']
  const rows = participantes.map((p) => [
    [p.first_name, p.last_name].filter(Boolean).join(' '),
    p.event_name || '',
    p.email || '',
    p.phone || '',
    p.company || '',
    p.job_title || '',
    p.ticket_name || '',
    p.check_in ? 'Presente' : 'Não compareceu',
    STATUS_LABELS[p.status] || p.status,
    p.situacao === 'novo' ? 'Novo' : p.situacao === 'existente' ? 'Já existia' : '',
  ])
  const csvContent = '﻿' + [headers, ...rows].map((row) => row.map(csvEscape).join(';')).join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'participantes-todos-eventos.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function GlobalParticipantsModal({ initialFilter = 'todos', onClose }) {
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState(initialFilter)
  const [dealStatusFilter, setDealStatusFilter] = useState('todos')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchTodosParticipantes()
      .then((list) => { if (!cancelled) { setParticipantes(list); setError(null) } })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  let filtered = filter === 'todos' ? participantes : participantes.filter((p) => p.status === filter)
  if (filter === 'negocio' && dealStatusFilter !== 'todos') {
    filtered = filtered.filter((p) => p.pipedrive_deal_status === dealStatusFilter)
  }

  return (
    <div className="pkt-eventos-overlay" onClick={onClose}>
      <div className="pkt-eventos-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pkt-eventos-modal__close" onClick={onClose}>✕</button>
        <div className="pkt-eventos-modal__header">
          <h3 className="pkt-eventos-modal__title">Todos os participantes</h3>
          <span className="pkt-eventos-modal__subtitle">
            {filtered.length} de {participantes.length} participantes · todos os eventos
          </span>
        </div>

        <div className="pkt-eventos-participants__filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`pkt-eventos-filter ${filter === f ? 'pkt-eventos-filter--active' : ''}`}
              onClick={() => { setFilter(f); setDealStatusFilter('todos') }}
            >
              {f === 'todos' ? 'Todos' : STATUS_LABELS[f]}
            </button>
          ))}
          <button
            className="pkt-eventos-export"
            onClick={() => exportParticipantesCsv(filtered)}
            disabled={filtered.length === 0}
          >
            ⬇ Exportar Excel
          </button>
        </div>

        {filter === 'negocio' && (
          <div className="pkt-eventos-participants__filters pkt-eventos-participants__filters--sub">
            {Object.keys(DEAL_STATUS_LABELS).map((ds) => (
              <button
                key={ds}
                className={`pkt-eventos-filter pkt-eventos-filter--sub ${dealStatusFilter === ds ? 'pkt-eventos-filter--active' : ''}`}
                onClick={() => setDealStatusFilter(ds)}
              >
                {DEAL_STATUS_LABELS[ds]}
              </button>
            ))}
          </div>
        )}

        <div className="pkt-eventos-participants__body">
          {loading && <div className="pkt-eventos-modal__state">Carregando...</div>}
          {error && <div className="pkt-eventos-modal__state">Falha ao carregar: {error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div className="pkt-eventos-modal__state">Nenhum participante nesse filtro.</div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="pkt-eventos-participants__list">
              <div className="pkt-eventos-participants__row pkt-eventos-participants__row--header pkt-eventos-participants__row--global">
                <span>Nome</span>
                <span>Evento</span>
                <span>E-mail</span>
                <span>Telefone</span>
                <span>Presença</span>
                <span>Status</span>
                <span>Situação</span>
              </div>
              {filtered.map((p) => {
                const nome = [p.first_name, p.last_name].filter(Boolean).join(' ') || '—'
                const pipedriveLink = getPipedriveLink(p)
                return (
                <div key={p.participant_id} className="pkt-eventos-participants__row pkt-eventos-participants__row--global">
                  <span className="pkt-eventos-participants__nome">
                    {pipedriveLink ? (
                      <a
                        className="pkt-eventos-participants__nome-link"
                        href={pipedriveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver pessoa no Pipedrive"
                      >
                        {nome}
                      </a>
                    ) : nome}
                    {(p.job_title || p.company) && (
                      <span className="pkt-eventos-participants__cargo">
                        {[p.job_title, p.company].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </span>
                  <span className="pkt-eventos-participants__evento" title={p.event_name}>{p.event_name || '—'}</span>
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
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
