import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEventosData } from '../hooks/useEventosData'
import { EventCard } from '../components/eventos/EventCard'
import { ParticipantsListModal } from '../components/eventos/ParticipantsListModal'
import { GlobalParticipantsModal } from '../components/eventos/GlobalParticipantsModal'
import { EventosOverview } from '../components/eventos/EventosOverview'
import './comando-eventos.css'

export function ComandoEventos() {
  const navigate = useNavigate()
  const { data, loading, error, refresh } = useEventosData()
  const [selectedEvento, setSelectedEvento] = useState(null)
  const [eventoFilter, setEventoFilter] = useState(null)
  const [globalFilter, setGlobalFilter] = useState(null)

  function openEvento(evento, filter) {
    setSelectedEvento(evento)
    setEventoFilter(filter || null)
  }

  const totals = data.reduce((acc, e) => {
    acc.total += e.totalParticipantes
    acc.prospects += e.prospects
    acc.convidados += e.convidados
    acc.oportunidades += e.oportunidadesNovas + e.oportunidadesExistentes
    acc.negociosGanhos += e.negociosGanhosNovos + e.negociosGanhosExistentes
    acc.naoCompareceram += e.naoCompareceramTotal
    return acc
  }, { total: 0, prospects: 0, convidados: 0, oportunidades: 0, negociosGanhos: 0, naoCompareceram: 0 })

  return (
    <div className="pkt-eventos-page">
      <header className="pkt-eventos-topbar">
        <button className="pkt-eventos-topbar__home" onClick={() => navigate('/pkt-hub')}>←</button>
        <div className="pkt-eventos-topbar__title">
          <span className="pkt-eventos-topbar__eyebrow">Pekatê Brasil · Marketing</span>
          <h1 className="pkt-eventos-topbar__name">Comando <em>Eventos</em></h1>
        </div>
        <div className="pkt-eventos-topbar__spacer" />
        <div className="pkt-eventos-topbar__summary">
          <button className="pkt-eventos-topbar__stat pkt-eventos-topbar__stat--clickable" onClick={() => setGlobalFilter({ compareceu: 'todos', situacao: 'todos', status: 'todos' })}>
            <strong>{totals.total}</strong> participantes
          </button>
          <button className="pkt-eventos-topbar__stat pkt-eventos-topbar__stat--clickable" onClick={() => setGlobalFilter({ compareceu: false, situacao: 'todos', status: 'todos' })}>
            <strong>{totals.naoCompareceram}</strong> não compareceram
          </button>
          <button className="pkt-eventos-topbar__stat pkt-eventos-topbar__stat--clickable" onClick={() => setGlobalFilter({ compareceu: 'todos', situacao: 'todos', status: 'convidado' })}>
            <strong>{totals.convidados}</strong> convidados
          </button>
          <button className="pkt-eventos-topbar__stat pkt-eventos-topbar__stat--clickable" onClick={() => setGlobalFilter({ compareceu: 'todos', situacao: 'todos', status: 'oportunidade' })}>
            <strong>{totals.oportunidades}</strong> negócios em aberto
          </button>
          <button className="pkt-eventos-topbar__stat pkt-eventos-topbar__stat--clickable" onClick={() => setGlobalFilter({ compareceu: 'todos', situacao: 'todos', status: 'negocio_ganho' })}>
            <strong>{totals.negociosGanhos}</strong> negócios ganhos
          </button>
          <button className="pkt-eventos-topbar__stat pkt-eventos-topbar__stat--clickable" onClick={() => setGlobalFilter({ compareceu: 'todos', situacao: 'todos', status: 'curioso' })}>
            <strong>{totals.prospects}</strong> prospects
          </button>
        </div>
        {error && <span className="pkt-eventos-topbar__error" title={error}>⚠ falha ao atualizar</span>}
        <button className="pkt-eventos-topbar__refresh" onClick={refresh}>⟳</button>
      </header>

      <main className="pkt-eventos-grid">
        {loading && data.length === 0 && <p className="pkt-eventos-empty">Carregando eventos...</p>}
        {!loading && data.length === 0 && <p className="pkt-eventos-empty">Nenhum evento encontrado.</p>}
        {data.map((evento) => (
          <EventCard key={evento.event_id} evento={evento} onSelect={openEvento} />
        ))}
      </main>

      <EventosOverview eventos={data} />

      {selectedEvento && (
        <ParticipantsListModal
          evento={selectedEvento}
          initialFilter={eventoFilter}
          onClose={() => { setSelectedEvento(null); setEventoFilter(null) }}
        />
      )}

      {globalFilter && (
        <GlobalParticipantsModal initialFilter={globalFilter} onClose={() => setGlobalFilter(null)} />
      )}
    </div>
  )
}
