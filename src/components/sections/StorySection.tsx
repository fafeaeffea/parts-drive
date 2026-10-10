import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { hero, story as copy } from '../../config/site'
import { SCENES, story } from '../../lib/storyStore'
import { clamp, range, window4 } from '../../lib/math'
import { detectQuality, useMediaQuery, useNearViewport, useReducedMotion, type RenderMode } from '../../lib/device'
import { useLead } from '../../lib/lead'
import { CarBlueprint } from '../illustrations/CarBlueprint'
import { RouteMap, type RouteMapHandle } from '../illustrations/RouteMap'
import { Arrow } from '../forms/LeadForm'
import { scrollToId } from '../ui/Header'

const StoryCanvas = lazy(() => import('../3d/StoryCanvas'))

export function StorySection({ mode }: { mode: RenderMode }) {
  const { openLead } = useLead()
  const section = useRef<HTMLElement>(null)
  const sticky = useRef<HTMLDivElement>(null)
  const route = useRef<RouteMapHandle>(null)
  const el = useRef<Record<string, HTMLElement | null>>({})
  const mobile = useMediaQuery('(max-width: 820px)')
  const reduced = useReducedMotion()
  const near = useNearViewport(section, '200px')
  const [ready, setReady] = useState(false)
  const animated = mode !== 'static'
  const quality = mode === 'full' ? detectQuality() : 'low'

  // прогресс прокрутки → состояние сюжета → стили оверлеев
  useEffect(() => {
    if (!animated) return
    let raf = 0
    const tick = () => {
      const s = section.current
      if (s) {
        const r = s.getBoundingClientRect()
        story.target = clamp(-r.top / Math.max(1, r.height - window.innerHeight))
        if (!ready) story.p = story.target
        apply(story.p)
      }
      raf = requestAnimationFrame(tick)
    }
    const apply = (p: number) => {
      const E = el.current
      const set = (k: string, o: number, y = 0) => {
        const n = E[k]
        if (!n) return
        n.style.opacity = o.toFixed(3)
        n.style.transform = `translate3d(0, ${((1 - o) * y).toFixed(1)}px, 0)`
        n.style.visibility = o < 0.01 ? 'hidden' : 'visible'
      }
      set('hero', 1 - range(p, 0.06, 0.13), -30)
      set('diag', window4(p, 0.17, 0.23, 0.36, 0.41), 30)
      set('exp', window4(p, 0.42, 0.47, 0.57, 0.61), 30)
      set('del', window4(p, 0.61, 0.66, 0.8, 0.84), 30)
      set('fin', range(p, 0.9, 0.96), 30)
      set('cue', 1 - range(p, 0.01, 0.05))
      // выноски к детали
      const callA = window4(p, 0.2, 0.25, 0.36, 0.4)
      const callB = window4(p, 0.45, 0.5, 0.57, 0.6)
      const c = E.callout
      if (c) {
        const a = Math.max(callA, callB)
        const px = callB > callA ? story.part.x : story.mount.x
        const py = callB > callA ? story.part.y : story.mount.y
        const lx = mobile ? 20 : Math.min(window.innerWidth - 300, px + 140)
        const ly = mobile ? Math.max(90, py - 170) : Math.max(110, py - 140)
        c.style.opacity = a.toFixed(3)
        c.style.visibility = a < 0.01 ? 'hidden' : 'visible'
        const line = c.querySelector('polyline')
        line?.setAttribute('points', `${px},${py} ${mobile ? px : lx - 30},${ly + 22} ${mobile ? px + 10 : lx},${ly + 22}`)
        const dot = c.querySelector('circle')
        dot?.setAttribute('cx', String(px)); dot?.setAttribute('cy', String(py))
        const lab = E.calloutLabel
        if (lab) {
          lab.style.transform = `translate3d(${mobile ? 20 : lx}px, ${ly}px, 0)`
          lab.dataset.mode = callB > callA ? 'b' : 'a'
        }
      }
      route.current?.set(range(p, 0.64, 0.8))
      const stepsP = range(p, 0.64, 0.82) * 4
      E.routeSteps?.querySelectorAll('li').forEach((li, i) => li.classList.toggle('is-on', stepsP > i + 0.15))
      // рельс прогресса
      const active = SCENES.reduce((acc, s, i) => (p >= s.at - 0.06 ? i : acc), 0)
      E.rail?.querySelectorAll('li').forEach((li, i) => li.classList.toggle('is-on', i === active))
      if (E.railFill) E.railFill.style.transform = `scaleY(${p.toFixed(3)})`
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [animated, mobile, ready])

  // курсор для рентген-линзы на первом экране
  useEffect(() => {
    const s = sticky.current
    if (!s || !animated) return
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = s.getBoundingClientRect()
      story.pointer.x = e.clientX - r.left
      story.pointer.y = e.clientY - r.top
      story.pointer.inside = true
      story.pointer.lastMove = performance.now()
    }
    const leave = () => { story.pointer.inside = false }
    s.addEventListener('pointermove', move)
    s.addEventListener('pointerleave', leave)
    return () => { s.removeEventListener('pointermove', move); s.removeEventListener('pointerleave', leave) }
  }, [animated])

  const goScene = (p: number) => {
    const s = section.current
    if (!s) return
    const top = s.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + p * (s.offsetHeight - window.innerHeight), behavior: reduced ? 'auto' : 'smooth' })
  }
  const bind = (k: string) => (n: HTMLElement | null) => { el.current[k] = n }

  return (
    <section id="top" ref={section} className={`story ${animated ? '' : 'story--static'}`} aria-label="Как мы решаем задачу: от поломки до замены детали">
      <div className="story__sticky" ref={sticky}>
        <div className="story__stage">
          {animated ? (
            <Suspense fallback={<CarBlueprint className="story__blueprint" internals={false} highlight={false} />}>
              <StoryCanvas quality={quality} reducedMotion={reduced} mobile={mobile} active={near} onReady={() => setReady(true)} />
            </Suspense>
          ) : (
            <CarBlueprint className="story__blueprint" />
          )}
          <div className="story__vignette" aria-hidden />
        </div>

        <div className="story__hud mono" aria-hidden>
          <span className="hud-tl">CAM 01 · FRONT 3/4</span>
          <span className="hud-tr">{copy.demoNote}</span>
          <span className="hud-bl">SYS.SCAN · READY</span>
        </div>

        {/* 01 — Hero */}
        <div className="scene scene--hero" ref={bind('hero')}>
          <div className="container">
            <p className="kicker mono reveal-load" style={{ animationDelay: '.2s' }}>
              <span className="dot" /> Китай · Дубай → Россия
            </p>
            <h1 className="display">
              {hero.titleLines.map((l, i) => (
                <span key={l} className="line"><span className="reveal-load" style={{ animationDelay: `${0.35 + i * 0.12}s` }}>{l}</span></span>
              ))}
            </h1>
            <p className="lead reveal-load" style={{ animationDelay: '.7s' }}>{hero.subtitle}</p>
            <div className="actions reveal-load" style={{ animationDelay: '.85s' }}>
              <button className="btn btn--primary btn--lg" onClick={() => openLead()}>{hero.ctaPrimary}<Arrow /></button>
              <button className="btn btn--ghost btn--lg" onClick={() => (animated ? goScene(0.24) : scrollToId('how'))}>{hero.ctaSecondary}</button>
            </div>
            {animated && !mobile && <p className="hint mono reveal-load" style={{ animationDelay: '1.4s' }}><span className="hint__ring" />{hero.hoverHint}</p>}
          </div>
        </div>

        {/* 02 — Диагностика */}
        <div className="scene scene--side" ref={bind('diag')}>
          <div className="container">
            <p className="kicker mono">{copy.diagnosis.kicker}</p>
            <h2 className="h2">{copy.diagnosis.title}</h2>
            <p className="muted">{copy.diagnosis.text}</p>
          </div>
        </div>

        {/* 03 — Деталь */}
        <div className="scene scene--side" ref={bind('exp')}>
          <div className="container">
            <p className="kicker mono">{copy.exploded.kicker}</p>
            <h2 className="h2">{copy.exploded.title}<br /><span className="accent">{copy.exploded.accent}</span></h2>
          </div>
        </div>

        {/* выноска к детали */}
        {animated && (
          <div className="callout" ref={bind('callout')} aria-hidden>
            <svg className="callout__svg"><polyline fill="none" /><circle r="5" /></svg>
            <div className="callout__label" ref={bind('calloutLabel')}>
              <span className="mono callout__a">DIAG · 0x2F · ВНИМАНИЕ</span>
              <span className="mono callout__b">ДЕТАЛЬ · ПОДБОР ПО VIN</span>
              <strong>{copy.diagnosis.partName}</strong>
            </div>
          </div>
        )}

        {/* 04 — Доставка */}
        <div className="scene scene--delivery" ref={bind('del')}>
          <div className="container delivery">
            <div className="delivery__text">
              <p className="kicker mono">{copy.delivery.kicker}</p>
              <h2 className="h2">{copy.delivery.title}</h2>
              <ol className="route-steps" ref={bind('routeSteps')}>
                {copy.delivery.route.map((r, i) => (
                  <li key={r}><span className="mono">{String(i + 1).padStart(2, '0')}</span>{r}</li>
                ))}
              </ol>
              <p className="muted small">{copy.delivery.text}</p>
            </div>
            <div className="delivery__map">
              <RouteMap ref={route} auto={!animated} />
            </div>
          </div>
        </div>

        {/* 05 — Замена */}
        <div className="scene scene--final" ref={bind('fin')}>
          <div className="container">
            <p className="kicker mono">05 / Замена</p>
            <h2 className="display display--md">
              {copy.final.titleLines.map((l) => <span key={l} className="line"><span>{l}</span></span>)}
            </h2>
            <button className="btn btn--primary btn--lg" onClick={() => openLead()}>{copy.final.cta}<Arrow /></button>
          </div>
        </div>

        {animated && (
          <>
            <ol className="rail mono" ref={bind('rail')} aria-label="Сцены">
              <span className="rail__track"><span className="rail__fill" ref={bind('railFill')} /></span>
              {SCENES.map((s, i) => (
                <li key={s.id}>
                  <button onClick={() => goScene(s.at)} aria-label={`Сцена ${i + 1}: ${s.label}`}>
                    <span className="rail__n">0{i + 1}</span><span className="rail__l">{s.label}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="scroll-cue mono" ref={bind('cue')} aria-hidden>
              <span className="scroll-cue__line" />Прокрутите
            </div>
          </>
        )}
      </div>
    </section>
  )
}
