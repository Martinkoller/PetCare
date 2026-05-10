import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { boardingService } from '@/services/boarding-service'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PlusCircle, Trash2, ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface BoardingDailyLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardingId: string
  petName: string
}

const BEHAVIOR_OPTIONS = [
  { value: 'calmo', label: 'Calmo' },
  { value: 'agitado', label: 'Agitado' },
  { value: 'ansioso', label: 'Ansioso' },
  { value: 'agressivo', label: 'Agressivo' },
  { value: 'deprimido', label: 'Deprimido' },
  { value: 'normal', label: 'Normal' },
]

const STOOL_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'mole', label: 'Mole' },
  { value: 'diarreia', label: 'Diarreia' },
  { value: 'ausente', label: 'Ausente' },
  { value: 'com_sangue', label: 'Com sangue' },
]

export function BoardingDailyLogDialog({
  open,
  onOpenChange,
  boardingId,
  petName,
}: BoardingDailyLogDialogProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    logDate: today,
    fedAt: '',
    walkedAt: '',
    medication: '',
    behavior: '',
    stoolNotes: '',
    staffNotes: '',
  })

  useEffect(() => {
    if (!open) return
    setLoading(true)
    boardingService
      .getDailyLogs(boardingId)
      .then(setLogs)
      .catch(() => toast.error('Erro ao carregar registros diários'))
      .finally(() => setLoading(false))
  }, [open, boardingId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const created = await boardingService.createDailyLog(boardingId, form)
      setLogs((prev) => [created, ...prev])
      setForm({
        logDate: today,
        fedAt: '',
        walkedAt: '',
        medication: '',
        behavior: '',
        stoolNotes: '',
        staffNotes: '',
      })
      toast.success('Registro salvo!')
    } catch {
      toast.error('Erro ao salvar registro')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingLogId) return
    try {
      await boardingService.deleteDailyLog(deletingLogId)
      setLogs((prev) => prev.filter((l) => l.id !== deletingLogId))
    } catch {
      toast.error('Erro ao remover registro')
    } finally {
      setDeletingLogId(null)
    }
  }

  const behaviorLabel = (val: string) =>
    BEHAVIOR_OPTIONS.find((o) => o.value === val)?.label || val
  const stoolLabel = (val: string) =>
    STOOL_OPTIONS.find((o) => o.value === val)?.label || val

  return (
    <>
    <ConfirmDialog
      open={!!deletingLogId}
      onOpenChange={(open) => { if (!open) setDeletingLogId(null) }}
      title="Remover registro"
      description="Tem certeza que deseja remover este registro diário?"
      confirmLabel="Remover"
      onConfirm={handleDeleteConfirm}
    />
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Diário de Bordo — {petName}
          </DialogTitle>
          <DialogDescription>
            Registre alimentação, passeio, medicação e comportamento diário.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          {/* Formulário novo registro */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/20 mb-6">
            <p className="text-sm font-semibold">Novo Registro</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  value={form.logDate}
                  onChange={(e) => setForm({ ...form, logDate: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Alimentado às</Label>
                <Input
                  placeholder="Ex: 7h e 18h"
                  value={form.fedAt}
                  onChange={(e) => setForm({ ...form, fedAt: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Passeio às</Label>
                <Input
                  placeholder="Ex: 8h e 17h"
                  value={form.walkedAt}
                  onChange={(e) => setForm({ ...form, walkedAt: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Comportamento</Label>
                <Select
                  value={form.behavior}
                  onValueChange={(v) => setForm({ ...form, behavior: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BEHAVIOR_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Fezes</Label>
                <Select
                  value={form.stoolNotes}
                  onValueChange={(v) => setForm({ ...form, stoolNotes: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STOOL_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Medicação administrada</Label>
                <Input
                  placeholder="Ex: Amoxicilina 250mg 1cp"
                  value={form.medication}
                  onChange={(e) => setForm({ ...form, medication: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Observações da equipe</Label>
              <Textarea
                placeholder="Notas adicionais sobre o dia..."
                value={form.staffNotes}
                onChange={(e) => setForm({ ...form, staffNotes: e.target.value })}
                rows={2}
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Registro'}
            </Button>
          </div>

          {/* Histórico de registros */}
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum registro ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {format(parseISO(log.logDate), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => setDeletingLogId(log.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {log.fedAt && (
                      <Badge variant="secondary">🍽 {log.fedAt}</Badge>
                    )}
                    {log.walkedAt && (
                      <Badge variant="secondary">🐾 {log.walkedAt}</Badge>
                    )}
                    {log.behavior && (
                      <Badge variant="outline">{behaviorLabel(log.behavior)}</Badge>
                    )}
                    {log.stoolNotes && (
                      <Badge variant="outline">Fezes: {stoolLabel(log.stoolNotes)}</Badge>
                    )}
                    {log.medication && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        💊 {log.medication}
                      </Badge>
                    )}
                  </div>
                  {log.staffNotes && (
                    <p className="text-xs text-muted-foreground">{log.staffNotes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
