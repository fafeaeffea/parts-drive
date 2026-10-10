import { useId, useState } from 'react'
import { brand, contacts, LEAD_DELIVERY, legalLinks, partCategories } from '../../config/site'
import { carText, useLead, validateLead, type LeadData } from '../../lib/lead'

/** Текст заявки для отправки в Telegram вручную (режим без бота). */
function composeMessage(d: LeadData) {
  const cat = partCategories.find((c) => c.id === d.category)?.title
  return [
    `Здравствуйте! Заявка с сайта ${brand.fullName}`,
    `Имя: ${d.name.trim()}`,
    `Автомобиль: ${carText(d)}`,
    `Нужна деталь: ${d.part.trim()}`,
    cat && `Категория: ${cat}`,
    d.vin.trim() && `VIN: ${d.vin.trim()}`,
    d.contact.trim() && `Контакт: ${d.contact.trim()}`,
  ].filter(Boolean).join('\n')
}

const linkMode = LEAD_DELIVERY === 'telegram-link' && !!contacts.telegram

/** Простая заявка: четыре поля на одном экране. */
export function LeadForm({ onDone }: { onDone?: () => void }) {
  const { data, update, submit, submitState, reset, honeypot } = useLead()
  const [error, setError] = useState<{ field: string; message: string } | null>(null)
  const [ready, setReady] = useState<{ text: string; url: string; copied: boolean } | null>(null)
  const uid = useId()
  const cat = partCategories.find((c) => c.id === data.category)

  const set = (patch: Partial<LeadData>) => { update(patch); if (error) setError(null) }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateLead(data, !linkMode)
    if (err) {
      setError(err)
      document.getElementById(`${uid}-${err.field}`)?.focus()
      return
    }
    if (!linkMode) return submit()
    const text = composeMessage(data)
    const url = `https://t.me/${contacts.telegram}?text=${encodeURIComponent(text)}`
    let copied = false
    try { await navigator.clipboard.writeText(text); copied = true } catch { /* буфер недоступен — текст есть в ссылке и на экране */ }
    window.open(url, '_blank', 'noopener')
    setReady({ text, url, copied })
  }

  const done = (title: string, body: React.ReactNode, extra?: React.ReactNode) => (
    <div className="wiz-done" role="status">
      <div className="wiz-done__mark" aria-hidden>
        <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" /><path d="M19 33l9 9 18-20" /></svg>
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      {extra}
      <div className="wiz-nav">
        <button type="button" className="btn btn--ghost" onClick={() => { reset(); setReady(null); onDone?.() }}>Новая заявка</button>
      </div>
    </div>
  )

  if (ready) {
    return done('Осталось нажать «Отправить»', <>Откроется чат с <b>@{contacts.telegram}</b> в Telegram, текст заявки уже вставлен. Нажмите «Отправить», и мы ответим в Telegram.</>, (
      <>
        <a className="btn btn--primary btn--lg" href={ready.url} target="_blank" rel="noopener">Открыть Telegram<Arrow /></a>
        <pre className="lead-text">{ready.text}</pre>
        <p className="muted small">
          {ready.copied ? 'Текст заявки также скопирован — если он не вставился сам, вставьте его в чат.' : 'Если текст не вставился сам, скопируйте его отсюда.'}
        </p>
      </>
    ))
  }
  if (submitState.status === 'sent') {
    return done(submitState.queued ? 'Заявка принята и сохранена' : 'Заявка отправлена',
      submitState.queued ? 'Telegram сейчас отвечает с задержкой — заявка сохранена и будет передана нам автоматически.' : 'Мы получили заявку и скоро свяжемся с вами.')
  }

  const sending = submitState.status === 'sending'
  const err = (f: string) => (error?.field === f ? { 'aria-invalid': true, 'aria-describedby': `${uid}-err` } : {})

  return (
    <form className="lead-form" onSubmit={onSubmit} noValidate>
      <div className="hp" aria-hidden>
        <label>Сайт<input tabIndex={-1} autoComplete="off" name="website" onChange={(e) => (honeypot.current = e.target.value)} /></label>
      </div>
      {cat && (
        <p className="lead-form__tag mono">
          Категория: {cat.title}
          <button type="button" aria-label="Убрать категорию" onClick={() => set({ category: '' })}>×</button>
        </p>
      )}
      <div className="field-row">
        <label className="field">
          <span>Имя</span>
          <input id={`${uid}-name`} autoComplete="name" value={data.name} maxLength={60} placeholder="Как к вам обращаться" {...err('name')}
            onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="field">
          <span>Автомобиль</span>
          <input id={`${uid}-car`} value={carText(data)} maxLength={80} placeholder="Например, Changan UNI-K 2022" {...err('car')}
            onChange={(e) => set({ car: e.target.value })} />
        </label>
      </div>
      <label className="field">
        <span>Какая деталь нужна</span>
        <textarea id={`${uid}-part`} rows={3} maxLength={600} value={data.part} {...err('part')}
          placeholder="Название детали или описание проблемы: «стучит спереди справа на неровностях»"
          onChange={(e) => set({ part: e.target.value })} />
      </label>
      <label className="field">
        <span>Телефон или Telegram{linkMode && <small> — необязательно</small>}</span>
        <input id={`${uid}-contact`} autoComplete="tel" value={data.contact} maxLength={64} placeholder="+7 … или @username" {...err('contact')}
          onChange={(e) => set({ contact: e.target.value })} />
      </label>
      <label className="check">
        <input id={`${uid}-consent`} type="checkbox" checked={data.consent} onChange={(e) => set({ consent: e.target.checked })} />
        <span>
          Согласен на <a href={legalLinks.personalData} target="_blank" rel="noopener">обработку персональных данных</a> и
          принимаю <a href={legalLinks.privacy} target="_blank" rel="noopener">политику конфиденциальности</a>
        </span>
      </label>
      <p id={`${uid}-err`} className="wiz-error" role="alert" aria-live="assertive">
        {error?.message ?? (submitState.status === 'error' ? submitState.message : '')}
      </p>
      <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={sending} aria-busy={sending}>
        {sending ? 'Отправляем…' : linkMode ? 'Отправить заявку в Telegram' : 'Отправить заявку'}
        {!sending && <Arrow />}
      </button>
      {linkMode && <p className="muted small lead-form__note">Откроется чат с @{contacts.telegram} с готовым текстом заявки — останется нажать «Отправить».</p>}
    </form>
  )
}

export function Arrow() {
  return (
    <svg className="btn__arrow" viewBox="0 0 20 20" aria-hidden>
      <path d="M3 10h13M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
