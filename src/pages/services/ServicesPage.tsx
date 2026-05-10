import { useState } from 'react'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { ServiceCatalogItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  DialogDescription,
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
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, AlertTriangle, ListChecks } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatCurrency } from '@/lib/utils'

export default function ServicesPage() {
  const { services, addService, updateService, toggleServiceStatus } =
    useAppointmentStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Partial<ServiceCatalogItem>>({})

  // Only main services (no parentId) shown as parent options
  const mainServices = services.filter((s) => !s.parentId && s.active)

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleOpenDialog = (service?: ServiceCatalogItem) => {
    if (service) {
      setEditingService(service)
    } else {
      setEditingService({ active: true, category: 'grooming', price: 0 })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingService.name || editingService.price === undefined || !editingService.category) {
      return toast.error('Preencha os campos obrigatórios')
    }
    if (isNaN(Number(editingService.price))) {
      return toast.error('Preço inválido')
    }
    try {
      if (editingService.id) {
        await updateService(editingService as ServiceCatalogItem)
        toast.success('Serviço atualizado!')
      } else {
        await addService({
          ...editingService,
          price: Number(editingService.price),
        } as ServiceCatalogItem)
        toast.success('Serviço criado!')
      }
      setIsDialogOpen(false)
    } catch (e) {
      toast.error('Erro ao salvar serviço. Verifique os dados.')
    }
  }

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      grooming: 'Banho e Tosa',
      consultation: 'Clínica',
      boarding: 'Hospedagem',
      exam: 'Exames',
      vaccine: 'Vacinas',
      other: 'Outros',
    }
    return map[cat] || cat
  }

  const getParentName = (parentId?: string) =>
    parentId ? services.find((s) => s.id === parentId)?.name : undefined

  return (
    <div className="space-y-4 animate-fade-in">

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviço..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="grooming">Banho e Tosa</SelectItem>
            <SelectItem value="consultation">Clínica</SelectItem>
            <SelectItem value="boarding">Hospedagem</SelectItem>
            <SelectItem value="exam">Exames</SelectItem>
            <SelectItem value="vaccine">Vacinas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map((service) => {
              const parentName = getParentName(service.parentId)
              return (
                <TableRow key={service.id} className={cn(service.parentId && 'bg-muted/30')}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {service.parentId && (
                        <ListChecks className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <div className="font-medium">{service.name}</div>
                        {parentName && (
                          <div className="text-xs text-muted-foreground">
                            Checklist de: {parentName}
                          </div>
                        )}
                        {service.alerts && (
                          <div className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="h-3 w-3" /> {service.alerts}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryLabel(service.category)}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(service.price)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {service.duration ? `${service.duration} min` : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.active}
                        onCheckedChange={() => toggleServiceStatus(service.id)}
                      />
                      <span
                        className={cn(
                          'text-xs',
                          service.active ? 'text-green-600' : 'text-muted-foreground',
                        )}
                      >
                        {service.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(service)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {filteredServices.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum serviço encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingService.id ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
            <DialogDescription>Preencha os detalhes do serviço oferecido.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            {/* Nome + Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Serviço</Label>
                <Input
                  id="name"
                  value={editingService.name || ''}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={editingService.category}
                  onValueChange={(val: any) =>
                    setEditingService({ ...editingService, category: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grooming">Banho e Tosa</SelectItem>
                    <SelectItem value="consultation">Clínica</SelectItem>
                    <SelectItem value="boarding">Hospedagem</SelectItem>
                    <SelectItem value="exam">Exames</SelectItem>
                    <SelectItem value="vaccine">Vacinas</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preço + Duração + Ativo */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingService.price || ''}
                  onChange={(e) =>
                    setEditingService({ ...editingService, price: parseFloat(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duração (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  step="5"
                  placeholder="Ex: 60"
                  value={editingService.duration ?? ''}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      duration: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="grid gap-2 justify-center">
                <Label>Disponibilidade</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    checked={editingService.active}
                    onCheckedChange={(checked) =>
                      setEditingService({ ...editingService, active: checked })
                    }
                  />
                  <span className="text-sm">{editingService.active ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
            </div>

            {/* Vinculo a serviço principal (checklist) */}
            <div className="grid gap-2">
              <Label htmlFor="parent" className="flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" />
                Sub-serviço de (Checklist)
              </Label>
              <Select
                value={editingService.parentId || 'none'}
                onValueChange={(val) =>
                  setEditingService({
                    ...editingService,
                    parentId: val === 'none' ? undefined : val,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Serviço principal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Serviço principal (sem vínculo) —</SelectItem>
                  {mainServices
                    .filter((s) => s.id !== editingService.id)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({getCategoryLabel(s.category)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {editingService.parentId && (
                <p className="text-xs text-muted-foreground">
                  Este item aparecerá como opção de checklist ao selecionar o serviço principal no agendamento.
                </p>
              )}
            </div>

            {/* Descrição */}
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Detalhes sobre o serviço..."
                value={editingService.description || ''}
                onChange={(e) =>
                  setEditingService({ ...editingService, description: e.target.value })
                }
              />
            </div>

            {/* Alertas */}
            <div className="grid gap-2">
              <Label htmlFor="alerts" className="text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Alertas / Avisos
              </Label>
              <Textarea
                id="alerts"
                className="border-amber-200 focus-visible:ring-amber-500"
                placeholder="Ex: Verificar carteira de vacinação, Jejum necessário..."
                value={editingService.alerts || ''}
                onChange={(e) =>
                  setEditingService({ ...editingService, alerts: e.target.value })
                }
              />
            </div>

            {/* Observações internas */}
            <div className="grid gap-2">
              <Label htmlFor="observations">Observações Internas</Label>
              <Input
                id="observations"
                placeholder="Visível apenas para equipe..."
                value={editingService.observations || ''}
                onChange={(e) =>
                  setEditingService({ ...editingService, observations: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        onClick={() => handleOpenDialog()}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 shadow-lg hover:shadow-xl"
        size="lg"
      >
        <Plus className="h-5 w-5" />
        Novo Serviço
      </Button>
    </div>
  )
}
