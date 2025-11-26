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
const DEFAULT_HEIGHT = 180 // 높이 증가로 조명이 더 잘 보이도록
const MIN_WIDTH = 400 // 최소 너비
const MAX_WIDTH = 1200 // 최대 너비 증가
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
  // 조명 크기를 더 크게 표시 (최소 60px, 스케일 1.8배) - 시인성 개선
  const widthPx = Math.max((light.width / beltCentimeter) * usableWidth * 1.8, 60)
  const height = widthPx * ratio
  const baseY = trackHeight / 2 - height - 12 // 조명이 더 위로 올라가도록

  useEffect(() => {
    if (element && imageRef.current) {
      imageRef.current.cache()
      imageRef.current.filters([Konva.Filters.Blur])
      imageRef.current.blurRadius(4) // 블러 감소로 더 선명하게
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
    const current = imageRef.current?.blurRadius?.() ?? 4
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
    animateBlur(1) // 호버 시 더 선명하게
    gsap.to(imageRef.current, {
      scale: 1.15,
      duration: 0.2,
      ease: 'power2.out',
    })
  }

  const handleOut = () => {
    if (!imageRef.current) return
    imageRef.current.getStage()?.container().style.setProperty('cursor', 'default')
    animateBlur(4)
    gsap.to(imageRef.current, {
      scale: 1,
      duration: 0.2,
      ease: 'power2.out',
    })
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
      shadowBlur={30}
      shadowColor="rgba(246,223,180,0.5)"
      shadowOffset={{ x: 0, y: 4 }}
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

  // 조명들의 실제 배치 길이를 계산하여 캔버스 너비 결정
  const calculateRequiredWidth = () => {
    if (belt.lights.length === 0) {
      return DEFAULT_WIDTH
    }
    
    const beltCentimeter = Math.max(100, belt.length * 100)
    const baseUsableWidth = DEFAULT_WIDTH - padding * 2
    
    // 모든 조명의 실제 픽셀 너비 계산 (크기 증가 반영)
    let totalWidth = 0
    let maxLightWidth = 0
    
    belt.lights.forEach((light) => {
      const lightWidthPx = Math.max((light.width / beltCentimeter) * baseUsableWidth * 1.8, 60)
      totalWidth += lightWidthPx
      maxLightWidth = Math.max(maxLightWidth, lightWidthPx)
    })
    
    // 조명 간 최소 간격 추가 (각 조명당 30px - 더 넓게)
    const spacing = belt.lights.length > 0 ? (belt.lights.length - 1) * 30 : 0
    const requiredWidth = totalWidth + spacing + padding * 2
    
    // 최소 너비와 최대 너비 사이에서 조정
    return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.max(requiredWidth, DEFAULT_WIDTH)))
  }

  useEffect(() => {
    if (!containerRef.current) return undefined
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      const containerWidth = entry.contentRect.width
      
      // 조명이 있을 때는 필요한 너비 계산, 없을 때는 컨테이너 너비 사용
      const calculatedWidth = calculateRequiredWidth()
      const width = Math.min(Math.max(calculatedWidth, containerWidth), MAX_WIDTH)
      
      // 높이를 조명이 잘 보이도록 증가
      const height = Math.max(180, Math.min(200, width * 0.22))
      
      setCanvasSize({ width, height })
    })
    observer.observe(containerRef.current)
    
    // 조명이 변경될 때마다 크기 재계산
    const recalculate = () => {
      if (!containerRef.current) return
      const calculatedWidth = calculateRequiredWidth()
      const containerWidth = containerRef.current.getBoundingClientRect().width
      const width = Math.min(Math.max(calculatedWidth, containerWidth), MAX_WIDTH)
      const height = Math.max(180, Math.min(200, width * 0.22))
      setCanvasSize({ width, height })
    }
    
    recalculate()
    return () => observer.disconnect()
  }, [belt.lights.length, belt.length])
  
  const trackWidth = canvasSize.width
  const trackHeight = canvasSize.height
  const usableWidth = Math.max(100, trackWidth - padding * 2)
  const beltCentimeter = Math.max(100, belt.length * 100)
  
  // 조명 크기를 더 크게 표시 (최소 60px, 스케일 1.8배) - 시인성 개선
  const projectWidth = (physicalWidth: number) =>
    Math.max((physicalWidth / beltCentimeter) * usableWidth * 1.8, 60)

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
          width={trackWidth}
          height={trackHeight}
          ref={stageRef}
          className="konva-stage"
          onMouseUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
          style={{ cursor: activeProduct ? 'copy' : 'default', width: '100%', maxWidth: '100%' }}
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
            {/* 벨트 메인 바디 - 더 밝고 명확하게 */}
            <Rect
              x={padding}
              y={trackHeight / 2 - 28}
              width={trackWidth - padding * 2}
              height={56}
              cornerRadius={28}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: trackWidth, y: 0 }}
              fillLinearGradientColorStops={[0, '#2a2d35', 0.5, '#32353d', 1, '#2a2d35']}
              shadowBlur={24}
              shadowColor="rgba(0,0,0,0.5)"
              stroke={status === 'OVERLOAD' ? '#ff6267' : status === 'CAUTION' ? '#f3b563' : 'rgba(246,223,180,0.2)'}
              strokeWidth={2}
            />
            {/* 벨트 상단 글로우 라인 - 더 밝게 */}
            <Rect
              x={padding + 4}
              y={trackHeight / 2 - 32}
              width={trackWidth - (padding + 4) * 2}
              height={6}
              fill="rgba(246,223,180,0.25)"
              cornerRadius={3}
              shadowBlur={8}
              shadowColor="rgba(246,223,180,0.4)"
            />
            {/* 벨트 하단 그림자 */}
            <Rect
              x={padding}
              y={trackHeight / 2 + 16}
              width={trackWidth - padding * 2}
              height={14}
              fill="rgba(0,0,0,0.4)"
              shadowBlur={20}
              shadowColor="rgba(0,0,0,0.4)"
              opacity={0.6}
              cornerRadius={7}
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

