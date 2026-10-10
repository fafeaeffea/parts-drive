import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { buildCar, STRUT_HOME, type Quality } from './carFactory'
import { createLensUniforms } from './lens'
import { Studio } from './Studio'
import { story } from '../../lib/storyStore'
import { clamp, range, sampleKeys } from '../../lib/math'

// [p, [камера x,y,z, цель x,y,z, сдвиг кадра]]
const CAM: [number, number[]][] = [
  [0.0, [6.0, 1.8, 7.0, 0.05, 0.72, 0, 0.16]],
  [0.13, [5.2, 1.55, 6.0, 0.15, 0.72, 0, 0.15]],
  [0.24, [3.35, 1.15, 3.0, 1.35, 0.68, 0.45, 0.14]],
  [0.37, [3.15, 1.1, 2.75, 1.38, 0.68, 0.5, 0.14]],
  [0.47, [3.0, 1.55, 4.6, 1.2, 0.85, 1.1, 0.1]],
  [0.58, [2.9, 1.45, 4.4, 1.25, 0.85, 1.15, 0.1]],
  [0.68, [3.3, 1.4, 4.4, 1.55, 0.95, 1.5, -0.22]],
  [0.8, [3.5, 1.45, 4.7, 1.45, 0.92, 1.4, -0.2]],
  [0.9, [5.0, 1.55, 5.8, 0.3, 0.72, 0.1, 0.16]],
  [1.0, [6.0, 1.8, 7.0, 0.05, 0.72, 0, 0.16]],
]
// [p, [вынос детали, линза, скан, упаковка]]
const FX: [number, number[]][] = [
  [0.0, [0, 0, 0, 0]],
  [0.15, [0, 0, 0, 0]],
  [0.24, [0, 1, 1, 0]],
  [0.38, [0, 1, 1, 0]],
  [0.48, [1, 0.85, 0.5, 0]],
  [0.58, [1, 0.6, 0.25, 0]],
  [0.66, [1, 0, 0, 1]],
  [0.8, [1, 0, 0, 1]],
  [0.84, [1, 0.7, 0.2, 0]],
  [0.92, [0, 0.4, 0, 0]],
  [0.98, [0, 0, 0, 0]],
]
const OUT_OFFSET = new THREE.Vector3(0.25, 0.5, 1.25)

function backOut(t: number) {
  const s = 1.9
  const u = t - 1
  return u * u * ((s + 1) * u + s) + 1
}

