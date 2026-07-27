import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEventosData } from '../hooks/useEventosData'
import { EventCard } from '../components/eventos/EventCard'
import { ParticipantsListModal } from '../components/eventos/ParticipantsListModal'
import './comando-eventos.css'

export function ComandoEventos() {
  const navigate = useNavigate()
  const { data, loading, error, refresh } = useEventosData()
  const [selectedEvento, setSelectedEvento] = useState(null)

  const totals = data.reduce((acc, e) => {
    acc.total += e.totalParticipantes
    acc.curiosos += e.curiosos
    acc.leads += e.leads
    acc.negocios += e.negocios
    return acc
  }, { total: 0, curiosos: 0, leads: 0, negocios: 0 })

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
          <span>{totals.total} participantes</span>
          <span>{totals.curiosos} curiosos</span>
          <span>{totals.leads} leads</span>
          <span>{totals.negocios} negócios</span>
        </div>
        {error && <span className="pkt-eventos-topbar__error" title={error}>⚠ falha ao atualizar</span>}
        <button className="pkt-eventos-topbar__refresh" onClick={refresh}>⟳</button>
      </header>

      <main className="pkt-eventos-grid">
        {loading && data.length === 0 && <p className="pkt-eventos-empty">Carregando eventos...</p>}
        {!loading && data.length === 0 && <p className="pkt-eventos-empty">Nenhum evento encontrado.</p>}
        {data.map((evento) => (
          <EventCard key={evento.event_id} evento={evento} onSelect={setSelectedEvento} />
        ))}
      </main>

      {selectedEvento && (
        <ParticipantsListModal evento={selectedEvento} onClose={() => setSelectedEvento(null)} />
      )}
    </div>
  )
}
