import fs from 'fs'
import path from 'path'
import { WhatsAppConnection } from '@/types/whatsapp-types'

const dataDir = path.resolve(process.cwd(), 'src/data')
const configFile = path.join(dataDir, 'whatsapp-config.json')

const defaultConfig: WhatsAppConnection = {
  enabled: false,
  phone: '',
  apiUrl: '',
  apiKey: '',
  instance: 'petcare',
  status: 'DISCONNECTED',
  qrCode: '',
  pairedNumber: '',
  pairedName: '',
  lastConnectionAt: '',
  errorMessage: '',
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

function ensureConfigFile() {
  ensureDataDir()
  if (!fs.existsSync(configFile)) {
    fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2), 'utf-8')
  }
}

export const whatsappConfigService = {
  getConfig(): WhatsAppConnection {
    ensureConfigFile()

    try {
      const raw = fs.readFileSync(configFile, 'utf-8')
      const parsed = JSON.parse(raw)

      return {
        ...defaultConfig,
        ...parsed,
      }
    } catch {
      return defaultConfig
    }
  },

  saveConfig(config: Partial<WhatsAppConnection>): WhatsAppConnection {
    ensureConfigFile()

    const current = this.getConfig()
    const updated: WhatsAppConnection = {
      ...current,
      ...config,
    }

    fs.writeFileSync(configFile, JSON.stringify(updated, null, 2), 'utf-8')
    return updated
  },

  resetSessionFields(): WhatsAppConnection {
    return this.saveConfig({
      status: 'DISCONNECTED',
      qrCode: '',
      pairedNumber: '',
      pairedName: '',
      lastConnectionAt: '',
      errorMessage: '',
    })
  },
}