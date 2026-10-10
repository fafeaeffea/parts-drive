import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

/**
 * Минималистичная техническая карта маршрута Китай / Дубай → Россия.
 * Проекция равнопромежуточная, 5 px на градус (долгота 20…140, широта 5…70).
 */
const P = (lon: number, lat: number) => [(lon - 20) * 5, (70 - lat) * 5] as const
const MOW = P(37.6, 55.75)
const DXB = P(55.3, 25.2)
const CAN = P(113.3, 23.1)
const PATH_CN = `M${CAN[0]} ${CAN[1]} Q ${330} ${40} ${MOW[0]} ${MOW[1]}`
const PATH_AE = `M${DXB[0]} ${DXB[1]} Q ${150} ${150} ${MOW[0]} ${MOW[1]}`

export type RouteMapHandle = { set: (p: number) => void }

export const RouteMap = forwardRef<RouteMapHandle, { auto?: boolean; className?: string }>(function RouteMap({ auto, className }, ref) {
  const cn = useRef<SVGPathElement>(null)
  const ae = useRef<SVGPathElement>(null)
  const dotCn = useRef<SVGCircleElement>(null)
  const dotAe = useRef<SVGCircleElement>(null)
  const ru = useRef<SVGGElement>(null)
  const root = useRef<SVGSVGElement>(null)

  const set = (p: number) => {
    for (const [path, dot, delay] of [[cn.current, dotCn.current, 0], [ae.current, dotAe.current, 0.12]] as const) {
      if (!path || !dot) continue
      const len = path.getTotalLength()
      const t = Math.min(1, Math.max(0, (p - delay) / (1 - delay)))
      path.style.strokeDasharray = `${len}`
      path.style.strokeDashoffset = `${len * (1 - t)}`
      const pt = path.getPointAtLength(len * t)
      dot.setAttribute('cx', String(pt.x))
      dot.setAttribute('cy', String(pt.y))
      dot.style.opacity = t > 0.01 && t < 0.995 ? '1' : '0'
    }
    if (ru.current) ru.current.style.opacity = String(0.35 + 0.65 * Math.min(1, Math.max(0, (p - 0.85) / 0.15)))
  }
  useImperativeHandle(ref, () => ({ set }))

  useEffect(() => {
    if (!auto) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { set(1); return }
    let raf = 0
    let visible = false
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    if (root.current) io.observe(root.current)
    const t0 = performance.now()
    const loop = (now: number) => {
      if (visible) set(((now - t0) / 5200) % 1.25)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); io.disconnect() }
  }, [auto])

  return (
    <svg ref={root} className={`route-map ${className ?? ''}`} viewBox="0 0 600 325" role="img"
      aria-label="Схема маршрута: Китай и Дубай — Россия">
      <g className="route-map__grid">
        {Array.from({ length: 25 }, (_, i) => Array.from({ length: 14 }, (_, j) => (
          <circle key={`${i}-${j}`} cx={i * 25 + 12} cy={j * 25 + 10} r="1" />
        )))}
        {[30, 60, 90, 120].map((lon) => <line key={lon} x1={(lon - 20) * 5} y1="0" x2={(lon - 20) * 5} y2="325" className="route-map__mer" />)}
        {[20, 40, 60].map((lat) => <line key={lat} x1="0" y1={(70 - lat) * 5} x2="600" y2={(70 - lat) * 5} className="route-map__mer" />)}
      </g>
      <g className="route-map__coords mono">
        <text x="4" y={(70 - 60) * 5 - 4}>60°N</text>
        <text x="4" y={(70 - 40) * 5 - 4}>40°N</text>
        <text x="4" y={(70 - 20) * 5 - 4}>20°N</text>
        <text x={(90 - 20) * 5 + 4} y="320">90°E</text>
        <text x={(60 - 20) * 5 + 4} y="320">60°E</text>
        <text x={(120 - 20) * 5 + 4} y="320">120°E</text>
      </g>
      <path d={PATH_CN} className="route-map__base" />
      <path d={PATH_AE} className="route-map__base" />
      <path ref={cn} d={PATH_CN} className="route-map__line" />
      <path ref={ae} d={PATH_AE} className="route-map__line" />
      <circle ref={dotCn} r="5" className="route-map__pulse" />
      <circle ref={dotAe} r="5" className="route-map__pulse" />
      <g className="route-map__node">
        <circle cx={CAN[0]} cy={CAN[1]} r="4" />
        <circle cx={CAN[0]} cy={CAN[1]} r="11" className="ring" />
        <text x={CAN[0] + 14} y={CAN[1] + 4}>Китай</text>
      </g>
      <g className="route-map__node">
        <circle cx={DXB[0]} cy={DXB[1]} r="4" />
        <circle cx={DXB[0]} cy={DXB[1]} r="11" className="ring" />
        <text x={DXB[0] + 14} y={DXB[1] + 4}>Дубай</text>
      </g>
      <g ref={ru} className="route-map__node route-map__node--dest">
        <circle cx={MOW[0]} cy={MOW[1]} r="5" />
        <circle cx={MOW[0]} cy={MOW[1]} r="14" className="ring" />
        <text x={MOW[0] + 18} y={MOW[1] - 8}>Россия</text>
      </g>
    </svg>
  )
})
