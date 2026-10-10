/** Узлы внутреннего макета — без зависимости от three.js (импортируется в основном бандле). */
export type PartId =
  | 'engine' | 'radiator' | 'gearbox' | 'frontAxle' | 'rearAxle' | 'driveshaft'
  | 'strut' | 'rearSuspension' | 'brakes' | 'exhaust' | 'fuelTank' | 'battery'
  | 'steering' | 'interior' | 'subframe'

export const PART_LABELS: Record<PartId, string> = {
  engine: 'Двигатель',
  radiator: 'Радиатор охлаждения',
  gearbox: 'Коробка передач',
  frontAxle: 'Передние приводы',
  rearAxle: 'Задний мост',
  driveshaft: 'Карданный вал',
  strut: 'Передняя стойка амортизатора',
  rearSuspension: 'Задняя подвеска',
  brakes: 'Тормозные механизмы',
  exhaust: 'Выпускная система',
  fuelTank: 'Топливный бак',
  battery: 'Аккумулятор',
  steering: 'Рулевое управление',
  interior: 'Салон и сиденья',
  subframe: 'Подрамник и лонжероны',
}

export const PART_CATEGORY: Partial<Record<PartId, string>> = {
  engine: 'engine', radiator: 'cooling', gearbox: 'gearbox', frontAxle: 'gearbox', rearAxle: 'gearbox',
  driveshaft: 'gearbox', strut: 'suspension', rearSuspension: 'suspension', brakes: 'consumables',
  exhaust: 'engine', fuelTank: 'engine', battery: 'electronics', steering: 'suspension', interior: 'interior', subframe: 'body',
}

