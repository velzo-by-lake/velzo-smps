import { useRef, type DragEvent, type MouseEvent } from 'react'
import { products } from '../data/products'
import { useSimulatorStore } from '../store/useSimulatorStore'

function LightCatalog() {
  const setActiveProduct = useSimulatorStore((state) => state.setActiveProduct)
  const quickAdd = useSimulatorStore((state) => state.quickAddProduct)
  const isDraggingRef = useRef(false)

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, productId: string) => {
    isDraggingRef.current = true
    const product = products.find((item) => item.id === productId)
    if (!product) return
    setActiveProduct(product)
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', productId)
      event.dataTransfer.effectAllowed = 'copy'
    }
  }

  const handleDragEnd = () => {
    isDraggingRef.current = false
    setActiveProduct(null)
  }

  const handleQuickInsert = (event: MouseEvent<HTMLButtonElement>, productId: string) => {
    if (isDraggingRef.current) return
    event.preventDefault()
    // 카탈로그 카드 클릭 시 바로 벨트에 추가
    quickAdd(productId)
  }

  return (
    <aside className="catalog">
      <div className="panel-headline">
        <p className="panel-label">VELZO MODULES</p>
        <h2>조명 카탈로그</h2>
        <p className="muted">탭하여 벨트에 추가하세요</p>
      </div>
      <div className="catalog-grid">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            draggable
            onDragStart={(event) => handleDragStart(event, product.id)}
            onDragEnd={handleDragEnd}
            className="catalog-card"
            onClick={(event) => handleQuickInsert(event, product.id)}
          >
            <img src={product.image} alt={product.name} />
            <div className="catalog-info">
              <strong>{product.name}</strong>
              <span className="catalog-spec">
                {product.watt}W · {product.size}
              </span>
              <span className="price">{product.price.toLocaleString()}원</span>
              {product.description && (
                <span className="catalog-desc">{product.description}</span>
              )}
            </div>
          </button>
        ))}
      </div>
      <div className="catalog-tip">
        <p className="tip-icon">💡</p>
        <p className="tip-text">
          <strong>팁:</strong> 여러 조명을 추가하여 공간을 더 밝고 아름답게 만들어보세요!
        </p>
      </div>
    </aside>
  )
}

export default LightCatalog

