import { useMetaAdsData } from '../hooks/useMetaAdsData'
import { useStageScale } from '../hooks/useStageScale'
import { MetaAdsTopbar } from '../components/meta-ads/MetaAdsTopbar'
import { ProgramGrid } from '../components/meta-ads/ProgramGrid'
import { DisclaimerStrip } from '../components/meta-ads/DisclaimerStrip'
import './meta-ads-dash.css'

export function MetaAdsDash() {
  const { data, error, lastUpdated, refresh } = useMetaAdsData()
  const stage = useStageScale()

  return (
    <div className="pkt-letterbox">
      <div className="pkt-stage pkt-meta-stage" ref={stage}>
        <MetaAdsTopbar lastUpdated={lastUpdated} error={error} onRefresh={refresh} />
        <ProgramGrid programs={data} />
        <DisclaimerStrip />
      </div>
    </div>
  )
}
