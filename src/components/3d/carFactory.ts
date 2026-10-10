import * as THREE from 'three'
import { createGhostMaterial, createScanMaterial, patchBodyMaterial, type LensUniforms } from './lens'

/**
 * Процедурная демонстрационная модель кроссовера с внутренним макетом
 * (двигатель, оси, подвеска, тормоза, выпуск, салон).
 *
 * Как заменить на настоящую модель: загрузите GLB через useGLTF (drei),
 * пропатчите материалы кузова функцией patchBodyMaterial, а внутренние узлы
 * пометьте userData.partId — остальной код сцены менять не придётся.
 *
 * Оси: X — вперёд, Y — вверх, Z — вбок (камера смотрит со стороны +Z).
 * Единицы — метры.
 */

export type Quality = 'high' | 'low'

import type { PartId } from './parts'
export type { PartId } from './parts'

export const WHEELBASE_HALF = 1.45
export const WHEEL_R = 0.37
export const TRACK_HALF = 0.84
/** Домашняя позиция левой передней стойки (сторона камеры). */
export const STRUT_HOME = new THREE.Vector3(WHEELBASE_HALF, 0.42, 0.6)

class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private r: number, private h: number, private turns: number) { super() }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2 * this.turns
    return target.set(Math.cos(a) * this.r, t * this.h, Math.sin(a) * this.r)
  }
}

function bodyShape() {
  const s = new THREE.Shape()
  s.moveTo(2.28, 0.3)
  s.quadraticCurveTo(2.44, 0.31, 2.46, 0.48)
  s.lineTo(2.47, 0.7)
  s.quadraticCurveTo(2.46, 0.86, 2.3, 0.9)
  s.quadraticCurveTo(1.7, 0.99, 1.0, 1.05)
  s.lineTo(-1.9, 1.1)
  s.quadraticCurveTo(-2.32, 1.12, -2.38, 1.0)
  s.lineTo(-2.44, 0.8)
  s.quadraticCurveTo(-2.46, 0.6, -2.42, 0.42)
  s.quadraticCurveTo(-2.4, 0.31, -2.25, 0.3)
  s.lineTo(-1.92, 0.3)
  s.absarc(-WHEELBASE_HALF, 0.37, 0.47, Math.PI, 0, true)
  s.lineTo(0.98, 0.3)
  s.absarc(WHEELBASE_HALF, 0.37, 0.47, Math.PI, 0, true)
  s.lineTo(2.28, 0.3)
  return s
}

function greenhouseShape() {
  const s = new THREE.Shape()
  s.moveTo(1.02, 1.0)
  s.quadraticCurveTo(0.42, 1.4, 0.05, 1.6)
  s.quadraticCurveTo(-0.1, 1.67, -0.4, 1.68)
  s.lineTo(-1.55, 1.65)
  s.quadraticCurveTo(-1.86, 1.63, -2.06, 1.4)
  s.lineTo(-2.27, 1.1)
  s.lineTo(-2.27, 1.0)
  s.lineTo(1.02, 1.0)
  return s
}

function extrude(shape: THREE.Shape, width: number, bevel: number, q: Quality) {
  const depth = width - bevel * 2
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.85,
    bevelOffset: -bevel * 0.85,
    bevelSegments: q === 'high' ? 8 : 4,
    curveSegments: q === 'high' ? 36 : 16,
  })
  g.translate(0, 0, -depth / 2)
  g.computeVertexNormals()
  return g
}

