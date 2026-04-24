import React, { useState } from 'react'
import { useConfigStore } from '@/stores/ConfigStore'

export default function WhatsAppConnectionPanel() {
  const {
    whatsappConnection,
    setWhatsappConnection,
    saveWhatsappConnection,
    startWhatsappSession,
    refreshWhatsappStatus,
    disconnectWhatsappSession,
  } = useConfigStore()

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await saveWhatsappConnection(whatsappConnection)
    setSaving(false)
  }

  const getStatusLabel = () => {
    switch (whatsappConnection.status) {
      case 'CONNECTED':
        return 'Conectado'
      case 'QRCODE':
        return 'Aguardando leitura do QR Code'
      case 'CONNECTING':
        return 'Conectando...'
      case 'ERROR':
        return 'Erro na conexão'
      default:
        return 'Desconectado'
    }
  }

  const getStatusColor = () => {
    switch (whatsappConnection.status) {
      case 'CONNECTED':
        return 'bg-green-100 text-green-700'
      case 'QRCODE':
        return 'bg-yellow-100 text-yellow-700'
      case 'CONNECTING':
        return 'bg-blue-100 text-blue-700'
      case 'ERROR':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">Integração com WhatsApp</h2>
        <p className="text-sm text-gray-500">
          Configure a instância, gere o QR Code e pareie o número para envio automático.
        </p>
      </div>

      {/* Configurações */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">URL da API</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={whatsappConnection.apiUrl || ''}
            onChange={(e) =>
              setWhatsappConnection((prev) => ({
                ...prev,
                apiUrl: e.target.value,
              }))
            }
            placeholder="https://sua-api-whatsapp.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">API Key</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={whatsappConnection.apiKey || ''}
            onChange={(e) =>
              setWhatsappConnection((prev) => ({
                ...prev,
                apiKey: e.target.value,
              }))
            }
            placeholder="Sua chave da API"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Instância</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={whatsappConnection.instance || ''}
            onChange={(e) =>
              setWhatsappConnection((prev) => ({
                ...prev,
                instance: e.target.value,
              }))
            }
            placeholder="agilipet"
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </button>

        <button
          onClick={startWhatsappSession}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:opacity-90"
        >
          Conectar / Gerar QR Code
        </button>

        <button
          onClick={refreshWhatsappStatus}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:opacity-90"
        >
          Atualizar Status
        </button>

        <button
          onClick={disconnectWhatsappSession}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:opacity-90"
        >
          Desconectar
        </button>
      </div>

      {/* Status */}
      <div className="rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">Status da conexão</span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor()}`}>
            {getStatusLabel()}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <span className="text-xs text-gray-500">Número pareado</span>
            <div className="text-sm font-medium">
              {whatsappConnection.pairedNumber || '-'}
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-500">Nome da sessão</span>
            <div className="text-sm font-medium">
              {whatsappConnection.pairedName || '-'}
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-500">Instância</span>
            <div className="text-sm font-medium">
              {whatsappConnection.instance || '-'}
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-500">Última conexão</span>
            <div className="text-sm font-medium">
              {whatsappConnection.lastConnectionAt || '-'}
            </div>
          </div>
        </div>

        {whatsappConnection.errorMessage ? (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {whatsappConnection.errorMessage}
          </div>
        ) : null}
      </div>

      {/* QR Code */}
      {whatsappConnection.status === 'QRCODE' && whatsappConnection.qrCode ? (
        <div className="rounded-xl border p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Pareamento via QR Code</h3>
            <p className="text-sm text-gray-500">
              No celular, abra o WhatsApp &gt; Aparelhos conectados &gt; Conectar aparelho.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <img
              src={whatsappConnection.qrCode}
              alt="QR Code do WhatsApp"
              className="h-64 w-64 rounded-xl border bg-white p-2"
            />

            <p className="text-center text-sm text-gray-500">
              Após escanear, o sistema atualizará automaticamente o status.
            </p>
          </div>
        </div>
      ) : null}

      {/* Conectado */}
      {whatsappConnection.status === 'CONNECTED' ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="text-sm font-medium text-green-700">
            WhatsApp conectado e pronto para envios automáticos.
          </div>
        </div>
      ) : null}
    </div>
  )
}