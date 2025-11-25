export type Product = {
  id: string
  name: string
  watt: number
  price: number
  size: string
  width: number // mm or relative width for canvas
  image: string
  simImage: string
  description: string
  galleryImages: string[]
}

export type LightItem = {
  id: string
  type: string
  watt: number
  width: number
  image: string
  simImage: string
  positionX: number
}

export type Belt = {
  id: string
  length: number // meters
  lights: LightItem[]
}

export type Status = 'SAFE' | 'CAUTION' | 'OVERLOAD'

export type ExportPayload = {
  beltId: string
  totalWatt: number
  recommendedPercent: number
  absolutePercent: number
  lights: Array<{
    id: string
    type: string
    watt: number
    positionX: number
  }>
}

