import { useMemo, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSimulatorStore } from '../store/useSimulatorStore'
import { products } from '../data/products'
import './PriceSummary.css'

function PriceSummary() {
  const belts = useSimulatorStore((state) => state.belts)
  const [firstLightTime, setFirstLightTime] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [purchasePhoneNumber, setPurchasePhoneNumber] = useState('')

  // 첫 조명 배치 시간 추적
  useEffect(() => {
    const hasLights = belts.some((belt) => belt.lights.length > 0)
    const savedTime = localStorage.getItem('velzo_first_light_time')
    
    if (!hasLights) {
      // 조명이 모두 제거되면 시간 초기화
      localStorage.removeItem('velzo_first_light_time')
      setFirstLightTime(null)
    } else if (savedTime) {
      setFirstLightTime(parseInt(savedTime, 10))
    } else {
      // 첫 조명이 배치되면 시간 저장
      const now = Date.now()
      localStorage.setItem('velzo_first_light_time', now.toString())
      setFirstLightTime(now)
    }
  }, [belts])

  // 남은 시간 실시간 업데이트
  useEffect(() => {
    if (!firstLightTime) return undefined
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000) // 1초마다 업데이트
    return () => clearInterval(interval)
  }, [firstLightTime])

  const totalPrice = useMemo(() => {
    return belts.reduce((sum, belt) => {
      return (
        sum +
        belt.lights.reduce((beltSum, light) => {
          const product = products.find((p) => p.id === light.productId)
          return beltSum + (product?.price || 0)
        }, 0)
      )
    }, 0)
  }, [belts])

  const lightCount = useMemo(() => {
    return belts.reduce((sum, belt) => sum + belt.lights.length, 0)
  }, [belts])

  // 할인 계산
  const discountInfo = useMemo(() => {
    if (totalPrice === 0) return null

    const isOver1Million = totalPrice >= 1000000
    const isWithin1Hour = firstLightTime
      ? currentTime - firstLightTime <= 60 * 60 * 1000 // 1시간 = 60분 * 60초 * 1000ms
      : false

    if (isOver1Million) {
      // 100만원 이상: 30% 특별 할인
      const discountAmount = Math.floor(totalPrice * 0.3)
      const finalPrice = totalPrice - discountAmount
      return {
        type: 'special' as const,
        discountRate: 30,
        discountAmount,
        finalPrice,
        originalPrice: totalPrice,
      }
    } else if (isWithin1Hour) {
      // 1시간 이내: 10% 할인
      const discountAmount = Math.floor(totalPrice * 0.1)
      const finalPrice = totalPrice - discountAmount
      return {
        type: 'time' as const,
        discountRate: 10,
        discountAmount,
        finalPrice,
        originalPrice: totalPrice,
      }
    }

    return null
  }, [totalPrice, firstLightTime, currentTime])

  // 남은 시간 계산 (1시간 이내 할인용)
  const remainingTime = useMemo(() => {
    if (!firstLightTime || discountInfo?.type !== 'time') return null
    const elapsed = currentTime - firstLightTime
    const remaining = 60 * 60 * 1000 - elapsed // 1시간 - 경과 시간
    if (remaining <= 0) return null
    const minutes = Math.floor(remaining / (60 * 1000))
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000)
    return { minutes, seconds }
  }, [firstLightTime, discountInfo, currentTime])

  const handleCatalogRequest = () => {
    // 사업자 특별 카탈로그 무료 받기 - Google Forms 설문조사로 이동
    window.open('https://forms.gle/KnqfXZxgW8xCTuem7', '_blank')
  }

  const sendTelegramNotification = async (action: string, phone?: string) => {
    // 텔레그램 봇 설정 (환경 변수 또는 설정 파일에서 가져오기)
    const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN'
    const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID'

    // 봇 토큰이 설정되지 않았으면 알림 전송 건너뛰기
    if (TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN' || TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID') {
      console.warn('텔레그램 봇 설정이 필요합니다.')
      return
    }

    const productList = belts
      .flatMap((belt) =>
        belt.lights.map((light) => {
          const product = products.find((p) => p.id === light.productId)
          return product ? `• ${product.name} (${product.price.toLocaleString()}원)` : null
        }),
      )
      .filter(Boolean)
      .join('\n')

    const discountText = discountInfo
      ? `\n할인 적용: ${discountInfo.discountRate}% (${discountInfo.discountAmount.toLocaleString()}원 할인)\n최종 금액: ${discountInfo.finalPrice.toLocaleString()}원`
      : ''

    const phoneText = phone ? `\n📞 <b>연락처:</b> ${phone}` : ''

    const message = `🛒 <b>VELZO 견적 문의</b>

${action === 'inquiry' ? '📞 <b>문의 요청</b>' : '💰 <b>구매 요청</b>'}${phoneText}

━━━━━━━━━━━━━━━━━━
총 견적 금액: ${totalPrice.toLocaleString()}원${discountText}
모듈 개수: ${lightCount}개

<b>선택한 제품:</b>
${productList || '없음'}

━━━━━━━━━━━━━━━━━━
문의 시간: ${new Date().toLocaleString('ko-KR')}`

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      })

      if (!response.ok) {
        throw new Error('텔레그램 알림 전송 실패')
      }
    } catch (error) {
      console.error('텔레그램 알림 전송 실패:', error)
      // 에러가 발생해도 사용자 경험에는 영향 없음 (조용히 실패)
    }
  }

  const handleInquiry = async () => {
    // 문의하기 - 텔레그램 알림 + 사용자에게 연락 옵션 제공
    await sendTelegramNotification('inquiry')
    
    const userChoice = window.confirm(
      '문의가 접수되었습니다!\n\n곧 연락드리겠습니다.\n\n지금 바로 전화 문의하시겠습니까?'
    )
    
    if (userChoice) {
      window.location.href = 'tel:010-7356-6036'
    }
  }

  const handlePurchase = () => {
    // 구매하기 모달 표시
    setShowPurchaseModal(true)
  }

  const handleContactSubmit = async () => {
    if (!purchasePhoneNumber.trim()) {
      alert('연락받을 전화번호를 입력해주세요.')
      return
    }

    await sendTelegramNotification('purchase', purchasePhoneNumber)
    alert('구매 문의가 접수되었습니다! 곧 연락드리겠습니다.')
    setShowPurchaseModal(false)
    setPurchasePhoneNumber('')
  }

  const handleKakaoInquiry = () => {
    window.open('https://pf.kakao.com/...', '_blank')
  }

  const handleCallNow = () => {
    window.location.href = 'tel:010-7356-6036'
  }

  return (
    <div className="price-summary-fixed">
      <div className="price-summary-content">
        <div className="price-info">
          <div className="price-main">
            <span className="price-label">총 견적 금액</span>
            <div className="price-values">
              {totalPrice > 0 ? (
                <>
                  {discountInfo ? (
                    <>
                      <span className="price-original">{discountInfo.originalPrice.toLocaleString()}원</span>
                      <span className="price-discount">{discountInfo.finalPrice.toLocaleString()}원</span>
                      <span className={`discount-badge ${discountInfo.type === 'special' ? 'special' : 'time'}`}>
                        {discountInfo.discountRate}% 할인
                        {discountInfo.type === 'special' && ' 특별할인'}
                      </span>
                    </>
                  ) : (
                    <span className="price-normal">{totalPrice.toLocaleString()}원</span>
                  )}
                </>
              ) : (
                <span className="price-empty">조명을 배치해주세요</span>
              )}
            </div>
          </div>
          {totalPrice > 0 && (
            <div className="price-details">
              <span>모듈 {lightCount}개</span>
              {discountInfo && (
                <span className="discount-amount">할인: {discountInfo.discountAmount.toLocaleString()}원</span>
              )}
              {remainingTime && (
                <span className="time-remaining">
                  ⏰ {remainingTime.minutes}분 {remainingTime.seconds}초 남음
                </span>
              )}
            </div>
          )}
        </div>
        <div className="price-actions">
          {totalPrice > 0 && (
            <>
              <button type="button" className="catalog-btn" onClick={handleCatalogRequest}>
                📋 사업자 특별 카탈로그 무료 받기
              </button>
              <button type="button" className="inquiry-btn" onClick={handleInquiry}>
                💬 문의하기
              </button>
              <button type="button" className="purchase-btn" onClick={handlePurchase}>
                🛒 바로 구매하기
              </button>
            </>
          )}
        </div>
      </div>

      {showPurchaseModal &&
        createPortal(
          <div className="purchase-modal-overlay" onClick={() => setShowPurchaseModal(false)}>
            <div className="purchase-modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="purchase-modal-close"
                onClick={() => setShowPurchaseModal(false)}
              >
                ×
              </button>
              <h3>구매 문의하기</h3>
              <p className="purchase-modal-description">
                원하시는 방법을 선택해주세요. 빠르게 연락드리겠습니다.
              </p>

              <div className="purchase-options">
                <div className="purchase-option-card">
                  <div className="option-header">
                    <span className="option-icon">📝</span>
                    <h4>연락처 남기기</h4>
                  </div>
                  <p className="option-description">전화번호를 남기시면 빠르게 연락드리겠습니다.</p>
                  <div className="phone-input-section">
                    <input
                      type="tel"
                      className="purchase-phone-input"
                      placeholder="010-1234-5678"
                      value={purchasePhoneNumber}
                      onChange={(e) => setPurchasePhoneNumber(e.target.value)}
                    />
                    <button
                      type="button"
                      className="contact-submit-btn"
                      onClick={handleContactSubmit}
                      disabled={!purchasePhoneNumber.trim()}
                    >
                      문의 접수
                    </button>
                  </div>
                </div>

                <div className="purchase-option-card">
                  <div className="option-header">
                    <span className="option-icon">💬</span>
                    <h4>카카오톡 문의</h4>
                  </div>
                  <p className="option-description">카카오톡으로 바로 문의하실 수 있습니다.</p>
                  <button
                    type="button"
                    className="kakao-inquiry-btn"
                    onClick={handleKakaoInquiry}
                  >
                    카카오톡으로 문의하기
                  </button>
                </div>

                <div className="purchase-option-card">
                  <div className="option-header">
                    <span className="option-icon">📞</span>
                    <h4>전화 문의</h4>
                  </div>
                  <p className="option-description">지금 바로 전화로 문의하실 수 있습니다.</p>
                  <button
                    type="button"
                    className="call-now-purchase-btn"
                    onClick={handleCallNow}
                  >
                    📞 010-7356-6036
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default PriceSummary

