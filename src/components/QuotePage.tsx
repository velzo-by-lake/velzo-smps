import { useMemo, useState } from 'react'
import { useSimulatorStore } from '../store/useSimulatorStore'
import { products } from '../data/products'
import { accessories } from '../data/accessories'
import { productSets, type ProductSet } from '../data/sets'
import { getBeltTotalWatt } from '../utils/watt'
import './QuotePage.css'

function QuotePage() {
  const belts = useSimulatorStore((state) => state.belts)
  const [selectedSet, setSelectedSet] = useState<string | null>(null)
  const [accessoryQuantities, setAccessoryQuantities] = useState<Record<string, number>>({})

  const productMap = useMemo(
    () => products.reduce<Record<string, typeof products[0]>>((acc, p) => ((acc[p.id] = p), acc), {}),
    [],
  )

  const accessoryMap = useMemo(
    () => accessories.reduce<Record<string, typeof accessories[0]>>((acc, a) => ((acc[a.id] = a), acc), {}),
    [],
  )

  const beltItems = useMemo(() => {
    return belts.flatMap((belt) =>
      belt.lights
        .map((light) => {
          const product = productMap[light.productId] || products.find((p) => p.id === light.productId)
          return product ? { product, quantity: 1 } : null
        })
        .filter(Boolean) as Array<{ product: typeof products[0]; quantity: number }>,
    )
  }, [belts, productMap])

  const aggregatedProducts = useMemo(() => {
    const map = new Map<string, { product: typeof products[0]; quantity: number }>()
    beltItems.forEach((item) => {
      const existing = map.get(item.product.id)
      if (existing) {
        existing.quantity += item.quantity
      } else {
        map.set(item.product.id, { product: item.product, quantity: item.quantity })
      }
    })
    return Array.from(map.values())
  }, [beltItems])

  const selectedSetData = useMemo(() => {
    if (!selectedSet) return null
    return productSets.find((s) => s.id === selectedSet) || null
  }, [selectedSet])

  const calculateTotal = useMemo(() => {
    let total = 0

    // 벨트에 배치된 제품
    aggregatedProducts.forEach((item) => {
      total += item.product.price * item.quantity
    })

    // 선택된 세트
    if (selectedSetData) {
      total += selectedSetData.discountPrice
    }

    // 부수기제
    Object.entries(accessoryQuantities).forEach(([id, qty]) => {
      const accessory = accessoryMap[id]
      if (accessory && qty > 0) {
        total += accessory.price * qty
      }
    })

    return total
  }, [aggregatedProducts, selectedSetData, accessoryQuantities, accessoryMap])

  const handleAccessoryChange = (id: string, delta: number) => {
    setAccessoryQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }))
  }

  const handleExportPDF = () => {
    window.print()
  }

  const handleExportJSON = () => {
    const quote = {
      date: new Date().toISOString(),
      products: aggregatedProducts.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        total: item.product.price * item.quantity,
      })),
      set: selectedSetData
        ? {
            id: selectedSetData.id,
            name: selectedSetData.name,
            originalPrice: selectedSetData.originalPrice,
            discountPrice: selectedSetData.discountPrice,
          }
        : null,
      accessories: Object.entries(accessoryQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const acc = accessoryMap[id]
          return acc ? { id, name: acc.name, quantity: qty, unitPrice: acc.price, total: acc.price * qty } : null
        })
        .filter(Boolean),
      total: calculateTotal,
    }

    const blob = new Blob([JSON.stringify(quote, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `velzo-quote-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
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
          <button type="button" className="ghost-btn" onClick={handleExportJSON}>
            JSON 내보내기
          </button>
          <button type="button" className="primary-btn" onClick={handleExportPDF}>
            PDF 인쇄
          </button>
        </div>
      </div>

      <div className="quote-content">
        <section className="quote-section">
          <h2>구성 제품</h2>
          {aggregatedProducts.length === 0 ? (
            <p className="empty-state">벨트에 배치된 제품이 없습니다.</p>
          ) : (
            <table className="quote-table">
              <thead>
                <tr>
                  <th>제품명</th>
                  <th>수량</th>
                  <th>단가</th>
                  <th>소계</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedProducts.map((item) => (
                  <tr key={item.product.id}>
                    <td>{item.product.name}</td>
                    <td>{item.quantity}개</td>
                    <td>{item.product.price.toLocaleString()}원</td>
                    <td>{(item.product.price * item.quantity).toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

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

        <section className="quote-section">
          <h2>부수기제</h2>
          <div className="accessory-grid">
            {accessories.map((accessory) => {
              const qty = accessoryQuantities[accessory.id] || 0
              return (
                <div key={accessory.id} className="accessory-card">
                  <div className="accessory-info">
                    <strong>{accessory.name}</strong>
                    <p>{accessory.size} · {accessory.color}</p>
                    <p className="accessory-price">{accessory.price.toLocaleString()}원</p>
                  </div>
                  <div className="accessory-controls">
                    <button type="button" onClick={() => handleAccessoryChange(accessory.id, -1)} disabled={qty === 0}>
                      –
                    </button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => handleAccessoryChange(accessory.id, 1)}>
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="quote-total">
          <div className="total-row">
            <span>총 견적 금액</span>
            <strong>{calculateTotal.toLocaleString()}원</strong>
          </div>
          {selectedSetData && (
            <div className="total-note">
              세트 할인가 적용: {selectedSetData.originalPrice.toLocaleString()}원 →{' '}
              {selectedSetData.discountPrice.toLocaleString()}원 (할인:{' '}
              {(selectedSetData.originalPrice - selectedSetData.discountPrice).toLocaleString()}원)
            </div>
          )}
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

