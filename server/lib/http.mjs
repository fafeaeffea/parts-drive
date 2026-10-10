// @ts-check
import { clientIp, handleLead } from './lead.mjs'

/** @param {import('node:http').IncomingMessage} req */
function readJson(req, limit = 16 * 1024) {
  return new Promise((resolve) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > limit) { resolve(null); req.destroy() } else chunks.push(c)
    })
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) } catch { resolve(null) }
    })
    req.on('error', () => resolve(null))
  })
}

/** Обрабатывает POST /api/lead. Возвращает true, если запрос обработан. */
export async function apiMiddleware(req, res) {
  const url = (req.url || '').split('?')[0]
  if (!url.endsWith('/api/lead')) return false
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
    return true
  }
  const body = await readJson(req)
  const { status, json } = await handleLead(body, { ip: clientIp(req.headers['x-forwarded-for'], req.socket.remoteAddress) })
  res.statusCode = status
  res.end(JSON.stringify(json))
  return true
}
