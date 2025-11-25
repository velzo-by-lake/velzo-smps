import { create } from 'zustand'
import type { Belt, LightItem, Product } from '../types'
import { products } from '../data/products'

const gap = 16

const settleLights = (lights: LightItem[]): LightItem[] => {
  if (lights.length <= 1) return lights
  const arranged = [...lights].sort((a, b) => a.positionX - b.positionX)
  for (let i = 1; i < arranged.length; i += 1) {
    const prev = arranged[i - 1]
    const current = arranged[i]
    const minX = prev.positionX + (prev.width + current.width) / 2 + gap
    if (current.positionX < minX) {
      current.positionX = minX
    }
  }

  for (let i = arranged.length - 2; i >= 0; i -= 1) {
    const next = arranged[i + 1]
    const current = arranged[i]
    const maxX = next.positionX - (next.width + current.width) / 2 - gap
    if (current.positionX > maxX) {
      current.positionX = maxX
    }
  }

  return arranged
}

const createBelt = (): Belt => ({
  id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 9),
  length: 5,
  lights: [],
})

type SimulatorState = {
  belts: Belt[]
  activeProduct: Product | null
  modalProductId: string | null
  setActiveProduct: (product: Product | null) => void
  addBelt: () => void
  updateBeltLength: (beltId: string, length: number) => void
  addLightToBelt: (beltId: string, product: Product, positionX: number) => void
  moveLight: (beltId: string, lightId: string, positionX: number) => void
  removeLight: (beltId: string, lightId: string) => void
  openProductModal: (productId: string) => void
  closeProductModal: () => void
  quickAddProduct: (productId: string) => void
}

export const useSimulatorStore = create<SimulatorState>((set) => ({
  belts: [createBelt()],
  activeProduct: null,
  modalProductId: null,
  setActiveProduct: (product) => set({ activeProduct: product }),
  addBelt: () =>
    set((state) => ({
      belts: [...state.belts, createBelt()],
    })),
  updateBeltLength: (beltId, length) =>
    set((state) => ({
      belts: state.belts.map((belt) =>
        belt.id === beltId ? { ...belt, length: Math.min(Math.max(length, 1), 10) } : belt,
      ),
    })),
  addLightToBelt: (beltId, product, positionX) =>
    set((state) => ({
      belts: state.belts.map((belt) => {
        if (belt.id !== beltId) return belt
        const newLight: LightItem = {
          id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10),
          type: product.name,
          watt: product.watt,
          width: product.width,
          image: product.image,
          simImage: product.simImage,
          positionX,
        }
        return { ...belt, lights: settleLights([...belt.lights, newLight]) }
      }),
      activeProduct: null,
    })),
  moveLight: (beltId, lightId, positionX) =>
    set((state) => ({
      belts: state.belts.map((belt) => {
        if (belt.id !== beltId) return belt
        const updated = belt.lights
          .map((light) => (light.id === lightId ? { ...light, positionX } : light))
          .map((light) => ({ ...light }))
        return { ...belt, lights: settleLights(updated) }
      }),
    })),
  removeLight: (beltId, lightId) =>
    set((state) => ({
      belts: state.belts.map((belt) =>
        belt.id === beltId
          ? { ...belt, lights: belt.lights.filter((light) => light.id !== lightId) }
          : belt,
      ),
    })),
  openProductModal: (productId) => set({ modalProductId: productId }),
  closeProductModal: () => set({ modalProductId: null }),
  quickAddProduct: (productId) =>
    set((state) => {
      const product = products.find((item) => item.id === productId)
      if (!product) return state
      const belts = state.belts.length ? state.belts : [createBelt()]
      const positionX = 380
      const updatedBelts = belts.map((belt, index) => {
        if (index !== 0) return belt
        const newLight: LightItem = {
          id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10),
          type: product.name,
          watt: product.watt,
          width: product.width,
          image: product.image,
          simImage: product.simImage,
          positionX,
        }
        return { ...belt, lights: settleLights([...belt.lights, newLight]) }
      })
      return {
        belts: updatedBelts,
        modalProductId: null,
      }
    }),
}))

