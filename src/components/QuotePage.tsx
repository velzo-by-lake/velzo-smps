import { useMemo, useState } from 'react'
import jsPDF from 'jspdf'
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

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPos = 20

    // 헤더
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('견적서', pageWidth / 2, yPos, { align: 'center' })
    yPos += 15

    // 회사 정보
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`상호: ${COMPANY_INFO.name}`, 20, yPos)
    doc.text(`대표자: ${COMPANY_INFO.ceo}`, 20, yPos + 5)
    doc.text(`사업자번호: ${COMPANY_INFO.businessNumber}`, 20, yPos + 10)
    doc.text(`사업장주소: ${COMPANY_INFO.address}`, 20, yPos + 15)
    doc.text(`연락처: ${COMPANY_INFO.phone} / ${COMPANY_INFO.email}`, 20, yPos + 20)
    doc.text(
      `입금계좌: ${COMPANY_INFO.bank} ${COMPANY_INFO.account} 예금주: ${COMPANY_INFO.accountHolder}`,
      20,
      yPos + 25,
    )
    yPos += 35

    // 견적일
    doc.text(`견적일: ${new Date().toLocaleDateString('ko-KR')}`, pageWidth - 20, yPos - 30, { align: 'right' })

    // 제품 목록 헤더
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('제품 목록', 20, yPos)
    yPos += 10

    // 테이블 헤더
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('제품명', 20, yPos)
    doc.text('수량', 100, yPos)
    doc.text('온라인가격', 120, yPos)
    doc.text('사업자가격', 150, yPos)
    doc.text('사이즈', 175, yPos)
    yPos += 8

    doc.setLineWidth(0.5)
    doc.line(20, yPos, pageWidth - 20, yPos)
    yPos += 5

    // 제품 목록 (수량이 있는 것만)
    doc.setFont('helvetica', 'normal')
    allProducts.forEach((item) => {
      if (item.quantity > 0) {
        if (yPos > pageHeight - 40) {
          doc.addPage()
          yPos = 20
        }
        const onlinePrice = item.product.price
        const businessPrice = Math.floor(onlinePrice * (1 - BUSINESS_DISCOUNT_RATE))
        doc.text(item.product.name, 20, yPos)
        doc.text(`${item.quantity}개`, 100, yPos)
        doc.text(`${onlinePrice.toLocaleString()}원`, 120, yPos)
        doc.text(`${businessPrice.toLocaleString()}원`, 150, yPos)
        doc.text(item.product.size, 175, yPos)
        yPos += 7
      }
    })

    // SMPS
    if (smpsCount > 0) {
      if (yPos > pageHeight - 40) {
        doc.addPage()
        yPos = 20
      }
      const onlinePrice = SMPS_PRICE
      const businessPrice = Math.floor(onlinePrice * (1 - BUSINESS_DISCOUNT_RATE))
      doc.text('Velzo SMPS', 20, yPos)
      doc.text(`${smpsCount}개`, 100, yPos)
      doc.text(`${onlinePrice.toLocaleString()}원`, 120, yPos)
      doc.text(`${businessPrice.toLocaleString()}원`, 150, yPos)
      doc.text('145×45×30mm', 175, yPos)
      yPos += 7
    }

    // 부수기제
    Object.entries(accessoryQuantities).forEach(([id, qty]) => {
      if (qty > 0) {
        const accessory = accessoryMap[id]
        if (accessory) {
          if (yPos > pageHeight - 40) {
            doc.addPage()
            yPos = 20
          }
          const onlinePrice = accessory.price
          const businessPrice = Math.floor(onlinePrice * (1 - BUSINESS_DISCOUNT_RATE))
          doc.text(accessory.name, 20, yPos)
          doc.text(`${qty}개`, 100, yPos)
          doc.text(`${onlinePrice.toLocaleString()}원`, 120, yPos)
          doc.text(`${businessPrice.toLocaleString()}원`, 150, yPos)
          doc.text(accessory.size, 175, yPos)
          yPos += 7
        }
      }
    })

    // 선택된 세트
    if (selectedSetData) {
      if (yPos > pageHeight - 40) {
        doc.addPage()
        yPos = 20
      }
      doc.setFont('helvetica', 'bold')
      doc.text(selectedSetData.name, 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text('1세트', 100, yPos)
      doc.text(`${selectedSetData.originalPrice.toLocaleString()}원`, 120, yPos)
      doc.text(`${selectedSetData.discountPrice.toLocaleString()}원`, 150, yPos)
      yPos += 7
    }

    // 합계
    if (yPos > pageHeight - 50) {
      doc.addPage()
      yPos = 20
    }
    yPos += 5
    doc.setLineWidth(0.5)
    doc.line(20, yPos, pageWidth - 20, yPos)
    yPos += 10

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('온라인 총액', 20, yPos)
    doc.text(`${priceCalculation.onlineTotal.toLocaleString()}원`, pageWidth - 20, yPos, { align: 'right' })
    yPos += 7

    doc.setFont('helvetica', 'normal')
    doc.text(`사업자 프로모션 ${BUSINESS_DISCOUNT_RATE * 100}% 할인`, 20, yPos)
    doc.text(`-${priceCalculation.businessDiscount.toLocaleString()}원`, pageWidth - 20, yPos, { align: 'right' })
    yPos += 7

    doc.setFont('helvetica', 'bold')
    doc.text('사업자 가격', 20, yPos)
    doc.text(`${priceCalculation.businessPrice.toLocaleString()}원`, pageWidth - 20, yPos, { align: 'right' })
    yPos += 7

    doc.setFont('helvetica', 'normal')
    doc.text(`부가세 (VAT ${VAT_RATE * 100}%)`, 20, yPos)
    doc.text(`+${priceCalculation.vat.toLocaleString()}원`, pageWidth - 20, yPos, { align: 'right' })
    yPos += 7

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('최종 견적 금액', 20, yPos)
    doc.text(`${priceCalculation.finalPrice.toLocaleString()}원`, pageWidth - 20, yPos, { align: 'right' })

    // 푸터
    yPos = pageHeight - 20
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('VELZO (벨조) · 벨트 색상: IronGray · LED 색온도: 아이보리빛 4000K', pageWidth / 2, yPos, { align: 'center' })

    // PDF 저장
    doc.save(`velzo-quote-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="quote-page">
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
        <section className="quote-section">
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
