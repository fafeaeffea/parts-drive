export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smooth = (t: number) => t * t * (3 - 2 * t)
/** 0→1 на отрезке [a, b] с плавным входом и выходом. */
export const range = (p: number, a: number, b: number) => smooth(clamp((p - a) / (b - a)))
/** Окно видимости: появляется на [a, b], исчезает на [c, d]. */
export const window4 = (p: number, a: number, b: number, c: number, d: number) =>
  Math.min(range(p, a, b), 1 - range(p, c, d))

type Key<T extends number[]> = [number, T]
/** Интерполяция по ключевым кадрам с плавными переходами. */
export function sampleKeys<T extends number[]>(keys: Key<T>[], p: number, out: number[]) {
  if (p <= keys[0][0]) return copy(keys[0][1], out)
  for (let i = 0; i < keys.length - 1; i++) {
    const [p0, v0] = keys[i]
    const [p1, v1] = keys[i + 1]
    if (p <= p1) {
      const t = smooth(clamp((p - p0) / (p1 - p0)))
      for (let j = 0; j < v0.length; j++) out[j] = lerp(v0[j], v1[j], t)
      return out
    }
  }
  return copy(keys[keys.length - 1][1], out)
}
function copy(v: number[], out: number[]) {
  for (let j = 0; j < v.length; j++) out[j] = v[j]
  return out
}
