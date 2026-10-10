// Локальная разработка: Vite + API заявок на одном порту.
import './env.mjs'
import http from 'node:http'
import { createServer } from 'vite'
import { apiMiddleware } from './lib/http.mjs'

const port = Number(process.env.PORT || 5173)
const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' })
http.createServer(async (req, res) => {
  if (await apiMiddleware(req, res)) return
  vite.middlewares(req, res)
}).listen(port, () => console.log(`PARTS//DRIVE dev: http://localhost:${port}`))
