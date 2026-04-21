import { useState } from 'react'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useInventoryStore } from '@/stores/InventoryStore'
import { AppointmentTemplate, TemplateItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash, Edit, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

export function TemplateSettings() {
  const {
    templates,
    addAppointmentTemplate,
    updateAppointmentTemplate,
    deleteAppointmentTemplate,
    services,
  } = useAppointmentStore()
  const { products } = useInventoryStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] =
    useState<Partial<AppointmentTemplate> | null>(null)

  // Internal state for editing items within the dialog
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([])
  const [newItemType, setNewItemType] = useState<'service' | 'product'>(
    'service',
  )
  const [newItemId, setNewItemId] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)

  const handleOpenDialog = (template?: AppointmentTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setTemplateItems(template.services || [])
    } else {
      setEditingTemplate({
        name: '',
        description: '',
        defaultDurationDays: 1,
      })
      setTemplateItems([])
    }
    setIsDialogOpen(true)
  }

  const handleAddItem = () => {
    if (!newItemId) return
    const item: TemplateItem = {
      type: newItemType,
      id: newItemId,
      quantity: newItemQuantity,
    }
    setTemplateItems([...templateItems, item])
    setNewItemId('')
    setNewItemQuantity(1)
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...templateItems]
    newItems.splice(index, 1)
    setTemplateItems(newItems)
  }

  const handleSave = async () => {
    if (!editingTemplate?.name) {
      toast.error('O nome do modelo é obrigatório')
      return
    }

    const templateData: any = {
      ...editingTemplate,
      services: templateItems,
    }

    if (editingTemplate.id) {
      await updateAppointmentTemplate(templateData as AppointmentTemplate)
    } else {
      await addAppointmentTemplate(templateData as AppointmentTemplate)
    }
    setIsDialogOpen(false)
  }

  const getItemName = (type: string, id: string) => {
    if (type === 'service') return services.find((s) => s.id === id)?.name
    if (type === 'product') return products.find((p) => p.id === id)?.name
    return 'Desconhecido'
  }

  const getItemPrice = (type: string, id: string) => {
    if (type === 'service') return services.find((s) => s.id === id)?.price || 0
    if (type === 'product') return products.find((p) => p.id === id)?.price || 0
    return 0
  }

  const calculateTotal = (items: TemplateItem[]) => {
    return items.reduce((acc, item) => {
      const price = getItemPrice(item.type, item.id)
      return acc + price * item.quantity
    }, 0)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Modelos de Agendamento</CardTitle>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Novo Modelo
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Duração Padrão</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum modelo cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>{template.defaultDurationDays} dias</TableCell>
                  <TableCell>
                    {template.services?.length || 0} itens (
                    {formatCurrency(calculateTotal(template.services || []))})
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAppointmentTemplate(template.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate?.id ? 'Editar Modelo' : 'Novo Modelo'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Modelo</Label>
                <Input
                  value={editingTemplate?.name || ''}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      name: e.target.value,
                    })
                  }
                  placeholder="Ex: Banho + Tosa + Hotel"
                />
              </div>
              <div className="space-y-2">
                <Label>Duração Padrão (Dias)</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingTemplate?.defaultDurationDays || 1}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      defaultDurationDays: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={editingTemplate?.description || ''}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="border rounded-md p-4 space-y-4 bg-muted/20">
              <Label className="text-base font-semibold">Itens do Pacote</Label>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <Label className="text-xs">Tipo</Label>
                  <Select
                    value={newItemType}
                    onValueChange={(v: any) => {
                      setNewItemType(v)
                      setNewItemId('')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Serviço</SelectItem>
                      <SelectItem value="product">Produto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-6">
                  <Label className="text-xs">Item</Label>
                  <Select value={newItemId} onValueChange={setNewItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {newItemType === 'service'
                        ? services.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} - {formatCurrency(s.price)}
                            </SelectItem>
                          ))
                        : products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} - {formatCurrency(p.price)}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    size="icon"
                    onClick={handleAddItem}
                    disabled={!newItemId}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {templateItems.length > 0 && (
                <div className="border rounded bg-background overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="w-20 text-center">Qtd</TableHead>
                        <TableHead className="w-24 text-right">Preço</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templateItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="py-2">
                            {getItemName(item.type, item.id)}
                            <span className="block text-xs text-muted-foreground capitalize">
                              {item.type === 'service' ? 'Serviço' : 'Produto'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center py-2">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right py-2">
                            {formatCurrency(
                              getItemPrice(item.type, item.id) * item.quantity,
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemoveItem(idx)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-2 bg-muted/50 flex justify-between font-semibold text-sm">
                    <span>Total Estimado:</span>
                    <span>{formatCurrency(calculateTotal(templateItems))}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-auto pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Modelo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
