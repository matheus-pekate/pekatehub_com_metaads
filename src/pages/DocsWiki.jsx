import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocsWiki } from '../hooks/useDocsWiki'
import { fetchDocContent, uploadDoc } from '../services/docsApi'
import './docs-wiki.css'

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return '' }
}

function groupByCategory(list) {
  const byCat = {}
  for (const item of list) {
    const cat = item.tags[0] || 'Sem categoria'
    if (!byCat[cat]) byCat[cat] = []
    byCat[cat].push(item)
  }
  return Object.entries(byCat).sort(([a], [b]) => {
    if (a === 'Sem categoria') return 1
    if (b === 'Sem categoria') return -1
    return a.localeCompare(b, 'pt-BR')
  })
}

export function DocsWiki() {
  const navigate = useNavigate()
  const { items, loading, error, refresh } = useDocsWiki()

  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(null) // workflow item aberto no painel
  const [fullscreen, setFullscreen] = useState(false)

  const [docHtml, setDocHtml] = useState(null)
  const [docLoading, setDocLoading] = useState(false)
  const [docError, setDocError] = useState(null)
  const [uploadMode, setUploadMode] = useState(false)

  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (!fullscreen) return
    function onKeyDown(e) {
      if (e.key === 'Escape') setFullscreen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [fullscreen])

  const filtered = useMemo(() => {
    return items.filter((w) => {
      if (filter === 'active' && !w.active) return false
      if (filter === 'inactive' && w.active) return false
      if (filter === 'doc' && !w.hasDoc) return false
      if (query) {
        const q = query.toLowerCase()
        return w.name.toLowerCase().includes(q) || (w.tags[0] || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [items, filter, query])

  const grouped = useMemo(() => groupByCategory(filtered), [filtered])

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((w) => w.active).length,
    inactive: items.filter((w) => !w.active).length,
    doc: items.filter((w) => w.hasDoc).length,
  }), [items])

  function openItem(item) {
    setActive(item)
    setFeedback(null)
    setTitle(item.name)
    setFile(null)
    if (item.hasDoc) {
      setUploadMode(false)
      setDocHtml(null)
      setDocError(null)
      setDocLoading(true)
      fetchDocContent(item.id)
        .then((html) => setDocHtml(html))
        .catch((err) => setDocError(err.message || 'Falha ao carregar documento'))
        .finally(() => setDocLoading(false))
    } else {
      setUploadMode(true)
    }
  }

  function closeItem() {
    setActive(null)
    setDocHtml(null)
    setDocError(null)
    setUploadMode(false)
    setFullscreen(false)
  }

  function handleFileChange(e) {
    setFile(e.target.files?.[0] || null)
  }

  async function handleUploadSubmit(e) {
    e.preventDefault()
    if (!active || !file || !title.trim()) return
    setSending(true)
    setFeedback(null)
    try {
      const html = await file.text()
      await uploadDoc({ workflowId: active.id, title: title.trim(), html })
      setFeedback({ type: 'success', text: 'Documentação enviada com sucesso.' })
      setFile(null)
      await refresh()
      openItem({ ...active, hasDoc: true })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Falha ao enviar documentação.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="wiki">
      <header className="wiki-header">
        <button className="wiki-header__home" onClick={() => navigate('/pkt-hub')}>← PKT-HUB</button>
        <div className="wiki-header__pipe" />
        <span className="wiki-header__sub">Wiki de Automações</span>
        <div className="wiki-header__spacer" />
        <span className="wiki-header__tag">n8n · Pekatê Brasil</span>
      </header>

      <div className="wiki-hero">
        <h1>Diretório de <em>fluxos</em></h1>
        <p>Documentação interna dos fluxos de automação — atualiza sozinho conforme os fluxos mudam no n8n.</p>
        <div className="wiki-stats">
          <div className="wiki-stat"><div className="wiki-stat__num">{stats.total}</div><div className="wiki-stat__label">Total</div></div>
          <div className="wiki-stat wiki-stat--active"><div className="wiki-stat__num">{stats.active}</div><div className="wiki-stat__label">Ativos</div></div>
          <div className="wiki-stat"><div className="wiki-stat__num">{stats.inactive}</div><div className="wiki-stat__label">Inativos</div></div>
          <div className="wiki-stat wiki-stat--orange"><div className="wiki-stat__num">{stats.doc}</div><div className="wiki-stat__label">Documentados</div></div>
        </div>
      </div>

      <div className="wiki-controls">
        <div className="wiki-search">
          <span className="wiki-search__icon">⌕</span>
          <input
            type="search"
            placeholder="Buscar fluxo ou categoria…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="wiki-filters">
          {[
            ['all', 'Todos'],
            ['active', 'Ativos'],
            ['inactive', 'Inativos'],
            ['doc', 'Com doc'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`wiki-fbtn ${filter === key ? 'wiki-fbtn--on' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={`wiki-split ${fullscreen ? 'wiki-split--fs' : ''}`}>
        <div className={`wiki-sidebar ${active ? 'wiki-sidebar--collapsed' : ''}`}>
          <div className="wiki-sidebar__inner">
            {loading && <p className="wiki-empty">Carregando fluxos…</p>}
            {!loading && error && <p className="wiki-empty wiki-empty--error">{error}</p>}
            {!loading && !error && filtered.length === 0 && (
              <p className="wiki-empty">Nenhum fluxo encontrado.</p>
            )}
            {!loading && !error && grouped.map(([cat, list]) => (
              <div key={cat} className="wiki-catblock">
                <div className="wiki-cathead">
                  <span className="wiki-cathead__dot" />
                  <span className="wiki-cathead__name">{cat}</span>
                  <span className="wiki-cathead__count">{list.length}</span>
                  <span className="wiki-cathead__line" />
                </div>
                <div className="wiki-grid">
                  {list.map((w) => (
                    <button
                      key={w.id}
                      className={`wiki-card ${active?.id === w.id ? 'wiki-card--active' : ''}`}
                      onClick={() => openItem(w)}
                    >
                      <div className="wiki-card__row1">
                        <span className="wiki-card__name">{w.name}</span>
                        <span className="wiki-card__arrow">→</span>
                      </div>
                      <div className="wiki-card__badges">
                        <span className={`wiki-pill ${w.active ? 'wiki-pill--active' : 'wiki-pill--inactive'}`}>{w.active ? 'Ativo' : 'Inativo'}</span>
                        <span className={`wiki-pill ${w.hasDoc ? 'wiki-pill--doc' : 'wiki-pill--nodoc'}`}>{w.hasDoc ? 'Documentado' : 'Sem doc'}</span>
                      </div>
                      <div className="wiki-card__id">{w.id}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`wiki-docpanel ${active ? 'wiki-docpanel--open' : ''}`}>
          {active && (
            <>
              <div className="wiki-doctop">
                <button className="wiki-docback" onClick={closeItem}>← Voltar</button>
                <div className="wiki-breadcrumb">
                  <div className="wiki-breadcrumb__cat">{active.tags[0] || 'Sem categoria'}</div>
                  <div className="wiki-breadcrumb__name">{active.name}</div>
                </div>
                {!uploadMode && active.hasDoc && (
                  <button className="wiki-docreplace" onClick={() => setUploadMode(true)}>Substituir</button>
                )}
                {!uploadMode && (
                  <button className="wiki-docfs" title="Tela cheia" onClick={() => setFullscreen((f) => !f)}>
                    {fullscreen ? '✕' : '⛶'}
                  </button>
                )}
              </div>

              {uploadMode ? (
                <div className="wiki-upload">
                  <p className="wiki-upload__intro">
                    {active.hasDoc ? 'Enviar uma nova versão da documentação deste fluxo.' : 'Este fluxo ainda não tem documentação — envie um arquivo .html para ele.'}
                  </p>
                  <form className="wiki-upload__form" onSubmit={handleUploadSubmit}>
                    <input
                      type="text"
                      className="wiki-upload__input"
                      placeholder="Título do documento"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <input type="file" accept=".html,.htm" className="wiki-upload__file" onChange={handleFileChange} />
                    <button type="submit" className="wiki-upload__submit" disabled={sending || !file || !title.trim()}>
                      {sending ? 'Enviando…' : 'Enviar documentação'}
                    </button>
                    {active.hasDoc && (
                      <button type="button" className="wiki-upload__cancel" onClick={() => setUploadMode(false)}>Cancelar</button>
                    )}
                  </form>
                  {feedback && <p className={`wiki-feedback wiki-feedback--${feedback.type}`}>{feedback.text}</p>}
                </div>
              ) : (
                <div className="wiki-iframe-wrap">
                  {docLoading && <div className="wiki-docstate">Carregando…</div>}
                  {!docLoading && docError && <div className="wiki-docstate wiki-docstate--error">{docError}</div>}
                  {!docLoading && !docError && docHtml != null && (
                    <iframe className="wiki-iframe" srcDoc={docHtml} sandbox="" title={active.name} />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
