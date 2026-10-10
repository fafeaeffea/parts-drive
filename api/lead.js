// Vercel Function: POST /api/lead
import { clientIp, handleLead } from '../server/lib/lead.mjs'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = null }
  }
  const { status, json } = await handleLead(body, { ip: clientIp(req.headers['x-forwarded-for'], req.socket?.remoteAddress) })
  return res.status(status).json(json)
}
