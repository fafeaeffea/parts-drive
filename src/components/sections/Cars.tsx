import { useState } from 'react'
import { carBrands, featuredModel, partCategories } from '../../config/site'
import { useLead } from '../../lib/lead'
import { CarBlueprint } from '../illustrations/CarBlueprint'
import { Arrow } from '../forms/LeadForm'

const YEARS = Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() - i))

export function Cars() {
  const { openLead } = useLead()
  const [open, setOpen] = useState(true)
  const [year, setYear] = useState('')
  const [vin, setVin] = useState('')
  const [cats, setCats] = useState<string[]>([])

  return (
    <section id="cars" className="section cars" aria-labelledby="cars-title">
      <div className="container">
        <p className="kicker mono" data-reveal>Для каких автомобилей</p>
        <h2 id="cars-title" className="h1" data-reveal>Китайские марки —<br />в первую очередь</h2>

        <ul className="brands" data-reveal>
          {carBrands.map((b) => (
            <li key={b.id}>
              <button className={`brand ${b.id === 'other' ? 'brand--other' : ''}`}
                onClick={() => openLead(b.id === 'other' ? { brand: '' } : { brand: b.name, model: '' }, b.id === 'other' ? 0 : 1)}>
                <span className="brand__name">{b.id === 'other' ? 'Другие китайские автомобили' : b.name}</span>
                <span className="brand__meta mono">{b.models.length ? b.models.filter((m) => m !== 'Другая модель').slice(0, 3).join(' · ') : 'по запросу'}</span>
              </button>
            </li>
          ))}
        </ul>

        <article className={`model ${open ? 'is-open' : ''}`} data-reveal>
          <button className="model__toggle" aria-expanded={open} aria-controls="model-uni-k" onClick={() => setOpen((o) => !o)}>
            <span className="mono kicker">Модель в фокусе</span>
            <span className="model__title">{featuredModel.title}</span>
            <span className="model__plus" aria-hidden />
          </button>
          <div id="model-uni-k" className="model__body" hidden={!open}>
            <div className="model__visual">
              <CarBlueprint className="model__bp" internals={false} highlight={false} />
              <span className="model__note mono">Схема демонстрационная, не чертёж производителя</span>
            </div>
            <form className="model__form" onSubmit={(e) => {
              e.preventDefault()
              const firstCat = partCategories.find((c) => c.id === cats[0])
              openLead({ brand: featuredModel.brand, model: featuredModel.model, year, vin, category: firstCat?.id ?? '' }, 3)
            }}>
              <p className="muted">{featuredModel.description}</p>
              <fieldset>
                <legend className="mono small-cap">Что нужно</legend>
                <div className="chips">
                  {featuredModel.categories.map((id) => {
                    const c = partCategories.find((x) => x.id === id)!
                    const on = cats.includes(id)
                    return (
                      <button type="button" key={id} className="chip" aria-pressed={on}
                        onClick={() => setCats((s) => (on ? s.filter((x) => x !== id) : [id, ...s]))}>{c.title}</button>
                    )
                  })}
                </div>
              </fieldset>
              <div className="field-row">
                <label className="field">
                  <span>Год выпуска</span>
                  <select value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="">Не важно / не помню</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>VIN <small>— необязательно</small></span>
                  <input className="mono" value={vin} maxLength={17} placeholder="17 символов"
                    onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17))} />
                </label>
              </div>
              <button className="btn btn--primary btn--block" type="submit">{featuredModel.cta}<Arrow /></button>
            </form>
          </div>
        </article>
      </div>
    </section>
  )
}
