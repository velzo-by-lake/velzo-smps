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

function PowerSummary({ belt }: PowerSummaryProps) {
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

  const remainingWatt = ABSOLUTE_LIMIT - totalWatt
  const recommendedRemaining = RECOMMENDED_LIMIT - totalWatt

  return (
    <div className="summary-card">
      <div className="summary-head">
        <div className="summary-title">
          <p className="muted">⚡ 전력 사용량</p>
          <h3 className={`watt-display ${status.toLowerCase()}`}>{totalWatt}W</h3>
        </div>
        <span className={toneClass}>{statusLabel}</span>
      </div>
      
      <div className="power-gauge-container">
        <div className="power-gauge">
          <div className="gauge-background">
            <div 
              className={`gauge-fill ${status.toLowerCase()}`}
              style={{ width: `${Math.min(absolutePercent, 100)}%` }}
            />
          </div>
          <div className="gauge-labels">
            <span className="gauge-min">0W</span>
            <span className="gauge-max">100W</span>
          </div>
        </div>
        
        <div className="capacity-status">
          {remainingWatt > 0 ? (
            <div className="remaining-capacity">
              <span className="remaining-label">남은 용량</span>
              <span className="remaining-value safe">{remainingWatt}W</span>
            </div>
          ) : (
            <div className="over-capacity">
              <span className="over-label">초과</span>
              <span className="over-value">{Math.abs(remainingWatt)}W</span>
            </div>
          )}
        </div>
      </div>

      <div className="progress-block">
        <div className="progress-header">
          <label>권장 용량 70W</label>
          <span className={`progress-percent ${recommendedPercent > 100 ? 'danger' : recommendedPercent > 80 ? 'warning' : 'safe'}`}>
            {recommendedPercent.toFixed(0)}%
          </span>
        </div>
        <div className="progress">
          <div 
            className={`progress-bar ${recommendedPercent > 100 ? 'danger' : recommendedPercent > 80 ? 'warning' : 'safe'}`}
            style={{ width: `${Math.min(recommendedPercent, 110)}%` }} 
          />
        </div>
        {recommendedRemaining > 0 && (
          <p className="progress-hint">+{recommendedRemaining.toFixed(0)}W 더 추가 가능</p>
        )}
      </div>
      
      <div className="progress-block">
        <div className="progress-header">
          <label>최대 용량 100W</label>
          <span className={`progress-percent ${absolutePercent > 100 ? 'danger' : absolutePercent > 80 ? 'warning' : 'safe'}`}>
            {absolutePercent.toFixed(0)}%
          </span>
        </div>
        <div className="progress">
          <div 
            className={`progress-bar ${absolutePercent > 100 ? 'danger' : absolutePercent > 80 ? 'warning' : 'safe'}`}
            style={{ width: `${Math.min(absolutePercent, 110)}%` }} 
          />
        </div>
        {remainingWatt > 0 && (
          <p className="progress-hint">+{remainingWatt.toFixed(0)}W 더 추가 가능</p>
        )}
        {remainingWatt <= 0 && (
          <p className="progress-hint danger">⚠️ 용량 초과! 조명을 제거하거나 SMPS를 추가하세요</p>
        )}
      </div>
      
      {status === 'OVERLOAD' && (
        <div className="lottie-box" ref={lottieContainer} />
      )}
    </div>
  )
}

export default PowerSummary

