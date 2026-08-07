import { useEffect, useState } from 'react'
import { fetchParticipantesEvento } from '../../services/eventosApi'
import { formatDate } from '../meta-ads/format'
import { STATUS_LABELS, STATUS_COLORS, DEAL_STATUS_LABELS, getStatusLabel } from '../../config/eventos'
import { buildPipedrivePersonUrl } from '../../config/pipedrive'

const CATEGORY_FILTERS = ['todos', 'curioso', 'convidado', 'oportunidade', 'negocio_ganho']

const SITUACAO_LABELS = {
  todos: 'Todos',
  existente: 'Já existe no CRM',
  novo: 'Novo no CRM',
}

const DEFAULT_FILTER = { compareceu: 'todos', situacao: 'todos', status: 'todos' }

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

function exportParticipantesCsv(participantes, eventName) {
  const headers = ['Nome', 'E-mail', 'Telefone', 'Empresa', 'Cargo', 'Ingresso', 'Presença', 'Status', 'Situação']
  const rows = participantes.map((p) => [
    [p.first_name, p.last_name].filter(Boolean).join(' '),
    p.email || '',
    p.phone || '',
    p.company || '',
    p.job_title || '',
    p.ticket_name || '',
    p.check_in ? 'Presente' : 'Não compareceu',
    getStatusLabel(p.status, p.situacao),
    p.situacao === 'novo' ? 'Novo' : p.situacao === 'existente' ? 'Já existia' : '',
  ])
  const csvContent = '﻿' + [headers, ...rows].map((row) => row.map(csvEscape).join(';')).join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `participantes-${eventName.replace(/[^\w\-]+/g, '_')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function ParticipantsListModal({ evento, initialFilter, onClose }) {
  const merged = { ...DEFAULT_FILTER, ...initialFilter }
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [compareceuFilter, setCompareceuFilter] = useState(merged.compareceu)
  const [situacaoFilter, setSituacaoFilter] = useState(merged.situacao)
  const [statusFilter, setStatusFilter] = useState(merged.status)
  const [dealStatusFilter, setDealStatusFilter] = useState('todos')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchParticipantesEvento(evento.event_id, evento.start_date)
      .then((list) => { if (!cancelled) { setParticipantes(list); setError(null) } })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [evento.event_id])

  let filtered = participantes
  if (compareceuFilter !== 'todos') filtered = filtered.filter((p) => p.check_in === compareceuFilter)
  if (situacaoFilter !== 'todos') filtered = filtered.filter((p) => p.situacao === situacaoFilter)
  if (statusFilter !== 'todos') filtered = filtered.filter((p) => p.status === statusFilter)
  if (statusFilter === 'oportunidade' && dealStatusFilter !== 'todos') {
    filtered = filtered.filter((p) => p.pipedrive_deal_status === dealStatusFilter)
  }

  function selectSituacao(value) {
    setSituacaoFilter(value)
    // "Novo no CRM" é sempre o pessoal ainda sem trabalho nenhum — vai direto pro prospect.
    setStatusFilter(value === 'novo' ? 'curioso' : 'todos')
    setDealStatusFilter('todos')
  }

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
          <button className={`pkt-eventos-filter ${compareceuFilter === 'todos' ? 'pkt-eventos-filter--active' : ''}`} onClick={() => setCompareceuFilter('todos')}>Todos</button>
          <button className={`pkt-eventos-filter ${compareceuFilter === true ? 'pkt-eventos-filter--active' : ''}`} onClick={() => setCompareceuFilter(true)}>Compareceram</button>
          <button className={`pkt-eventos-filter ${compareceuFilter === false ? 'pkt-eventos-filter--active' : ''}`} onClick={() => setCompareceuFilter(false)}>Não compareceram</button>
          <button
            className="pkt-eventos-export"
            onClick={() => exportParticipantesCsv(filtered, evento.name)}
            disabled={filtered.length === 0}
          >
            ⬇ Exportar Excel
          </button>
        </div>

        <div className="pkt-eventos-participants__filters pkt-eventos-participants__filters--sub">
          {Object.keys(SITUACAO_LABELS).map((s) => (
            <button
              key={s}
              className={`pkt-eventos-filter pkt-eventos-filter--sub ${situacaoFilter === s ? 'pkt-eventos-filter--active' : ''}`}
              onClick={() => selectSituacao(s)}
            >
              {SITUACAO_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="pkt-eventos-participants__filters pkt-eventos-participants__filters--sub">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f}
              className={`pkt-eventos-filter pkt-eventos-filter--sub ${statusFilter === f ? 'pkt-eventos-filter--active' : ''}`}
              onClick={() => { setStatusFilter(f); setDealStatusFilter('todos') }}
            >
              {f === 'todos' ? 'Todos' : getStatusLabel(f, situacaoFilter)}
            </button>
          ))}
        </div>

        {statusFilter === 'oportunidade' && (
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
              <div className="pkt-eventos-participants__row pkt-eventos-participants__row--header">
                <span>Nome</span>
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
                <div key={p.participant_id} className="pkt-eventos-participants__row">
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
                  <span className="pkt-eventos-participants__email" title={p.email}>{p.email || '—'}</span>
                  <span className="pkt-eventos-participants__phone">{p.phone || '—'}</span>
                  <span className="pkt-eventos-presenca" title={p.check_in_date ? formatDate(p.check_in_date) : ''}>
                    {p.check_in ? '✅ Presente' : '❌ Não compareceu'}
                  </span>
                  <span className="pkt-eventos-status" style={{ '--status-color': STATUS_COLORS[p.status] }}>
                    {getStatusLabel(p.status, p.situacao)}
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
