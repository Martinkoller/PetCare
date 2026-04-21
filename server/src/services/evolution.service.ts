import axios from 'axios'
import { whatsappConfigService } from '@/services/whatsapp-config.service'
import { SendWhatsAppPayload, WhatsAppConnection } from '@/types/whatsapp-types'

function buildHeaders(apiKey: string) {
  return {
    apikey: apiKey,
    'Content-Type': 'application/json',
  }
}

async function fetchQrCodeWithRetry(
  baseURL: string,
  instance: string,
  headers: Record<string, string>,
  attempts = 3,
  delayMs = 1500,
): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await axios.get(`${baseURL}/instance/connect/${instance}`, { headers })
      const code =
        res?.data?.base64 ||
        res?.data?.qrcode?.base64 ||
        res?.data?.qrcode ||
        res?.data?.code ||
        ''
      if (code) return code
    } catch {
      // ignora e tenta novamente
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs))
  }
  return ''
}

function normalizeQrCode(qrCode?: string) {
  if (!qrCode) return ''

  if (qrCode.startsWith('data:image')) {
    return qrCode
  }

  return `data:image/png;base64,${qrCode}`
}

export const evolutionService = {
  async createOrConnectInstance(config: WhatsAppConnection): Promise<WhatsAppConnection> {
    const baseURL = config.apiUrl.replace(/\/$/, '')
    const headers = buildHeaders(config.apiKey)

    try {
      // 1) tenta criar a instância (se já existir, pode falhar e seguimos)
      try {
        await axios.post(
          `${baseURL}/instance/create`,
          {
            instanceName: config.instance,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          },
          { headers },
        )
      } catch {
        // ignora erro se já existir
      }

      // 2) consulta conexão / QR
      const status = await this.getInstanceStatus(config)

      return status
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Erro ao iniciar instância na Evolution API'

      return whatsappConfigService.saveConfig({
        status: 'ERROR',
        errorMessage: message,
      })
    }
  },

  async getInstanceStatus(config: WhatsAppConnection): Promise<WhatsAppConnection> {
    const baseURL = config.apiUrl.replace(/\/$/, '')
    const headers = buildHeaders(config.apiKey)

    try {
      // Alguns ambientes usam /instance/connectionState/{instance}
      const stateResponse = await axios.get(
        `${baseURL}/instance/connectionState/${config.instance}`,
        { headers },
      )

      const state =
        stateResponse?.data?.instance?.state ||
        stateResponse?.data?.state ||
        stateResponse?.data?.status ||
        ''

      const normalizedState = String(state).toLowerCase()

      // Conectado
      if (
        normalizedState.includes('open') ||
        normalizedState.includes('connected')
      ) {
        // tenta buscar info da instância
        let pairedNumber = ''
        let pairedName = ''

        try {
          const fetchResponse = await axios.get(
            `${baseURL}/instance/fetchInstances`,
            { headers },
          )

          const instances = Array.isArray(fetchResponse.data)
            ? fetchResponse.data
            : fetchResponse.data?.instance || fetchResponse.data?.instances || []

          const found = Array.isArray(instances)
            ? instances.find(
                (item: any) =>
                  item?.name === config.instance ||
                  item?.instance?.instanceName === config.instance ||
                  item?.instanceName === config.instance,
              )
            : null

          pairedNumber =
            found?.ownerJid?.replace('@s.whatsapp.net', '') ||
            found?.instance?.ownerJid?.replace('@s.whatsapp.net', '') ||
            ''

          pairedName =
            found?.profileName ||
            found?.instance?.profileName ||
            config.instance
        } catch {
          // não quebra se não conseguir buscar detalhes
        }

        return whatsappConfigService.saveConfig({
          status: 'CONNECTED',
          qrCode: '',
          pairedNumber,
          pairedName,
          lastConnectionAt: new Date().toISOString(),
          errorMessage: '',
          enabled: true,
        })
      }

      // Não conectado -> tenta buscar QR Code com retry
      const qrCode = await fetchQrCodeWithRetry(baseURL, config.instance, headers)

      if (qrCode) {
        return whatsappConfigService.saveConfig({
          status: 'QRCODE',
          qrCode: normalizeQrCode(qrCode),
          errorMessage: '',
        })
      }

      return whatsappConfigService.saveConfig({
        status: 'CONNECTING',
        errorMessage: '',
      })
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Erro ao consultar status da instância'

      return whatsappConfigService.saveConfig({
        status: 'ERROR',
        errorMessage: message,
      })
    }
  },

  async disconnectInstance(config: WhatsAppConnection): Promise<WhatsAppConnection> {
    const baseURL = config.apiUrl.replace(/\/$/, '')
    const headers = buildHeaders(config.apiKey)

    try {
      try {
        await axios.delete(`${baseURL}/instance/logout/${config.instance}`, {
          headers,
        })
      } catch {
        // fallback para ambientes diferentes
        try {
          await axios.delete(`${baseURL}/instance/delete/${config.instance}`, {
            headers,
          })
        } catch {
          // se falhar, ainda assim limpamos localmente
        }
      }

      return whatsappConfigService.saveConfig({
        status: 'DISCONNECTED',
        qrCode: '',
        pairedNumber: '',
        pairedName: '',
        lastConnectionAt: '',
        errorMessage: '',
        enabled: false,
      })
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Erro ao desconectar instância'

      return whatsappConfigService.saveConfig({
        status: 'ERROR',
        errorMessage: message,
      })
    }
  },

  async sendMessage(payload: SendWhatsAppPayload) {
    const config = whatsappConfigService.getConfig()

    if (!config.apiUrl || !config.apiKey || !config.instance) {
      throw new Error('Configuração do WhatsApp incompleta')
    }

    if (config.status !== 'CONNECTED') {
      throw new Error('WhatsApp não está conectado')
    }

    if (!payload.phone) {
      throw new Error('Telefone não informado')
    }

    const baseURL = config.apiUrl.replace(/\/$/, '')
    const headers = buildHeaders(config.apiKey)

    let number = payload.phone.replace(/\D/g, '')
    // garante código do país (55 = Brasil)
    if (number.length === 10 || number.length === 11) {
      number = `55${number}`
    }

    console.log('[sendMessage] number:', number, 'instance:', config.instance, 'url:', baseURL)
    try {
      const response = await axios.post(
        `${baseURL}/message/sendText/${config.instance}`,
        {
          number,
          textMessage: { text: payload.message },
        },
        { headers },
      )
      return response.data
    } catch (err: any) {
      console.log('[sendMessage ERROR]', JSON.stringify(err?.response?.data))
      const msg = err?.response?.data?.response?.message
      const notOnWhatsApp =
        Array.isArray(msg) && msg.some((m: any) => m?.exists === false)
      if (notOnWhatsApp) {
        throw new Error(`Número ${number} não encontrado no WhatsApp`)
      }
      throw err
    }
  },
}