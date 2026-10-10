// Минимальная загрузка .env без зависимостей (для своего сервера и локальной разработки).
import { readFileSync } from 'node:fs'
try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
} catch { /* .env нет — используем переменные окружения */ }
