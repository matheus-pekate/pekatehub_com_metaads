import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchDocContent } from '../services/docsApi'
import './doc-viewer.css'

export function DocViewer() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [html, setHtml] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setHtml(null)
    setError(null)
    fetchDocContent(slug)
      .then((result) => { if (!cancelled) setHtml(result) })
      .catch((err) => { if (!cancelled) setError(err.message || 'Falha ao carregar documento') })
    return () => { cancelled = true }
  }, [slug])

  return (
    <div className="doc-viewer">
      <div className="doc-viewer__bar">
        <button className="doc-viewer__back" onClick={() => navigate('/pkt-hub')}>← Voltar</button>
      </div>
      {error && <div className="doc-viewer__state doc-viewer__state--error">{error}</div>}
      {!error && html == null && <div className="doc-viewer__state">Carregando…</div>}
      {!error && html != null && (
        <iframe
          className="doc-viewer__frame"
          srcDoc={html}
          sandbox=""
          title="Documentação"
        />
      )}
    </div>
  )
}
