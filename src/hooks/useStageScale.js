import { useEffect, useRef } from 'react'

// Ajusta a variável CSS --stage-scale para caber o canvas fixo de 1920x1080
// na resolução real da TV. Compartilhado por PekateDash e MetaAdsDash.
export function useStageScale() {
  const stageRef = useRef(null)

  useEffect(() => {
    function fit() {
      const stage = stageRef.current
      if (!stage) return
      const w = window.innerWidth || document.documentElement.clientWidth
      const h = window.innerHeight || document.documentElement.clientHeight
      if (!w || !h) return
      const s = Math.min(w / 1920, h / 1080)
      if (s > 0) stage.style.setProperty('--stage-scale', s)
    }
    fit()
    window.addEventListener('resize', fit)
    let tries = 0
    const retry = setInterval(() => {
      fit()
      if (++tries > 12) clearInterval(retry)
    }, 80)
    return () => {
      window.removeEventListener('resize', fit)
      clearInterval(retry)
    }
  }, [])

  return stageRef
}
