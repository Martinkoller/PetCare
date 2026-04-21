import { useState } from 'react'
import { useConfigStore } from '@/stores/ConfigStore'
import { GroomingStage } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Badge } from '@/components/ui/badge'
import { Trash, Plus, MoveUp, MoveDown, Edit, Flag, PlayCircle, PackageCheck } from 'lucide-react'
import { toast } from 'sonner'

export function GroomingSettings() {
  const { groomingStages, updateGroomingStages, requireChecklistOnFinish, updateRequireChecklistOnFinish } = useConfigStore()
  const [editingStage, setEditingStage] =
    useState<Partial<GroomingStage> | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSave = () => {
    if (!editingStage?.title || !editingStage?.color) {
      return toast.error('Preencha título e cor')
    }

    let newStages = [...groomingStages]

    if (editingStage.isFinal) {
      newStages = newStages.map((s) => ({ ...s, isFinal: false }))
    }
    if (editingStage.isInitial) {
      newStages = newStages.map((s) => ({ ...s, isInitial: false }))
    }
    if (editingStage.isDelivery) {
      newStages = newStages.map((s) => ({ ...s, isDelivery: false }))
    }

    if (editingStage.id) {
      newStages = newStages.map((s) =>
        s.id === editingStage.id ? (editingStage as GroomingStage) : s,
      )
    } else {
      const id = editingStage.title.toLowerCase().replace(/\s+/g, '_')
      newStages.push({ ...editingStage, id } as GroomingStage)
    }

    const hasFinal = newStages.some((s) => s.isFinal)
    if (!hasFinal) {
      return toast.error('É obrigatório ter uma etapa marcada como Final')
    }
    const hasInitial = newStages.some((s) => s.isInitial)
    if (!hasInitial) {
      return toast.error('É obrigatório ter uma etapa marcada como Inicial')
    }

    updateGroomingStages(newStages)
    setIsDialogOpen(false)
    setEditingStage(null)
  }

  const handleDelete = (id: string) => {
    const stage = groomingStages.find((s) => s.id === id)
    if (stage?.isFinal) {
      return toast.error('Não é possível excluir a etapa final. Defina outra etapa como final antes.')
    }
    if (stage?.isInitial) {
      return toast.error('Não é possível excluir a etapa inicial. Defina outra etapa como inicial antes.')
    }
    if (confirm('Tem certeza? Isso pode afetar agendamentos existentes.')) {
      updateGroomingStages(groomingStages.filter((s) => s.id !== id))
    }
  }

  const moveStage = (index: number, direction: 'up' | 'down') => {
    const newStages = [...groomingStages]
    if (direction === 'up' && index > 0) {
      ;[newStages[index], newStages[index - 1]] = [
        newStages[index - 1],
        newStages[index],
      ]
    } else if (direction === 'down' && index < newStages.length - 1) {
      ;[newStages[index], newStages[index + 1]] = [
        newStages[index + 1],
        newStages[index],
      ]
    }
    updateGroomingStages(newStages)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Etapas do Banho e Tosa</CardTitle>
            <CardDescription>
              Defina as etapas e a ordem do fluxo. A etapa final bloqueia edição do atendimento.
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingStage({ color: 'bg-gray-100 text-gray-700', isFinal: false })
              setIsDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Etapa
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Título</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Inicial</TableHead>
                <TableHead>Final</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groomingStages.map((stage, index) => (
                <TableRow key={stage.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={index === 0}
                        onClick={() => moveStage(index, 'up')}
                      >
                        <MoveUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={index === groomingStages.length - 1}
                        onClick={() => moveStage(index, 'down')}
                      >
                        <MoveDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{stage.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {stage.id}
                  </TableCell>
                  <TableCell>
                    <div
                      className={`px-2 py-1 rounded text-xs inline-block ${stage.color}`}
                    >
                      Exemplo
                    </div>
                  </TableCell>
                  <TableCell>
                    {stage.isInitial && (
                      <Badge variant="secondary" className="gap-1 text-blue-700 bg-blue-100">
                        <PlayCircle className="h-3 w-3" /> Inicial
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {stage.isFinal && (
                      <Badge variant="secondary" className="gap-1 text-green-700 bg-green-100">
                        <Flag className="h-3 w-3" /> Final
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {stage.isDelivery && (
                      <Badge variant="secondary" className="gap-1 text-purple-700 bg-purple-100">
                        <PackageCheck className="h-3 w-3" /> Entrega
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingStage(stage)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(stage.id)}
                      disabled={stage.isFinal || stage.isInitial || stage.isDelivery}
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

      {/* Configuração de checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Regras de Finalização</CardTitle>
          <CardDescription>
            Defina o comportamento ao finalizar atendimentos com checklist pendente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Exigir checklist completo ao finalizar</p>
              <p className="text-xs text-muted-foreground">
                Se ativo, bloqueia a finalização quando houver itens obrigatórios não concluídos.
                Se inativo, exibe alerta mas permite confirmar mesmo assim.
              </p>
            </div>
            <Switch
              checked={requireChecklistOnFinish}
              onCheckedChange={updateRequireChecklistOnFinish}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStage?.id ? 'Editar Etapa' : 'Nova Etapa'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input
                value={editingStage?.title || ''}
                onChange={(e) =>
                  setEditingStage({ ...editingStage, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Classe de Cor (Tailwind)</Label>
              <Input
                value={editingStage?.color || ''}
                onChange={(e) =>
                  setEditingStage({ ...editingStage, color: e.target.value })
                }
                placeholder="Ex: bg-blue-100 text-blue-700"
              />
            </div>
            <div className="flex items-center gap-3 rounded-md border p-3 bg-muted/30">
              <Checkbox
                id="isInitial"
                checked={!!editingStage?.isInitial}
                onCheckedChange={(checked) =>
                  setEditingStage({ ...editingStage, isInitial: !!checked })
                }
              />
              <div className="grid gap-0.5">
                <Label htmlFor="isInitial" className="cursor-pointer font-medium">
                  Etapa Inicial
                </Label>
                <p className="text-xs text-muted-foreground">
                  Quando o atendimento chegar aqui, o horário de entrada será registrado. Somente uma etapa pode ser a inicial.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md border p-3 bg-muted/30">
              <Checkbox
                id="isFinal"
                checked={!!editingStage?.isFinal}
                onCheckedChange={(checked) =>
                  setEditingStage({ ...editingStage, isFinal: !!checked })
                }
              />
              <div className="grid gap-0.5">
                <Label htmlFor="isFinal" className="cursor-pointer font-medium">
                  Etapa Final
                </Label>
                <p className="text-xs text-muted-foreground">
                  Quando o atendimento chegar aqui, será bloqueado para edição. Somente uma etapa pode ser a final.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md border p-3 bg-muted/30">
              <Checkbox
                id="isDelivery"
                checked={!!editingStage?.isDelivery}
                onCheckedChange={(checked) =>
                  setEditingStage({ ...editingStage, isDelivery: !!checked })
                }
              />
              <div className="grid gap-0.5">
                <Label htmlFor="isDelivery" className="cursor-pointer font-medium">
                  Etapa de Entrega
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ao mover para esta etapa, uma mensagem WhatsApp será enviada automaticamente ao tutor. Somente uma etapa pode ser a de entrega.
                </p>
              </div>
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
