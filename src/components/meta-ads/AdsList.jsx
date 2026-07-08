import { useState } from 'react'
import { formatBRL, formatCompactNumber, formatPercent } from './format'

const MAX_VISIBLE = 4

function AdsHeader() {
  return (
    <div className="pkt-meta-ads__header">
      <span className="pkt-meta-ads__col pkt-meta-ads__col--name">Anúncio</span>
      <span className="pkt-meta-ads__col">Leads</span>
      <span className="pkt-meta-ads__col">CPL</span>
      <span className="pkt-meta-ads__col">Alcance</span>
      <span className="pkt-meta-ads__col">Impressões</span>
      <span className="pkt-meta-ads__col">Cliques</span>
      <span className="pkt-meta-ads__col">CTR</span>
    </div>
  )
}

function AdRow({ ad, showCrown, onSelect }) {
  return (
    <div
      className={`pkt-meta-ads__row ${showCrown ? 'pkt-meta-ads__row--best' : ''} ${onSelect ? 'pkt-meta-ads__row--clickable' : ''}`}
      onClick={onSelect ? () => onSelect(ad) : undefined}
    >
      <span className="pkt-meta-ads__col pkt-meta-ads__col--name" title={ad.ad_name}>
        {showCrown && <span className="pkt-meta-ads__crown">🏆</span>}
        {ad.thumbnail_url && (
          <img className="pkt-meta-ads__thumb" src={ad.thumbnail_url} alt="" />
        )}
        <span className="pkt-meta-ads__name-text">{ad.ad_name}</span>
      </span>
      <span className="pkt-meta-ads__col pkt-meta-ads__col--num">{ad.leads}</span>
      <span className="pkt-meta-ads__col pkt-meta-ads__col--num">{formatBRL(ad.cpl)}</span>
      <span className="pkt-meta-ads__col pkt-meta-ads__col--num">{formatCompactNumber(ad.reach)}</span>
      <span className="pkt-meta-ads__col pkt-meta-ads__col--num">{formatCompactNumber(ad.impressions)}</span>
      <span className="pkt-meta-ads__col pkt-meta-ads__col--num">{formatCompactNumber(ad.clicks)}</span>
      <span className="pkt-meta-ads__col pkt-meta-ads__col--num">{formatPercent(ad.clicks, ad.impressions)}</span>
    </div>
  )
}

function groupByCampaign(ads) {
  const order = []
  const groups = new Map()
  for (const ad of ads) {
    if (!groups.has(ad.campaign_id)) {
      groups.set(ad.campaign_id, { campaign_id: ad.campaign_id, campaign_name: ad.campaign_name, ads: [] })
      order.push(ad.campaign_id)
    }
    groups.get(ad.campaign_id).ads.push(ad)
  }
  // campanhas com mais leads no topo (ads dentro de cada uma já vêm ordenados por leads)
  return order
    .map((id) => groups.get(id))
    .sort((a, b) => (b.ads[0]?.leads ?? 0) - (a.ads[0]?.leads ?? 0))
}

export function AdsList({ ads, groupByCampaign: shouldGroup = false, onSelectAd }) {
  const [expandedId, setExpandedId] = useState(null)

  if (!ads || ads.length === 0) return null

  if (shouldGroup) {
    const campaigns = groupByCampaign(ads)

    return (
      <div className="pkt-meta-ads pkt-meta-ads--grouped">
        {campaigns.map((campaign) => {
          const isOpen = campaign.campaign_id === expandedId
          const visible = isOpen ? campaign.ads.slice(0, MAX_VISIBLE) : []
          const remaining = campaign.ads.length - visible.length
          return (
            <div key={campaign.campaign_id} className={`pkt-meta-ads-group ${isOpen ? 'pkt-meta-ads-group--open' : ''}`}>
              <button
                type="button"
                className="pkt-meta-ads-group__title"
                onClick={() => setExpandedId(isOpen ? null : campaign.campaign_id)}
              >
                <span className="pkt-meta-ads-group__title-text" title={campaign.campaign_name}>{campaign.campaign_name}</span>
                <span className="pkt-meta-ads-group__count">{campaign.ads.length} anúncio{campaign.ads.length === 1 ? '' : 's'}</span>
                <span className="pkt-meta-ads-group__chevron">▾</span>
              </button>
              {isOpen && (
                <>
                  <AdsHeader />
                  {visible.map((ad, i) => (
                    <AdRow key={ad.ad_id} ad={ad} showCrown={i === 0} onSelect={onSelectAd} />
                  ))}
                  {remaining > 0 && (
                    <div className="pkt-meta-ads__more">+{remaining} outro{remaining === 1 ? '' : 's'} anúncio{remaining === 1 ? '' : 's'} ativo{remaining === 1 ? '' : 's'}</div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const visible = ads.slice(0, MAX_VISIBLE)
  const remaining = ads.length - visible.length

  return (
    <div className="pkt-meta-ads">
      <AdsHeader />
      {visible.map((ad, i) => (
        <AdRow key={ad.ad_id} ad={ad} showCrown={i === 0} onSelect={onSelectAd} />
      ))}
      {remaining > 0 && (
        <div className="pkt-meta-ads__more">+{remaining} outro{remaining === 1 ? '' : 's'} anúncio{remaining === 1 ? '' : 's'} ativo{remaining === 1 ? '' : 's'}</div>
      )}
    </div>
  )
}
