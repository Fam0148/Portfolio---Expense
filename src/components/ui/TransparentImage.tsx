import { useState, useEffect } from 'react'

interface TransparentImageProps {
  src: string
  alt: string
  className?: string
  threshold?: number
}

export const TransparentImage = ({ src, alt, className = "", threshold = 35 }: TransparentImageProps) => {
  const [cleanSrc, setCleanSrc] = useState<string>(src)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = src

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imgData.data

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          const maxVal = Math.max(r, g, b)
          if (maxVal < threshold) {
            data[i + 3] = 0
          } else if (maxVal < threshold + 25) {
            const alphaRatio = (maxVal - threshold) / 25
            data[i + 3] = Math.round(data[i + 3] * alphaRatio)
          }
        }

        ctx.putImageData(imgData, 0, 0)
        setCleanSrc(canvas.toDataURL('image/png'))
      } catch (err) {
        console.error('Failed to make image background transparent:', err)
      }
    }
  }, [src, threshold])

  return <img src={cleanSrc} alt={alt} className={className} />
}
