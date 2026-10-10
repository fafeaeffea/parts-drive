import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { LEAD_ENDPOINT, type PartCategoryId } from '../config/site'

export type LeadData = {
  /** Автомобиль одной строкой (марка, модель, год) */
  car: string
  brand: string
  model: string
  year: string
  category: PartCategoryId | ''
  part: string
  vin: string
  comment: string
  name: string
  contact: string
  consent: boolean
}

export const emptyLead: LeadData = {
  car: '', brand: '', model: '', year: '', category: '', part: '', vin: '', comment: '', name: '', contact: '', consent: false,
}

export type SubmitState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent'; queued: boolean; id: string }
  | { status: 'error'; message: string }

type Ctx = {
  data: LeadData
  step: number
  setStep: (n: number) => void
  update: (patch: Partial<LeadData>) => void
  reset: () => void
  modalOpen: boolean
  openLead: (prefill?: Partial<LeadData>, step?: number) => void
  closeLead: () => void
  submit: () => Promise<void>
  submitState: SubmitState
  /** время начала заполнения — для серверной антиспам-проверки */
  startedAt: React.RefObject<number>
  honeypot: React.RefObject<string>
}

const LeadCtx = createContext<Ctx | null>(null)
const KEY = 'pd-lead-draft-v1'

function loadDraft(): { data: LeadData; step: number } {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) {
      const j = JSON.parse(raw)
      return { data: { ...emptyLead, ...j.data }, step: Math.min(5, Math.max(0, Number(j.step) || 0)) }
    }
  } catch { /* хранилище недоступно — работаем без черновика */ }
  return { data: emptyLead, step: 0 }
}

export function LeadProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(loadDraft, [])
  const [data, setData] = useState<LeadData>(initial.data)
  const [step, setStep] = useState(initial.step)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })
  const startedAt = useRef(Date.now())
  const honeypot = useRef('')
  const sending = useRef(false)

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify({ data, step })) } catch { /* noop */ }
  }, [data, step])

  const update = useCallback((patch: Partial<LeadData>) => {
    setData((d) => ({ ...d, ...patch }))
    setSubmitState((s) => (s.status === 'error' ? { status: 'idle' } : s))
  }, [])

  const reset = useCallback(() => {
    setData(emptyLead)
    setStep(0)
    setSubmitState({ status: 'idle' })
    startedAt.current = Date.now()
  }, [])

  const openLead = useCallback((prefill?: Partial<LeadData>, toStep?: number) => {
    setSubmitState((s) => (s.status === 'sent' ? { status: 'idle' } : s))
    if (prefill) {
      setData((d) => {
        const sentBefore = submitState.status === 'sent'
        return { ...(sentBefore ? emptyLead : d), ...prefill }
      })
    }
    if (toStep !== undefined) setStep(toStep)
    setModalOpen(true)
  }, [submitState.status])

  const closeLead = useCallback(() => setModalOpen(false), [])

  const submit = useCallback(async () => {
    if (sending.current) return
    sending.current = true
    setSubmitState({ status: 'sending' })
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 20000)
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, brand: carText(data), model: '', year: '', website: honeypot.current, startedAt: startedAt.current, page: location.href.slice(0, 300) }),
        signal: ctrl.signal,
      })
      let body: { ok?: boolean; queued?: boolean; id?: string; error?: string } = {}
      try { body = await res.json() } catch { /* не JSON — значит, сервер не наш */ }
      if (res.ok && body.ok) {
        setSubmitState({ status: 'sent', queued: !!body.queued, id: body.id ?? '' })
        try { sessionStorage.removeItem(KEY) } catch { /* noop */ }
      } else {
        setSubmitState({
          status: 'error',
          message: body.error || (res.status === 404
            ? 'Сервер заявок не подключён на этом адресе. Ваши данные сохранены в форме — попробуйте позже или свяжитесь с нами напрямую.'
            : 'Не удалось отправить заявку. Ваши данные сохранены в форме — попробуйте ещё раз.'),
        })
      }
    } catch (e) {
      setSubmitState({
        status: 'error',
        message: (e as Error).name === 'AbortError'
          ? 'Сервер долго не отвечает. Данные сохранены в форме — попробуйте отправить ещё раз.'
          : 'Нет соединения с сервером. Данные сохранены в форме — проверьте интернет и попробуйте ещё раз.',
      })
    } finally {
      clearTimeout(timer)
      sending.current = false
    }
  }, [data])

  const value = useMemo<Ctx>(() => ({
    data, step, setStep, update, reset, modalOpen, openLead, closeLead, submit, submitState, startedAt, honeypot,
  }), [data, step, update, reset, modalOpen, openLead, closeLead, submit, submitState])

  return <LeadCtx.Provider value={value}>{children}</LeadCtx.Provider>
}

export function useLead() {
  const c = useContext(LeadCtx)
  if (!c) throw new Error('useLead outside LeadProvider')
  return c
}

// ── Клиентская валидация (повторяет серверную) ───────────────────────────
export function normalizeContact(raw: string) {
  return raw.trim()
}
export function contactKind(raw: string): 'phone' | 'telegram' | null {
  const v = raw.trim()
  const tg = v.replace(/^(https?:\/\/)?(t\.me|telegram\.me)\//i, '').replace(/^@/, '')
  if (/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(tg) && !/^\d/.test(v.replace(/^@/, ''))) return 'telegram'
  const digits = v.replace(/[^\d]/g, '')
  if (/^[+\d\s()-]+$/.test(v) && digits.length >= 10 && digits.length <= 15) return 'phone'
  return null
}

/** Автомобиль одной строкой: то, что ввёл клиент, или собранное из выбора на сайте. */
export const carText = (d: LeadData) => d.car.trim() || [d.brand, d.model, d.year].filter(Boolean).join(' ')

export function validateLead(d: LeadData, contactRequired: boolean): { field: string; message: string } | null {
  if (d.name.trim().length < 2) return { field: 'name', message: 'Как к вам обращаться?' }
  if (carText(d).length < 2) return { field: 'car', message: 'Укажите марку и модель автомобиля' }
  if (d.part.trim().length < 3) return { field: 'part', message: 'Напишите, какая деталь нужна, или опишите проблему' }
  if ((contactRequired || d.contact.trim()) && !contactKind(d.contact)) return { field: 'contact', message: 'Укажите телефон (+7 …) или Telegram (@username)' }
  if (!d.consent) return { field: 'consent', message: 'Нужно согласие на обработку персональных данных' }
  return null
}
