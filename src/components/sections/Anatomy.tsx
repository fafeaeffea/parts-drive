import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { detectQuality, useNearViewport, useReducedMotion, type RenderMode } from '../../lib/device'
import { useLead } from '../../lib/lead'
import { partCategories, type PartCategoryId } from '../../config/site'
import { CarBlueprint } from '../illustrations/CarBlueprint'
import type { AnatomyInput } from '../3d/AnatomyScene'
import { PART_CATEGORY, PART_LABELS, type PartId } from '../3d/parts'

const AnatomyCanvas = lazy(() => import('../3d/AnatomyCanvas'))

const LEGEND: PartId[] = ['engine', 'radiator', 'gearbox', 'frontAxle', 'strut', 'brakes', 'driveshaft', 'rearAxle', 'rearSuspension', 'exhaust', 'fuelTank', 'battery', 'steering', 'interior']

export function Anatomy({ mode }: { mode: RenderMode }) {
  const { openLead } = useLead()
  const wrap = useRef<HTMLDivElement>(null)
  const near = useNearViewport(wrap, '300px')
  const reduced = useReducedMotion()
  const input = useRef<AnatomyInput>({ x: 0, y: 0, active: false, selected: null, click: { n: 0, x: 0, y: 0 }, yaw: 0.22, pitch: 0.17, lastDrag: 0 })
  const [hovered, setHovered] = useState<PartId | null>(null)
  const [selected, setSelected] = useState<PartId | null>(null)
  const label = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // монтируем WebGL при приближении к секции
  useEffect(() => { if (near) setMounted(true) }, [near])
  useEffect(() => { input.current.selected = selected }, [selected])

  useEffect(() => {
    const el = wrap.current
    if (!el || mode === 'static') return
    const pos = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    // перетаскивание — вращение на 360°, короткое касание без сдвига — выбор узла
    let drag: { id: number; x: number; y: number; moved: number } | null = null
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 }
      el.classList.add('is-dragging')
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') Object.assign(input.current, pos(e), { active: true })
      if (!drag || drag.id !== e.pointerId) return
      const dx = e.clientX - drag.x
      const dy = e.clientY - drag.y
      drag.x = e.clientX
      drag.y = e.clientY
      drag.moved += Math.abs(dx) + Math.abs(dy)
      if (drag.moved > 6) {
        if (!el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId)
        input.current.yaw -= dx * 0.009
        input.current.pitch = Math.min(1.1, Math.max(0.02, input.current.pitch + dy * 0.005))
        input.current.lastDrag = performance.now()
      }
    }
    const up = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return
      if (drag.moved <= 6) input.current.click = { n: input.current.click.n + 1, ...pos(e) }
      else input.current.lastDrag = performance.now()
      drag = null
      el.classList.remove('is-dragging')
    }
    const leave = () => { input.current.active = false }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('pointerleave', leave)
    }
  }, [mode])

  const onHover = useCallback((id: PartId | null, x: number, y: number) => {
    setHovered((h) => (h === id ? h : id))
    const l = label.current
    const w = wrap.current?.clientWidth ?? 0
    if (l) {
      const flip = x > w - l.offsetWidth - 40
      l.style.transform = `translate3d(${Math.round(flip ? x - l.offsetWidth - 48 : x)}px, ${Math.round(y)}px, 0)`
    }
  }, [])
  const onPick = useCallback((id: PartId | null) => setSelected(id), [])

  const shown = selected ?? hovered
  const cat = selected ? (PART_CATEGORY[selected] as PartCategoryId | undefined) : undefined
  const catTitle = partCategories.find((c) => c.id === cat)?.title

  return (
    <section id="xray" className="section anatomy" aria-labelledby="xray-title">
      <div className="container anatomy__head">
        <div>
          <p className="kicker mono" data-reveal>Рентген автомобиля</p>
          <h2 id="xray-title" className="h1" data-reveal>Вся машина. <span className="accent">И всё, что внутри.</span></h2>
        </div>
        <p className="muted anatomy__lead" data-reveal>
          Двигатель, оси, подвеска и другие узлы — в разрезе. Поворачивайте машину на 360°, перетаскивая её.
          Выберите, что сломалось, в списке или нажмите на узел — он подсветится, и можно сразу оставить заявку.
        </p>
      </div>

      <div className={`anatomy__stage ${hovered && !selected ? 'is-hover' : ''}`} ref={wrap} data-reveal>
        {mode === 'static' ? (
          <CarBlueprint className="anatomy__blueprint" />
        ) : mounted ? (
          <Suspense fallback={<CarBlueprint className="anatomy__blueprint" highlight={false} />}>
            <AnatomyCanvas quality={mode === 'full' ? detectQuality() : 'low'} reducedMotion={reduced} input={input}
              onHover={onHover} onPick={onPick} active={near} />
          </Suspense>
        ) : (
          <CarBlueprint className="anatomy__blueprint" highlight={false} />
        )}
        {mode !== 'static' && (
          <div className={`xray-label ${shown ? 'is-on' : ''} ${selected ? 'is-selected' : ''}`} ref={label} aria-hidden>
            <span className="mono">{selected ? 'ВЫБРАНО' : 'УЗЕЛ'}</span>
            <strong>{shown ? PART_LABELS[shown] : ''}</strong>
          </div>
        )}
        <div className="anatomy__hud mono" aria-hidden>
          <span>X-RAY · DEMO MODEL</span>
          <span>{selected ? 'TARGET · LOCK' : 'CUTAWAY VIEW'}</span>
        </div>
        {mode !== 'static' && <p className="anatomy__drag mono" aria-hidden>⟲ 360° · перетащите, чтобы повернуть</p>}
      </div>

      <div className="container anatomy__foot">
        <ul className="anatomy__legend" aria-label="Что сломалось">
          {LEGEND.map((id) => (
            <li key={id}>
              <button className={`legend-item ${selected === id ? 'is-on' : ''}`} aria-pressed={selected === id}
                onClick={() => setSelected((s) => (s === id ? null : id))}>
                <span className="legend-item__dot" />{PART_LABELS[id]}
              </button>
            </li>
          ))}
        </ul>
        <div className="anatomy__cta">
          <p className="muted small">{selected ? <>Выбрано: <strong>{PART_LABELS[selected]}</strong>{catTitle ? ` · ${catTitle}` : ''}</> : 'Выберите, что сломалось'}</p>
          <button className="btn btn--primary" onClick={() => openLead(selected && cat ? { category: cat, part: PART_LABELS[selected] } : undefined, selected ? 0 : undefined)}>
            {selected ? 'Подобрать эту деталь' : 'Подобрать деталь'}
          </button>
        </div>
      </div>
    </section>
  )
}
