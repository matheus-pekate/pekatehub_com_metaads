import { useState } from 'react'
import { useGeneralDocs } from '../../hooks/useGeneralDocs'
import { fetchGeneralDocContent, uploadGeneralDoc, deleteGeneralDoc } from '../../services/generalDocsApi'

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return '' }
}

export function GeneralDocsGrid() {
  const { docs, loading, error, refresh } = useGeneralDocs()

  const [uploadOpen, setUploadOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [sending, setSending] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const [viewing, setViewing] = useState(null)
  const [viewHtml, setViewHtml] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState(null)

  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  function openUpload() {
    setTitle('')
    setFile(null)
    setUploadError(null)
    setUploadOpen(true)
  }

  async function handleUploadSubmit(e) {
    e.preventDefault()
    if (!file || !title.trim()) return
    setSending(true)
    setUploadError(null)
    try {
      const html = await file.text()
      await uploadGeneralDoc({ title: title.trim(), html })
      setUploadOpen(false)
      await refresh()
    } catch (err) {
      setUploadError(err.message || 'Falha ao enviar documento.')
    } finally {
      setSending(false)
    }
  }

  function openViewer(doc) {
    setViewing(doc)
    setViewHtml(null)
    setViewError(null)
    setViewLoading(true)
    fetchGeneralDocContent(doc.slug)
      .then(setViewHtml)
      .catch((err) => setViewError(err.message || 'Falha ao carregar documento'))
      .finally(() => setViewLoading(false))
  }

  function askDelete(doc) {
    setDeleteError(null)
    setDeleting(doc)
  }

  async function handleDeleteConfirmed() {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await deleteGeneralDoc(deleting.slug)
      setDeleting(null)
      await refresh()
    } catch (err) {
      setDeleteError(err.message || 'Falha ao apagar documento.')
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <>
      {docs.map((doc) => (
        <div key={doc.slug} className="hub-card hub-doc-card">
          <div className="hub-card__icon">📄</div>
          <h3 className="hub-card__title">{doc.title}</h3>
          <p className="hub-card__desc">Atualizado em {formatDate(doc.updatedAt)}</p>
          <div className="hub-doc-card__actions">
            <button type="button" className="hub-doc-card__open" onClick={() => openViewer(doc)}>Abrir</button>
            <button type="button" className="hub-doc-card__delete" onClick={() => askDelete(doc)}>Apagar</button>
          </div>
        </div>
      ))}

      <button type="button" className="hub-card hub-doc-add" onClick={openUpload}>
        <div className="hub-card__icon">＋</div>
        <h3 className="hub-card__title">Novo documento</h3>
        <p className="hub-card__desc">Adicione um arquivo .html com uma nova documentação.</p>
      </button>

      {loading && <p className="hub-doc-status">Carregando documentos…</p>}
      {!loading && error && <p className="hub-doc-status hub-doc-status--error">{error}</p>}

      {uploadOpen && (
        <div className="hub-modal-overlay" onClick={() => !sending && setUploadOpen(false)}>
          <div className="hub-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="hub-modal__title">Novo documento</h3>
            <form className="hub-modal__form" onSubmit={handleUploadSubmit}>
              <input
                type="text"
                className="hub-modal__input"
                placeholder="Título do documento"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input type="file" accept=".html,.htm" className="hub-modal__file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {uploadError && <p className="hub-doc-status hub-doc-status--error">{uploadError}</p>}
              <div className="hub-modal__actions">
                <button type="button" className="hub-modal__cancel" onClick={() => setUploadOpen(false)} disabled={sending}>Cancelar</button>
                <button type="submit" className="hub-modal__submit" disabled={sending || !file || !title.trim()}>
                  {sending ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div className="hub-viewer-overlay" onClick={() => setViewing(null)}>
          <div className="hub-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="hub-viewer__top">
              <span className="hub-viewer__title">{viewing.title}</span>
              <button type="button" className="hub-viewer__close" onClick={() => setViewing(null)}>✕</button>
            </div>
            <div className="hub-viewer__body">
              {viewLoading && <div className="hub-doc-status">Carregando…</div>}
              {!viewLoading && viewError && <div className="hub-doc-status hub-doc-status--error">{viewError}</div>}
              {!viewLoading && !viewError && viewHtml != null && (
                <iframe className="hub-viewer__frame" srcDoc={viewHtml} sandbox="allow-scripts allow-popups" title={viewing.title} />
              )}
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="hub-modal-overlay" onClick={() => !deleteBusy && setDeleting(null)}>
          <div className="hub-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="hub-modal__title">Apagar documento?</h3>
            <p className="hub-modal__text">
              Isso vai apagar <strong>{deleting.title}</strong>. Essa ação não pode ser desfeita.
            </p>
            {deleteError && <p className="hub-doc-status hub-doc-status--error">{deleteError}</p>}
            <div className="hub-modal__actions">
              <button type="button" className="hub-modal__cancel" onClick={() => setDeleting(null)} disabled={deleteBusy}>Cancelar</button>
              <button type="button" className="hub-modal__delete" onClick={handleDeleteConfirmed} disabled={deleteBusy}>
                {deleteBusy ? 'Apagando…' : 'Apagar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
