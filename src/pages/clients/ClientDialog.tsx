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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// Formata apenas DDD + número para exibição (sem +55)
function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 11) digits = digits.slice(2)
  digits = digits.slice(0, 11)

  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function rawPhone(formatted: string): string {
  let digits = formatted.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 11) return digits
  return `55${digits}`
}

function isValidPhone(raw: string): boolean {
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
    acceptsCampaigns: true,
    blockCredit: false,
  })
  const [phoneDisplay, setPhoneDisplay] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (client) {
      setFormData(client)
      setPhoneDisplay(formatPhone(client.phone || ''))
    } else {
      setFormData({
        whatsappEnabled: true,
        acceptsCampaigns: true,
        blockCredit: false,
      })
      setPhoneDisplay('')
    }
    setPhoneError('')
  }, [client, open])

  const handleSave = async () => {
    const raw = rawPhone(phoneDisplay)
    if (!isValidPhone(raw)) {
      setPhoneError('Informe o telefone com DDD. Ex: (11) 99999-9999')
      return
    }
    setPhoneError('')

    if (formData.name && formData.email && raw) {
      setIsSaving(true)

      try {
        const clientData: any = {
          ...formData,
          phone: raw,
          joinedAt: client?.joinedAt || new Date().toISOString(),
        }

        let savedClient: Client
        if (client?.id) {
          savedClient = await updateClient({ ...clientData, id: client.id } as Client)
          toast.success('Cliente atualizado com sucesso!')
        } else {
          savedClient = await addClient(clientData as Omit<Client, 'id'>)
          toast.success('Cliente cadastrado com sucesso!')
        }

        if (onSave) onSave(savedClient)
        onOpenChange(false)
      } catch (error) {
        toast.error('Erro ao salvar cliente.')
      } finally {
        setIsSaving(false)
      }
    } else {
      toast.error('Preencha os campos obrigatórios (Nome, Email, Telefone).')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-white">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription className="text-base">
            Insira os dados detalhados do proprietário.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-8 pb-8">
          <div className="space-y-10 py-4">
            {/* Seção: Dados Pessoais */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <h3 className="font-bold text-sm uppercase tracking-wider">Dados Pessoais</h3>
                <div className="h-[1px] flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">Nome Completo *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: João Silva"
                    className="h-12 bg-gray-50/50"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-sm font-semibold">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    className="h-12 bg-gray-50/50"
                    value={formData.cpf || ''}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-sm font-semibold">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    className="h-12 bg-gray-50/50"
                    value={formData.birthDate ? formData.birthDate.split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-semibold">Sexo</Label>
                  <Select
                    value={formData.gender || ''}
                    onValueChange={(val) => setFormData({ ...formData, gender: val })}
                  >
                    <SelectTrigger id="gender" className="h-12 bg-gray-50/50">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Seção: Contato */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <h3 className="font-bold text-sm uppercase tracking-wider">Contato</h3>
                <div className="h-[1px] flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemplo@email.com"
                    className="h-12 bg-gray-50/50"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold">Telefone / WhatsApp *</Label>
                  <Input
                    id="phone"
                    placeholder="(49) 99999-9999"
                    className={`h-12 bg-gray-50/50 ${phoneError ? 'border-red-500' : ''}`}
                    value={phoneDisplay}
                    onChange={(e) => {
                      setPhoneDisplay(formatPhone(e.target.value))
                      setPhoneError('')
                    }}
                  />
                  {phoneError && <p className="text-xs text-red-500 font-medium">{phoneError}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="origin" className="text-sm font-semibold">Origem do Cadastro</Label>
                  <Select
                    value={formData.origin || ''}
                    onValueChange={(val) => setFormData({ ...formData, origin: val })}
                  >
                    <SelectTrigger id="origin" className="h-12 bg-gray-50/50">
                      <SelectValue placeholder="Como nos conheceu?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indicação">Indicação</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Passagem">Passagem</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Seção: Endereço */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <h3 className="font-bold text-sm uppercase tracking-wider">Endereço</h3>
                <div className="h-[1px] flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="zipCode" className="text-sm font-semibold">CEP</Label>
                  <Input
                    id="zipCode"
                    placeholder="00000-000"
                    className="h-12 bg-gray-50/50"
                    value={formData.zipCode || ''}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-3">
                  <Label htmlFor="street" className="text-sm font-semibold">Logradouro</Label>
                  <Input
                    id="street"
                    placeholder="Rua, Avenida..."
                    className="h-12 bg-gray-50/50"
                    value={formData.street || ''}
                    onChange={(e) => {
                      const newStreet = e.target.value
                      setFormData({ 
                        ...formData, 
                        street: newStreet,
                        address: `${newStreet}${formData.number ? ', ' + formData.number : ''}${formData.city ? ' - ' + formData.city : ''}`
                      })
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="number" className="text-sm font-semibold">Número</Label>
                  <Input
                    id="number"
                    placeholder="123"
                    className="h-12 bg-gray-50/50"
                    value={formData.number || ''}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="complement" className="text-sm font-semibold">Complemento</Label>
                  <Input
                    id="complement"
                    placeholder="Apt, Sala, etc."
                    className="h-12 bg-gray-50/50"
                    value={formData.complement || ''}
                    onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="neighborhood" className="text-sm font-semibold">Bairro</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Ex: Centro"
                    className="h-12 bg-gray-50/50"
                    value={formData.neighborhood || ''}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-1">
                  <Label htmlFor="city" className="text-sm font-semibold">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Cidade"
                    className="h-12 bg-gray-50/50"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-1">
                  <Label htmlFor="state" className="text-sm font-semibold">UF</Label>
                  <Input
                    id="state"
                    maxLength={2}
                    placeholder="SC"
                    className="h-12 bg-gray-50/50 uppercase"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </div>

            {/* Seção: Preferências e Observações */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <h3 className="font-bold text-sm uppercase tracking-wider">Preferências & Notas</h3>
                <div className="h-[1px] flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-transparent bg-emerald-50/30 hover:border-emerald-100 transition-all">
                    <Checkbox
                      id="whatsapp"
                      checked={formData.whatsappEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, whatsappEnabled: checked as boolean })}
                    />
                    <Label htmlFor="whatsapp" className="text-sm font-medium cursor-pointer">Notificações por WhatsApp</Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-transparent bg-blue-50/30 hover:border-blue-100 transition-all">
                    <Checkbox
                      id="acceptsCampaigns"
                      checked={formData.acceptsCampaigns}
                      onCheckedChange={(checked) => setFormData({ ...formData, acceptsCampaigns: checked as boolean })}
                    />
                    <Label htmlFor="acceptsCampaigns" className="text-sm font-medium cursor-pointer">Aceita campanhas e promos</Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-transparent bg-red-50/30 hover:border-red-100 transition-all">
                    <Checkbox
                      id="blockCredit"
                      checked={formData.blockCredit}
                      onCheckedChange={(checked) => setFormData({ ...formData, blockCredit: checked as boolean })}
                    />
                    <Label htmlFor="blockCredit" className="text-sm font-medium cursor-pointer text-red-700">Bloquear crédito (Fiado)</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-semibold">Observações Internas</Label>
                  <Textarea
                    id="notes"
                    className="min-h-[140px] bg-gray-50/50 resize-none"
                    placeholder="Informações relevantes sobre o cliente..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-8 pt-6 border-t bg-gray-50/30">
          <div className="flex w-full justify-end gap-3">
            <Button variant="ghost" size="lg" className="px-8 h-12 text-base font-semibold" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button size="lg" className="px-10 h-12 text-base font-bold bg-[#10b981] hover:bg-[#059669] shadow-lg shadow-emerald-200/50 transition-all" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Cliente'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
