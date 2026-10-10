import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { AnatomyScene, type AnatomyInput } from './AnatomyScene'
import type { PartId, Quality } from './carFactory'

export default function AnatomyCanvas({ quality, reducedMotion, input, onHover, onPick, active }: {
  quality: Quality
  reducedMotion: boolean
  input: React.RefObject<AnatomyInput>
  onHover: (id: PartId | null, x: number, y: number) => void
  onPick: (id: PartId | null) => void
  active: boolean
}) {
  return (
    <Canvas
      className="anatomy__canvas"
      frameloop={active ? 'always' : 'never'}
      dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
      gl={{ antialias: quality === 'high', powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 24, near: 0.1, far: 80, position: [0, 1.4, 14] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
      aria-hidden
    >
      <AnatomyScene quality={quality} reducedMotion={reducedMotion} input={input} onHover={onHover} onPick={onPick} />
    </Canvas>
  )
}
