const WEBHOOK_URL = import.meta.env.VITE_META_ADS_WEBHOOK_URL

export async function fetchMetaAdsSnapshot() {
  if (!WEBHOOK_URL) throw new Error('VITE_META_ADS_WEBHOOK_URL não configurado')
  const res = await fetch(WEBHOOK_URL)
  if (!res.ok) throw new Error(`Meta Ads webhook falhou: ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json)) throw new Error('Meta Ads webhook: formato de resposta inesperado')
  return json
}
