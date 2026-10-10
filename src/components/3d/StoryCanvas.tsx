import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { StoryScene } from './StoryScene'
import type { Quality } from './carFactory'

export default function StoryCanvas({ quality, reducedMotion, mobile, active, onReady }: {
  quality: Quality; reducedMotion: boolean; mobile: boolean; active: boolean; onReady?: () => void
}) {
  return (
    <Canvas
      className="story__canvas"
      frameloop={active ? 'always' : 'never'}
      dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
      gl={{ antialias: quality === 'high', powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: mobile ? 40 : 30, near: 0.1, far: 60, position: [5.6, 1.75, 6.6] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        onReady?.()
      }}
      aria-hidden
    >
      <StoryScene quality={quality} reducedMotion={reducedMotion} mobile={mobile} />
    </Canvas>
  )
}
