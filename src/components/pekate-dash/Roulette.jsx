import { useState, useRef, useCallback, useMemo } from 'react'

const PRIZES = [
  { label: 'Prêmio 1', emoji: '🎁' },
  { label: 'Prêmio 2', emoji: '🏆' },
  { label: 'Prêmio 3', emoji: '🎉' },
  { label: 'Prêmio 4', emoji: '⭐' },
  { label: 'Prêmio 5', emoji: '🔥' },
  { label: 'Prêmio 6', emoji: '💎' },
  { label: 'Prêmio 7', emoji: '🚀' },
  { label: 'Prêmio 8', emoji: '🎯' },
]

const SEGMENT_ANGLE = 360 / PRIZES.length
const CONFETTI_COLORS = ['#fe8f20', '#F26522', '#cb5b36', '#fde4cd', '#08373f', '#2DA8A8', '#7B61FF', '#ffffff']
const CONFETTI_COUNT = 60

export function Roulette({ open, onClose }) {
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [rotation, setRotation] = useState(0)
  const wheelRef = useRef(null)
  const [confettiKey, setConfettiKey] = useState(0)

  const confettiPieces = useMemo(() =>
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: `${Math.random() * 0.6}s`,
      duration: `${1.5 + Math.random() * 2}s`,
      drift: `${-30 + Math.random() * 60}px`,
      rotation: `${Math.random() * 720}deg`,
      size: `${6 + Math.random() * 6}px`,
    })),
  [confettiKey])

  const spin = useCallback(() => {
    if (spinning) return
    setSpinning(true)
    setResult(null)

    const winIdx = Math.floor(Math.random() * PRIZES.length)
    const extraTurns = 5 + Math.floor(Math.random() * 3)
    const targetAngle = extraTurns * 360 + (360 - winIdx * SEGMENT_ANGLE - SEGMENT_ANGLE / 2)
    const finalRotation = rotation + targetAngle

    setRotation(finalRotation)

    setTimeout(() => {
      setSpinning(false)
      setResult(PRIZES[winIdx])
      setConfettiKey((k) => k + 1)
    }, 4200)
  }, [spinning, rotation])

  const handleClose = () => {
    setResult(null)
    setRotation(0)
    onClose()
  }

  if (!open) return null

  return (
    <div className="pkt-roulette-overlay" onClick={handleClose}>
      <div className="pkt-roulette" onClick={(e) => e.stopPropagation()}>
        <button className="pkt-roulette__close" onClick={handleClose}>✕</button>

        <div className="pkt-roulette__header">
          <span className="pkt-roulette__eyebrow">Fechou contrato?</span>
          <h2 className="pkt-roulette__title">Roleta de Prêmios</h2>
        </div>

        <div className="pkt-roulette__stage">
          <div className="pkt-roulette__pointer">▼</div>
          <div
            ref={wheelRef}
            className="pkt-roulette__wheel"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {PRIZES.map((prize, i) => {
              const angle = i * SEGMENT_ANGLE
              return (
                <div
                  key={i}
                  className="pkt-roulette__segment"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <span className="pkt-roulette__segment-label">
                    <span className="pkt-roulette__segment-emoji">{prize.emoji}</span>
                    {prize.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {result ? (
          <>
            <div className="pkt-confetti" key={confettiKey}>
              {confettiPieces.map((p, i) => (
                <span
                  key={i}
                  className="pkt-confetti__piece"
                  style={{
                    left: p.left,
                    '--c-color': p.color,
                    '--c-delay': p.delay,
                    '--c-duration': p.duration,
                    '--c-drift': p.drift,
                    '--c-rotation': p.rotation,
                    '--c-size': p.size,
                  }}
                />
              ))}
            </div>
            <div className="pkt-roulette__result">
              <span className="pkt-roulette__result-emoji">{result.emoji}</span>
              <span className="pkt-roulette__result-text">Parabéns! Você ganhou:</span>
              <span className="pkt-roulette__result-prize">{result.label}</span>
            </div>
          </>
        ) : (
          <button
            className="pkt-roulette__spin"
            onClick={spin}
            disabled={spinning}
          >
            {spinning ? 'Girando...' : 'Girar a Roleta!'}
          </button>
        )}
      </div>
    </div>
  )
}
