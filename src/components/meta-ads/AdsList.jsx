import { formatBRL, formatCompactNumber, formatPercent } from './format'

const MAX_VISIBLE = 6

export function AdsList({ ads }) {
  if (!ads || ads.length === 0) return null

  const visible = ads.slice(0, MAX_VISIBLE)
  const remaining = ads.length - visible.length

  return (
    <div className="pkt-meta-ads">
      <div className="pkt-meta-ads__header">
        <span className="pkt-meta-ads__col pkt-meta-ads__col--name">Anúncio</span>
        <span className="pkt-meta-ads__col">Leads</span>
        <span className="pkt-meta-ads__col">CPL</span>
        <span className="pkt-meta-ads__col">Alcance</span>
        <span className="pkt-meta-ads__col">Impressões</span>
        <span className="pkt-meta-ads__col">Cliques</span>
        <span className="pkt-meta-ads__col">CTR</span>
      </div>
      {visible.map((ad, i) => (
        <div key={ad.ad_id} className={`pkt-meta-ads__row ${i === 0 ? 'pkt-meta-ads__row--best' : ''}`}>
          <span className="pkt-meta-ads__col pkt-meta-ads__col--name" title={ad.ad_name}>
            {i === 0 && <span className="pkt-meta-ads__crown">🏆</span>}
            {ad.ad_name}
          </span>
          <span className="pkt-meta-ads__col pkt-meta-ads__col--num">{ad.leads}</span>
          <span className="pkt-meta-ads__col pkt-meta-ads__col--num">{formatBRL(ad.cpl)}</span>
          <span className="pkt-meta-ads__col pkt-meta-ads__col--num">{formatCompactNumber(ad.reach)}</span>
          <span className="pkt-meta-ads__col pkt-meta-ads__col--num">{formatCompactNumber(ad.impressions)}</span>
          <span className="pkt-meta-ads__col pkt-meta-ads__col--num">{formatCompactNumber(ad.clicks)}</span>
          <span className="pkt-meta-ads__col pkt-meta-ads__col--num">{formatPercent(ad.clicks, ad.impressions)}</span>
        </div>
      ))}
      {remaining > 0 && (
        <div className="pkt-meta-ads__more">+{remaining} outro{remaining === 1 ? '' : 's'} anúncio{remaining === 1 ? '' : 's'} ativo{remaining === 1 ? '' : 's'}</div>
      )}
    </div>
  )
}
