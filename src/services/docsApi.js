export async function fetchDocsList() {
  const res = await fetch('/api/docs')
  if (!res.ok) throw new Error(`Falha ao listar documentos: ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json.docs)) throw new Error('Documentos: formato de resposta inesperado')
  return json.docs
}

export async function fetchDocContent(slug) {
  const res = await fetch(`/api/docs?slug=${encodeURIComponent(slug)}`)
  if (!res.ok) throw new Error(`Falha ao carregar documento: ${res.status}`)
  const json = await res.json()
  if (typeof json.html !== 'string') throw new Error('Documento: formato de resposta inesperado')
  return json.html
}

export async function uploadDoc({ title, html }) {
  const res = await fetch('/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, html }),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || `Falha ao enviar documento: ${res.status}`)
  }
  return res.json()
}
