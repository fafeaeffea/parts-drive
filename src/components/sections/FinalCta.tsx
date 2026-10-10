import { finalCta } from '../../config/site'
import { useLead } from '../../lib/lead'
import { CarBlueprint } from '../illustrations/CarBlueprint'
import { PartIcon } from '../illustrations/PartIcons'
import { Arrow } from '../forms/LeadForm'

export function FinalCta() {
  const { openLead } = useLead()
  return (
    <section className="section final" aria-labelledby="final-title">
      <div className="container">
        <div className="final__card" data-reveal>
          <div className="final__visual" aria-hidden>
            <CarBlueprint className="final__car" />
            <PartIcon id="suspension" className="final__part" />
          </div>
          <div className="final__text">
            <h2 id="final-title" className="display display--md">{finalCta.title}</h2>
            <p className="lead">{finalCta.subtitle}</p>
            <button className="btn btn--primary btn--lg" onClick={() => openLead()}>{finalCta.cta}<Arrow /></button>
          </div>
        </div>
      </div>
    </section>
  )
}
