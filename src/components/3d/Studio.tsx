import { useMemo } from 'react'
import * as THREE from 'three'
import { Environment, Grid, Lightformer } from '@react-three/drei'
import type { Quality } from './carFactory'

/** Тёмная студия: окружение из световых панелей (без внешних HDR-файлов), пол, тени. */
/** Мягкая тень под машиной: радиальный градиент вместо дорогих теневых карт. */
function useShadowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256; c.height = 128
    const g = c.getContext('2d')!
    const grd = g.createRadialGradient(128, 64, 8, 128, 64, 128)
    grd.addColorStop(0, 'rgba(0,0,0,0.92)')
    grd.addColorStop(0.45, 'rgba(0,0,0,0.7)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 256, 128)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
}

export function Studio({ quality, grid = true }: { quality: Quality; grid?: boolean }) {
  const shadow = useShadowTexture()
  return (
    <>
      <color attach="background" args={['#07080a']} />
      <fog attach="fog" args={['#07080a', 10, 26]} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <directionalLight position={[-6, 3, -4]} intensity={0.8} color="#9db8ff" />
      <Environment resolution={quality === 'high' ? 256 : 128} frames={1}>
        <color attach="background" args={['#050506']} />
        <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 3, 1]} />
        <Lightformer form="rect" intensity={2} position={[0, 2.5, 7]} scale={[14, 0.5, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[0, 1.2, 7]} scale={[14, 0.15, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[-8, 2, 0]} rotation-y={Math.PI / 2} scale={[10, 1, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[8, 2.5, -2]} rotation-y={-Math.PI / 2} scale={[8, 0.6, 1]} color="#ffd2b8" />
      </Environment>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.001}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0a0b0d" metalness={0.4} roughness={0.55} />
      </mesh>
      {grid && (
        <Grid
          position={[0, 0.002, 0]}
          args={[30, 30]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#1a1d22"
          sectionSize={2.5}
          sectionThickness={1}
          sectionColor="#2b3038"
          fadeDistance={16}
          fadeStrength={1.6}
          infiniteGrid
        />
      )}
      <mesh rotation-x={-Math.PI / 2} position-y={0.004} renderOrder={-1}>
        <planeGeometry args={[6.4, 3.0]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
    </>
  )
}
