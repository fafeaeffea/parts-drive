import { useEffect, useRef } from 'react'

/** Плавающие линии на фоне секции (по мотивам BackgroundPaths), на чистом SVG + CSS, без лишних зависимостей. */
function Paths({ position }: { position: number }) {
  return (
    <svg className="flow-paths__svg" viewBox="0 0 696 316" fill="none" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: 24 }, (_, k) => {
        const i = Math.round(k * 1.5)
        const a = 380 - i * 5 * position
        const b = 312 - i * 5 * position
        const c = 152 - i * 5 * position
        const d = 616 - i * 5 * position
        const e = 684 - i * 5 * position
        return (
          <path
            key={k}
            pathLength={1}
            d={`M-${a} -${189 + i * 6}C-${a} -${189 + i * 6} -${b} ${216 - i * 6} ${c} ${343 - i * 6}C${d} ${470 - i * 6} ${e} ${875 - i * 6} ${e} ${875 - i * 6}`}
            strokeWidth={0.5 + i * 0.03}
            strokeOpacity={0.1 + i * 0.03}
            style={{ animationDuration: `${20 + ((i * 7 + (position > 0 ? 3 : 11)) % 10)}s`, animationDelay: `-${(i * 1.7) % 20}s` }}
          />
        )
      })}
    </svg>
  )
}

export function FlowPaths() {
  const ref = useRef<HTMLDivElement>(null)
  // анимация идёт только пока секция на экране
  useEffect(() => {
    const n = ref.current
    if (!n || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([en]) => n.classList.toggle('is-live', en.isIntersecting), { rootMargin: '100px' })
    io.observe(n)
    return () => io.disconnect()
  }, [])
  return (
    <div className="flow-paths" ref={ref} aria-hidden>
      <Paths position={1} />
      <Paths position={-1} />
    </div>
  )
}
