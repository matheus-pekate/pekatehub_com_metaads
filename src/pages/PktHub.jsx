import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, LabelList, ResponsiveContainer } from 'recharts'
import { GeneralDocsGrid } from '../components/docs/GeneralDocsGrid'
import { PROGRAMS } from '../config/pipedrive'
import { useDashboardData } from '../hooks/useDashboardData'
import './pkt-hub.css'

const SIDEBAR_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'comercial', label: 'Comercial', icon: 'chart' },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone' },
  { id: 'operacao', label: 'Operação', icon: 'gear' },
  { id: 'agentes', label: 'Agentes', icon: 'bot' },
  { id: 'documentacao', label: 'Documentação', icon: 'doc' },
]

const AGENT_SUBTABS = ['Funis', 'Performance', 'Conversas']

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function formatCompactBRL(value) {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$ ${Math.round(value / 1000)}k`
  return formatBRL(value)
}

function getNextProgram() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const withDays = PROGRAMS
    .filter((p) => p.startDate)
    .map((p) => ({ ...p, daysUntil: Math.ceil((new Date(p.startDate) - today) / 86400000) }))
    .sort((a, b) => a.daysUntil - b.daysUntil)
  return withDays.find((p) => p.daysUntil >= 0) || withDays[withDays.length - 1] || null
}

function countdownLabel(days) {
  if (days > 1) return `Início em ${days} dias`
  if (days === 1) return 'Início amanhã'
  if (days === 0) return 'Começa hoje'
  return 'Turma em andamento'
}

function ProgramChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload
  const pct = p.meta > 0 ? Math.round((p.atual / p.meta) * 100) : 0
  return (
    <div className="hub-chart-tooltip">
      <p className="hub-chart-tooltip__label">{p.name}</p>
      <p>Meta: <strong>{formatBRL(p.meta)}</strong></p>
      <p>Atual: <strong>{formatBRL(p.atual)}</strong> ({pct}%)</p>
    </div>
  )
}

function NavIcon({ type }) {
  const icons = {
    home: <path d="M3 12L12 3l9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/>,
    chart: <><path d="M18 20V10M12 20V4M6 20v-6"/></>,
    megaphone: <><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 01-5.8-1.6"/></>,
    gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z"/></>,
    bot: <><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 2v3M8 11V9a4 4 0 018 0v2"/><circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/></>,
    doc: <><path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></>,
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[type]}
    </svg>
  )
}

/* ── Utilitários de chat ── */
function parseMessage(raw) {
  const match = raw.match(/^(AI|USER)(?:_[A-Z]+)?_(\d{4}-\d{2}-\d{2}T[\d:.+-]+):\s?(.*)$/s)
  if (!match) return { role: 'unknown', time: '', text: raw }
  return { role: match[1] === 'AI' ? 'ai' : 'user', time: match[2], text: match[3].trim() }
}

function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

function formatPhone(key) {
  const num = key.replace('chat-history_', '')
  return num.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '+$1 ($2) $3-$4') || num
}

/* ── Sub-página da Laura ── */
function LauraPage() {
  const [subTab, setSubTab] = useState('Funis')
  const [chats, setChats] = useState({})
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetch('/api/chats')
      .then(r => r.json())
      .then(data => {
        const c = data.chats || {}
        setChats(c)
        const first = Object.keys(c)[0]
        if (first) setSelected(first)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected, chats])

  const keys = Object.keys(chats)
  const messages = selected ? (chats[selected] || []).map(parseMessage) : []

  return (
    <div className="agent-page">
      {/* Cabeçalho do agente */}
      <div className="agent-page__header">
        <img src="/Laura-agent.png" alt="Laura" className="agent-page__photo" />
        <div className="agent-page__info">
          <h2 className="agent-page__name">Laura Vieira</h2>
          <span className="agent-page__role">Pré-qualificação B2C · <span className="agent-page__live">● Ativo</span></span>
          <nav className="agent-page__subtabs">
            {AGENT_SUBTABS.map(t => (
              <button
                key={t}
                className={`agent-subtab ${subTab === t ? 'agent-subtab--active' : ''}`}
                onClick={() => setSubTab(t)}
              >{t}</button>
            ))}
          </nav>
        </div>
      </div>

      {/* Conversas */}
      {subTab === 'Conversas' && (
        <div className="agent-chats">
          {/* Lista de conversas */}
          <aside className="agent-chats__list">
            {loading && <p className="agent-chats__empty">Carregando...</p>}
            {!loading && keys.length === 0 && <p className="agent-chats__empty">Nenhuma conversa.</p>}
            {keys.map(key => {
              const msgs = chats[key].map(parseMessage)
              const last = msgs[msgs.length - 1]
              return (
                <button
                  key={key}
                  className={`agent-chat-item ${selected === key ? 'agent-chat-item--active' : ''}`}
                  onClick={() => setSelected(key)}
                >
                  <div className="agent-chat-item__avatar">{formatPhone(key).slice(-2)}</div>
                  <div className="agent-chat-item__info">
                    <span className="agent-chat-item__phone">{formatPhone(key)}</span>
                    <span className="agent-chat-item__preview">{last?.text?.slice(0, 40)}…</span>
                  </div>
                  <span className="agent-chat-item__count">{msgs.length}</span>
                </button>
              )
            })}
          </aside>

          {/* Janela de mensagens */}
          <div className="agent-chats__window">
            {!selected ? (
              <p className="agent-chats__empty">Selecione uma conversa</p>
            ) : (
              <>
                <div className="agent-chats__winheader">
                  <div className="agent-chat-item__avatar">{formatPhone(selected).slice(-2)}</div>
                  <div>
                    <span className="agent-chat-item__phone">{formatPhone(selected)}</span>
                    <span className="agent-chat-item__preview">{messages.length} mensagens</span>
                  </div>
                </div>
                <div className="agent-messages">
                  {messages.map((m, i) => (
                    <div key={i} className={`agent-bubble agent-bubble--${m.role}`}>
                      <p className="agent-bubble__text">{m.text}</p>
                      <span className="agent-bubble__time">{formatTime(m.time)}</span>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {subTab === 'Funis' && (
        <div className="agent-placeholder">
          <span>📊</span>
          <p>Funis — em breve</p>
        </div>
      )}

      {subTab === 'Performance' && (
        <div className="agent-placeholder">
          <span>📈</span>
          <p>Performance — em breve</p>
        </div>
      )}
    </div>
  )
}

/* ── PktHub principal ── */
export function PktHub() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Home')
  const [activeAgent, setActiveAgent] = useState(null)
  const nextProgram = getNextProgram()
  const { data: dashboardData, loading: loadingDashboard } = useDashboardData()

  const chartData = (dashboardData?.programs || []).map((p) => ({
    shortName: p.shortName,
    name: p.name,
    meta: p.revenueGoal,
    atual: p.totalWonValue,
    accentColor: p.accentColor,
  }))
  const nextProgramLive = dashboardData?.programs?.find((p) => p.id === nextProgram?.id) || null

  function handleTabChange(tab) {
    setActiveTab(tab)
    setActiveAgent(null)
  }

  return (
    <div className="hub-layout">
      {/* ── Sidebar ── */}
      <aside className="hub-sidebar">
        <div className="hub-sidebar__top">
          <div className="hub-sidebar__brand">
            <img src="/pekate-logo.png" alt="Pekatê" className="hub-sidebar__logo" />
            <div>
              <span className="hub-sidebar__brand-name">HUB</span>
              <span className="hub-sidebar__brand-sub">Pekatê Brasil</span>
            </div>
          </div>

          <nav className="hub-sidebar__nav">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`hub-nav-item ${activeTab === item.label ? 'hub-nav-item--active' : ''}`}
                onClick={() => handleTabChange(item.label)}
              >
                <NavIcon type={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="hub-sidebar__bottom">
          <div className="hub-sidebar__user">
            <div className="hub-sidebar__avatar">PB</div>
            <div>
              <span className="hub-sidebar__user-name">Pekatê Brasil</span>
              <span className="hub-sidebar__user-role">Administrador</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Coluna direita ── */}
      <div className="hub-right">
        <div className="hub-strip hub-strip--quote">
          <p className="hub-strip__quote">
            "Desde 2003 melhorando a vida das pessoas e empresas brasileiras"
          </p>
        </div>

        <main className="hub-main">
          {/* Banner — oculto quando agente aberto */}
          {!activeAgent && (
            <div className="hub-banner">
              <div className="hub-banner__content">
                <span className="hub-banner__badge">Central</span>
                <h2 className="hub-banner__title">Pekatê Brasil · PKT-HUB</h2>
                <p className="hub-banner__text">Acompanhe em tempo real os indicadores comerciais, de marketing e operacionais de toda a operação.</p>
              </div>
              <div className="hub-banner__art">
                <img src="/pekate-logo.png" alt="Pekatê" className="hub-banner__seta" />
              </div>
            </div>
          )}

          {/* ── Agente aberto ── */}
          {activeAgent === 'laura' && <LauraPage />}

          {/* ── Conteúdo normal das abas ── */}
          {!activeAgent && activeTab === 'Home' && (
            <>
              <section className="hub-main__section">
                <h2 className="hub-main__section-title">Próximo Programa</h2>
                {nextProgram ? (
                  <div className="hub-next-program" style={{ '--accent': nextProgram.accentColor }}>
                    <div className="hub-next-program__main">
                      <span className="hub-next-program__eyebrow">Turma mais próxima</span>
                      <h3 className="hub-next-program__name">{nextProgram.name}</h3>
                      <span className="hub-next-program__countdown">{countdownLabel(nextProgram.daysUntil)}</span>
                    </div>
                    <div className="hub-next-program__stats">
                      <div className="hub-next-program__stat">
                        <strong>{nextProgramLive ? nextProgramLive.converted : 0}<span className="hub-next-program__stat-of">/{nextProgramLive?.dynamicGoal ?? nextProgram.goal}</span></strong>
                        <span>vagas convertidas</span>
                      </div>
                      <div className="hub-next-program__stat">
                        <strong>{formatCompactBRL(nextProgramLive ? nextProgramLive.totalWonValue : 0)}<span className="hub-next-program__stat-of">/{formatCompactBRL(nextProgram.revenueGoal)}</span></strong>
                        <span>receita atingida</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="hub-main__empty">Nenhum programa cadastrado.</p>
                )}
              </section>

              <section className="hub-main__section">
                <h2 className="hub-main__section-title">Meta x Atual — Receita por Programa</h2>
                <div className="hub-chart-card">
                  {loadingDashboard && <p className="hub-main__empty">Carregando dados do Pipedrive...</p>}
                  {!loadingDashboard && chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData} margin={{ top: 24, right: 16, left: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(48,50,51,.08)" />
                        <XAxis dataKey="shortName" tick={{ fontSize: 12, fill: '#4a4d4f' }} axisLine={{ stroke: 'rgba(48,50,51,.15)' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9a9d9f' }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => formatCompactBRL(v)} />
                        <Tooltip content={<ProgramChartTooltip />} cursor={{ fill: 'rgba(48,50,51,.04)' }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => (value === 'meta' ? 'Meta' : 'Atual')} />
                        <Bar dataKey="meta" name="meta" fill="#e3ddd0" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                          <LabelList dataKey="meta" position="top" formatter={formatCompactBRL} style={{ fontSize: 11, fill: '#9a9d9f' }} />
                        </Bar>
                        <Bar dataKey="atual" name="atual" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                          {chartData.map((d) => (
                            <Cell key={d.shortName} fill={d.accentColor} />
                          ))}
                          <LabelList dataKey="atual" position="top" formatter={formatCompactBRL} style={{ fontSize: 12, fontWeight: 700, fill: '#08373f' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {!loadingDashboard && chartData.length === 0 && (
                    <p className="hub-main__empty">Não foi possível carregar os dados do Pipedrive.</p>
                  )}
                </div>
              </section>
            </>
          )}

          {!activeAgent && activeTab === 'Comercial' && (
            <>
              <section className="hub-main__section">
                <h2 className="hub-main__section-title">Geral</h2>
                <div className="hub-main__grid">
                  <div className="hub-card hub-card--disabled">
                    <span className="hub-card__tag hub-card__tag--geral">Geral</span>
                    <div className="hub-card__icon hub-card__icon--geral">🎯</div>
                    <h3 className="hub-card__title">Controle de Metas</h3>
                    <p className="hub-card__desc">Acompanhamento consolidado de metas de receita e conversão de todos os programas.</p>
                    <span className="hub-card__status">Em breve</span>
                  </div>
                </div>
              </section>
              <section className="hub-main__section">
                <h2 className="hub-main__section-title">B2C</h2>
                <div className="hub-main__grid">
                  <button className="hub-card" onClick={() => navigate('/pekate-dash')}>
                    <span className="hub-card__tag">B2C</span>
                    <div className="hub-card__icon hub-card__icon--b2c">📊</div>
                    <h3 className="hub-card__title">Comando B2C</h3>
                    <p className="hub-card__desc">Funil, metas, vendedores e alertas dos programas B2C em tempo real.</p>
                    <span className="hub-card__status hub-card__status--live">Ao vivo</span>
                  </button>
                  <button className="hub-card" onClick={() => navigate('/seller-analysis')}>
                    <span className="hub-card__tag">B2C</span>
                    <div className="hub-card__icon hub-card__icon--b2c">👤</div>
                    <h3 className="hub-card__title">Análise dos Vendedores</h3>
                    <p className="hub-card__desc">Performance individual, atividades e metas dos vendedores B2C.</p>
                    <span className="hub-card__status hub-card__status--live">Ao vivo</span>
                  </button>
                </div>
              </section>
              <section className="hub-main__section">
                <h2 className="hub-main__section-title">B2B</h2>
                <div className="hub-main__grid">
                  <button className="hub-card" onClick={() => navigate('/comando-b2b')}>
                    <span className="hub-card__tag hub-card__tag--b2b">B2B</span>
                    <div className="hub-card__icon">🏢</div>
                    <h3 className="hub-card__title">Comando B2B</h3>
                    <p className="hub-card__desc">Contas corporativas e pipeline enterprise.</p>
                    <span className="hub-card__status hub-card__status--live">Ao vivo</span>
                  </button>
                  <button className="hub-card" onClick={() => navigate('/seller-analysis?segment=b2b')}>
                    <span className="hub-card__tag hub-card__tag--b2b">B2B</span>
                    <div className="hub-card__icon">👤</div>
                    <h3 className="hub-card__title">Análise dos Vendedores</h3>
                    <p className="hub-card__desc">Performance individual, atividades e metas dos vendedores B2B.</p>
                    <span className="hub-card__status hub-card__status--live">Ao vivo</span>
                  </button>
                </div>
              </section>
            </>
          )}

          {!activeAgent && activeTab === 'Marketing' && (
            <section className="hub-main__section">
              <h2 className="hub-main__section-title">Marketing</h2>
              <div className="hub-main__grid">
                <button className="hub-card" onClick={() => navigate('/meta-ads')}>
                  <div className="hub-card__icon">📣</div>
                  <h3 className="hub-card__title">Comando Marketing</h3>
                  <p className="hub-card__desc">Análise META ADS.</p>
                  <span className="hub-card__status hub-card__status--live">Ao vivo</span>
                </button>
                <button className="hub-card" onClick={() => navigate('/eventos')}>
                  <div className="hub-card__icon">🎟️</div>
                  <h3 className="hub-card__title">Comando Eventos</h3>
                  <p className="hub-card__desc">Trajetória dos participantes dos eventos: quem virou lead e quem fechou negócio.</p>
                  <span className="hub-card__status hub-card__status--live">Ao vivo</span>
                </button>
              </div>
            </section>
          )}

          {!activeAgent && activeTab === 'Agentes' && (
            <section className="hub-main__section">
              <h2 className="hub-main__section-title">Agentes Comerciais</h2>
              <div className="hub-main__grid">
                <button className="hub-agent-card" onClick={() => setActiveAgent('laura')}>
                  <span className="hub-agent-card__tag">Comercial</span>
                  <img src="/Laura-agent.png" alt="Laura Vieira" className="hub-agent-card__photo" />
                  <h3 className="hub-agent-card__name">Laura Vieira</h3>
                  <p className="hub-agent-card__role">Pré-qualificação B2C</p>
                  <span className="hub-agent-card__status">Ativo</span>
                </button>
              </div>
            </section>
          )}

          {!activeAgent && activeTab === 'Documentação' && (
            <section className="hub-main__section">
              <h2 className="hub-main__section-title">Documentação</h2>
              <div className="hub-main__grid">
                <button className="hub-card" onClick={() => navigate('/documentacao')}>
                  <div className="hub-card__icon">📄</div>
                  <h3 className="hub-card__title">Wiki de Automações</h3>
                  <p className="hub-card__desc">Fluxos do n8n com documentação — atualiza sozinho conforme novos fluxos são criados.</p>
                  <span className="hub-card__status hub-card__status--live">Ao vivo</span>
                </button>
                <GeneralDocsGrid />
              </div>
            </section>
          )}

          {!activeAgent && activeTab === 'Operação' && (
            <section className="hub-main__section">
              <h2 className="hub-main__section-title">Operacional</h2>
              <div className="hub-main__grid">
                <div className="hub-card hub-card--disabled">
                  <div className="hub-card__icon">⚙️</div>
                  <h3 className="hub-card__title">Performance Operacional</h3>
                  <p className="hub-card__desc">Indicadores operacionais, entregas e performance das equipes.</p>
                  <span className="hub-card__status">Em breve</span>
                </div>
                <div className="hub-card hub-card--disabled">
                  <div className="hub-card__icon">📑</div>
                  <h3 className="hub-card__title">Relatórios</h3>
                  <p className="hub-card__desc">Relatórios consolidados e históricos de toda a operação.</p>
                  <span className="hub-card__status">Em breve</span>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
