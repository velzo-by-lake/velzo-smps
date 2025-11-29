import { useMemo, useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useSimulatorStore } from '../store/useSimulatorStore'
import { products } from '../data/products'
import { accessories } from '../data/accessories'
import { productSets } from '../data/sets'
import './QuotePage.css'

// 회사 정보
const COMPANY_INFO = {
  name: '단봉실업',
  ceo: '최진호',
  businessNumber: '688-20-01961',
  address: '인천광역시 서구 완정로 179,601-411호',
  phone: '010-5318-2596',
  email: 'velzo@naver.com',
  bank: '기업은행',
  account: '223-122856-01-021',
  accountHolder: '최진호',
}

const BUSINESS_DISCOUNT_RATE = 0.3 // 사업자 프로모션 30%
const VAT_RATE = 0.1 // VAT 10%

function QuotePage() {
  const belts = useSimulatorStore((state) => state.belts)
  const [selectedSet, setSelectedSet] = useState<string | null>(null)
  const [accessoryQuantities, setAccessoryQuantities] = useState<Record<string, number>>({})
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({})
  const [smpsCount, setSmpsCount] = useState(belts.length)
  const quotePageRef = useRef<HTMLDivElement>(null)

  const SMPS_PRICE = 40000

  const accessoryMap = useMemo(
    () => accessories.reduce<Record<string, typeof accessories[0]>>((acc, a) => ((acc[a.id] = a), acc), {}),
    [],
  )

  // 벨트에 배치된 제품으로 초기 수량 설정
  useMemo(() => {
    const initialQuantities: Record<string, number> = {}
    belts.forEach((belt) => {
      belt.lights.forEach((light) => {
        const productId = light.productId
        if (productId) {
          initialQuantities[productId] = (initialQuantities[productId] || 0) + 1
        }
      })
    })
    setProductQuantities((prev) => {
      // 기존 값과 병합 (사용자가 수동으로 변경한 값 유지)
      const merged = { ...initialQuantities }
      Object.keys(prev).forEach((id) => {
        if (prev[id] > 0) {
          merged[id] = prev[id]
        }
      })
      return merged
    })
    setSmpsCount(belts.length)
  }, [belts])

  // 모든 제품 목록 (수량이 0이어도 표시)
  const allProducts = useMemo(() => {
    return products.map((product) => ({
      product,
      quantity: productQuantities[product.id] || 0,
    }))
  }, [productQuantities])

  const selectedSetData = useMemo(() => {
    if (!selectedSet) return null
    return productSets.find((s) => s.id === selectedSet) || null
  }, [selectedSet])

  // 가격 계산
  const priceCalculation = useMemo(() => {
    let onlineTotal = 0

    // 모든 제품 (수량이 있는 것만)
    allProducts.forEach((item) => {
      if (item.quantity > 0) {
        onlineTotal += item.product.price * item.quantity
      }
    })

    // SMPS
    onlineTotal += smpsCount * SMPS_PRICE

    // 선택된 세트
    if (selectedSetData) {
      onlineTotal += selectedSetData.originalPrice
    }

    // 부수기제
    Object.entries(accessoryQuantities).forEach(([id, qty]) => {
      const accessory = accessoryMap[id]
      if (accessory && qty > 0) {
        onlineTotal += accessory.price * qty
      }
    })

    // 사업자 프로모션 30% 할인
    const businessDiscount = Math.floor(onlineTotal * BUSINESS_DISCOUNT_RATE)
    const businessPrice = onlineTotal - businessDiscount

    // VAT 10% 추가
    const vat = Math.floor(businessPrice * VAT_RATE)
    const finalPrice = businessPrice + vat

    return {
      onlineTotal,
      businessDiscount,
      businessPrice,
      vat,
      finalPrice,
    }
  }, [allProducts, smpsCount, selectedSetData, accessoryQuantities, accessoryMap])

  const handleAccessoryChange = (id: string, delta: number) => {
    setAccessoryQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }))
  }

  const handleProductChange = (id: string, delta: number) => {
    setProductQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }))
  }

  const handleSmpsChange = (delta: number) => {
    setSmpsCount((prev) => Math.max(0, prev + delta))
  }

  const handleExportPDF = async () => {
    if (!quotePageRef.current) return

    try {
      // PDF 생성 전: 수량이 0인 행과 세트 구성 섹션 숨기기, PDF 모드 클래스 추가
      const allRows = quotePageRef.current.querySelectorAll('tr')
      const setSection = quotePageRef.current.querySelector('.set-section')
      
      // PDF 모드 클래스 추가 (흰 배경 적용)
      quotePageRef.current.classList.add('pdf-mode')
      
      // 수량이 0인 행 숨기기
      allRows.forEach((row) => {
        const qtyValue = row.querySelector('.qty-value')
        if (qtyValue && parseInt(qtyValue.textContent || '0') === 0) {
          ;(row as HTMLElement).style.display = 'none'
        }
      })

      // 세트 구성 섹션 숨기기
      if (setSection) {
        ;(setSection as HTMLElement).style.display = 'none'
      }

      // 잠시 대기하여 스타일 적용 완료
      await new Promise((resolve) => setTimeout(resolve, 100))

      // HTML을 캔버스로 변환
      const canvas = await html2canvas(quotePageRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: quotePageRef.current.scrollWidth,
        height: quotePageRef.current.scrollHeight,
      })

      // 원래대로 복원
      quotePageRef.current.classList.remove('pdf-mode')
      allRows.forEach((row) => {
        ;(row as HTMLElement).style.display = ''
      })
      if (setSection) {
        ;(setSection as HTMLElement).style.display = ''
      }

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      const doc = new jsPDF('p', 'mm', 'a4')
      let position = 0

      // 첫 페이지 추가
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // 여러 페이지가 필요한 경우
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        doc.addPage()
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // PDF 저장
      doc.save(`velzo-quote-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('PDF 생성 중 오류 발생:', error)
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="quote-page" ref={quotePageRef}>
      <div className="quote-header">
        <div>
          <p className="eyebrow">VELZO</p>
          <h1>견적서</h1>
          <p className="subtitle">벨트 위에 빛을 디자인하다. VELZO.</p>
        </div>
        <div className="quote-actions">
          <button type="button" className="primary-btn" onClick={handleExportPDF}>
            📄 PDF 다운로드
          </button>
        </div>
      </div>

      {/* 회사 정보 */}
      <div className="company-info-section">
        <div className="company-info">
          <div className="info-row">
            <span className="info-label">상호</span>
            <span className="info-value">{COMPANY_INFO.name}</span>
            <span className="info-label">대표자</span>
            <span className="info-value">{COMPANY_INFO.ceo}</span>
          </div>
          <div className="info-row">
            <span className="info-label">사업자번호</span>
            <span className="info-value">{COMPANY_INFO.businessNumber}</span>
          </div>
          <div className="info-row">
            <span className="info-label">사업장주소</span>
            <span className="info-value">{COMPANY_INFO.address}</span>
          </div>
          <div className="info-row">
            <span className="info-label">연락처</span>
            <span className="info-value">
              {COMPANY_INFO.phone} / {COMPANY_INFO.email}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">입금계좌</span>
            <span className="info-value">
              {COMPANY_INFO.bank} {COMPANY_INFO.account} 예금주: {COMPANY_INFO.accountHolder}
            </span>
          </div>
        </div>
        <div className="quote-date">
          <span className="info-label">견적일</span>
          <span className="info-value">{new Date().toLocaleDateString('ko-KR')}</span>
        </div>
      </div>

      <div className="quote-content">
        {/* 제품 목록 */}
        <section className="quote-section">
          <h2>제품 목록</h2>
          <div className="quote-table-wrapper">
            <table className="quote-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>이미지</th>
                  <th>제품명</th>
                  <th>수량</th>
                  <th>온라인 가격</th>
                  <th>사업자 프로모션 30%</th>
                  <th>제품 사이즈</th>
                  <th>와트</th>
                  <th>제품 재질</th>
                </tr>
              </thead>
              <tbody>
                {allProducts.map((item) => {
                  const onlinePrice = item.product.price
                  const businessPrice = Math.floor(onlinePrice * (1 - BUSINESS_DISCOUNT_RATE))
                  const material =
                    item.product.id.includes('stick') ||
                    item.product.id.includes('shade') ||
                    item.product.id.includes('ball') ||
                    item.product.id.includes('half') ||
                    item.product.id.includes('ufo') ||
                    item.product.id.includes('spot')
                      ? '알루미늄/플라스틱'
                      : '플라스틱'
                  return (
                    <tr key={item.product.id} className={item.quantity > 0 ? 'has-quantity' : ''}>
                      <td>
                        <div className="product-image-cell">
                          <img src={item.product.simImage} alt={item.product.name} className="product-thumbnail" />
                        </div>
                      </td>
                      <td>{item.product.name}</td>
                      <td>
                        <div className="quantity-controls">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleProductChange(item.product.id, -1)}
                            disabled={item.quantity === 0}
                          >
                            –
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button type="button" className="qty-btn" onClick={() => handleProductChange(item.product.id, 1)}>
                            +
                          </button>
                        </div>
                      </td>
                      <td className="price-cell">₩{onlinePrice.toLocaleString()}</td>
                      <td className="price-cell business">₩{businessPrice.toLocaleString()}</td>
                      <td>{item.product.size}</td>
                      <td>{item.product.watt}W</td>
                      <td>{material}</td>
                    </tr>
                  )
                })}
                <tr className={smpsCount > 0 ? 'has-quantity' : ''}>
                  <td>
                    <div className="product-image-cell">
                      <img src="/images/smps.png" alt="Velzo SMPS" className="product-thumbnail" />
                    </div>
                  </td>
                  <td>Velzo SMPS</td>
                  <td>
                    <div className="quantity-controls">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleSmpsChange(-1)}
                        disabled={smpsCount === 0}
                      >
                        –
                      </button>
                      <span className="qty-value">{smpsCount}</span>
                      <button type="button" className="qty-btn" onClick={() => handleSmpsChange(1)}>
                        +
                      </button>
                    </div>
                  </td>
                  <td className="price-cell">₩{SMPS_PRICE.toLocaleString()}</td>
                  <td className="price-cell business">₩{Math.floor(SMPS_PRICE * (1 - BUSINESS_DISCOUNT_RATE)).toLocaleString()}</td>
                  <td>145×45×30mm</td>
                  <td>48V 100W</td>
                  <td>-</td>
                </tr>
                {accessories.map((accessory) => {
                  const qty = accessoryQuantities[accessory.id] || 0
                  const onlinePrice = accessory.price
                  const businessPrice = Math.floor(onlinePrice * (1 - BUSINESS_DISCOUNT_RATE))
                  return (
                    <tr key={accessory.id} className={qty > 0 ? 'has-quantity' : ''}>
                      <td>
                        <div className="product-image-cell">
                          <div className="product-placeholder">부품</div>
                        </div>
                      </td>
                      <td>{accessory.name}</td>
                      <td>
                        <div className="quantity-controls">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleAccessoryChange(accessory.id, -1)}
                            disabled={qty === 0}
                          >
                            –
                          </button>
                          <span className="qty-value">{qty}</span>
                          <button type="button" className="qty-btn" onClick={() => handleAccessoryChange(accessory.id, 1)}>
                            +
                          </button>
                        </div>
                      </td>
                      <td className="price-cell">₩{onlinePrice.toLocaleString()}</td>
                      <td className="price-cell business">₩{businessPrice.toLocaleString()}</td>
                      <td>{accessory.size}</td>
                      <td>-</td>
                      <td>플라스틱</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 세트 구성 */}
        <section className="quote-section set-section">
          <h2>세트 구성 (선택사항)</h2>
          <div className="set-grid">
            {productSets.map((set) => (
              <div
                key={set.id}
                className={`set-card ${selectedSet === set.id ? 'selected' : ''}`}
                onClick={() => setSelectedSet(selectedSet === set.id ? null : set.id)}
              >
                <div className="set-header">
                  <h3>{set.name}</h3>
                  <div className="set-price">
                    <span className="original-price">{set.originalPrice.toLocaleString()}원</span>
                    <span className="discount-price">{set.discountPrice.toLocaleString()}원</span>
                  </div>
                </div>
                <div className="set-items">
                  <p>벨트 {set.beltLength}m 포함</p>
                  <ul>
                    {set.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* 최종 견적 */}
        <section className="quote-total">
          <div className="total-section">
            <div className="total-row">
              <span>온라인 총액</span>
              <strong>₩{priceCalculation.onlineTotal.toLocaleString()}</strong>
            </div>
            <div className="total-row discount">
              <span>사업자 프로모션 {BUSINESS_DISCOUNT_RATE * 100}% 할인</span>
              <strong>-₩{priceCalculation.businessDiscount.toLocaleString()}</strong>
            </div>
            <div className="total-row business">
              <span>사업자 가격</span>
              <strong>₩{priceCalculation.businessPrice.toLocaleString()}</strong>
            </div>
            <div className="total-row vat">
              <span>부가세 (VAT {VAT_RATE * 100}%)</span>
              <strong>+₩{priceCalculation.vat.toLocaleString()}</strong>
            </div>
            <div className="total-row final">
              <span>최종 견적 금액</span>
              <strong>₩{priceCalculation.finalPrice.toLocaleString()}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="quote-footer">
        <p>
          <strong>VELZO (벨조)</strong> · 벨트 색상: IronGray · LED 색온도: 아이보리빛 4000K
        </p>
        <p>견적서 생성일: {new Date().toLocaleDateString('ko-KR')}</p>
      </div>
    </div>
  )
}

export default QuotePage
