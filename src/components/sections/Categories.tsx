import { partCategories } from '../../config/site'
import { useLead } from '../../lib/lead'
import { PartIcon } from '../illustrations/PartIcons'

export function Categories() {
  const { openLead } = useLead()
  return (
    <section id="parts" className="section cats" aria-labelledby="parts-title">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="kicker mono" data-reveal>Какие запчасти</p>
            <h2 id="parts-title" className="h1" data-reveal>Подбираем детали<br />по всем узлам</h2>
          </div>
          <p className="muted" data-reveal>Выберите категорию — откроется заявка, где она уже указана. Если не уверены, к какой категории относится деталь, просто опишите задачу.</p>
        </div>
        <ul className="cats__grid">
          {partCategories.map((c, i) => (
            <li key={c.id} data-reveal style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
              <button className="cat" onClick={() => openLead({ category: c.id }, 0)} aria-label={`${c.title}: оставить заявку`}>
                <span className="cat__n mono">{String(i + 1).padStart(2, '0')}</span>
                <PartIcon id={c.id} className="cat__art" />
                <span className="cat__body">
                  <span className="cat__title">{c.title}</span>
                  <span className="cat__text">{c.text}</span>
                </span>
                <span className="cat__go" aria-hidden>
                  <svg viewBox="0 0 20 20"><path d="M5 15L15 5M7 5h8v8" /></svg>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
