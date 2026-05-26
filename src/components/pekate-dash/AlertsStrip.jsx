import Lottie from 'lottie-react'
import alertLampAnimation from './alert-lamp.json'

const ALERT_SLOTS = [
  { key: 'critico',      variant: 'critico',   tag: 'Crítico · sem retorno',       sub: 'Leads parados há mais de 14 dias' },
  { key: 'pendencia',    variant: 'pendencia', tag: 'Pendência · follow-up',       sub: 'Leads iniciais com 3 a 14 dias sem contato' },
  { key: 'oportunidade', variant: 'oportun',   tag: 'Oportunidade · inscrição',    sub: 'Leads em estágio avançado do funil' },
  { key: 'marco',        variant: 'marco',     tag: 'Próximo marco',               sub: 'Progresso da meta e prazo da turma' },
]

function formatTime(date) {
  if (!date) return '--:--'
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function AlertsStrip({ lastUpdated, program }) {
  const alerts = program?.alerts

  return (
    <section className="pkt-alerts">
      <div className="pkt-alerts__head">
        <Lottie
          animationData={alertLampAnimation}
          loop
          autoplay
          className="pkt-alert-lamp"
        />
        <div className="pkt-alerts__text">
          <span className="pkt-alerts__text-title">Alertas</span>
          <span className="pkt-alerts__text-sub">
            última atualiz. {formatTime(lastUpdated)}
          </span>
        </div>
      </div>

      {ALERT_SLOTS.map(({ key, variant, tag, sub }) => {
        const alert = alerts?.[key]
        const hasCount = alert?.count != null && alert.count > 0
        return (
          <article key={key} className={`pkt-alert pkt-alert--${variant}${hasCount ? ' pkt-alert--hot' : ''}`}>
            <span className="pkt-alert__tag">{tag}</span>
            <div className="pkt-alert__body">
              {alert ? (
                <span className="pkt-alert__text">{alert.text}</span>
              ) : (
                <span className="pkt-alert__placeholder">Carregando...</span>
              )}
            </div>
            <span className="pkt-alert__sub">{sub}</span>
            {hasCount && (
              <span className="pkt-alert__count">⚠️</span>
            )}
          </article>
        )
      })}
    </section>
  )
}
