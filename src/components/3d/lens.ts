import * as THREE from 'three'

/**
 * «Рентген-линза»: круг в экранных координатах, внутри которого кузов
 * становится прозрачным и виден внутренний макет автомобиля.
 * Один объект uniforms разделяется всеми материалами сцены.
 */
export type LensUniforms = {
  uLensPos: { value: THREE.Vector2 } // в пикселях буфера, начало — снизу слева
  uLensRadius: { value: number } // в пикселях буфера
  uLensColor: { value: THREE.Color }
}

export const ACCENT = new THREE.Color('#ff5a1f')

export function createLensUniforms(): LensUniforms {
  return {
    uLensPos: { value: new THREE.Vector2(-9999, -9999) },
    uLensRadius: { value: 0 },
    uLensColor: { value: ACCENT.clone() },
  }
}

const LENS_DECL = /* glsl */ `
uniform vec2 uLensPos;
uniform float uLensRadius;
uniform vec3 uLensColor;
`

/** Кузов: вырезается внутри линзы, по краю линзы — тонкое световое кольцо. */
export function patchBodyMaterial<T extends THREE.Material>(mat: T, lens: LensUniforms): T {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, lens)
    shader.fragmentShader = LENS_DECL + shader.fragmentShader
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
         float lensD = distance(gl_FragCoord.xy, uLensPos);
         if (uLensRadius > 0.5 && lensD < uLensRadius) discard;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         if (uLensRadius > 0.5) {
           float ring = 1.0 - smoothstep(0.0, 5.0, lensD - uLensRadius);
           gl_FragColor.rgb = mix(gl_FragColor.rgb, uLensColor * 1.6, ring * 0.85);
         }`,
      )
  }
  mat.customProgramCacheKey = () => 'lens-body'
  return mat
}

/** Призрачная оболочка кузова: видна только внутри линзы, френелевский контур. */
export function createGhostMaterial(lens: LensUniforms, color = '#bcd3ff'): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...lens, uGhost: { value: new THREE.Color(color) } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${LENS_DECL}
      uniform vec3 uGhost;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float d = distance(gl_FragCoord.xy, uLensPos);
        if (uLensRadius < 0.5 || d > uLensRadius) discard;
        float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        float edge = smoothstep(uLensRadius * 0.55, uLensRadius, d);
        gl_FragColor = vec4(uGhost * (0.05 + fres * 0.55) * (1.0 - edge * 0.6), 1.0);
      }`,
  })
}

/** Лёгкая техническая сетка-сканер для подсветки детали. */
export function createScanMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStrength: { value: 0 }, uColor: { value: ACCENT.clone() } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec3 vP;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vP = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uStrength;
      uniform vec3 uColor;
      varying vec3 vP;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.6);
        float band = smoothstep(0.06, 0.0, abs(fract(vP.y * 1.4 - uTime * 0.6) - 0.5));
        float a = (fres * 0.7 + band * 0.6) * uStrength;
        gl_FragColor = vec4(uColor * a, a);
      }`,
  })
}
