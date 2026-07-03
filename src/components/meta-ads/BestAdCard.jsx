import { formatBRL, formatCompactNumber, formatPercent } from './format'

export function BestAdCard({ ad }) {
  if (!ad) return null

  return (
    <div className="pkt-meta-bestad">
      <span className="pkt-meta-bestad__label">Anúncio destaque</span>
      <span className="pkt-meta-bestad__name" title={ad.ad_name}>{ad.ad_name}</span>
      <div className="pkt-meta-bestad__stats">
        <div className="pkt-meta-bestad__stat">
          <span className="pkt-meta-bestad__stat-value">{ad.leads}</span>
          <span className="pkt-meta-bestad__stat-label">leads</span>
        </div>
        <div className="pkt-meta-bestad__stat">
          <span className="pkt-meta-bestad__stat-value">{formatBRL(ad.cpl)}</span>
          <span className="pkt-meta-bestad__stat-label">CPL</span>
        </div>
        <div className="pkt-meta-bestad__stat">
          <span className="pkt-meta-bestad__stat-value">{formatCompactNumber(ad.reach)}</span>
          <span className="pkt-meta-bestad__stat-label">alcance</span>
        </div>
      </div>
      <span className="pkt-meta-bestad__secondary">
        {formatCompactNumber(ad.impressions)} impressões · {formatCompactNumber(ad.clicks)} cliques · CTR {formatPercent(ad.clicks, ad.impressions)}
      </span>
    </div>
  )
}
