import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { buildCar, setPartGlow, type PartId, type Quality } from './carFactory'
import { createLensUniforms } from './lens'
import { Studio } from './Studio'

export type AnatomyInput = {
  /** Положение курсора, CSS px относительно холста */
  x: number
  y: number
  active: boolean
  /** Выбранный узел: подсвечивается. */
  selected: PartId | null
  /** Счётчик кликов по сцене и их координаты — для выбора узла кликом. */
  click: { n: number; x: number; y: number }
  /** Угол обзора, задаётся перетаскиванием (рад). */
  yaw: number
  pitch: number
  /** Время последнего перетаскивания — после паузы машина медленно вращается сама. */
  lastDrag: number
}

/**
 * Машина целиком в разрезе: кузов показан полупрозрачным контуром,
 * внутренний макет виден сразу. Выбранный узел подсвечивается.
 */
export function AnatomyScene({
  quality, reducedMotion, input, onHover, onPick,
}: {
  quality: Quality
  reducedMotion: boolean
  input: React.RefObject<AnatomyInput>
  onHover: (id: PartId | null, x: number, y: number) => void
  onPick: (id: PartId | null) => void
}) {
  const lens = useMemo(createLensUniforms, [])
  const rig = useMemo(() => {
    const r = buildCar(lens, quality)
    r.exterior.visible = false // сплошной кузов не рисуем — только контур
    return r
  }, [lens, quality])
  useEffect(() => () => rig.dispose(), [rig])
  const { camera, size, gl } = useThree()
  const cam = camera as THREE.PerspectiveCamera

  const tmp = useMemo(() => ({
    ray: new THREE.Raycaster(), ndc: new THREE.Vector2(), box: new THREE.Box3(), v: new THREE.Vector3(),
    yaw: 0.22, pitch: 0.17, lastReport: 0, clickSeen: 0,
  }), [])

  const pick = (x: number, y: number): PartId | null => {
    tmp.ndc.set((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1)
    tmp.ray.setFromCamera(tmp.ndc, cam)
    for (const h of tmp.ray.intersectObject(rig.internals, true)) {
      let o: THREE.Object3D | null = h.object
      while (o && !o.userData.partId) o = o.parent
      if (o) return o.userData.partId as PartId
    }
    return null
  }

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    const inp = input.current
    const t = state.clock.elapsedTime
    const aspect = size.width / size.height

    // камера: вся машина в кадре при любом соотношении сторон
    const vfov = THREE.MathUtils.degToRad(cam.fov)
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect)
    const dist = Math.max(3.45 / Math.tan(hfov / 2), 1.45 / Math.tan(vfov / 2))
    // вращение на 360°: перетаскивание; в паузе — медленный автоповорот
    if (!reducedMotion && performance.now() - inp.lastDrag > 4000) inp.yaw += d * 0.18
    tmp.yaw = THREE.MathUtils.damp(tmp.yaw, inp.yaw, 8, d)
    tmp.pitch = THREE.MathUtils.damp(tmp.pitch, inp.pitch, 8, d)
    const flat = Math.cos(tmp.pitch) * dist
    cam.position.set(Math.sin(tmp.yaw) * flat, 0.78 + Math.sin(tmp.pitch) * dist, Math.cos(tmp.yaw) * flat)
    cam.lookAt(0, 0.78, 0)

    // контур кузова виден целиком: «линза» на весь кадр
    const dpr = gl.getPixelRatio()
    lens.uLensPos.value.set((size.width / 2) * dpr, (size.height / 2) * dpr)
    lens.uLensRadius.value = Math.hypot(size.width, size.height) * dpr

    if (inp.click.n !== tmp.clickSeen) {
      tmp.clickSeen = inp.click.n
      onPick(pick(inp.click.x, inp.click.y))
    }

    const hovered = inp.active ? pick(inp.x, inp.y) : null
    const glow = reducedMotion ? 1 : 0.75 + 0.25 * Math.sin(t * 4)
    setPartGlow(rig, inp.selected, inp.selected ? glow * 1.6 : 0)

    if (t - tmp.lastReport > 0.06) {
      tmp.lastReport = t
      if (inp.selected) {
        const g = rig.parts.get(inp.selected)
        if (g) {
          tmp.box.setFromObject(g).getCenter(tmp.v).project(cam)
          onHover(inp.selected, (tmp.v.x * 0.5 + 0.5) * size.width, (-tmp.v.y * 0.5 + 0.5) * size.height)
        }
      } else {
        onHover(hovered, inp.x, inp.y)
      }
    }
    rig.scanMaterial.uniforms.uStrength.value = 0
  })

  return (
    <>
      <Studio quality={quality} grid={quality === 'high'} />
      <primitive object={rig.root} />
    </>
  )
}
