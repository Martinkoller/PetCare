import { useState, useEffect } from 'react'
import { Client } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useClientStore } from '@/stores/ClientContext'

// Formata apenas DDD + número para exibição (sem +55)
function formatPhone(value: string): string {
  // Remove tudo que não é dígito e o prefixo 55 se vier do banco
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 11) digits = digits.slice(2)
  digits = digits.slice(0, 11)

  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

// Salva sempre com 55 + dígitos locais
function rawPhone(formatted: string): string {
  let digits = formatted.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 11) return digits
  return `55${digits}`
}

function isValidPhone(raw: string): boolean {
  // raw já tem 55 + DDD + número = 12 ou 13 dígitos
  return raw.length === 12 || raw.length === 13
}

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (client: Client) => void
  client?: Client | null
}

export function ClientDialog({
  open,
  onOpenChange,
  onSave,
  client,
}: ClientDialogProps) {
  const { addClient, updateClient } = useClientStore()
  const [formData, setFormData] = useState<Partial<Client>>({
    whatsappEnabled: true,
  })
  const [phoneDisplay, setPhoneDisplay] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (client) {
      setFormData(client)
      setPhoneDisplay(formatPhone(client.phone || ''))
    } else {
      setFormData({ whatsappEnabled: true })
      setPhoneDisplay('')
    }
    setPhoneError('')
  }, [client, open])

  const handleSave = async () => {
    const raw = rawPhone(phoneDisplay)
    if (!isValidPhone(raw)) {
      setPhoneError('Informe o telefone com DDD e código do país. Ex: +55 (11) 99999-9999')
      return
    }
    setPhoneError('')
    const phoneRaw = raw

    if (formData.name && formData.email && phoneRaw) {
      setIsSaving(true)

      try {
        let savedClient: Client
        if (client?.id) {
          const clientToUpdate: Client = {
            id: client.id,
            joinedAt: client.joinedAt,
            address: formData.address || '',
            name: formData.name,
            email: formData.email,
            phone: phoneRaw,
            whatsappEnabled: formData.whatsappEnabled,
          }
          savedClient = await updateClient(clientToUpdate)
          toast.success('Cliente atualizado com sucesso!')
        } else {
          const clientToCreate: Omit<Client, 'id'> = {
            joinedAt: new Date().toISOString(),
            address: formData.address || '',
            name: formData.name,
            email: formData.email,
            phone: phoneRaw,
            whatsappEnabled: formData.whatsappEnabled,
          }
          savedClient = await addClient(clientToCreate)
          toast.success('Cliente cadastrado com sucesso!')
        }

        if (onSave) onSave(savedClient)
        onOpenChange(false)
        if (!client) setFormData({ whatsappEnabled: true })
      } catch (error) {
        console.error('Error saving client:', error)
        toast.error('Erro ao salvar cliente.')
      } finally {
        setIsSaving(false)
      }
    } else {
      toast.error('Preencha os campos obrigatorios.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {client ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            Insira os dados do proprietario.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="phone" className="text-right pt-2">
              Telefone
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="phone"
                placeholder="(49) 99999-9999"
                value={phoneDisplay}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setPhoneDisplay(formatted)
                  setPhoneError('')
                }}
                className={phoneError ? 'border-red-500' : ''}
              />
              {phoneError && (
                <p className="text-xs text-red-500">{phoneError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Formato: (DDD) 99999-9999
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Endereco
            </Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-start-2 col-span-3 flex items-center gap-2">
              <Checkbox
                id="whatsapp"
                checked={formData.whatsappEnabled}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    whatsappEnabled: checked as boolean,
                  })
                }
              />
              <Label htmlFor="whatsapp" className="font-normal">
                Receber notificacoes via WhatsApp
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
