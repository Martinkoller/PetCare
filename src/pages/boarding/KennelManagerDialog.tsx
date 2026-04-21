import { useState } from 'react'
import { Kennel } from '@/lib/types'
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
import { Trash, Edit, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface KennelManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KennelManagerDialog({
  open,
  onOpenChange,
}: KennelManagerDialogProps) {
  const { kennels, addKennel, updateKennel, deleteKennel, boardingStays } =
    useBoardingStore()
  const [editingKennel, setEditingKennel] = useState<Partial<Kennel> | null>(
    null,
  )

  const handleSave = () => {
    if (!editingKennel?.name || !editingKennel?.size) {
      return toast.error('Preencha os campos obrigatórios')
    }

    if (editingKennel.id) {
      updateKennel(editingKennel as Kennel)
      toast.success('Canil atualizado')
    } else {
      addKennel({
        ...editingKennel,
        id: Math.random().toString(36).substr(2, 9),
        status: 'available',
      } as Kennel)
      toast.success('Canil adicionado')
    }
    setEditingKennel(null)
  }

  const handleDelete = (id: string) => {
    const isOccupied = boardingStays.some(
      (s) => s.kennelNumber === id && s.status === 'active',
    )
    if (isOccupied) {
      return toast.error('Não é possível excluir um canil ocupado')
    }
    if (confirm('Tem certeza?')) {
      deleteKennel(id)
      toast.success('Canil removido')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Canis</DialogTitle>
          <DialogDescription>
            Adicione, edite ou remova unidades de hospedagem.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          <div className="flex gap-4 mb-6 p-4 bg-muted/20 rounded-lg border">
            <div className="flex-1 grid gap-2">
              <Label>Nome / Número</Label>
              <Input
                placeholder="Ex: 101 ou Ala A1"
                value={editingKennel?.name || ''}
                onChange={(e) =>
                  setEditingKennel({ ...editingKennel, name: e.target.value })
                }
              />
            </div>
            <div className="w-[150px] grid gap-2">
              <Label>Tamanho</Label>
              <Select
                value={editingKennel?.size || 'medium'}
                onValueChange={(val: any) =>
                  setEditingKennel({ ...editingKennel, size: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px] grid gap-2">
              <Label>Status</Label>
              <Select
                value={editingKennel?.status || 'available'}
                onValueChange={(val: any) =>
                  setEditingKennel({ ...editingKennel, status: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSave}>
                {editingKennel?.id ? (
                  <Edit className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingKennel?.id ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </div>

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
              {kennels.map((k) => {
                const stay = boardingStays.find(
                  (s) =>
                    s.kennelNumber === k.id && // Assuming kennelNumber stores kennel ID for simplicity in new logic
                    s.status === 'active',
                )
                return (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell className="capitalize">
                      {k.size === 'small'
                        ? 'Pequeno'
                        : k.size === 'medium'
                          ? 'Médio'
                          : 'Grande'}
                    </TableCell>
                    <TableCell>
                      {k.status === 'maintenance' ? (
                        <Badge variant="destructive">Manutenção</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50">
                          Disponível
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {stay ? (
                        <Badge variant="secondary" className="bg-orange-100">
                          Ocupado
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Livre
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingKennel(k)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(k.id)}
                          disabled={!!stay}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
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
  )
}
