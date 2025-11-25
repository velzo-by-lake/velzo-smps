import { useMemo } from 'react'
import { useSimulatorStore } from '../store/useSimulatorStore'
import { products } from '../data/products'
import type { Belt } from '../types'
import './LightList.css'

type LightListProps = {
  belt: Belt
}

function LightList({ belt }: LightListProps) {
  const removeLight = useSimulatorStore((state) => state.removeLight)

  const lightItems = useMemo(() => {
    return belt.lights.map((light) => {
      const product = products.find((p) => p.id === light.productId)
      return {
        ...light,
        product,
      }
    })
  }, [belt.lights])

  if (lightItems.length === 0) {
    return (
      <div className="light-list">
        <h3>배치된 조명</h3>
        <p className="empty-message">조명을 배치해주세요</p>
      </div>
    )
  }

  return (
    <div className="light-list">
      <h3>배치된 조명 ({lightItems.length}개)</h3>
      <div className="light-items">
        {lightItems.map((item) => (
          <div key={item.id} className="light-item">
            <div className="light-item-info">
              <strong>{item.product?.name || item.type}</strong>
              <span>{item.product?.price.toLocaleString()}원</span>
            </div>
            <button
              type="button"
              className="light-remove-btn"
              onClick={() => {
                if (window.confirm('이 조명을 제거하시겠습니까?')) {
                  removeLight(belt.id, item.id)
                }
              }}
              title="조명 제거"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LightList

