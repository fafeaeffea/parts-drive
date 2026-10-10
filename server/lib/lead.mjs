// @ts-check
/**
 * Приём заявок: валидация → антиспам → отправка в Telegram → резервное хранение.
 * Общий код для Vercel Functions (api/*.js) и собственного Node-сервера (server/index.mjs).
 *
 * Переменные окружения: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
 * UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, LEADS_DIR.
 * Токен никогда не логируется и не возвращается клиенту.
 */
import { z } from 'zod'
import { createHash, randomBytes } from 'node:crypto'
import { appendFile, mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import path from 'node:path'

const env = (k) => (process.env[k] || '').trim()

// ── Схема ───────────────────────────────────────────────────────────────
const text = (max) => z.string().trim().max(max)
const CATEGORY = {
  body: 'Кузовные детали', optics: 'Оптика', engine: 'Детали двигателя', suspension: 'Подвеска',
  gearbox: 'Коробка передач', cooling: 'Радиаторы и охлаждение', electronics: 'Электроника',
  interior: 'Салон', consumables: 'Расходники',
}

export const LeadSchema = z.object({
  brand: text(80).min(2, 'Укажите автомобиль'),
  model: text(60).default(''),
  year: z.string().trim().regex(/^(|19[8-9]\d|20[0-3]\d)$/, 'Год — четыре цифры').default(''),
  category: z.enum(/** @type {[string, ...string[]]} */ (['', ...Object.keys(CATEGORY)])).default(''),
  part: text(600).min(3, 'Опишите, какая деталь нужна'),
  vin: z.string().trim().toUpperCase().regex(/^([A-HJ-NPR-Z0-9]{17})?$/, 'VIN — 17 символов').default(''),
  comment: text(1000).default(''),
  name: text(60).min(2, 'Укажите имя'),
  contact: text(64).min(5, 'Укажите телефон или Telegram'),
  consent: z.literal(true, { message: 'Нужно согласие на обработку персональных данных' }),
  website: z.string().max(200).optional(), // ловушка для ботов
  startedAt: z.number().optional(),
  page: z.string().max(300).optional(),
})

/** @param {string} raw */
export function parseContact(raw) {
  const v = raw.trim()
  const tg = v.replace(/^(https?:\/\/)?(t\.me|telegram\.me)\//i, '').replace(/^@/, '')
  if (/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(tg)) return { kind: 'telegram', value: tg }
  const digits = v.replace(/\D/g, '')
  if (/^[+\d\s()-]+$/.test(v) && digits.length >= 10 && digits.length <= 15) {
    const norm = digits.length === 11 && digits.startsWith('8') ? '7' + digits.slice(1) : digits.length === 10 ? '7' + digits : digits
    return { kind: 'phone', value: '+' + norm }
  }
  return null
}

/** @param {string} s */
export const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ── Антиспам ────────────────────────────────────────────────────────────
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 5
const memRate = new Map()
const memDedupe = new Map()

/** @param {string} ip */
async function rateLimited(ip) {
  const key = createHash('sha256').update('rl:' + ip).digest('hex').slice(0, 24)
  if (upstashOn()) {
    try {
      const r = await upstash([['INCR', `pd:rl:${key}`], ['EXPIRE', `pd:rl:${key}`, String(RATE_WINDOW_MS / 1000), 'NX']])
      return Number(r?.[0]?.result) > RATE_MAX
    } catch { /* при сбое Redis — локальный лимит */ }
  }
  const now = Date.now()
  const rec = memRate.get(key)
  if (!rec || now - rec.t > RATE_WINDOW_MS) { memRate.set(key, { t: now, n: 1 }); return false }
  rec.n++
  if (memRate.size > 5000) memRate.clear()
  return rec.n > RATE_MAX
}

// ── Telegram ────────────────────────────────────────────────────────────
/**
 * @param {z.infer<typeof LeadSchema>} d
 * @param {{ id: string, receivedAt: string }} meta
 */
export function buildTelegramMessage(d, meta) {
  const c = parseContact(d.contact)
  const when = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(meta.receivedAt))
  const row = (label, value) => `<b>${label}:</b> ${value ? escapeHtml(value) : '—'}`
  const lines = [
    '🔧 <b>Новая заявка на подбор запчасти</b>',
    '',
    row('Имя клиента', d.name),
    row('Контакт', c?.kind === 'telegram' ? '@' + c.value : c?.value ?? d.contact),
    '',
    row('Автомобиль', [d.brand, d.model, d.year].filter(Boolean).join(' ')),
    row('Нужная деталь', d.part),
    row('Категория', d.category ? CATEGORY[d.category] : ''),
    row('VIN', d.vin),
    row('Комментарий', d.comment),
    '',
    row('Источник заявки', 'сайт'),
    row('Получена', `${when} (МСК)`),
    row('Номер', meta.id),
  ]
  /** @type {{ text: string, url: string }[]} */
  const buttons = []
  if (c?.kind === 'telegram') buttons.push({ text: `Написать @${c.value}`, url: `https://t.me/${c.value}` })
  if (c?.kind === 'phone') {
    buttons.push({ text: 'Открыть чат по номеру', url: `https://t.me/${c.value}` })
    buttons.push({ text: 'WhatsApp', url: `https://wa.me/${c.value.slice(1)}` })
  }
  return { text: lines.join('\n').slice(0, 4000), buttons }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Отправка с тайм-аутом и повторами. Возвращает true только при подтверждении от Telegram.
 * @param {{ text: string, buttons: { text: string, url: string }[] }} msg
 */
export async function sendTelegram(msg, { attempts = 3, timeoutMs = 8000 } = {}) {
  const token = env('TELEGRAM_BOT_TOKEN')
  const chatId = env('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return { ok: false, reason: 'not_configured' }
  const body = {
    chat_id: chatId,
    text: msg.text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(msg.buttons.length ? { reply_markup: { inline_keyboard: [msg.buttons] } } : {}),
  }
  let reason = 'unknown'
  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const base = env('TELEGRAM_API_BASE') || 'https://api.telegram.org' // переопределение — только для тестов
      const res = await fetch(`${base}/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal,
      })
      const j = /** @type {any} */ (await res.json().catch(() => ({})))
      if (res.ok && j.ok) return { ok: true }
      reason = `http_${res.status}`
      // 400/401/403 — ошибка настройки (неверный токен/чат), повтор не поможет
      if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
        // если кнопки не приняты — пробуем без них
        if (res.status === 400 && body.reply_markup) { delete body.reply_markup; continue }
        break
      }
      const retryAfter = Number(j?.parameters?.retry_after) || 0
      await sleep(retryAfter ? Math.min(retryAfter, 5) * 1000 : 600 * 2 ** i)
    } catch (e) {
      reason = /** @type {Error} */ (e).name === 'AbortError' ? 'timeout' : 'network'
      await sleep(600 * 2 ** i)
    } finally {
      clearTimeout(t)
    }
  }
  return { ok: false, reason }
}

// ── Хранилище недоставленных заявок ─────────────────────────────────────
const upstashOn = () => !!(env('UPSTASH_REDIS_REST_URL') && env('UPSTASH_REDIS_REST_TOKEN'))

/** @param {string[][]} commands */
async function upstash(commands) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 5000)
  try {
    const res = await fetch(env('UPSTASH_REDIS_REST_URL').replace(/\/$/, '') + '/pipeline', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env('UPSTASH_REDIS_REST_TOKEN')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error('upstash_' + res.status)
    return /** @type {any[]} */ (await res.json())
  } finally {
    clearTimeout(t)
  }
}

const leadsDir = () => path.resolve(env('LEADS_DIR') || './.data/leads')
const fileStoreOn = () => !process.env.VERCEL || !!env('LEADS_DIR') // на Vercel диск не постоянный

/** Сохраняет заявку для повторной отправки. true — если сохранение подтверждено. */
async function storePending(record) {
  const line = JSON.stringify(record)
  if (upstashOn()) {
    try {
      await upstash([['RPUSH', 'pd:leads:pending', line]])
      return true
    } catch (e) {
      console.error('[lead] upstash store failed', /** @type {Error} */ (e).message)
    }
  }
  if (fileStoreOn()) {
    try {
      await mkdir(leadsDir(), { recursive: true })
      await appendFile(path.join(leadsDir(), 'pending.jsonl'), line + '\n', { encoding: 'utf8', mode: 0o600 })
      return true
    } catch (e) {
      console.error('[lead] file store failed', /** @type {Error} */ (e).message)
    }
  }
  return false
}

/** Досылает сохранённые заявки. Вызывается по крону / таймеру. */
export async function retryPending() {
  let sent = 0
  let left = 0
  if (upstashOn()) {
    const r = await upstash([['LRANGE', 'pd:leads:pending', '0', '49']])
    const items = /** @type {string[]} */ (r?.[0]?.result || [])
    for (const raw of items) {
      const rec = JSON.parse(raw)
      const res = await sendTelegram(rec.message, { attempts: 1 })
      if (res.ok) { await upstash([['LREM', 'pd:leads:pending', '1', raw]]); sent++ } else left++
    }
  }
  if (fileStoreOn()) {
    const file = path.join(leadsDir(), 'pending.jsonl')
    let content = ''
    try { content = await readFile(file, 'utf8') } catch { /* файла нет — нечего досылать */ }
    const lines = content.split('\n').filter(Boolean)
    if (lines.length) {
      const keep = []
      for (const raw of lines) {
        const rec = JSON.parse(raw)
        const res = await sendTelegram(rec.message, { attempts: 1 })
        if (res.ok) sent++
        else keep.push(raw)
      }
      const tmp = file + '.tmp'
      await writeFile(tmp, keep.map((l) => l + '\n').join(''), { mode: 0o600 })
      await rename(tmp, file)
      left += keep.length
    }
  }
  if (sent || left) console.info(`[lead] retry: sent=${sent} pending=${left}`)
  return { sent, pending: left }
}

// ── Основной обработчик ─────────────────────────────────────────────────
/**
 * @param {unknown} body
 * @param {{ ip: string }} ctx
 * @returns {Promise<{ status: number, json: Record<string, unknown> }>}
 */
export async function handleLead(body, ctx) {
  if (!body || typeof body !== 'object') return { status: 400, json: { ok: false, error: 'Некорректный запрос' } }
  if (JSON.stringify(body).length > 8000) return { status: 413, json: { ok: false, error: 'Слишком длинная заявка' } }

  const blank = { brand: '', model: '', year: '', category: '', part: '', vin: '', comment: '', name: '', contact: '' }
  const parsed = LeadSchema.safeParse({ ...blank, ...body })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { status: 422, json: { ok: false, error: first?.message || 'Проверьте поля формы', field: first?.path?.[0] } }
  }
  const d = parsed.data
  const contact = parseContact(d.contact)
  if (!contact) return { status: 422, json: { ok: false, error: 'Укажите телефон (+7 …) или Telegram (@username)', field: 'contact' } }

  // ботам отвечаем «успехом», но ничего не отправляем
  const tooFast = typeof d.startedAt === 'number' && Date.now() - d.startedAt < 3000
  if (d.website || tooFast) {
    console.info('[lead] spam rejected', d.website ? 'honeypot' : 'too_fast')
    return { status: 200, json: { ok: true, id: 'PD-' + randomBytes(3).toString('hex').toUpperCase() } }
  }

  if (await rateLimited(ctx.ip)) {
    return { status: 429, json: { ok: false, error: 'Слишком много заявок подряд. Подождите несколько минут и попробуйте снова.' } }
  }

  // защита от двойной отправки одной и той же заявки
  const fp = createHash('sha256').update([contact.value, d.brand, d.model, d.part].join('|').toLowerCase()).digest('hex')
  const prev = memDedupe.get(fp)
  if (prev && Date.now() - prev.t < RATE_WINDOW_MS) return { status: 200, json: { ok: true, id: prev.id, duplicate: true } }

  const receivedAt = new Date().toISOString()
  const id = 'PD-' + receivedAt.slice(2, 10).replace(/-/g, '') + '-' + randomBytes(2).toString('hex').toUpperCase()
  const message = buildTelegramMessage(d, { id, receivedAt })
  const sent = await sendTelegram(message)

  if (sent.ok) {
    memDedupe.set(fp, { t: Date.now(), id })
    if (memDedupe.size > 5000) memDedupe.clear()
    console.info(`[lead] ${id} delivered`)
    return { status: 200, json: { ok: true, id } }
  }

  if (sent.reason === 'not_configured') console.error('[lead] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы — заявки не доходят до Telegram!')
  console.warn(`[lead] ${id} telegram failed: ${sent.reason}`)
  const stored = await storePending({ id, receivedAt, message })
  if (stored) {
    memDedupe.set(fp, { t: Date.now(), id })
    console.info(`[lead] ${id} stored for retry`)
    return { status: 202, json: { ok: true, queued: true, id } }
  }
  return {
    status: 503,
    json: { ok: false, error: 'Не удалось отправить заявку: сервис временно недоступен. Ваши данные сохранены в форме — попробуйте ещё раз через несколько минут.' },
  }
}

/** @param {string | string[] | undefined} xff @param {string | undefined} remote */
export function clientIp(xff, remote) {
  const v = Array.isArray(xff) ? xff[0] : xff
  return (v ? v.split(',')[0].trim() : remote) || 'unknown'
}