export function StoryScene({ quality, reducedMotion, mobile }: { quality: Quality; reducedMotion: boolean; mobile: boolean }) {
  const lens = useMemo(createLensUniforms, [])
  const rig = useMemo(() => buildCar(lens, quality), [lens, quality])
  useEffect(() => () => rig.dispose(), [rig])

  const { camera, size, gl } = useThree()
  const cam = camera as THREE.PerspectiveCamera
  const tmp = useMemo(() => ({
    cam: new Array(7).fill(0), fx: new Array(4).fill(0), look: new THREE.Vector3(),
    v: new THREE.Vector3(), lensPos: new THREE.Vector2(-9999, -9999), lensR: 0, mouseW: 0, intro: 0,
  }), [])

  const sweep = useRef<THREE.SpotLight>(null)
  const packBox = useMemo(() => {
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.34, 0.62, 0.34))
    const mat = new THREE.LineBasicMaterial({ color: '#ff5a1f', transparent: true, opacity: 0 })
    return new THREE.LineSegments(geo, mat)
  }, [])
  const tether = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()])
    const mat = new THREE.LineDashedMaterial({ color: '#ff5a1f', dashSize: 0.05, gapSize: 0.04, transparent: true, opacity: 0 })
    const l = new THREE.Line(geo, mat)
    return l
  }, [])
  useEffect(() => () => {
    packBox.geometry.dispose(); (packBox.material as THREE.Material).dispose()
    tether.geometry.dispose(); (tether.material as THREE.Material).dispose()
  }, [packBox, tether])

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    // сглаживание прокрутки: «дорогая» инерция камеры
    story.p = reducedMotion ? story.target : THREE.MathUtils.damp(story.p, story.target, 4.2, d)
    const p = story.p
    const t = state.clock.elapsedTime
    tmp.intro = reducedMotion ? 1 : Math.min(1, tmp.intro + d / 2.8)
    const intro = 1 - Math.pow(1 - tmp.intro, 3)

    // ── камера ──
    const c = sampleKeys(CAM, p, tmp.cam)
    const aspect = size.width / size.height
    const far = aspect < 1 ? 1 + (1 - aspect) * 1.25 : 1
    const drift = reducedMotion ? 0 : Math.sin(t * 0.25) * 0.12
    const introPush = (1 - intro) * 2.2
    tmp.look.set(c[3], c[4], c[5])
    cam.position.set(
      c[3] + (c[0] - c[3]) * far * (1 + introPush * 0.25) + drift,
      c[4] + (c[1] - c[4]) * far + introPush * 0.15,
      c[5] + (c[2] - c[5]) * far * (1 + introPush * 0.25),
    )
    cam.lookAt(tmp.look)
    const shift = mobile ? 0 : c[6]
    cam.setViewOffset(size.width, size.height, -shift * size.width, mobile ? -size.height * 0.17 : 0, size.width, size.height)

    // ── деталь ──
    const fx = sampleKeys(FX, p, tmp.fx)
    let out = fx[0]
    if (p > 0.84 && p < 0.92) out = 1 - backOut(clamp((p - 0.84) / 0.08)) // механическая фиксация с «дожимом»
    const spin = range(p, 0.6, 0.8) * Math.PI * 2 * (reducedMotion ? 0 : 1)
    rig.strut.position.copy(STRUT_HOME).addScaledVector(OUT_OFFSET, out)
    rig.strut.rotation.set(out * 0.25, spin + out * 0.4, -out * 0.18)
    rig.strut.scale.setScalar(1 + out * 0.2)
    const pulse = 0.65 + 0.35 * Math.sin(t * 4)
    rig.scanMaterial.uniforms.uTime.value = t
    rig.scanMaterial.uniforms.uStrength.value = fx[2] * (reducedMotion ? 0.8 : pulse)

    // упаковка и «трос» к посадочному месту
    packBox.position.copy(rig.strut.position).add(tmp.v.set(0, 0.32 * rig.strut.scale.y, 0))
    packBox.rotation.copy(rig.strut.rotation)
    packBox.scale.setScalar(rig.strut.scale.x * (1 + (1 - fx[3]) * 0.3))
    ;(packBox.material as THREE.LineBasicMaterial).opacity = fx[3] * 0.9
    const tetherA = range(p, 0.42, 0.5) * (1 - range(p, 0.6, 0.66)) + range(p, 0.8, 0.84) * (1 - range(p, 0.86, 0.9))
    const pos = tether.geometry.attributes.position as THREE.BufferAttribute
    pos.setXYZ(0, STRUT_HOME.x, STRUT_HOME.y + 0.3, STRUT_HOME.z)
    pos.setXYZ(1, rig.strut.position.x, rig.strut.position.y + 0.3, rig.strut.position.z)
    pos.needsUpdate = true
    tether.computeLineDistances()
    ;(tether.material as THREE.LineDashedMaterial).opacity = tetherA

    // ── экранные позиции детали и гнезда для DOM-подписей ──
    tmp.v.copy(rig.strut.position)
    tmp.v.y += 0.3 * rig.strut.scale.y
    tmp.v.project(cam)
    story.part.x = (tmp.v.x * 0.5 + 0.5) * size.width
    story.part.y = (-tmp.v.y * 0.5 + 0.5) * size.height
    story.part.visible = tmp.v.z < 1
    tmp.v.set(STRUT_HOME.x, STRUT_HOME.y + 0.3, STRUT_HOME.z).project(cam)
    story.mount.x = (tmp.v.x * 0.5 + 0.5) * size.width
    story.mount.y = (-tmp.v.y * 0.5 + 0.5) * size.height

    // ── рентген-линза ──
    const dpr = gl.getPixelRatio()
    const ptr = story.pointer
    const mouseWanted = ptr.inside && !mobile && performance.now() - ptr.lastMove < 2600 ? 1 : 0
    const heroW = 1 - range(p, 0.06, 0.14) + range(p, 0.95, 1)
    tmp.mouseW = THREE.MathUtils.damp(tmp.mouseW, mouseWanted * clamp(heroW), 6, d)
    const storyR = fx[1] * Math.min(size.width, size.height) * (mobile ? 0.2 : 0.16)
    const mouseR = tmp.mouseW * (Math.min(size.width, size.height) * 0.15)
    let tx: number, ty: number, tr: number
    if (storyR >= mouseR) {
      tx = story.mount.x; ty = story.mount.y; tr = storyR
    } else {
      tx = ptr.x; ty = ptr.y; tr = mouseR
    }
    if (tmp.lensR < 1) tmp.lensPos.set(tx * dpr, (size.height - ty) * dpr)
    else {
      tmp.lensPos.x = THREE.MathUtils.damp(tmp.lensPos.x, tx * dpr, 14, d)
      tmp.lensPos.y = THREE.MathUtils.damp(tmp.lensPos.y, (size.height - ty) * dpr, 14, d)
    }
    tmp.lensR = THREE.MathUtils.damp(tmp.lensR, tr * dpr, 9, d)
    lens.uLensPos.value.copy(tmp.lensPos)
    lens.uLensRadius.value = tmp.lensR < 1 ? 0 : tmp.lensR

    // ── свет, скользящий по кузову ──
    if (sweep.current) {
      const s = reducedMotion ? 0.3 : -1 + intro * 1.3 + Math.sin(t * 0.18) * 0.25 + p * 0.8
      sweep.current.position.set(s * 5, 4.2, 4.5)
      sweep.current.intensity = 60 * intro
    }
  })

  return (
    <>
      <Studio quality={quality} />
      <spotLight ref={sweep} angle={0.5} penumbra={1} distance={18} decay={2} color="#fff4ea" position={[-4, 4, 4]} />
      <primitive object={rig.root} />
      <primitive object={packBox} />
      <primitive object={tether} />
    </>
  )
}
