import type { Belt, Status } from '../types'

export const RECOMMENDED_LIMIT = 70
export const ABSOLUTE_LIMIT = 100

export const getBeltTotalWatt = (belt: Belt) =>
  belt.lights.reduce((sum, light) => sum + light.watt, 0)

export const getStatus = (value: number): Status => {
  if (value > ABSOLUTE_LIMIT) return 'OVERLOAD'
  if (value > RECOMMENDED_LIMIT) return 'CAUTION'
  return 'SAFE'
}

export const getUsagePercent = (value: number, limit: number) =>
  limit === 0 ? 0 : (value / limit) * 100

