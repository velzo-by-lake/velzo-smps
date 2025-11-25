import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { products } from '../data/products'
import { useSimulatorStore } from '../store/useSimulatorStore'

const modalRoot = document.body

function ProductDetailModal() {
  const modalProductId = useSimulatorStore((state) => state.modalProductId)
  const closeModal = useSimulatorStore((state) => state.closeProductModal)
  const quickAdd = useSimulatorStore((state) => state.quickAddProduct)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const product = products.find((item) => item.id === modalProductId)

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeModal])

  if (!product) return null

  return createPortal(
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className="modal-card"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <button type="button" className="modal-close" onClick={closeModal} aria-label="닫기">
          ×
        </button>
        <div className="modal-main">
          <img src={product.simImage} alt={product.name} className="modal-hero" />
          <div className="modal-info">
            <p className="modal-eyebrow">VELZO MODULE</p>
            <h3>{product.name}</h3>
            <p className="modal-spec">
              {product.watt}W · {product.size}
            </p>
            <p className="modal-description">{product.description}</p>
            <button type="button" className="primary-btn" onClick={() => quickAdd(product.id)}>
              벨트에 추가
            </button>
          </div>
        </div>
        <div className="modal-gallery">
          {product.galleryImages.map((src) => (
            <button
              type="button"
              key={src}
              className="gallery-item"
              onClick={() => setPreviewImage(src)}
            >
              <img src={src} alt={`${product.name} 설치`} loading="lazy" />
              <span>클릭하여 확대</span>
            </button>
          ))}
        </div>
        {previewImage ? (
          <div className="modal-lightbox" onClick={() => setPreviewImage(null)}>
            <button
              type="button"
              className="lightbox-close"
              onClick={(event) => {
                event.stopPropagation()
                setPreviewImage(null)
              }}
              aria-label="확대 닫기"
            >
              ×
            </button>
            <img src={previewImage} alt={`${product?.name} 설치 확대`} loading="lazy" />
          </div>
        ) : null}
      </div>
    </div>,
    modalRoot,
  )
}

export default ProductDetailModal

