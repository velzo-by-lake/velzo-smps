import { useMemo, useRef, useState } from 'react'
import type { Stage } from 'konva/lib/Stage'
import Header from './components/Header'
import LightCatalog from './components/LightCatalog'
import BeltCanvas from './components/BeltCanvas'
import PowerSummary from './components/PowerSummary'
import ProductGallery from './components/ProductGallery'
import ProductDetailModal from './components/ProductDetailModal'
import { useSimulatorStore } from './store/useSimulatorStore'
import { ABSOLUTE_LIMIT, getBeltTotalWatt, getStatus, getUsagePercent } from './utils/watt'
import './App.css'

function App() {
  const belts = useSimulatorStore((state) => state.belts)
  const addBelt = useSimulatorStore((state) => state.addBelt)
  const updateLength = useSimulatorStore((state) => state.updateBeltLength)

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
                      <label htmlFor={`length-${belt.id}`}>길이 (1m - 10m)</label>
                      <input
                        id={`length-${belt.id}`}
                        type="range"
                        min={1}
                        max={10}
                        step={0.1}
                        value={belt.length}
                        onChange={(event) => updateLength(belt.id, Number(event.target.value))}
                      />
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
    </div>
  )
}

export default App

