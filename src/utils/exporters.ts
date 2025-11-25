import type { Stage } from 'konva/lib/Stage'
import type { Belt, ExportPayload } from '../types'
import { ABSOLUTE_LIMIT, RECOMMENDED_LIMIT, getBeltTotalWatt, getUsagePercent } from './watt'

export const exportStageAsPNG = (stage: Stage | null, filename: string) => {
  if (!stage) return
  const dataURL = stage.toDataURL({ pixelRatio: 2 })
  const link = document.createElement('a')
  link.href = dataURL
  link.download = filename
  link.click()
}

export const exportBeltSummaryJSON = (belt: Belt) => {
  const total = getBeltTotalWatt(belt)
  const payload: ExportPayload = {
    beltId: belt.id,
    totalWatt: total,
    recommendedPercent: Number(getUsagePercent(total, RECOMMENDED_LIMIT).toFixed(2)),
    absolutePercent: Number(getUsagePercent(total, ABSOLUTE_LIMIT).toFixed(2)),
    lights: belt.lights.map((light) => ({
      id: light.id,
      type: light.type,
      watt: light.watt,
      positionX: light.positionX,
    })),
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `velzo-belt-${belt.id}.json`
  link.click()
  URL.revokeObjectURL(url)
}

