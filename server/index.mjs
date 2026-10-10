// Продакшен-сервер для VPS: отдаёт собранный сайт (dist/) и принимает заявки.
// Запуск: npm run build && npm start
import './env.mjs'
import http from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { apiMiddleware } from './lib/http.mjs'
import { retryPending } from './lib/lead.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const port = Number(process.env.PORT || 3000)
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
}

http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  try {
    if (await apiMiddleware(req, res)) return
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    let file = path.join(root, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ''))
    if (!file.startsWith(root)) { res.statusCode = 403; return res.end() }
    let s = await stat(file).catch(() => null)
    if (s?.isDirectory()) { file = path.join(file, 'index.html'); s = await stat(file).catch(() => null) }
    if (!s) { file = path.join(root, 'index.html'); s = await stat(file) }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream')
    if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    createReadStream(file).pipe(res)
  } catch (e) {
    console.error('[server]', e.message)
    res.statusCode = 500
    res.end('Internal error')
  }
}).listen(port, () => console.log(`PARTS//DRIVE: http://localhost:${port}`))

// досылка заявок, не ушедших в Telegram с первого раза
setInterval(() => retryPending().catch((e) => console.error('[retry]', e.message)), 5 * 60 * 1000)
