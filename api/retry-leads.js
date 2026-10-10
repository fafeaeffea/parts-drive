// Vercel Cron: досылка заявок, которые не ушли в Telegram с первого раза.
import { retryPending } from '../server/lib/lead.mjs'

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ ok: false })
  const result = await retryPending()
  return res.status(200).json({ ok: true, ...result })
}
