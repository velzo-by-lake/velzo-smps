import { useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva'
import type { Stage as KonvaStage } from 'konva/lib/Stage'
import Konva from 'konva'
import gsap from 'gsap'
import lottie from 'lottie-web'
import type { AnimationItem } from 'lottie-web'
import explosionAnimation from '../assets/explosion.json'
import type { Belt, Status } from '../types'
import useImageLoader from '../hooks/useImageLoader'
import { useSimulatorStore } from '../store/useSimulatorStore'

type BeltCanvasProps = {
  belt: Belt
  status: Status
  onStageReady: (stage: KonvaStage | null) => void
}

const DEFAULT_WIDTH = 600
const DEFAULT_HEIGHT = 150
const MAX_WIDTH = 800 // 최대 너비 제한
const padding = 24

const clampX = (value: number, width: number, trackWidth: number) => {
  const min = padding + width / 2
  const max = trackWidth - padding - width / 2
  return Math.min(Math.max(value, min), max)
}

type LightSpriteProps = {
  beltId: string
  light: { id: string; simImage: string; width: number; positionX: number }
  status: Status
  trackHeight: number
  trackWidth: number
  beltCentimeter: number
  usableWidth: number
}

function LightSprite({
  beltId,
  light,
  status,
  trackHeight,
  trackWidth,
  beltCentimeter,
  usableWidth,
}: LightSpriteProps) {
  const { element, width: naturalWidth, height: naturalHeight } = useImageLoader(light.simImage)
  const moveLight = useSimulatorStore((state) => state.moveLight)
  const removeLight = useSimulatorStore((state) => state.removeLight)
  const imageRef = useRef<Konva.Image>(null)
  const blurTween = useRef<gsap.core.Tween>()

  const ratio = naturalWidth > 0 ? naturalHeight / naturalWidth : 1
  const widthPx = Math.max((light.width / beltCentimeter) * usableWidth, 36)
  const height = widthPx * ratio
  const baseY = trackHeight / 2 - height - 8

  useEffect(() => {
    if (element && imageRef.current) {
      imageRef.current.cache()
      imageRef.current.filters([Konva.Filters.Blur])
      imageRef.current.blurRadius(6)
      imageRef.current.getLayer()?.batchDraw()
    }
  }, [element])

  useEffect(() => {
    if (status !== 'OVERLOAD' || !imageRef.current) return undefined
    const tween = gsap.fromTo(
      imageRef.current,
      { opacity: 0.2 },
      { opacity: 1, repeat: 2, yoyo: true, duration: 0.12 },
    )
    return () => {
      tween.kill()
    }
  }, [status])

  const animateBlur = (target: number) => {
    blurTween.current?.kill()
    const current = imageRef.current?.blurRadius?.() ?? 6
    const helper = { radius: current }
    blurTween.current = gsap.to(helper, {
      radius: target,
      duration: 0.25,
      onUpdate: () => {
        if (!imageRef.current) return
        imageRef.current.blurRadius(helper.radius)
        imageRef.current.getLayer()?.batchDraw()
      },
    })
  }

  const handleHover = () => {
    if (!imageRef.current) return
    imageRef.current.getStage()?.container().style.setProperty('cursor', 'pointer')
    gsap.to(imageRef.current, {
      duration: 0.25,
      scaleX: 1.08,
      scaleY: 1.08,
      y: baseY - 8,
    })
    animateBlur(12)
  }

  const handleOut = () => {
    if (!imageRef.current) return
    imageRef.current.getStage()?.container().style.setProperty('cursor', 'default')
    gsap.to(imageRef.current, {
      duration: 0.25,
      scaleX: 1,
      scaleY: 1,
      y: baseY,
    })
    animateBlur(6)
  }

  return (
    <KonvaImage
      ref={imageRef}
      image={element ?? undefined}
      x={light.positionX - widthPx / 2}
      y={baseY}
      width={widthPx}
      height={height}
      draggable
      listening
      onMouseEnter={handleHover}
      onTouchStart={handleHover}
      onMouseLeave={handleOut}
      onTouchEnd={handleOut}
      onDragEnd={(event) => {
        const x = clampX(event.target.x() + widthPx / 2, widthPx, trackWidth)
        moveLight(beltId, light.id, x)
        event.target.position({
          x: x - widthPx / 2,
          y: baseY,
        })
      }}
      onDblClick={() => removeLight(beltId, light.id)}
      opacity={element ? 1 : 0}
      shadowBlur={25}
      shadowColor="rgba(243,217,164,0.35)"
      perfectDrawEnabled={false}
    />
  )
}

function BeltCanvas({ belt, status, onStageReady }: BeltCanvasProps) {
  const stageRef = useRef<KonvaStage>(null)
  const beltRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const explosionRef = useRef<HTMLDivElement>(null)
  const lottieInstance = useRef<AnimationItem>()
  const activeProduct = useSimulatorStore((state) => state.activeProduct)
  const addLight = useSimulatorStore((state) => state.addLightToBelt)
  const [canvasSize, setCanvasSize] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  })

  useEffect(() => {
    onStageReady(stageRef.current)
  }, [onStageReady])

  useEffect(() => {
    if (!containerRef.current) return undefined
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      const containerWidth = entry.contentRect.width
      // 최대 너비 제한 및 높이 최소화
      const width = Math.min(containerWidth, MAX_WIDTH)
      const height = Math.max(120, Math.min(150, width * 0.15))
      setCanvasSize({ width, height })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])
  const trackWidth = canvasSize.width
  const trackHeight = canvasSize.height
  const usableWidth = Math.max(80, trackWidth - padding * 2)
  const beltCentimeter = Math.max(100, belt.length * 100)
  const projectWidth = (physicalWidth: number) =>
    Math.max((physicalWidth / beltCentimeter) * usableWidth, 36)

  useEffect(() => {
    if (!explosionRef.current) return undefined
    lottieInstance.current = lottie.loadAnimation({
      container: explosionRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: explosionAnimation,
    })
    return () => {
      lottieInstance.current?.destroy()
    }
  }, [])

  useEffect(() => {
    if (status === 'OVERLOAD') {
      beltRef.current &&
        gsap.fromTo(
          beltRef.current,
          { x: -2 },
          { x: 2, repeat: 4, yoyo: true, duration: 0.06, clearProps: 'x' },
        )
      lottieInstance.current?.goToAndPlay(0, true)
    } else {
      lottieInstance.current?.stop()
    }
  }, [status])

  const handlePointerUp = () => {
    if (!activeProduct) return
    const stage = stageRef.current
    if (!stage) return
    
    // 벨트가 비어있으면 왼쪽 끝부터 배치
    if (belt.lights.length === 0) {
      const productWidthPx = projectWidth(activeProduct.width)
      const positionX = padding + productWidthPx / 2
      addLight(belt.id, activeProduct, positionX)
      return
    }
    
    const pointerPosition = stage.getPointerPosition()
    if (!pointerPosition) return
    const clamped = clampX(pointerPosition.x, projectWidth(activeProduct.width), trackWidth)
    addLight(belt.id, activeProduct, clamped)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const product = activeProduct
    if (!product) return
    const stage = stageRef.current
    if (!stage) return
    
    // 벨트가 비어있으면 왼쪽 끝부터 배치
    if (belt.lights.length === 0) {
      const productWidthPx = projectWidth(product.width)
      const positionX = padding + productWidthPx / 2
      addLight(belt.id, product, positionX)
      return
    }
    
    const container = stage.container()
    const rect = container.getBoundingClientRect()
    const relativeX = event.clientX - rect.left
    const clamped = clampX(relativeX, projectWidth(product.width), trackWidth)
    addLight(belt.id, product, clamped)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <div className={`belt-wrapper status-${status.toLowerCase()}`} ref={beltRef}>
      <div className="belt-explosion" ref={explosionRef} />
      <div
        className="belt-stage-container"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        ref={containerRef}
      >
        {belt.lights.length === 0 && (
          <div className="belt-empty-hint">
            <p>카탈로그에서 클릭 또는 드래그하여 모듈을 추가하세요.</p>
          </div>
        )}
        <Stage
          width={Math.min(trackWidth, MAX_WIDTH)}
          height={trackHeight}
          ref={stageRef}
          className="konva-stage"
          onMouseUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
          style={{ cursor: activeProduct ? 'copy' : 'default', maxWidth: '100%' }}
        >
          <Layer>
            <Rect
              x={padding / 2}
              y={trackHeight / 2 - 25}
              width={16}
              height={50}
              fill="#2c2f36"
              cornerRadius={4}
            />
            <Rect
              x={trackWidth - padding / 2 - 16}
              y={trackHeight / 2 - 25}
              width={16}
              height={50}
              fill="#2c2f36"
              cornerRadius={4}
            />
            <Rect
              x={padding}
              y={trackHeight / 2 - 25}
              width={trackWidth - padding * 2}
              height={45}
              cornerRadius={22}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: trackWidth, y: 0 }}
              fillLinearGradientColorStops={[0, '#1b1b1f', 1, '#24262d']}
              shadowBlur={20}
              shadowColor="rgba(0,0,0,0.4)"
            />
            <Rect
              x={padding + 3}
              y={trackHeight / 2 - 30}
              width={trackWidth - (padding + 3) * 2}
              height={8}
              fill="rgba(246,223,180,0.12)"
              cornerRadius={4}
            />
            <Rect
              x={padding}
              y={trackHeight / 2 + 12}
              width={trackWidth - padding * 2}
              height={12}
              fill="rgba(0,0,0,0.3)"
              shadowBlur={15}
              shadowColor="rgba(0,0,0,0.3)"
              opacity={0.5}
            />
            {belt.lights.map((light) => (
              <LightSprite
                key={light.id}
                beltId={belt.id}
                light={light}
                status={status}
                trackHeight={trackHeight}
                trackWidth={trackWidth}
                beltCentimeter={beltCentimeter}
                usableWidth={usableWidth}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}

export default BeltCanvas

