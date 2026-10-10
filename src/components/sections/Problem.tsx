import { problem } from '../../config/site'

function Visual({ id }: { id: string }) {
  if (id === 'stock') {
    return (
      <svg viewBox="0 0 240 150" className="pv" aria-hidden>
        {Array.from({ length: 3 }, (_, r) => Array.from({ length: 5 }, (_, c) => {
          const empty = r === 1 && c === 2
          return (
            <g key={`${r}${c}`} className={empty ? 'pv-empty' : 'pv-slot'}>
              <rect x={14 + c * 44} y={12 + r * 44} width="36" height="36" rx="3" />
              {!empty && <rect x={22 + c * 44} y={24 + r * 44} width="20" height="16" rx="2" className="pv-box" />}
            </g>
          )
        }))}
        <text x="120" y="78" textAnchor="middle" className="pv-code">0 шт.</text>
      </svg>
    )
  }
  if (id === 'price') {
    return (
      <svg viewBox="0 0 240 150" className="pv" aria-hidden>
        <line x1="20" y1="130" x2="220" y2="130" className="pv-axis" />
        {[0.42, 0.7, 0.55, 0.9, 0.62].map((h, i) => (
          <rect key={i} x={30 + i * 38} y={130 - h * 110} width="22" height={h * 110} rx="2" className={i === 3 ? 'pv-bar pv-bar--hi' : 'pv-bar'} />
        ))}
        <path d="M30 70 L68 40 L106 58 L144 18 L182 50" className="pv-trend" />
        <text x="155" y="12" className="pv-code">₽ ?</text>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 240 150" className="pv" aria-hidden>
      <circle cx="120" cy="75" r="62" className="pv-ring" />
      <circle cx="120" cy="75" r="40" className="pv-ring" />
      <circle cx="120" cy="75" r="18" className="pv-ring" />
      <line x1="58" y1="75" x2="182" y2="75" className="pv-ring" />
      <line x1="120" y1="13" x2="120" y2="137" className="pv-ring" />
      <g className="pv-sweep"><path d="M120 75 L120 13 A62 62 0 0 1 172 42 Z" /></g>
      <circle cx="158" cy="52" r="4" className="pv-target" />
      <circle cx="158" cy="52" r="10" className="pv-target-ring" />
    </svg>
  )
}

export function Problem() {
  return (
    <section className="section problem" aria-labelledby="problem-title">
      <div className="container">
        <p className="kicker mono" data-reveal>Проблема</p>
        <h2 id="problem-title" className="h1" data-reveal>{problem.title}</h2>
        <div className="problem__grid">
          {problem.cards.map((c, i) => (
            <article key={c.id} className={`pcard pcard--${c.id}`} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
              <header className="pcard__head mono"><span>{c.code}</span><span className="pcard__led" /></header>
              <Visual id={c.id} />
              <h3>{c.title}</h3>
              <p className="muted">{c.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
