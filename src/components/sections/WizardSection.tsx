import { wizard } from '../../config/site'
import { LeadForm } from '../forms/LeadForm'
import { useLead } from '../../lib/lead'

export function WizardSection() {
  const { modalOpen } = useLead()
  return (
    <section id="request" className="section wizard-section" aria-labelledby="wizard-title">
      <div className="container wizard-section__grid">
        <div className="wizard-section__intro">
          <p className="kicker mono" data-reveal>{wizard.kicker}</p>
          <h2 id="wizard-title" className="h1" data-reveal>{wizard.title}</h2>
          <p className="muted" data-reveal>{wizard.subtitle}</p>
          <ul className="wizard-section__notes mono" data-reveal>
            <li>Название детали можно не знать</li>
            <li>Цена и условия — до заказа</li>
          </ul>
        </div>
        <div className="panel wizard-section__panel" data-reveal>
          {/* одна форма на странице за раз: в модальном окне — те же данные */}
          {modalOpen ? <p className="muted wizard-section__busy">Заявка открыта в окне.</p> : <LeadForm />}
        </div>
      </div>
    </section>
  )
}
