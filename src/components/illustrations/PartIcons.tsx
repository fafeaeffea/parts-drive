import type { PartCategoryId } from '../../config/site'

/** Технические линейные иллюстрации категорий (векторные, без внешних файлов). */
const A = 'var(--accent)'

const art: Record<PartCategoryId, React.ReactNode> = {
  body: (
    <>
      <path d="M40 110 L40 52 Q42 34 64 30 L120 26 Q150 26 160 50 L166 110 Z" />
      <path d="M52 62 Q56 40 76 38 L118 36 Q140 36 148 56 L150 66 Z" className="fill-dim" />
      <path d="M118 80 h22" stroke={A} strokeWidth="3" strokeLinecap="round" />
      <path d="M40 92 L166 92" className="thin" />
      <path d="M30 118 h150" className="thin" />
    </>
  ),
  optics: (
    <>
      <path d="M28 82 Q40 48 100 44 L172 46 Q180 60 168 84 Q120 100 44 98 Z" />
      <circle cx="120" cy="70" r="13" />
      <circle cx="148" cy="68" r="10" />
      <circle cx="120" cy="70" r="5" className="fill-dim" />
      <path d="M44 86 Q96 92 162 80" stroke={A} strokeWidth="3" strokeLinecap="round" />
      <path d="M8 70 h14 M6 58 h12 M8 82 h12" className="thin" />
    </>
  ),
  engine: (
    <>
      <rect x="46" y="54" width="104" height="54" rx="4" />
      <rect x="54" y="34" width="88" height="20" rx="3" stroke={A} />
      {[66, 86, 106, 126].map((x) => <circle key={x} cx={x} cy="44" r="5" />)}
      <circle cx="160" cy="92" r="14" />
      <circle cx="160" cy="92" r="5" />
      <path d="M150 70 L172 82" className="thin" />
      <path d="M60 108 v12 M136 108 v12 M50 120 h96" className="thin" />
    </>
  ),
  suspension: (
    <>
      <rect x="92" y="18" width="16" height="96" rx="4" />
      <path d="M80 30 h40 M80 102 h40" />
      <path d="M78 38 Q100 30 122 38 Q100 46 78 46 Q100 54 122 54 Q100 62 78 62 Q100 70 122 70 Q100 78 78 78 Q100 86 122 86 Q100 94 78 94" stroke={A} />
      <path d="M100 114 v10 M84 124 h32" />
      <path d="M40 124 h120" className="thin" />
    </>
  ),
  gearbox: (
    <>
      <circle cx="78" cy="72" r="34" />
      <circle cx="78" cy="72" r="10" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <path key={i} d={`M${78 + Math.cos(a) * 34} ${72 + Math.sin(a) * 34} L${78 + Math.cos(a) * 41} ${72 + Math.sin(a) * 41}`} strokeWidth="5" />
      })}
      <circle cx="136" cy="90" r="22" stroke={A} />
      <circle cx="136" cy="90" r="6" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.2
        return <path key={i} d={`M${136 + Math.cos(a) * 22} ${90 + Math.sin(a) * 22} L${136 + Math.cos(a) * 28} ${90 + Math.sin(a) * 28}`} strokeWidth="5" stroke={A} />
      })}
    </>
  ),
  cooling: (
    <>
      <rect x="30" y="32" width="140" height="76" rx="3" />
      {Array.from({ length: 13 }, (_, i) => <path key={i} d={`M${40 + i * 10} 38 v64`} className="thin" />)}
      <circle cx="100" cy="70" r="26" stroke={A} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return <path key={i} d={`M100 70 Q${100 + Math.cos(a + 0.6) * 18} ${70 + Math.sin(a + 0.6) * 18} ${100 + Math.cos(a) * 24} ${70 + Math.sin(a) * 24}`} stroke={A} />
      })}
      <path d="M170 50 h14 v40 h-14" className="thin" />
    </>
  ),
  electronics: (
    <>
      <rect x="58" y="38" width="84" height="64" rx="4" />
      <rect x="78" y="56" width="44" height="28" rx="2" stroke={A} />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={'t' + i} d={`M${66 + i * 14} 38 v-12 M${66 + i * 14} 102 v12`} />)}
      <path d="M142 60 h22 v-20 h14 M142 80 h30 v26 M58 70 h-30 v-24" className="thin" />
      <circle cx="178" cy="40" r="3" /><circle cx="172" cy="108" r="3" /><circle cx="28" cy="44" r="3" />
    </>
  ),
  interior: (
    <>
      <path d="M58 112 L58 92 Q58 84 68 84 L112 84 Q120 84 120 92 L120 112" />
      <path d="M62 84 L48 30 Q46 22 54 22 L64 22 Q70 22 72 30 L82 84" />
      <rect x="48" y="8" width="26" height="14" rx="5" />
      <circle cx="150" cy="56" r="26" stroke={A} />
      <circle cx="150" cy="56" r="8" />
      <path d="M124 56 h18 M158 56 h18 M150 64 v18" />
      <path d="M30 120 h150" className="thin" />
    </>
  ),
  consumables: (
    <>
      <circle cx="80" cy="72" r="42" />
      <circle cx="80" cy="72" r="16" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return <circle key={i} cx={80 + Math.cos(a) * 9} cy={72 + Math.sin(a) * 9} r="2" />
      })}
      <path d="M108 40 Q126 50 128 72 Q126 94 108 104" stroke={A} strokeWidth="8" strokeLinecap="round" />
      <rect x="146" y="40" width="30" height="62" rx="6" />
      <path d="M146 54 h30 M146 88 h30" className="thin" />
    </>
  ),
}

export function PartIcon({ id, className }: { id: PartCategoryId; className?: string }) {
  return (
    <svg className={`part-art ${className ?? ''}`} viewBox="0 0 200 140" aria-hidden>
      <g className="part-art__grid">
        {Array.from({ length: 11 }, (_, i) => <line key={i} x1={i * 20} y1="0" x2={i * 20} y2="140" />)}
        {Array.from({ length: 8 }, (_, i) => <line key={'h' + i} x1="0" y1={i * 20} x2="200" y2={i * 20} />)}
      </g>
      <g className="part-art__lines">{art[id]}</g>
    </svg>
  )
}
