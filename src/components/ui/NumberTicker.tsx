import { useEffect, useRef } from 'react'
import { useSpring, useInView } from 'framer-motion'

interface NumberTickerProps {
  value: number
  className?: string
}

export const NumberTicker = ({ value, className }: NumberTickerProps) => {
  const ref = useRef<HTMLSpanElement>(null)
  const springValue = useSpring(0, {
    mass: 0.5,
    stiffness: 280,
    damping: 28,
  })
  const isInView = useInView(ref, { once: true, margin: '-10px' })

  useEffect(() => {
    if (isInView) {
      springValue.set(value)
    }
  }, [isInView, value, springValue])

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest: number) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat('en-IN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(Math.floor(latest))
      }
    })
    return () => unsubscribe()
  }, [springValue])

  return (
    <span
      ref={ref}
      className={className}
    >
      0
    </span>
  )
}
