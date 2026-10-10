import { steps } from '../../config/site'
import { FlowPaths } from '../illustrations/FlowPaths'

const icons = [
  <path key="0" d="M8 6h16v20H8z M12 12h8 M12 16h8 M12 20h5" />,
  <g key="1"><circle cx="14" cy="14" r="7" /><path d="M19 19l7 7" /></g>,
  <g key="2"><path d="M6 10h20l-2 14H8z" /><path d="M11 10a5 5 0 0110 0" /></g>,
  <g key="3"><path d="M3 20h17V9H3z M20 13h5l3 4v3h-8" /><circle cx="8" cy="22" r="2.5" /><circle cx="23" cy="22" r="2.5" /></g>,
]

export function HowItWorks() {
  return (
    <section id="how" className="section how" aria-labelledby="how-title">
      <FlowPaths />
      <div className="container">
        <p className="kicker mono" data-reveal>Как это работает</p>
        <h2 id="how-title" className="h1" data-reveal>Четыре шага от заявки<br />до детали в России</h2>
        <ol className="how__track" data-reveal>
          <span className="how__line" aria-hidden><span className="how__line-fill" /></span>
          {steps.map((s, i) => (
            <li key={s.n} className="how__step" style={{ transitionDelay: `${200 + i * 160}ms` }}>
              <div className="how__node" aria-hidden>
                <svg viewBox="0 0 32 32">{icons[i]}</svg>
              </div>
              <span className="how__n mono">{s.n}</span>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
