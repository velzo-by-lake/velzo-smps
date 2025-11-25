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
              <div className="canvas-head">
                <div>
                  <p className="panel-label">BELT CANVAS</p>
                  <h2>벨트를 추가하고 모듈을 배치하세요.</h2>
                </div>
                <button type="button" className="primary-btn" onClick={addBelt}>
                  + SMPS 추가
                </button>
              </div>
              {belts.map((belt, index) => {
                const status = getStatus(getBeltTotalWatt(belt))
                const lightCount = belt.lights.length
                const percent = getUsagePercent(getBeltTotalWatt(belt), ABSOLUTE_LIMIT)
                const expanded = expandedBelts[belt.id] ?? true
                return (
                  <div key={belt.id} className="belt-accordion-block">
                    <div className="belt-accordion-header">
                      <button
                        type="button"
                        className="belt-accordion"
                        onClick={() => toggleBelt(belt.id)}
                      >
                        <div>
                          <span className="muted">SMPS {index + 1}</span>
                          <strong>{percent.toFixed(0)}%</strong>
                        </div>
                        <div className={`badge ${status.toLowerCase()}`}>{status}</div>
                        <div className="muted">모듈 {lightCount}개</div>
                        <span className="chevron">{expanded ? '−' : '+'}</span>
                      </button>
                      {belts.length > 1 && (
                        <button
                          type="button"
                          className="belt-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm('이 SMPS를 삭제하시겠습니까?')) {
                              removeBelt(belt.id)
                            }
                          }}
                          title="SMPS 삭제"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {expanded && (
                      <div className="belt-row">
                        <BeltCanvas
                          belt={belt}
                          status={status}
                          onStageReady={(stage) => {
                            stageRefs.current[belt.id] = stage
                          }}
                        />
                        <div className="belt-controls">
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

