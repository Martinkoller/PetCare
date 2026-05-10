import { useState } from 'react'
import { useBoardingStore } from '@/stores/BoardingStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Edit, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EditButton, DeleteButton } from '@/components/ui/action-buttons'

interface KennelManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface KennelForm {
  id?: string
  name: string
  size: string
  status: string
}

const EMPTY_FORM: KennelForm = { name: '', size: 'medium', status: 'available' }

const SIZE_LABEL: Record<string, string> = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
}

export function KennelManagerDialog({ open, onOpenChange }: KennelManagerDialogProps) {
  const { kennels, addKennel, updateKennel, deleteKennel, boardingStays } = useBoardingStore()
  const [form, setForm] = useState<KennelForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingKennelId, setDeletingKennelId] = useState<string | null>(null)

  const patch = (partial: Partial<KennelForm>) => setForm((prev) => ({ ...prev, ...partial }))
  const resetForm = () => setForm(EMPTY_FORM)

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Informe o nome ou número do canil')

    setSaving(true)
    try {
      if (form.id) {
        await updateKennel({ id: form.id, name: form.name.trim(), size: form.size, status: form.status } as any)
        toast.success('Canil atualizado')
      } else {
        await addKennel({ name: form.name.trim(), size: form.size, status: form.status })
        toast.success('Canil adicionado')
      }
      resetForm()
    } catch {
      // errors surfaced by store
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (k: any) => {
    setForm({ id: k.id, name: k.name, size: k.size, status: k.status })
  }

  const handleDeleteRequest = (id: string) => {
    const isActive = boardingStays.some((s) => s.kennelNumber === id && s.status === 'active')
    if (isActive) return toast.error('Não é possível excluir um canil ocupado')
    setDeletingKennelId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingKennelId) return
    try {
      await deleteKennel(deletingKennelId)
    } catch {
      // errors surfaced by store
    } finally {
      setDeletingKennelId(null)
    }
  }

  return (
    <>
    <ConfirmDialog
      open={!!deletingKennelId}
      onOpenChange={(open) => { if (!open) setDeletingKennelId(null) }}
      title="Excluir canil"
      description={`Tem certeza que deseja excluir o canil "${kennels.find(k => k.id === deletingKennelId)?.name}"?`}
      confirmLabel="Excluir"
      onConfirm={handleDeleteConfirm}
    />
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Canis</DialogTitle>
          <DialogDescription>Adicione, edite ou remova unidades de hospedagem.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4 space-y-6">
          {/* Formulário */}
          <div className="flex flex-wrap gap-3 p-4 bg-muted/20 rounded-lg border items-end">
            <div className="flex-1 min-w-[160px] grid gap-1.5">
              <Label>Nome / Número</Label>
              <Input
                placeholder="Ex: 101 ou Ala A-1"
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>

            <div className="w-[140px] grid gap-1.5">
              <Label>Tamanho</Label>
              <Select value={form.size} onValueChange={(v) => patch({ size: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[140px] grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => patch({ status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              {form.id && (
                <Button variant="outline" size="icon" onClick={resetForm} title="Cancelar edição">
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {form.id ? <Edit className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {form.id ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </div>

          {/* Lista */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identificação</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ocupação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kennels.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum canil cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {kennels.map((k) => {
                const activeStay = boardingStays.find(
                  (s) => s.kennelNumber === k.id && s.status === 'active',
                )
                const isEditing = form.id === k.id

                return (
                  <TableRow key={k.id} className={isEditing ? 'bg-primary/5' : undefined}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>{SIZE_LABEL[k.size] ?? k.size}</TableCell>
                    <TableCell>
                      {k.status === 'maintenance' ? (
                        <Badge variant="destructive">Manutenção</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700">Disponível</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {activeStay ? (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">Ocupado</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Livre</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <EditButton onClick={() => handleEdit(k)} />
                        <DeleteButton onClick={() => handleDeleteRequest(k.id)} disabled={!!activeStay} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
