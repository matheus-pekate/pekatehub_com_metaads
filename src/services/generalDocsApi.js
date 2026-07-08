export async function fetchGeneralDocsList() {
  const res = await fetch('/api/general-docs')
  if (!res.ok) throw new Error(`Falha ao listar documentos: ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json.docs)) throw new Error('Documentos: formato de resposta inesperado')
  return json.docs
}

export async function fetchGeneralDocContent(slug) {
  const res = await fetch(`/api/general-docs?slug=${encodeURIComponent(slug)}`)
  if (!res.ok) throw new Error(`Falha ao carregar documento: ${res.status}`)
  const json = await res.json()
  if (typeof json.html !== 'string') throw new Error('Documento: formato de resposta inesperado')
  return json.html
}

export async function uploadGeneralDoc({ title, html, protected: isProtected }) {
  const res = await fetch('/api/general-docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, html, protected: !!isProtected }),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || `Falha ao enviar documento: ${res.status}`)
  }
  return res.json()
}

export async function deleteGeneralDoc(slug) {
  const res = await fetch(`/api/general-docs?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || `Falha ao apagar documento: ${res.status}`)
  }
  return res.json()
}
