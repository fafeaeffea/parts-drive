/**
 * Общее изменяемое состояние сюжета прокрутки: читается и в 3D-сцене (useFrame),
 * и в DOM-оверлеях (requestAnimationFrame) без лишних React-рендеров.
 */
export const story = {
  /** Целевой прогресс прокрутки сюжета 0…1. */
  target: 0,
  /** Сглаженный прогресс, которым живёт сцена. */
  p: 0,
  pointer: { x: 0, y: 0, inside: false, lastMove: 0 },
  /** Экранная позиция детали (CSS px относительно холста) — для подписей. */
  part: { x: 0, y: 0, visible: false },
  /** Экранная позиция её «гнезда» на машине. */
  mount: { x: 0, y: 0 },
}

export const SCENES = [
  { id: 'hero', label: 'Автомобиль', at: 0 },
  { id: 'diagnosis', label: 'Диагностика', at: 0.24 },
  { id: 'exploded', label: 'Деталь', at: 0.47 },
  { id: 'delivery', label: 'Доставка', at: 0.68 },
  { id: 'final', label: 'Замена', at: 0.95 },
] as const
