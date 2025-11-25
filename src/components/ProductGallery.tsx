import { products } from '../data/products'
import { useSimulatorStore } from '../store/useSimulatorStore'

function ProductGallery() {
  const openModal = useSimulatorStore((state) => state.openProductModal)

  return (
    <section className="gallery-panel">
      <div className="panel-headline">
        <p className="panel-label">VELZO GALLERY</p>
        <h2>시그니처 모듈 프리뷰</h2>
      </div>
      <div className="gallery-grid">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            className="gallery-card"
            onClick={() => openModal(product.id)}
          >
            <img src={product.simImage} alt={product.name} />
            <div>
              <strong>{product.name}</strong>
              <p>
                {product.watt}W · {product.size}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

export default ProductGallery

