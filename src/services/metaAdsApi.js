const WEBHOOK_URL = import.meta.env.VITE_META_ADS_WEBHOOK_URL
const AD_DETAIL_WEBHOOK_URL = import.meta.env.VITE_META_ADS_AD_DETAIL_WEBHOOK_URL
const PROGRAM_DAILY_WEBHOOK_URL = import.meta.env.VITE_META_ADS_PROGRAM_DAILY_WEBHOOK_URL

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
