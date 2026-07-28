const EVENTOS_WEBHOOK_URL = import.meta.env.VITE_EVENTOS_WEBHOOK_URL
const EVENTOS_PARTICIPANTES_WEBHOOK_URL = import.meta.env.VITE_EVENTOS_PARTICIPANTES_WEBHOOK_URL

export async function fetchEventos() {
  if (!EVENTOS_WEBHOOK_URL) throw new Error('VITE_EVENTOS_WEBHOOK_URL não configurado')
  const res = await fetch(EVENTOS_WEBHOOK_URL)
  if (!res.ok) throw new Error(`Eventos webhook falhou: ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json)) throw new Error('Eventos webhook: formato de resposta inesperado')
  return json
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
