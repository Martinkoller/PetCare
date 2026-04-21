import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { clientInteractionService } from '@/services/client-interaction-service'
import { toast } from 'sonner'
import { ClientInteraction } from '@/lib/types'

interface ClientInteractionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  onSave: () => void
}

export function ClientInteractionDialog({
  open,
  onOpenChange,
  clientId,
  onSave,
}: ClientInteractionDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<ClientInteraction>>({
    type: 'whatsapp',
    origin: 'manual',
    subject: '',
    body: '',
    status: 'done',
    responsible: '',
  })

  const handleSave = async () => {
    if (!formData.subject || !formData.type) {
      toast.error('Preencha pelo menos o assunto e o tipo.')
      return
    }

    setIsSaving(true)
    try {
      await clientInteractionService.createInteraction(clientId, formData)
      toast.success('Interação registrada com sucesso!')
      onSave()
      onOpenChange(false)
      setFormData({
        type: 'whatsapp',
        origin: 'manual',
        subject: '',
        body: '',
        status: 'done',
        responsible: '',
      })
    } catch (error) {
      toast.error('Erro ao registrar interação.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Registro de Contato</DialogTitle>
          <DialogDescription>
            Registre manualmente uma ligação, WhatsApp ou atendimento presencial.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right text-xs uppercase font-bold text-muted-foreground">
              Canal
            </Label>
            <Select
              value={formData.type}
              onValueChange={(val: any) => setFormData({ ...formData, type: val })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="call">Ligação Telefônica</SelectItem>
                <SelectItem value="in_person">Atendimento Presencial</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="system">Sistema / Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right text-xs uppercase font-bold text-muted-foreground">
              Assunto
            </Label>
            <Input
              id="subject"
              placeholder="Ex: Confirmação de banho, Reclamação, etc"
              className="col-span-3"
              value={formData.subject || ''}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="body" className="text-right text-xs uppercase font-bold text-muted-foreground pt-2">
              Detalhes
            </Label>
            <Textarea
              id="body"
              placeholder="Descreva o que foi conversado..."
              className="col-span-3 min-h-[100px]"
              value={formData.body || ''}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="responsible" className="text-right text-xs uppercase font-bold text-muted-foreground">
              Responsável
            </Label>
            <Input
              id="responsible"
              placeholder="Seu nome"
              className="col-span-3"
              value={formData.responsible || ''}
              onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
