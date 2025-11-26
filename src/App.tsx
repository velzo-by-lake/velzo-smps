import { useMemo, useRef, useState } from 'react'
import type { Stage } from 'konva/lib/Stage'
import Header from './components/Header'
import LightCatalog from './components/LightCatalog'
import BeltCanvas from './components/BeltCanvas'
import PowerSummary from './components/PowerSummary'
import ProductGallery from './components/ProductGallery'
import ProductDetailModal from './components/ProductDetailModal'
import QuotePage from './components/QuotePage'
import PriceSummary from './components/PriceSummary'
import LightList from './components/LightList'
import { useSimulatorStore } from './store/useSimulatorStore'
import { ABSOLUTE_LIMIT, getBeltTotalWatt, getStatus, getUsagePercent } from './utils/watt'
import './App.css'

type Page = 'designer' | 'quote'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('designer')
  const belts = useSimulatorStore((state) => state.belts)
  const addBelt = useSimulatorStore((state) => state.addBelt)
  const removeBelt = useSimulatorStore((state) => state.removeBelt)

  const stageRefs = useRef<Record<string, Stage | null>>({})
  const [expandedBelts, setExpandedBelts] = useState<Record<string, boolean>>({})

  const totalWatt = useMemo(
    () => belts.reduce((sum, belt) => sum + getBeltTotalWatt(belt), 0),
    [belts],
  )

  const toggleBelt = (beltId: string) => {
    setExpandedBelts((prev) => ({
      ...prev,
      [beltId]: !(prev[beltId] ?? true),
    }))
  }

  return (
    <div className="app">
      <Header totalWatt={totalWatt} belts={belts.length} />
      <div className="page-tabs">
        <button
          type="button"
          className={`tab-btn ${currentPage === 'designer' ? 'active' : ''}`}
          onClick={() => setCurrentPage('designer')}
        >
          디자이너
        </button>
        <button
          type="button"
          className={`tab-btn ${currentPage === 'quote' ? 'active' : ''}`}
          onClick={() => setCurrentPage('quote')}
        >
          견적서
        </button>
      </div>

      {currentPage === 'designer' ? (
        <>
          <ProductGallery />
          <div className="main-grid">
            <LightCatalog />
            <section className="canvas-zone">
              <div className="canvas-header-card">
                <div className="canvas-header-content">
                  <div className="canvas-title-section">
                    <div className="canvas-title-icon">⚡</div>
                    <div>
                      <h2 className="canvas-title">벨트 조명 디자이너</h2>
                      <p className="canvas-subtitle">조명을 배치하고 전력 사용량을 확인하세요</p>
                    </div>
                  </div>
                  <button type="button" className="add-smps-button" onClick={addBelt}>
                    <span className="btn-icon-large">⚡</span>
                    <div className="btn-content">
                      <span className="btn-text">SMPS 추가</span>
                      <span className="btn-price">40,000원</span>
                    </div>
                  </button>
                </div>
                <div className="capacity-guide">
                  <div className="guide-item">
                    <span className="guide-icon safe">✓</span>
                    <span className="guide-text">권장: <strong>70W</strong></span>
                  </div>
                  <div className="guide-item">
                    <span className="guide-icon warning">⚠</span>
                    <span className="guide-text">최대: <strong>100W</strong></span>
                  </div>
                </div>
              </div>
              {belts.map((belt, index) => {
                const status = getStatus(getBeltTotalWatt(belt))
                const lightCount = belt.lights.length
                const percent = getUsagePercent(getBeltTotalWatt(belt), ABSOLUTE_LIMIT)
                const expanded = expandedBelts[belt.id] ?? true
                return (
                  <div key={belt.id} className="smps-card">
                    <div className="smps-card-header" onClick={() => toggleBelt(belt.id)}>
                      <div className="smps-header-left">
                        <div className="smps-number">SMPS {index + 1}</div>
                        <div className="smps-status-group">
                          <div className={`smps-status-badge ${status.toLowerCase()}`}>
                            {status === 'OVERLOAD' ? '⚠️ 과부하' : status === 'CAUTION' ? '⚡ 주의' : '✓ 안전'}
                          </div>
                          <div className="smps-usage">
                            <span className="usage-value">{percent.toFixed(0)}%</span>
                            <span className="usage-label">사용중</span>
                          </div>
                        </div>
                      </div>
                      <div className="smps-header-right">
                        <div className="smps-info">
                          <span className="smps-modules">{lightCount}개 조명</span>
                          <span className="smps-price-tag">40,000원</span>
                        </div>
                        {belts.length > 1 && (
                          <button
                            type="button"
                            className="smps-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm('이 SMPS를 삭제하시겠습니까?')) {
                                removeBelt(belt.id)
                              }
                            }}
                            title="SMPS 삭제"
                          >
                            삭제
                          </button>
                        )}
                        <div className="smps-toggle">{expanded ? '▼' : '▶'}</div>
                      </div>
                    </div>
                    {expanded && (
                      <div className="smps-card-body">
                        <div className="belt-visual-section">
                          <BeltCanvas
                            belt={belt}
                            status={status}
                            onStageReady={(stage) => {
                              stageRefs.current[belt.id] = stage
                            }}
                          />
                        </div>
                        <div className="belt-info-section">
                          <LightList belt={belt} />
                          <PowerSummary belt={belt} stage={stageRefs.current[belt.id] ?? null} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </section>
          </div>
          <ProductDetailModal />
          {currentPage === 'designer' && <PriceSummary />}
        </>
      ) : (
        <QuotePage />
      )}
    </div>
  )
}

export default App


