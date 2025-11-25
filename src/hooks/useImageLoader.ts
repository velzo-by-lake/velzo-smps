import { useEffect, useState } from 'react'

type LoadedImage = {
  element: HTMLImageElement | null
  width: number
  height: number
}

const useImageLoader = (src: string) => {
  const [data, setData] = useState<LoadedImage>({
    element: null,
    width: 0,
    height: 0,
  })

  useEffect(() => {
    if (!src) return undefined
    const img = new window.Image()
    img.src = src
    img.onload = () => {
      setData({ element: img, width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      console.error(`[VELZO] 이미지 로드 실패: ${src}`)
    }
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])

  return data
}

export default useImageLoader

