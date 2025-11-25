import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'
import type { AnimationItem } from 'lottie-web'
import explosionAnimation from '../assets/explosion.json'
import type { Belt } from '../types'
import {
  ABSOLUTE_LIMIT,
  RECOMMENDED_LIMIT,
  getBeltTotalWatt,
  getStatus,
  getUsagePercent,
} from '../utils/watt'
import type { Stage } from 'konva/lib/Stage'

type PowerSummaryProps = {
  belt: Belt
  stage: Stage | null
}

function PowerSummary({ belt, stage }: PowerSummaryProps) {
  const totalWatt = getBeltTotalWatt(belt)
  const recommendedPercent = getUsagePercent(totalWatt, RECOMMENDED_LIMIT)
  const absolutePercent = getUsagePercent(totalWatt, ABSOLUTE_LIMIT)
  const status = getStatus(totalWatt)

  const lottieContainer = useRef<HTMLDivElement>(null)
  const animationInstance = useRef<AnimationItem>()

  useEffect(() => {
    if (!lottieContainer.current) return undefined
    animationInstance.current = lottie.loadAnimation({
      container: lottieContainer.current,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: explosionAnimation,
    })
    return () => {
      animationInstance.current?.destroy()
    }
  }, [])

  useEffect(() => {
    if (status === 'OVERLOAD') {
      animationInstance.current?.goToAndPlay(0, true)
    }
  }, [status])

  const statusLabel = {
    SAFE: 'SAFE',
    CAUTION: 'CAUTION',
    OVERLOAD: 'OVERLOAD',
  }[status]

  const toneClass = `badge ${status.toLowerCase()}`

  return (
    <div className="summary-card">
      <div className="summary-head">
        <div>
          <p className="muted">SMPS {belt.id.slice(0, 4).toUpperCase()}</p>
          <h3>{totalWatt}W</h3>
        </div>
        <span className={toneClass}>{statusLabel}</span>
      </div>
      <div className="progress-block">
        <label>권장 70W</label>
        <div className="progress">
          <div style={{ width: `${Math.min(recommendedPercent, 110)}%` }} />
        </div>
        <span>{recommendedPercent.toFixed(1)}%</span>
      </div>
      <div className="progress-block">
        <label>정격 100W</label>
        <div className="progress danger">
          <div style={{ width: `${Math.min(absolutePercent, 110)}%` }} />
        </div>
        <span>{absolutePercent.toFixed(1)}%</span>
      </div>
      <div className="lottie-box" ref={lottieContainer} />
    </div>
  )
}

export default PowerSummary

