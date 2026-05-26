import { useState } from 'react'
import { formatCompactBRL } from './format.js'

const WEBHOOK_URL = 'https://n8n.pekatebrasil.online/webhook/18e02b4f-aff9-49d9-8153-43817ff2d2c5'

async function sendReport(report) {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  })
  if (!res.ok) throw new Error(`Webhook error: ${res.status}`)
}

function OverviewTable({ overview }) {
  return (
    <table className="pkt-report__table">
      <thead>
        <tr>
          <th>Programa</th>
          <th>Convertidos</th>
          <th>Meta</th>
          <th>%</th>
          <th>Receita</th>
          <th>Forecast</th>
        </tr>
      </thead>
      <tbody>
        {overview.map((p) => (
          <tr key={p.shortName}>
            <td className="pkt-report__td-name">{p.shortName}</td>
            <td>{p.converted}</td>
            <td>{p.goal}</td>
            <td className={p.goalPct >= 90 ? 'pkt-report__td--good' : p.goalPct >= 50 ? 'pkt-report__td--ok' : 'pkt-report__td--low'}>
              {p.goalPct}%
            </td>
            <td>{formatCompactBRL(p.revenue)}</td>
            <td>{formatCompactBRL(p.forecast)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ProgramSection({ program }) {
  return (
    <div className="pkt-report__program">
      <h3 className="pkt-report__program-title">{program.name}</h3>

      <div className="pkt-report__kpis">
        <div className="pkt-report__kpi">
          <span className="pkt-report__kpi-value">{program.converted}<small> / {program.goal}</small></span>
          <span className="pkt-report__kpi-label">Convertidos ({program.goalPct}%)</span>
        </div>
        <div className="pkt-report__kpi">
          <span className="pkt-report__kpi-value">{formatCompactBRL(program.revenue)}</span>
          <span className="pkt-report__kpi-label">Receita ({program.revenuePct}% da meta)</span>
        </div>
        <div className="pkt-report__kpi">
          <span className="pkt-report__kpi-value">{program.conversionRate}%</span>
          <span className="pkt-report__kpi-label">Taxa de conversão</span>
        </div>
        <div className="pkt-report__kpi">
          <span className="pkt-report__kpi-value">{formatCompactBRL(program.forecast)}</span>
          <span className="pkt-report__kpi-label">Forecast ({program.forecastCount} leads)</span>
        </div>
      </div>

      {program.projected != null && (
        <div className="pkt-report__projection">
          <span className="pkt-report__projection-label">Projeção de atingimento</span>
          <span className="pkt-report__projection-value">
            ~{program.projected} alunos ({program.projectedPct}% da meta)
            {program.daysLeft != null && <small> · {program.daysLeft} dias restantes</small>}
          </span>
        </div>
      )}

      <div className="pkt-report__subsection">
        <h4 className="pkt-report__subtitle">Funil</h4>
        <div className="pkt-report__funnel">
          {program.stagesData.map((s) => (
            <div key={s.name} className="pkt-report__funnel-stage">
              <span className="pkt-report__funnel-count">{s.count}</span>
              <span className="pkt-report__funnel-name">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pkt-report__subsection">
        <h4 className="pkt-report__subtitle">Vendedores (top 5)</h4>
        <table className="pkt-report__table pkt-report__table--compact">
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>Conv.</th>
              <th>Ativos</th>
              <th>Atividades (7d)</th>
            </tr>
          </thead>
          <tbody>
            {program.sellers.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}º</td>
                <td className="pkt-report__td-name">{s.name}</td>
                <td>{s.converted}</td>
                <td>{s.active}</td>
                <td>
                  {s.activities.total > 0
                    ? `${s.activities.total} (${s.activities.calls}☎ ${s.activities.emails}✉ ${s.activities.meetings}📅)`
                    : '—'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {program.criticalDeals.length > 0 && (
        <div className="pkt-report__subsection">
          <h4 className="pkt-report__subtitle pkt-report__subtitle--alert">
            Deals críticos ({program.criticalDeals.length})
          </h4>
          <div className="pkt-report__critical-list">
            {program.criticalDeals.map((d) => (
              <div key={d.id} className="pkt-report__critical-deal">
                <span className="pkt-report__critical-title">{d.title}</span>
                <span className="pkt-report__critical-idle">{d.idle} dias parado</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ReportPreview({ report, loading, onClose, onGenerate }) {
  const [sendState, setSendState] = useState('idle')

  const handleSend = async () => {
    setSendState('sending')
    try {
      await sendReport(report)
      setSendState('sent')
    } catch {
      setSendState('error')
    }
  }

  return (
    <div className="pkt-report-overlay" onClick={onClose}>
      <div className="pkt-report" onClick={(e) => e.stopPropagation()}>
        <button className="pkt-report__close" onClick={onClose}>✕</button>

        {!report && !loading && (
          <div className="pkt-report__empty">
            <span className="pkt-report__empty-icon">📊</span>
            <h2 className="pkt-report__empty-title">Relatório Semanal</h2>
            <p className="pkt-report__empty-text">Gere um preview do relatório consolidado de todos os programas.</p>
            <button className="pkt-report__generate" onClick={onGenerate}>Gerar Relatório</button>
          </div>
        )}

        {loading && (
          <div className="pkt-report__empty">
            <span className="pkt-report__empty-icon">⏳</span>
            <h2 className="pkt-report__empty-title">Gerando relatório...</h2>
            <p className="pkt-report__empty-text">Buscando atividades dos vendedores na API.</p>
          </div>
        )}

        {report && !loading && (
          <div className="pkt-report__content">
            <header className="pkt-report__header">
              <div>
                <span className="pkt-report__eyebrow">Pekatê Brasil · Comando B2C</span>
                <h2 className="pkt-report__title">Relatório Semanal</h2>
              </div>
              <div className="pkt-report__meta">
                <span>Período: <strong>{report.period}</strong></span>
                <span>Gerado em: {report.generatedAt}</span>
              </div>
            </header>

            <div className="pkt-report__section">
              <h3 className="pkt-report__section-title">Visão Geral</h3>
              <OverviewTable overview={report.overview} />
            </div>

            {report.programs.map((p) => (
              <ProgramSection key={p.shortName} program={p} />
            ))}

            <div className="pkt-report__summary">
              <div className="pkt-report__summary-header">
                <span className="pkt-report__summary-icon">🤖</span>
                <div>
                  <h3 className="pkt-report__section-title">Resumo Executivo</h3>
                  <span className="pkt-report__summary-badge">Gerado por IA</span>
                </div>
              </div>
              <div className="pkt-report__summary-body">
                {report.executiveSummary ? (
                  <div
                    className="pkt-report__summary-html"
                    dangerouslySetInnerHTML={{ __html: report.executiveSummary }}
                  />
                ) : (
                  <p className="pkt-report__summary-loading">Gerando análise com IA...</p>
                )}
              </div>
            </div>

            <div className="pkt-report__send-bar">
              <button
                className={`pkt-report__send ${sendState === 'sent' ? 'pkt-report__send--sent' : ''}`}
                onClick={handleSend}
                disabled={sendState === 'sending' || sendState === 'sent'}
              >
                {sendState === 'idle' && '📤 Enviar via Teams e Outlook'}
                {sendState === 'sending' && '⏳ Enviando...'}
                {sendState === 'sent' && '✓ Enviado'}
                {sendState === 'error' && '⚠ Falha — tentar novamente'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
