import { useState } from 'react'
import { useConfigStore } from '@/stores/ConfigStore'
import { CustomStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Trash, Plus, Edit } from 'lucide-react'
import { toast } from 'sonner'

export function GeneralStatusSettings() {
  const { generalStatuses, updateGeneralStatuses } = useConfigStore()
  const [editingStatus, setEditingStatus] =
    useState<Partial<CustomStatus> | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSave = () => {
    if (!editingStatus?.label || !editingStatus?.value) {
      return toast.error('Preencha rótulo e valor')
    }

    let newStatuses = [...generalStatuses]
    if (editingStatus.id) {
      newStatuses = newStatuses.map((s) =>
        s.id === editingStatus.id ? (editingStatus as CustomStatus) : s,
      )
    } else {
      const id = Math.random().toString(36).substr(2, 9)
      newStatuses.push({ ...editingStatus, id } as CustomStatus)
    }

    updateGeneralStatuses(newStatuses)
    setIsDialogOpen(false)
    setEditingStatus(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza?')) {
      updateGeneralStatuses(generalStatuses.filter((s) => s.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Status Gerais</CardTitle>
            <CardDescription>
              Gerencie status personalizados para uso global.
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingStatus({ color: 'bg-gray-100 text-gray-800' })
              setIsDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Status
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rótulo</TableHead>
                <TableHead>Valor (Código)</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generalStatuses.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    Nenhum status personalizado.
                  </TableCell>
                </TableRow>
              )}
              {generalStatuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell className="font-medium">{status.label}</TableCell>
                  <TableCell className="text-xs font-mono">
                    {status.value}
                  </TableCell>
                  <TableCell>
                    <div
                      className={`px-2 py-1 rounded text-xs inline-block ${status.color}`}
                    >
                      Exemplo
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingStatus(status)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(status.id)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus?.id ? 'Editar Status' : 'Novo Status'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Rótulo</Label>
              <Input
                value={editingStatus?.label || ''}
                onChange={(e) =>
                  setEditingStatus({ ...editingStatus, label: e.target.value })
                }
                placeholder="Ex: Em Análise"
              />
            </div>
            <div className="grid gap-2">
              <Label>Valor (Código Interno)</Label>
              <Input
                value={editingStatus?.value || ''}
                onChange={(e) =>
                  setEditingStatus({ ...editingStatus, value: e.target.value })
                }
                placeholder="Ex: in_analysis"
              />
            </div>
            <div className="grid gap-2">
              <Label>Classe de Cor (Tailwind)</Label>
              <Input
                value={editingStatus?.color || ''}
                onChange={(e) =>
                  setEditingStatus({ ...editingStatus, color: e.target.value })
                }
                placeholder="Ex: bg-yellow-100 text-yellow-800"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
