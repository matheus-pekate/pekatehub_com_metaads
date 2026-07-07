import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocsList } from '../../hooks/useDocsList'
import { uploadDoc } from '../../services/docsApi'

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return '' }
}

export function DocsSection() {
  const navigate = useNavigate()
  const { docs, loading, error, refresh } = useDocsList()
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState(null)

  function handleFileChange(e) {
    const selected = e.target.files?.[0] || null
    setFile(selected)
    if (selected && !title) setTitle(selected.name.replace(/\.html?$/i, ''))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const form = e.target
    if (!file || !title.trim()) return

    setSending(true)
    setFeedback(null)
    try {
      const html = await file.text()
      await uploadDoc({ title: title.trim(), html })
      setFeedback({ type: 'success', text: 'Documento enviado com sucesso.' })
      setTitle('')
      setFile(null)
      form.reset()
      refresh()
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Falha ao enviar documento.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <section className="hub-main__section">
        <h2 className="hub-main__section-title">Documentação dos fluxos</h2>
        <div className="hub-main__grid">
          {loading && <p className="docs-empty">Carregando...</p>}
          {!loading && error && <p className="docs-empty docs-empty--error">{error}</p>}
          {!loading && !error && docs.length === 0 && (
            <p className="docs-empty">Nenhuma documentação enviada ainda.</p>
          )}
          {!loading && docs.map((doc) => (
            <button key={doc.slug} className="hub-card" onClick={() => navigate(`/documentacao/${doc.slug}`)}>
              <div className="hub-card__icon">📄</div>
              <h3 className="hub-card__title">{doc.title}</h3>
              <p className="hub-card__desc">Atualizado em {formatDate(doc.updatedAt)}</p>
              <span className="hub-card__status hub-card__status--live">Abrir</span>
            </button>
          ))}
        </div>
      </section>

      <section className="hub-main__section">
        <h2 className="hub-main__section-title">Enviar nova documentação</h2>
        <form className="docs-upload" onSubmit={handleSubmit}>
          <input
            type="text"
            className="docs-upload__input"
            placeholder="Título do documento (ex: Fluxo de Coleta — Meta Ads)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="file"
            accept=".html,.htm"
            className="docs-upload__file"
            onChange={handleFileChange}
          />
          <button type="submit" className="docs-upload__submit" disabled={sending || !file || !title.trim()}>
            {sending ? 'Enviando…' : 'Enviar documentação'}
          </button>
        </form>
        {feedback && (
          <p className={`docs-feedback docs-feedback--${feedback.type}`}>{feedback.text}</p>
        )}
        <p className="docs-hint">Envie um arquivo .html. Se já existir um documento com o mesmo título, ele será substituído.</p>
      </section>
    </>
  )
}
