import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { products } from '../data/products'
import { useSimulatorStore } from '../store/useSimulatorStore'

const modalRoot = document.body

function ProductDetailModal() {
  const modalProductId = useSimulatorStore((state) => state.modalProductId)
  const closeModal = useSimulatorStore((state) => state.closeProductModal)
  const quickAdd = useSimulatorStore((state) => state.quickAddProduct)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const galleryRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  const product = products.find((item) => item.id === modalProductId)

  // 갤러리 이미지가 변경되면 첫 번째 이미지로 리셋
  useEffect(() => {
    if (product) {
      setCurrentImageIndex(0)
    }
  }, [product])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeModal])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!product || product.galleryImages.length === 0) return

    const swipeDistance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50

    if (swipeDistance > minSwipeDistance) {
      // 왼쪽으로 스와이프 (다음 이미지)
      setCurrentImageIndex((prev) => (prev + 1) % product.galleryImages.length)
    } else if (swipeDistance < -minSwipeDistance) {
      // 오른쪽으로 스와이프 (이전 이미지)
      setCurrentImageIndex((prev) => (prev - 1 + product.galleryImages.length) % product.galleryImages.length)
    }
  }

  const handleImageClick = (index: number) => {
    if (product) {
      setPreviewImage(product.galleryImages[index])
    }
  }

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
        {product.galleryImages.length > 0 && (
          <div className="modal-gallery-section">
            <div className="gallery-header">
              <h4>실제 설치 사진</h4>
              <span className="gallery-counter">
                {product.galleryImages.length}장
              </span>
            </div>
            {/* 모바일: 스와이프 갤러리 */}
            <div
              className="modal-gallery-swipe"
              ref={galleryRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="gallery-swipe-container"
                style={{
                  transform: `translateX(-${currentImageIndex * 100}%)`,
                }}
              >
                {product.galleryImages.map((src, index) => (
                  <div
                    key={src}
                    className="gallery-swipe-item"
                    onClick={() => handleImageClick(index)}
                  >
                    <img src={src} alt={`${product.name} 설치 ${index + 1}`} loading="lazy" />
                    <div className="gallery-swipe-overlay">
                      <span>탭하여 확대</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* PC: 그리드 갤러리 */}
            <div className="modal-gallery-grid">
              {product.galleryImages.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  className="gallery-grid-item"
                  onClick={() => handleImageClick(index)}
                >
                  <img src={src} alt={`${product.name} 설치 ${index + 1}`} loading="lazy" />
                  <div className="gallery-grid-overlay">
                    <span>클릭하여 확대</span>
                  </div>
                </button>
              ))}
            </div>
            {product.galleryImages.length > 1 && (
              <div className="gallery-dots">
                {product.galleryImages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`gallery-dot ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`이미지 ${index + 1}로 이동`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
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

