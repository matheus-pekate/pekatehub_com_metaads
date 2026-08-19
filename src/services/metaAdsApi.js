const WEBHOOK_URL = import.meta.env.VITE_META_ADS_WEBHOOK_URL
const AD_DETAIL_WEBHOOK_URL = import.meta.env.VITE_META_ADS_AD_DETAIL_WEBHOOK_URL
const PROGRAM_DAILY_WEBHOOK_URL = import.meta.env.VITE_META_ADS_PROGRAM_DAILY_WEBHOOK_URL
const WON_DEALS_WEBHOOK_URL = import.meta.env.VITE_META_ADS_WON_DEALS_WEBHOOK_URL
const LOST_DEALS_WEBHOOK_URL = import.meta.env.VITE_META_ADS_LOST_DEALS_WEBHOOK_URL
const LEADS_WEBHOOK_URL = import.meta.env.VITE_META_ADS_LEADS_WEBHOOK_URL
const OPEN_DEALS_WEBHOOK_URL = import.meta.env.VITE_META_ADS_OPEN_DEALS_WEBHOOK_URL

export async function fetchMetaAdsSnapshot() {
  if (!WEBHOOK_URL) throw new Error('VITE_META_ADS_WEBHOOK_URL não configurado')
  const res = await fetch(WEBHOOK_URL)
  if (!res.ok) throw new Error(`Meta Ads webhook falhou: ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json)) throw new Error('Meta Ads webhook: formato de resposta inesperado')
  return json
}

export async function fetchAdDailyBreakdown(adId) {
  if (!AD_DETAIL_WEBHOOK_URL) throw new Error('VITE_META_ADS_AD_DETAIL_WEBHOOK_URL não configurado')
  const url = `${AD_DETAIL_WEBHOOK_URL}?ad_id=${encodeURIComponent(adId)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Meta Ads ad-detail webhook falhou: ${res.status}`)
  const json = await res.json()
  if (!json || !Array.isArray(json.days)) throw new Error('Meta Ads ad-detail webhook: formato inesperado')
  return json.days
}

export async function fetchProgramDailyBreakdown(programId) {
  if (!PROGRAM_DAILY_WEBHOOK_URL) throw new Error('VITE_META_ADS_PROGRAM_DAILY_WEBHOOK_URL não configurado')
  const url = `${PROGRAM_DAILY_WEBHOOK_URL}?program_id=${encodeURIComponent(programId)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Meta Ads program-daily webhook falhou: ${res.status}`)
  const json = await res.json()
  if (!json || !Array.isArray(json.days)) throw new Error('Meta Ads program-daily webhook: formato inesperado')
  return json.days
}

export async function fetchWonDeals() {
  if (!WON_DEALS_WEBHOOK_URL) throw new Error('VITE_META_ADS_WON_DEALS_WEBHOOK_URL não configurado')
  const res = await fetch(WON_DEALS_WEBHOOK_URL)
  if (!res.ok) throw new Error(`Meta Ads won-deals webhook falhou: ${res.status}`)
  const json = await res.json()
  if (!json || !Array.isArray(json.programs)) throw new Error('Meta Ads won-deals webhook: formato inesperado')
  return json.programs
}

export async function fetchLostDeals() {
  if (!LOST_DEALS_WEBHOOK_URL) throw new Error('VITE_META_ADS_LOST_DEALS_WEBHOOK_URL não configurado')
  const res = await fetch(LOST_DEALS_WEBHOOK_URL)
  if (!res.ok) throw new Error(`Meta Ads lost-deals webhook falhou: ${res.status}`)
  // A tabela de perdidos pode estar vazia (sem sync ainda) — nesse caso o n8n
  // não emite nenhum item e o corpo da resposta chega vazio, não um JSON válido.
  const text = await res.text()
  const json = text ? JSON.parse(text) : { programs: [] }
  if (!json || !Array.isArray(json.programs)) throw new Error('Meta Ads lost-deals webhook: formato inesperado')
  return json.programs
}

export async function fetchOpenDeals() {
  if (!OPEN_DEALS_WEBHOOK_URL) throw new Error('VITE_META_ADS_OPEN_DEALS_WEBHOOK_URL não configurado')
  const res = await fetch(OPEN_DEALS_WEBHOOK_URL)
  if (!res.ok) throw new Error(`Meta Ads open-deals webhook falhou: ${res.status}`)
  // Mesma cautela do lost-deals: tabela pode estar vazia (sem sync ainda) e o
  // n8n não emite nenhum item, chegando um corpo vazio em vez de JSON válido.
  const text = await res.text()
  const json = text ? JSON.parse(text) : { programs: [] }
  if (!json || !Array.isArray(json.programs)) throw new Error('Meta Ads open-deals webhook: formato inesperado')
  return json.programs
}

export async function fetchLeadsList() {
  if (!LEADS_WEBHOOK_URL) throw new Error('VITE_META_ADS_LEADS_WEBHOOK_URL não configurado')
  const res = await fetch(LEADS_WEBHOOK_URL)
  if (!res.ok) throw new Error(`Meta Ads leads webhook falhou: ${res.status}`)
  const text = await res.text()
  const json = text ? JSON.parse(text) : { programs: [] }
  if (!json || !Array.isArray(json.programs)) throw new Error('Meta Ads leads webhook: formato inesperado')
  return json.programs
}
