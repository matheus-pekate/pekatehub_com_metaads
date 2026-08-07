const EVENTOS_WEBHOOK_URL = import.meta.env.VITE_EVENTOS_WEBHOOK_URL
const EVENTOS_PARTICIPANTES_WEBHOOK_URL = import.meta.env.VITE_EVENTOS_PARTICIPANTES_WEBHOOK_URL
const EVENTOS_TODOS_PARTICIPANTES_WEBHOOK_URL = import.meta.env.VITE_EVENTOS_TODOS_PARTICIPANTES_WEBHOOK_URL

// A API devolve, por evento, `compareceram`/`naoCompareceram` já divididos em
// { total, existente: {prospect,convidado,oportunidade,negocioGanho}, novo: {...} }.
// Além de manter esse formato bruto (usado pelo drill-down do card), derivamos
// os totais "planos" que o restante do dashboard (Visão Geral, topbar) já espera.
function withDerivedTotals(evento) {
  const c = evento.compareceram || { total: 0, existente: {}, novo: {} }
  const n = evento.naoCompareceram || { total: 0, existente: {}, novo: {} }
  const g = (bucket, key) => (bucket && bucket[key]) || 0

  return {
    ...evento,
    prospects: g(c.existente, 'prospect') + g(c.novo, 'prospect') + g(n.existente, 'prospect') + g(n.novo, 'prospect'),
    convidados: g(c.existente, 'convidado') + g(c.novo, 'convidado') + g(n.existente, 'convidado') + g(n.novo, 'convidado'),
    oportunidadesNovas: g(c.novo, 'oportunidade') + g(n.novo, 'oportunidade'),
    oportunidadesExistentes: g(c.existente, 'oportunidade') + g(n.existente, 'oportunidade'),
    negociosGanhosNovos: g(c.novo, 'negocioGanho') + g(n.novo, 'negocioGanho'),
    negociosGanhosExistentes: g(c.existente, 'negocioGanho') + g(n.existente, 'negocioGanho'),
    naoCompareceramTotal: n.total,
  }
}

export async function fetchEventos() {
  if (!EVENTOS_WEBHOOK_URL) throw new Error('VITE_EVENTOS_WEBHOOK_URL não configurado')
  const res = await fetch(EVENTOS_WEBHOOK_URL)
  if (!res.ok) throw new Error(`Eventos webhook falhou: ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json)) throw new Error('Eventos webhook: formato de resposta inesperado')
  return json.map(withDerivedTotals)
}

export async function fetchParticipantesEvento(eventId, eventStartDate) {
  if (!EVENTOS_PARTICIPANTES_WEBHOOK_URL) throw new Error('VITE_EVENTOS_PARTICIPANTES_WEBHOOK_URL não configurado')
  const params = new URLSearchParams({ event_id: eventId })
  if (eventStartDate) params.set('event_start_date', eventStartDate)
  const url = `${EVENTOS_PARTICIPANTES_WEBHOOK_URL}?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Eventos participantes webhook falhou: ${res.status}`)
  const json = await res.json()
  if (!json || !Array.isArray(json.participantes)) throw new Error('Eventos participantes webhook: formato inesperado')
  return json.participantes
}

export async function fetchTodosParticipantes() {
  if (!EVENTOS_TODOS_PARTICIPANTES_WEBHOOK_URL) throw new Error('VITE_EVENTOS_TODOS_PARTICIPANTES_WEBHOOK_URL não configurado')
  const res = await fetch(EVENTOS_TODOS_PARTICIPANTES_WEBHOOK_URL)
  if (!res.ok) throw new Error(`Eventos todos participantes webhook falhou: ${res.status}`)
  const json = await res.json()
  if (!json || !Array.isArray(json.participantes)) throw new Error('Eventos todos participantes webhook: formato inesperado')
  return json.participantes
}
