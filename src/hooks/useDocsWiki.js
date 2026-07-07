import { useCallback, useEffect, useState } from 'react'
import { fetchWorkflows, fetchDocsIndex } from '../services/docsApi'

const REFRESH_INTERVAL_MS = 2 * 60 * 1000 // 2 minutos — fluxos novos/removidos no n8n aparecem sozinhos

function mergeWorkflowsWithDocs(workflows, docs) {
  const docsById = new Map(docs.map((d) => [d.workflowId, d]))
  return workflows
    .map((wf) => {
      const doc = docsById.get(wf.id)
      return {
        ...wf,
        hasDoc: !!doc,
        docTitle: doc?.title || null,
        docUpdatedAt: doc?.updatedAt || null,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function useDocsWiki() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const [workflows, docs] = await Promise.all([fetchWorkflows(), fetchDocsIndex()])
      setItems(mergeWorkflowsWithDocs(workflows, docs))
    } catch (err) {
      setError(err.message || 'Falha ao carregar fluxos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  return { items, loading, error, refresh }
}
