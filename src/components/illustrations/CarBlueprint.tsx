/** Технический чертёж кроссовера (тот же профиль, что и у 3D-модели). Нужен для фолбэка без WebGL и карточки модели. */
const BODY =
  'M22.0 155.0 L19.4 154.7 L17.1 154.2 L14.9 153.5 L12.9 152.6 L11.1 151.4 L9.5 150.0 L8.1 148.4 L6.9 146.6 L5.9 144.5 L5.1 142.2 L4.4 139.7 L4.0 137.0 L3.0 115.0 L3.3 112.4 L3.7 110.0 L4.4 107.7 L5.3 105.7 L6.4 103.8 L7.7 102.0 L9.3 100.4 L11.0 99.0 L12.9 97.8 L15.1 96.7 L17.4 95.8 L20.0 95.0 L30.1 93.5 L40.3 92.1 L50.6 90.7 L61.1 89.3 L71.7 88.0 L82.5 86.8 L93.4 85.5 L104.4 84.3 L115.6 83.2 L126.9 82.1 L138.4 81.0 L150.0 80.0 L440.0 75.0 L446.8 74.8 L453.0 74.7 L458.8 74.9 L464.0 75.2 L468.7 75.8 L473.0 76.5 L476.8 77.4 L480.0 78.6 L482.8 79.9 L485.0 81.4 L486.8 83.1 L488.0 85.0 L494.0 105.0 L494.3 108.3 L494.5 111.6 L494.6 114.9 L494.7 118.1 L494.6 121.3 L494.5 124.5 L494.3 127.7 L494.0 130.8 L493.6 133.9 L493.2 136.9 L492.6 140.0 L492.0 143.0 L491.6 144.8 L491.0 146.4 L490.2 147.9 L489.2 149.2 L488.1 150.4 L486.8 151.5 L485.2 152.4 L483.6 153.2 L481.7 153.9 L479.6 154.4 L477.4 154.8 L475.0 155.0 L442.0 155.0 L442.0 148.0 L441.6 141.9 L440.4 135.8 L438.4 130.0 L435.7 124.5 L432.3 119.4 L428.2 114.8 L423.6 110.7 L418.5 107.3 L413.0 104.6 L407.2 102.6 L401.1 101.4 L395.0 101.0 L388.9 101.4 L382.8 102.6 L377.0 104.6 L371.5 107.3 L366.4 110.7 L361.8 114.8 L357.7 119.4 L354.3 124.5 L351.6 130.0 L349.6 135.8 L348.4 141.9 L348.0 148.0 L152.0 155.0 L152.0 148.0 L151.6 141.9 L150.4 135.8 L148.4 130.0 L145.7 124.5 L142.3 119.4 L138.2 114.8 L133.6 110.7 L128.5 107.3 L123.0 104.6 L117.2 102.6 L111.1 101.4 L105.0 101.0 L98.9 101.4 L92.8 102.6 L87.0 104.6 L81.5 107.3 L76.4 110.7 L71.8 114.8 L67.7 119.4 L64.3 124.5 L61.6 130.0 L59.6 135.8 L58.4 141.9 L58.0 148.0 L22.0 155.0 Z'
const GLASS =
  'M148.0 85.0 L157.8 78.5 L167.4 72.2 L176.6 66.3 L185.4 60.6 L194.0 55.1 L202.3 50.0 L210.2 45.1 L217.8 40.6 L225.1 36.3 L232.0 32.2 L238.7 28.5 L245.0 25.0 L247.6 23.9 L250.4 22.8 L253.4 21.9 L256.7 21.0 L260.1 20.2 L263.8 19.5 L267.6 18.9 L271.7 18.3 L275.9 17.9 L280.4 17.5 L285.1 17.2 L290.0 17.0 L405.0 20.0 L410.1 20.5 L415.0 21.2 L419.8 22.3 L424.4 23.7 L428.9 25.3 L433.3 27.3 L437.4 29.5 L441.4 32.0 L445.3 34.8 L449.0 37.9 L452.6 41.3 L456.0 45.0 L477.0 75.0'

export function CarBlueprint({ className, internals = true, highlight = true }: { className?: string; internals?: boolean; highlight?: boolean }) {
  return (
    <svg className={className} viewBox="-20 -10 540 210" role="img" aria-label="Схема кроссовера сбоку">
      <defs>
        <linearGradient id="bp-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3f46" />
          <stop offset="1" stopColor="#15171b" />
        </linearGradient>
      </defs>
      {/* сетка */}
      <g stroke="rgba(255,255,255,.05)" strokeWidth=".5">
        {Array.from({ length: 27 }, (_, i) => <line key={'v' + i} x1={-20 + i * 20} y1="-10" x2={-20 + i * 20} y2="200" />)}
        {Array.from({ length: 11 }, (_, i) => <line key={'h' + i} x1="-20" y1={-10 + i * 20} x2="520" y2={-10 + i * 20} />)}
      </g>
      <line x1="-20" y1="185" x2="520" y2="185" stroke="rgba(255,255,255,.25)" strokeWidth=".8" />
      <path d={BODY} fill="url(#bp-body)" stroke="rgba(255,255,255,.55)" strokeWidth="1" />
      <path d={GLASS} fill="#07090c" stroke="rgba(255,255,255,.4)" strokeWidth=".8" />
      <path d="M4 104 L18 103" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M489 86 L488 92" stroke="#ff2a2a" strokeWidth="3" />
      {internals && (
        <g fill="none" stroke="rgba(188,211,255,.55)" strokeWidth=".9" strokeDasharray="3 2">
          <rect x="47" y="82" width="50" height="40" rx="3" />
          <rect x="20" y="95" width="6" height="45" />
          <line x1="105" y1="148" x2="395" y2="148" />
          <rect x="300" y="138" width="60" height="18" />
          <path d="M60 140 Q90 158 200 158 L430 152 L493 150" />
          <rect x="230" y="105" width="40" height="45" rx="4" />
          <rect x="320" y="110" width="50" height="40" rx="4" />
        </g>
      )}
      {[105, 395].map((x) => (
        <g key={x}>
          <circle cx={x} cy="148" r="37" fill="#0c0d10" stroke="rgba(255,255,255,.5)" strokeWidth="1" />
          <circle cx={x} cy="148" r="26" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1" />
          <circle cx={x} cy="148" r="5" fill="rgba(255,255,255,.5)" />
        </g>
      ))}
      {highlight && (
        <g>
          <path d="M105 140 L105 96" stroke="#ff5a1f" strokeWidth="3" />
          <circle cx="105" cy="118" r="30" fill="none" stroke="#ff5a1f" strokeWidth="1" strokeDasharray="2 3" />
        </g>
      )}
      <g fill="rgba(255,255,255,.45)" fontFamily="JetBrains Mono, monospace" fontSize="8">
        <text x="105" y="200" textAnchor="middle">AXLE F</text>
        <text x="395" y="200" textAnchor="middle">AXLE R</text>
        <text x="250" y="200" textAnchor="middle">DEMO MODEL · SIDE VIEW</text>
      </g>
    </svg>
  )
}
