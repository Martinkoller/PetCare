import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageCircle } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  petName?: string
  defaultMessage: string
  onConfirm: (message: string) => void
}

export default function WhatsAppConfirmDialog({
  open,
  onOpenChange,
  clientName,
  petName,
  defaultMessage,
  onConfirm,
}: Props) {
  const [message, setMessage] = useState(defaultMessage)

  useEffect(() => {
    if (open) setMessage(defaultMessage)
  }, [open, defaultMessage])

  const handleConfirm = () => {
    if (!message.trim()) return
    onConfirm(message.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Confirmar envio via WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium">Para:</span>{' '}
            {clientName}
            {petName && (
              <span className="text-muted-foreground"> — {petName}</span>
            )}
          </div>

          <div className="space-y-1">
            <Label>Mensagem</Label>
            <Textarea
              className="h-28 resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!message.trim()}>
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
