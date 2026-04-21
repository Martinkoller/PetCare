import fs from 'fs'
import path from 'path'
import { NotificationLog } from '@/types/whatsapp-types'

const dataDir = path.resolve(process.cwd(), 'src/data')
const logsFile = path.join(dataDir, 'whatsapp-logs.json')

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

function ensureLogsFile() {
  ensureDataDir()
  if (!fs.existsSync(logsFile)) {
    fs.writeFileSync(logsFile, JSON.stringify([], null, 2), 'utf-8')
  }
}

export const whatsappLogService = {
  getLogs(): NotificationLog[] {
    ensureLogsFile()

    try {
      const raw = fs.readFileSync(logsFile, 'utf-8')
      const logs = JSON.parse(raw) as NotificationLog[]

      return logs
        .sort(
          (a, b) =>
            new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
        )
        .slice(0, 200)
    } catch {
      return []
    }
  },

  addLog(log: NotificationLog) {
    ensureLogsFile()

    const current = this.getLogs()
    const updated = [log, ...current].slice(0, 500)

    fs.writeFileSync(logsFile, JSON.stringify(updated, null, 2), 'utf-8')
  },
}