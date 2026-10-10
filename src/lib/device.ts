import { useEffect, useState } from 'react'
import type { Quality } from '../components/3d/carFactory'

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function detectQuality(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  const small = window.matchMedia('(max-width: 820px)').matches
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 || !!nav.connection?.saveData
  return small || coarse || weak ? 'low' : 'high'
}

export function useMediaQuery(q: string) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return m
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

/** Режим рендеринга 3D: полный, упрощённый или статичный (без WebGL). */
export type RenderMode = 'full' | 'lite' | 'static'

export function useRenderMode(): RenderMode {
  const [mode, setMode] = useState<RenderMode>('lite')
  useEffect(() => {
    const forced = new URLSearchParams(location.search).get('mode')
    if (forced === 'full' || forced === 'lite' || forced === 'static') return setMode(forced)
    if (!hasWebGL()) return setMode('static')
    setMode(detectQuality() === 'high' ? 'full' : 'lite')
  }, [])
  return mode
}

/** true, когда элемент близко к экрану (для ленивого монтирования WebGL). */
export function useNearViewport<T extends Element>(ref: React.RefObject<T | null>, margin = '400px') {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return near
}

export function useInView<T extends Element>(ref: React.RefObject<T | null>, threshold = 0.2) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold, seen])
  return seen
}