type Mats = ReturnType<typeof makeInternalMats>
function makeInternalMats() {
  return {
    steel: new THREE.MeshStandardMaterial({ color: '#8d939b', metalness: 0.85, roughness: 0.38 }),
    alu: new THREE.MeshStandardMaterial({ color: '#c3c8ce', metalness: 0.9, roughness: 0.28 }),
    dark: new THREE.MeshStandardMaterial({ color: '#2a2e34', metalness: 0.5, roughness: 0.55 }),
    accent: new THREE.MeshStandardMaterial({ color: '#ff5a1f', metalness: 0.4, roughness: 0.35 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#16181b', metalness: 0.1, roughness: 0.85 }),
  }
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, p?: [number, number, number], r?: [number, number, number]) {
  const m = new THREE.Mesh(geo, mat)
  if (p) m.position.set(...p)
  if (r) m.rotation.set(...r)
  m.castShadow = false
  m.receiveShadow = false
  return m
}

const box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z)
const cyl = (r: number, h: number, seg = 24) => new THREE.CylinderGeometry(r, r, h, seg)

function part(id: PartId) {
  const g = new THREE.Group()
  g.name = id
  g.userData.partId = id
  return g
}

/** Стойка: пружина, амортизатор, опора, поворотный кулак. Начало координат — у кулака. */
export function buildStrut(m: Mats, q: Quality) {
  const g = new THREE.Group()
  const spring = new THREE.TubeGeometry(new HelixCurve(0.075, 0.34, 6.5), q === 'high' ? 220 : 90, 0.012, 8)
  g.add(mesh(spring, m.accent, [0, 0.12, 0]))
  g.add(mesh(cyl(0.032, 0.42, 16), m.alu, [0, 0.2, 0]))
  g.add(mesh(cyl(0.022, 0.2, 12), m.steel, [0, 0.46, 0]))
  g.add(mesh(cyl(0.1, 0.02, 24), m.dark, [0, 0.11, 0]))
  g.add(mesh(cyl(0.1, 0.02, 24), m.dark, [0, 0.47, 0]))
  g.add(mesh(cyl(0.07, 0.05, 20), m.rubber, [0, 0.5, 0]))
  // кулак и рычаг
  g.add(mesh(box(0.1, 0.16, 0.08), m.steel, [0, -0.02, 0.05]))
  g.add(mesh(box(0.42, 0.04, 0.06), m.steel, [0.02, -0.08, -0.16], [0, 0.5, 0]))
  return g
}

export type CarRig = {
  root: THREE.Group
  exterior: THREE.Group
  internals: THREE.Group
  ghost: THREE.Group
  strut: THREE.Group
  strutScan: THREE.Mesh[]
  scanMaterial: THREE.ShaderMaterial
  parts: Map<PartId, THREE.Group>
  partMats: Map<PartId, THREE.MeshStandardMaterial[]>
  dispose: () => void
}

export function buildCar(lens: LensUniforms, q: Quality): CarRig {
  const root = new THREE.Group()
  const exterior = new THREE.Group()
  const internals = new THREE.Group()
  const ghost = new THREE.Group()
  root.add(internals, exterior, ghost)

  // ── Материалы кузова ────────────────────────────────────────────────
  const paint = patchBodyMaterial(new THREE.MeshPhysicalMaterial({
    color: '#7a8189', metalness: 0.7, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.06,
  }), lens)
  const glass = patchBodyMaterial(new THREE.MeshPhysicalMaterial({
    color: '#0b0f14', metalness: 0.85, roughness: 0.05, clearcoat: 1, envMapIntensity: 1.1,
  }), lens)
  const trim = patchBodyMaterial(new THREE.MeshStandardMaterial({ color: '#0d0f12', metalness: 0.3, roughness: 0.55 }), lens)
  const chrome = patchBodyMaterial(new THREE.MeshStandardMaterial({ color: '#d7dade', metalness: 1, roughness: 0.18 }), lens)
  const drl = patchBodyMaterial(new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#e8f1ff', emissiveIntensity: 2.4 }), lens)
  const tail = patchBodyMaterial(new THREE.MeshStandardMaterial({ color: '#3a0000', emissive: '#ff1a1a', emissiveIntensity: 1.8 }), lens)
  const tire = patchBodyMaterial(new THREE.MeshStandardMaterial({ color: '#141518', metalness: 0.05, roughness: 0.88 }), lens)
  const rim = patchBodyMaterial(new THREE.MeshStandardMaterial({ color: '#b9bec5', metalness: 1, roughness: 0.22 }), lens)
  const rimDark = patchBodyMaterial(new THREE.MeshStandardMaterial({ color: '#1b1d21', metalness: 0.8, roughness: 0.4 }), lens)
  const ghostMat = createGhostMaterial(lens)
  const bodyMats = [paint, glass, trim, chrome, drl, tail, tire, rim, rimDark]

  // ── Кузов ───────────────────────────────────────────────────────────
  const bodyGeo = extrude(bodyShape(), 1.94, 0.15, q)
  const ghGeo = extrude(greenhouseShape(), 1.58, 0.13, q)
  exterior.add(mesh(bodyGeo, paint))
  exterior.add(mesh(ghGeo, glass))
  ghost.add(mesh(bodyGeo, ghostMat))
  ghost.add(mesh(ghGeo, ghostMat))

  // крыша-рейлинги, молдинги, зеркала
  for (const z of [-0.66, 0.66]) {
    exterior.add(mesh(box(1.3, 0.03, 0.045), chrome, [-0.9, 1.69, z]))
  }
  for (const z of [-0.8, 0.8]) {
    exterior.add(mesh(box(3.2, 0.018, 0.02), chrome, [-0.6, 1.075, z]))
    exterior.add(mesh(box(0.14, 0.08, 0.16), trim, [0.84, 1.12, z * 1.24]))
  }
  // пороги и накладки арок
  for (const z of [-0.975, 0.975]) {
    exterior.add(mesh(box(1.9, 0.09, 0.03), trim, [0, 0.34, z]))
    for (const x of [-WHEELBASE_HALF, WHEELBASE_HALF]) {
      const arch = mesh(new THREE.TorusGeometry(0.485, 0.03, 8, 40, Math.PI), trim, [x, 0.37, z])
      exterior.add(arch)
    }
    // линия дверей
    exterior.add(mesh(box(0.012, 0.62, 0.012), trim, [-0.25, 0.75, z]))
    exterior.add(mesh(box(0.012, 0.6, 0.012), trim, [0.95, 0.75, z * 0.995]))
    exterior.add(mesh(box(0.12, 0.022, 0.02), chrome, [0.55, 0.93, z]))
    exterior.add(mesh(box(0.12, 0.022, 0.02), chrome, [-0.65, 0.95, z]))
  }
  // перед: решётка, ходовые огни, фары
  exterior.add(mesh(box(0.06, 0.38, 1.14), trim, [2.445, 0.56, 0]))
  for (let i = 0; i < 6; i++) exterior.add(mesh(box(0.02, 0.012, 1.1), chrome, [2.48, 0.41 + i * 0.058, 0]))
  exterior.add(mesh(box(0.05, 0.022, 1.62), drl, [2.405, 0.845, 0]))
  for (const z of [-0.72, 0.72]) exterior.add(mesh(box(0.05, 0.08, 0.24), drl, [2.455, 0.66, z]))
  // зад: сплошная полоса фонарей
  exterior.add(mesh(box(0.05, 0.04, 1.7), tail, [-2.39, 0.99, 0]))
  exterior.add(mesh(box(0.04, 0.12, 1.2), trim, [-2.445, 0.45, 0]))
  for (const z of [-0.45, 0.45]) exterior.add(mesh(cyl(0.045, 0.06, 16), chrome, [-2.45, 0.36, z], [0, 0, Math.PI / 2]))

  // ── Колёса ──────────────────────────────────────────────────────────
  const seg = q === 'high' ? 48 : 24
  const tireGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.25, seg)
  const tireEdge = new THREE.TorusGeometry(WHEEL_R - 0.03, 0.035, 8, seg)
  const barrelGeo = cyl(0.265, 0.2, seg)
  const faceGeo = cyl(0.27, 0.012, seg)
  const spokeGeo = box(0.03, 0.23, 0.02)
  const capGeo = cyl(0.05, 0.03, 20)
  for (const x of [-WHEELBASE_HALF, WHEELBASE_HALF]) {
    for (const side of [1, -1]) {
      const w = new THREE.Group()
      w.position.set(x, WHEEL_R, side * TRACK_HALF)
      if (side < 0) w.rotation.y = Math.PI
      w.add(mesh(tireGeo, tire, [0, 0, 0], [Math.PI / 2, 0, 0]))
      w.add(mesh(tireEdge, tire, [0, 0, 0.11]))
      w.add(mesh(barrelGeo, rimDark, [0, 0, 0.02], [Math.PI / 2, 0, 0]))
      w.add(mesh(faceGeo, rimDark, [0, 0, 0.115], [Math.PI / 2, 0, 0]))
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        for (const d of [-0.035, 0.035]) {
          const sp = mesh(spokeGeo, rim, [Math.sin(a) * 0.13 + Math.cos(a) * d, Math.cos(a) * 0.13 - Math.sin(a) * d, 0.125], [0, 0, -a])
          w.add(sp)
        }
      }
      w.add(mesh(capGeo, rim, [0, 0, 0.13], [Math.PI / 2, 0, 0]))
      exterior.add(w)
      const gw = mesh(tireGeo, ghostMat, [x, WHEEL_R, side * TRACK_HALF], [Math.PI / 2, 0, 0])
      ghost.add(gw)
    }
  }

  // ── Внутренний макет ────────────────────────────────────────────────
  const parts = new Map<PartId, THREE.Group>()
  const partMats = new Map<PartId, THREE.MeshStandardMaterial[]>()
  const addPart = (id: PartId, build: (g: THREE.Group, m: Mats) => void) => {
    const g = part(id)
    const m = makeInternalMats()
    build(g, m)
    internals.add(g)
    parts.set(id, g)
    partMats.set(id, Object.values(m))
    return g
  }

  addPart('engine', (g, m) => {
    g.add(mesh(box(0.5, 0.36, 0.62), m.steel, [1.78, 0.56, 0]))
    g.add(mesh(box(0.42, 0.12, 0.6), m.alu, [1.76, 0.8, 0]))
    g.add(mesh(box(0.36, 0.05, 0.56), m.accent, [1.76, 0.875, 0]))
    for (let i = 0; i < 4; i++) g.add(mesh(cyl(0.035, 0.06, 12), m.dark, [1.76, 0.92, -0.21 + i * 0.14]))
    for (let i = 0; i < 4; i++) g.add(mesh(cyl(0.03, 0.3, 12), m.alu, [1.5, 0.76, -0.21 + i * 0.14], [0, 0, 0.9]))
    g.add(mesh(cyl(0.11, 0.06, 24), m.dark, [1.78, 0.52, 0.34], [Math.PI / 2, 0, 0]))
    g.add(mesh(cyl(0.07, 0.06, 20), m.dark, [1.95, 0.7, 0.34], [Math.PI / 2, 0, 0]))
    g.add(mesh(box(0.2, 0.2, 0.2), m.dark, [2.0, 0.72, -0.22]))
  })
  addPart('radiator', (g, m) => {
    g.add(mesh(box(0.05, 0.42, 1.2), m.alu, [2.3, 0.62, 0]))
    for (let i = 0; i < 10; i++) g.add(mesh(box(0.055, 0.008, 1.18), m.dark, [2.3, 0.44 + i * 0.04, 0]))
    g.add(mesh(cyl(0.18, 0.04, 28), m.dark, [2.24, 0.62, 0.3], [0, 0, Math.PI / 2]))
    g.add(mesh(cyl(0.18, 0.04, 28), m.dark, [2.24, 0.62, -0.3], [0, 0, Math.PI / 2]))
  })
  addPart('battery', (g, m) => {
    g.add(mesh(box(0.26, 0.2, 0.17), m.dark, [2.02, 0.72, 0.46]))
    g.add(mesh(cyl(0.018, 0.03, 10), m.accent, [2.08, 0.835, 0.42]))
    g.add(mesh(cyl(0.018, 0.03, 10), m.alu, [1.96, 0.835, 0.42]))
  })
  addPart('gearbox', (g, m) => {
    g.add(mesh(cyl(0.17, 0.36, 28), m.alu, [1.72, 0.5, -0.42], [Math.PI / 2, 0, 0]))
    g.add(mesh(box(0.3, 0.26, 0.28), m.alu, [1.5, 0.47, -0.2]))
    g.add(mesh(cyl(0.09, 0.14, 20), m.steel, [1.45, 0.4, 0.02], [Math.PI / 2, 0, 0]))
  })
  addPart('frontAxle', (g, m) => {
    g.add(mesh(cyl(0.022, 0.62, 12), m.steel, [1.45, 0.38, 0.33], [Math.PI / 2, 0, 0]))
    g.add(mesh(cyl(0.022, 0.58, 12), m.steel, [1.45, 0.38, -0.36], [Math.PI / 2, 0, 0]))
    for (const z of [0.66, 0.08, -0.07, -0.66]) g.add(mesh(new THREE.SphereGeometry(0.045, 16, 12), m.rubber, [1.45, 0.38, z]))
  })
  addPart('driveshaft', (g, m) => {
    g.add(mesh(cyl(0.035, 2.65, 16), m.steel, [-0.05, 0.36, 0.02], [0, 0, Math.PI / 2]))
    g.add(mesh(cyl(0.05, 0.06, 16), m.dark, [-0.05, 0.36, 0.02], [0, 0, Math.PI / 2]))
  })
  addPart('rearAxle', (g, m) => {
    g.add(mesh(new THREE.SphereGeometry(0.14, 24, 16), m.alu, [-1.45, 0.38, 0]))
    g.add(mesh(cyl(0.03, 1.5, 14), m.steel, [-1.45, 0.38, 0], [Math.PI / 2, 0, 0]))
    g.add(mesh(box(0.08, 0.06, 1.3), m.dark, [-1.35, 0.3, 0]))
  })
  addPart('rearSuspension', (g, m) => {
    for (const z of [0.6, -0.6]) {
      const sp = new THREE.TubeGeometry(new HelixCurve(0.07, 0.26, 5), q === 'high' ? 160 : 70, 0.011, 8)
      g.add(mesh(sp, m.accent, [-1.6, 0.42, z]))
      g.add(mesh(cyl(0.026, 0.4, 12), m.alu, [-1.3, 0.6, z], [0, 0, -0.15]))
      g.add(mesh(box(0.55, 0.04, 0.06), m.steel, [-1.45, 0.34, z * 0.9]))
    }
  })
  addPart('brakes', (g, m) => {
    for (const x of [-WHEELBASE_HALF, WHEELBASE_HALF]) {
      for (const side of [1, -1]) {
        const z = side * (TRACK_HALF - 0.02)
        g.add(mesh(cyl(0.19, 0.025, 36), m.steel, [x, WHEEL_R, z], [Math.PI / 2, 0, 0]))
        g.add(mesh(cyl(0.06, 0.08, 20), m.dark, [x, WHEEL_R, z], [Math.PI / 2, 0, 0]))
        g.add(mesh(box(0.14, 0.08, 0.07), m.accent, [x + 0.1, WHEEL_R + 0.12, z], [0, 0, -0.6]))
      }
    }
  })
  addPart('exhaust', (g, m) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.92, 0.5, 0.0), new THREE.Vector3(1.6, 0.32, 0.18), new THREE.Vector3(0.9, 0.27, 0.24),
      new THREE.Vector3(-0.6, 0.27, 0.28), new THREE.Vector3(-1.75, 0.3, 0.32), new THREE.Vector3(-2.44, 0.36, 0.45),
    ])
    g.add(mesh(new THREE.TubeGeometry(curve, q === 'high' ? 90 : 40, 0.03, 10), m.alu))
    g.add(mesh(cyl(0.11, 0.4, 24), m.steel, [0.3, 0.27, 0.25], [0, 0, Math.PI / 2]))
    g.add(mesh(box(0.42, 0.16, 0.36), m.steel, [-2.0, 0.33, 0.38]))
  })
  addPart('fuelTank', (g, m) => {
    g.add(mesh(box(0.6, 0.2, 0.9), m.dark, [-0.75, 0.38, -0.25]))
  })
  addPart('steering', (g, m) => {
    g.add(mesh(new THREE.TorusGeometry(0.17, 0.018, 10, 40), m.dark, [0.42, 1.04, -0.4], [0, Math.PI / 2, -0.35]))
    g.add(mesh(cyl(0.02, 0.6, 10), m.steel, [0.7, 0.86, -0.4], [0, 0, 0.95]))
    g.add(mesh(cyl(0.025, 1.1, 12), m.steel, [1.38, 0.5, 0], [Math.PI / 2, 0, 0]))
  })
  addPart('interior', (g, m) => {
    g.add(mesh(box(0.32, 0.18, 1.6), m.dark, [0.7, 0.95, 0]))
    g.add(mesh(box(0.06, 0.12, 0.5), m.accent, [0.55, 1.06, 0.15]))
    for (const z of [0.4, -0.4]) {
      g.add(mesh(box(0.52, 0.12, 0.5), m.rubber, [-0.05, 0.6, z]))
      g.add(mesh(box(0.1, 0.62, 0.48), m.rubber, [-0.33, 0.95, z], [0, 0, 0.15]))
      g.add(mesh(box(0.08, 0.14, 0.26), m.rubber, [-0.4, 1.33, z], [0, 0, 0.15]))
    }
    g.add(mesh(box(0.5, 0.12, 1.36), m.rubber, [-1.05, 0.62, 0]))
    g.add(mesh(box(0.1, 0.6, 1.36), m.rubber, [-1.33, 0.95, 0], [0, 0, 0.12]))
  })
  addPart('subframe', (g, m) => {
    for (const z of [0.5, -0.5]) g.add(mesh(box(4.4, 0.07, 0.08), m.dark, [0.05, 0.31, z]))
    g.add(mesh(box(0.08, 0.07, 1.0), m.dark, [2.2, 0.33, 0]))
    g.add(mesh(box(0.08, 0.07, 1.0), m.dark, [-2.2, 0.33, 0]))
  })

  // стойки: правая — часть подвески, левая (к камере) — сюжетная деталь
  const strutParts = addPart('strut', (g, m) => {
    const right = buildStrut(m, q)
    right.position.set(WHEELBASE_HALF, 0.42, -0.6)
    right.rotation.y = Math.PI
    g.add(right)
  })
  const strutMats = makeInternalMats()
  const strut = buildStrut(strutMats, q)
  strut.userData.partId = 'strut'
  strut.position.copy(STRUT_HOME)
  strutParts.add(strut)
  partMats.get('strut')!.push(...Object.values(strutMats))

  // сканер поверх левой стойки
  const scanMaterial = createScanMaterial()
  const strutScan: THREE.Mesh[] = []
  strut.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      const src = o as THREE.Mesh
      const s = new THREE.Mesh(src.geometry, scanMaterial)
      s.position.copy(src.position)
      s.rotation.copy(src.rotation)
      s.scale.setScalar(1.06)
      s.renderOrder = 5
      strutScan.push(s)
    }
  })
  strutScan.forEach((s) => strut.add(s))

  const dispose = () => {
    const geos = new Set<THREE.BufferGeometry>()
    const mats = new Set<THREE.Material>()
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        geos.add(m.geometry)
        ;(Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => mats.add(x))
      }
    })
    geos.forEach((g) => g.dispose())
    mats.forEach((m) => m.dispose())
    bodyMats.forEach((m) => m.dispose())
  }

  return { root, exterior, internals, ghost, strut, strutScan, scanMaterial, parts, partMats, dispose }
}

/** Подсветка узла (наведение в рентген-режиме). */
export function setPartGlow(rig: CarRig, id: PartId | null, amount: number) {
  rig.partMats.forEach((mats, pid) => {
    const on = pid === id ? amount : 0
    for (const m of mats) {
      m.emissive.set('#ff5a1f')
      m.emissiveIntensity = on * 0.32
    }
  })
}
