import { useState } from 'react'
import { products } from '../data/products'
import { useSimulatorStore } from '../store/useSimulatorStore'
import './ProductGallery.css'

function ProductGallery() {
  const openModal = useSimulatorStore((state) => state.openProductModal)
  const [showInquiryModal, setShowInquiryModal] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedImages((prev) => [...prev, ...files])
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const sendGalleryInquiry = async () => {
    if (!phoneNumber.trim()) {
      alert('연락받을 전화번호를 입력해주세요.')
      return
    }

    const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN'
    const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID'

    if (TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN' || TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID') {
      alert('텔레그램 봇 설정이 필요합니다.')
      return
    }

    try {
      // 텍스트 메시지 전송
      const message = `🖼️ <b>VELZO 갤러리 문의</b>

${inquiryMessage || '사용자가 갤러리에서 문의를 요청했습니다.'}

📞 <b>연락처:</b> ${phoneNumber}
🖼️ 선택한 이미지: ${selectedImages.length}개
🕐 문의 시간: ${new Date().toLocaleString('ko-KR')}`

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
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

      // 이미지 전송 (각 이미지를 개별적으로 전송)
      for (const image of selectedImages) {
        const formData = new FormData()
        formData.append('photo', image)
        formData.append('chat_id', TELEGRAM_CHAT_ID)
        formData.append('caption', `갤러리 문의 이미지 - ${image.name}`)

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: formData,
        })
      }

      alert('문의가 접수되었습니다! 곧 연락드리겠습니다.')
      setShowInquiryModal(false)
      setSelectedImages([])
      setInquiryMessage('')
      setPhoneNumber('')
    } catch (error) {
      console.error('문의 전송 실패:', error)
      alert('문의 전송에 실패했습니다. 전화로 문의해주세요: 010-7356-6036')
    }
  }

  return (
    <>
      <section className="gallery-panel">
        <div className="panel-headline">
          <p className="panel-label">VELZO GALLERY</p>
          <h2>시그니처 모듈 프리뷰</h2>
          <p className="muted">원하는 이미지나 사진을 선택하여 문의하세요</p>
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
        <div className="gallery-actions">
          <button
            type="button"
            className="gallery-inquiry-btn"
            onClick={() => setShowInquiryModal(true)}
          >
            📷 사진과 함께 문의하기
          </button>
        </div>
      </section>

      {showInquiryModal && (
        <div className="gallery-inquiry-modal-overlay" onClick={() => setShowInquiryModal(false)}>
          <div className="gallery-inquiry-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowInquiryModal(false)}
            >
              ×
            </button>
            <h3>사진과 함께 문의하기</h3>
            <p className="modal-description">
              원하는 이미지나 사진을 선택하여 문의해주세요. 선택한 사진과 함께 문의가 전달됩니다.
            </p>

            <div className="image-upload-section">
              <label className="image-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="image-upload-input"
                />
                <span className="image-upload-button">📷 사진 선택하기</span>
              </label>

              {selectedImages.length > 0 && (
                <div className="selected-images">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="selected-image-item">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`선택한 이미지 ${index + 1}`}
                        className="preview-image"
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="phone-section">
              <label htmlFor="phone-number" className="required-label">
                연락받을 전화번호 <span className="required-mark">*</span>
              </label>
              <div className="phone-input-wrapper">
                <input
                  id="phone-number"
                  type="tel"
                  className="phone-input"
                  placeholder="010-1234-5678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="call-now-btn"
                  onClick={() => window.location.href = 'tel:010-7356-6036'}
                  title="바로 전화하기"
                >
                  📞 바로 전화하기
                </button>
              </div>
              <p className="phone-hint">전화번호를 남기시면 빠르게 연락드리겠습니다.</p>
            </div>

            <div className="inquiry-message-section">
              <label htmlFor="inquiry-message">문의 내용 (선택사항)</label>
              <textarea
                id="inquiry-message"
                className="inquiry-textarea"
                placeholder="문의하실 내용을 입력해주세요..."
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowInquiryModal(false)}>
                취소
              </button>
              <button
                type="button"
                className="submit-btn"
                onClick={sendGalleryInquiry}
                disabled={!phoneNumber.trim()}
              >
                문의 보내기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProductGallery

