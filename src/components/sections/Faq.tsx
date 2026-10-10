import { faq } from '../../config/site'

export function Faq() {
  return (
    <section id="faq" className="section faq" aria-labelledby="faq-title">
      <div className="container faq__grid">
        <div>
          <p className="kicker mono" data-reveal>FAQ</p>
          <h2 id="faq-title" className="h1" data-reveal>Честные ответы</h2>
          <p className="muted" data-reveal>Если условие зависит от конкретной детали и поставщика, мы так и говорим — и согласовываем его до заказа.</p>
        </div>
        <div className="faq__list" data-reveal>
          {faq.map((f, i) => (
            <details key={f.q} className="faq__item" name="faq">
              <summary>
                <span className="mono faq__n">{String(i + 1).padStart(2, '0')}</span>
                <span className="faq__q">{f.q}</span>
                <span className="faq__icon" aria-hidden />
              </summary>
              <div className="faq__a"><p>{f.a}</p></div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
