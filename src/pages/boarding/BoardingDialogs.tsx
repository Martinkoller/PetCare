import { useState, useEffect, useCallback } from 'react'
import { BoardingStay, Pet, Kennel, Product } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { toast } from 'sonner'
import { differenceInDays, addDays, parseISO, format } from 'date-fns'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useBoardingStore } from '@/stores/BoardingStore'
import { useClientStore } from '@/stores/ClientContext'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useInventoryStore } from '@/stores/InventoryStore'
import { useConfigStore } from '@/stores/ConfigStore'
import { Plus, UserPlus, CalendarPlus, X, Trash2 } from 'lucide-react'
import { PetDialog } from '@/pages/pets/PetDialog'
import { ClientDialog } from '@/pages/clients/ClientDialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/lib/utils'

// ─── Shared helper ────────────────────────────────────────────────────────────

function hasKennelConflict(
  kennelId: string,
  rangeStart: string,
  rangeEnd: string,
  stays: BoardingStay[],
  excludeStayId?: string,
): boolean {
  return stays.some((s) => {
    if (excludeStayId && s.id === excludeStayId) return false
    if (s.kennelNumber !== kennelId) return false
    if (s.status !== 'active' && s.status !== 'reserved') return false
    const sStart = s.checkIn
    const sEnd = s.actualCheckOut || s.checkOut
    return rangeStart < sEnd && rangeEnd > sStart
  })
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Period {
  checkIn: string
  checkOut: string
  kennelId: string
  tempId: string
}

interface SelectedProduct {
  product: Product
  quantity: number
}

// ─── CheckInDialog ────────────────────────────────────────────────────────────

interface CheckInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pets: Pet[]
  existingStays: BoardingStay[]
  kennels: Kennel[]
  onSave?: (stay: BoardingStay) => void
}

const CHECKIN_EMPTY = {
  petId: '',
  serviceId: '',
  dailyRate: 0,
  belongings: '',
  instructions: '',
  vaccinationStatus: '',
  feedingInstructions: '',
  behaviorNotes: '',
  emergencyVetContact: '',
  selectedTemplateId: 'none',
  periods: [] as Period[],
  currentCheckIn: new Date().toISOString().split('T')[0],
  currentCheckOut: '',
  currentKennelId: '',
}

export function CheckInDialog({ open, onOpenChange, pets, existingStays, kennels }: CheckInDialogProps) {
  const { addBoardingService, addBoardingStay } = useBoardingStore()
  const { addClient } = useClientStore()
  const { services, refreshAppointments } = useAppointmentStore()
  const { templates } = useConfigStore()
  const { products } = useInventoryStore()

  const [state, setState] = useState(CHECKIN_EMPTY)
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false)
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [newClientId, setNewClientId] = useState<string | null>(null)

  const set = useCallback((patch: Partial<typeof CHECKIN_EMPTY>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  const resetAll = useCallback(() => {
    setState({ ...CHECKIN_EMPTY, currentCheckIn: new Date().toISOString().split('T')[0] })
    setNewClientId(null)
  }, [])

  useEffect(() => {
    if (!open) return
    setState((prev) => ({ ...prev, currentCheckIn: new Date().toISOString().split('T')[0] }))
  }, [open])

  useEffect(() => {
    if (!state.serviceId) return
    const svc = services.find((s) => s.id === state.serviceId)
    if (svc) set({ dailyRate: svc.price })
  }, [state.serviceId, services, set])

  useEffect(() => {
    if (state.selectedTemplateId === 'none') return
    const tpl = templates.find((t) => t.id === state.selectedTemplateId)
    if (tpl && state.currentCheckIn) {
      const endDate = addDays(parseISO(state.currentCheckIn), tpl.defaultDurationDays)
      set({ currentCheckOut: format(endDate, 'yyyy-MM-dd') })
    }
  }, [state.selectedTemplateId, state.currentCheckIn, templates, set])

  const boardingServices = services.filter((s) => s.category === 'boarding')

  const getAvailableKennels = (start: string, end: string) => {
    if (!start || !end) return []
    const rangeEnd = end || start
    return kennels.filter((k) => {
      if (k.status === 'maintenance') return false
      if (hasKennelConflict(k.id, start, rangeEnd, existingStays)) return false
      if (state.periods.some((p) => hasKennelConflict(k.id, start, rangeEnd, [
        { ...existingStays[0], kennelNumber: p.kennelId, checkIn: p.checkIn, checkOut: p.checkOut, status: 'reserved', id: p.tempId } as any
      ]))) return false
      return true
    })
  }

  const currentAvailableKennels = getAvailableKennels(state.currentCheckIn, state.currentCheckOut)

  const handleAddPeriod = () => {
    if (!state.currentCheckIn || !state.currentCheckOut || !state.currentKennelId) {
      return toast.error('Preencha a data de entrada, saída e o canil')
    }
    if (state.currentCheckOut <= state.currentCheckIn) {
      return toast.error('A data de saída deve ser após a entrada')
    }
    set({
      periods: [...state.periods, {
        checkIn: state.currentCheckIn,
        checkOut: state.currentCheckOut,
        kennelId: state.currentKennelId,
        tempId: Math.random().toString(36).slice(2),
      }],
      currentCheckIn: '',
      currentCheckOut: '',
      currentKennelId: '',
    })
    toast.success('Período adicionado')
  }

  const handleSave = async (saveAndAddAnother = false) => {
    if (!state.petId) return toast.error('Selecione um pet')
    if (!state.serviceId) return toast.error('Selecione o pacote de hospedagem')

    let periodsToSave = [...state.periods]
    if (periodsToSave.length === 0) {
      if (!state.currentCheckOut || !state.currentKennelId) {
        return toast.error('Adicione um período ou preencha os dados atuais')
      }
      if (state.currentCheckOut <= state.currentCheckIn) {
        return toast.error('A data de saída deve ser após a entrada')
      }
      periodsToSave.push({
        checkIn: state.currentCheckIn,
        checkOut: state.currentCheckOut,
        kennelId: state.currentKennelId,
        tempId: 'temp',
      })
    }

    try {
      for (const p of periodsToSave) {
        const today = new Date().toISOString().split('T')[0]
        const stay: BoardingStay = {
          id: '',
          petId: state.petId,
          checkIn: new Date(`${p.checkIn}T12:00:00`).toISOString(),
          checkOut: new Date(`${p.checkOut}T12:00:00`).toISOString(),
          kennelNumber: p.kennelId,
          status: p.checkIn === today ? 'active' : 'reserved',
          dailyRate: state.dailyRate,
          serviceId: state.serviceId,
          belongings: state.belongings,
          specialInstructions: state.instructions,
          vaccinationStatus: state.vaccinationStatus,
          feedingInstructions: state.feedingInstructions,
          behaviorNotes: state.behaviorNotes,
          emergencyVetContact: state.emergencyVetContact,
        }

        const savedStay = await addBoardingStay(stay)

        if (state.selectedTemplateId !== 'none' && savedStay?.id) {
          const tpl = templates.find((t) => t.id === state.selectedTemplateId)
          if (tpl?.services) {
            for (const item of tpl.services) {
              const isService = item.type === 'service'
              const found = isService
                ? services.find((s) => s.id === item.id)
                : products.find((p) => p.id === item.id)
              const unitPrice = found?.price ?? 0
              const qty = item.quantity || 1
              await addBoardingService({
                boardingId: savedStay.id,
                serviceId: isService ? item.id : undefined,
                productId: !isService ? item.id : undefined,
                name: found?.name || 'Item',
                quantity: qty,
                unitPrice,
                totalPrice: unitPrice * qty,
              })
            }
          }
        }
      }

      toast.success(`${periodsToSave.length} agendamento(s) criado(s)!`)
      refreshAppointments()

      if (saveAndAddAnother) {
        set({ periods: [], currentCheckIn: new Date().toISOString().split('T')[0], currentCheckOut: '', currentKennelId: '' })
      } else {
        onOpenChange(false)
        resetAll()
      }
    } catch {
      toast.error('Erro ao salvar agendamentos')
    }
  }

  const handleClientSave = async (clientData: any) => {
    try {
      const created = await addClient(clientData)
      setNewClientId(created.id)
      setIsPetDialogOpen(true)
    } catch {
      toast.error('Erro ao cadastrar cliente')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetAll(); onOpenChange(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Check-in / Agendamento</DialogTitle>
            <DialogDescription>Registre entrada ou agende múltiplos períodos.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Pet & Pacote */}
            <div className="grid md:grid-cols-2 gap-4 border-b pb-4">
              <div className="grid gap-2">
                <Label>Pet</Label>
                <div className="flex gap-2">
                  <Select value={state.petId} onValueChange={(v) => set({ petId: v })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione o hóspede..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map((pet) => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name} ({pet.breed})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => setIsPetDialogOpen(true)} title="Novo Pet">
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setIsClientDialogOpen(true)} title="Novo Cliente">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Pacote de Hospedagem</Label>
                <Select value={state.serviceId} onValueChange={(v) => set({ serviceId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o pacote..." />
                  </SelectTrigger>
                  <SelectContent>
                    {boardingServices.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — {formatCurrency(s.price)}/dia
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.serviceId && (
                  <p className="text-xs text-muted-foreground">Diária: {formatCurrency(state.dailyRate)}</p>
                )}
              </div>
            </div>

            {/* Modelo */}
            <div className="grid gap-2">
              <Label>Modelo de Agendamento (opcional)</Label>
              <Select value={state.selectedTemplateId} onValueChange={(v) => set({ selectedTemplateId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.defaultDurationDays} dias)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="bg-muted/30 p-4 rounded-lg space-y-4">
              <Label className="font-semibold">Período</Label>
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div className="grid gap-2">
                  <Label>Entrada</Label>
                  <Input
                    type="date"
                    value={state.currentCheckIn}
                    onChange={(e) => set({ currentCheckIn: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Saída</Label>
                  <Input
                    type="date"
                    value={state.currentCheckOut}
                    min={state.currentCheckIn}
                    onChange={(e) => set({ currentCheckOut: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Canil Disponível</Label>
                  <Select value={state.currentKennelId} onValueChange={(v) => set({ currentKennelId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currentAvailableKennels.length === 0 ? (
                        <SelectItem value="_none" disabled>Nenhum canil disponível</SelectItem>
                      ) : (
                        currentAvailableKennels.map((k) => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.name} ({k.size})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAddPeriod}
                variant="secondary"
                className="w-full"
                disabled={!state.currentCheckOut || !state.currentKennelId}
              >
                <CalendarPlus className="mr-2 h-4 w-4" /> Adicionar à Lista
              </Button>
            </div>

            {/* Lista de períodos */}
            {state.periods.length > 0 && (
              <div className="border rounded-md">
                <div className="bg-muted p-2 text-sm font-medium grid grid-cols-4 gap-2">
                  <div>Entrada</div><div>Saída</div><div>Canil</div><div />
                </div>
                <div className="divide-y">
                  {state.periods.map((p) => (
                    <div key={p.tempId} className="p-2 text-sm grid grid-cols-4 gap-2 items-center">
                      <div>{format(parseISO(p.checkIn), 'dd/MM/yyyy')}</div>
                      <div>{format(parseISO(p.checkOut), 'dd/MM/yyyy')}</div>
                      <div>{kennels.find((k) => k.id === p.kennelId)?.name ?? p.kennelId}</div>
                      <div className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => set({ periods: state.periods.filter((x) => x.tempId !== p.tempId) })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pertences e instruções */}
            <div className="grid gap-2">
              <Label>Pertences</Label>
              <RichTextEditor
                placeholder="Coleira, brinquedos, ração..."
                value={state.belongings}
                onChange={(v) => set({ belongings: v })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Instruções Especiais</Label>
              <RichTextEditor
                placeholder="Medicação, alimentação, cuidados especiais..."
                value={state.instructions}
                onChange={(v) => set({ instructions: v })}
              />
            </div>

            {/* Ficha de admissão */}
            <div className="border-t pt-4 grid gap-4">
              <p className="text-sm font-semibold text-muted-foreground">Ficha de Admissão</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Status de Vacinação</Label>
                  <RichTextEditor
                    placeholder="Ex: V8 em dia (venc. 03/2027), antirrábica em dia..."
                    value={state.vaccinationStatus}
                    onChange={(v) => set({ vaccinationStatus: v })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Instruções de Alimentação</Label>
                  <RichTextEditor
                    placeholder="Ex: Ração X, 200g, 2× ao dia (7h e 18h)..."
                    value={state.feedingInstructions}
                    onChange={(v) => set({ feedingInstructions: v })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Notas de Comportamento</Label>
                  <RichTextEditor
                    placeholder="Ex: Late bastante, não socializa com cães grandes..."
                    value={state.behaviorNotes}
                    onChange={(v) => set({ behaviorNotes: v })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Contato Veterinário de Emergência</Label>
                  <Input
                    placeholder="Ex: Dr. Silva — (51) 99999-0000 — Clínica Patas"
                    value={state.emergencyVetContact}
                    onChange={(e) => set({ emergencyVetContact: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-end gap-2">
            <Button variant="outline" onClick={() => handleSave(true)}>
              Salvar e Adicionar Outro
            </Button>
            <Button onClick={() => handleSave(false)}>Confirmar Agendamentos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PetDialog
        open={isPetDialogOpen}
        onOpenChange={setIsPetDialogOpen}
        onSave={(pet) => { set({ petId: pet.id }); toast.success('Pet cadastrado e selecionado.') }}
        initialClientId={newClientId || undefined}
      />
      <ClientDialog
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
        onSave={handleClientSave}
      />
    </>
  )
}

// ─── CheckOutDialog ───────────────────────────────────────────────────────────

interface CheckOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (stay: BoardingStay) => void
  stay: BoardingStay
  petName: string
}

export function CheckOutDialog({ open, onOpenChange, onSave, stay, petName }: CheckOutDialogProps) {
  const { services: allServices } = useAppointmentStore()
  const { products } = useInventoryStore()
  const { addBoardingService } = useBoardingStore()

  const [observations, setObservations] = useState('')
  const [actualCheckOut, setActualCheckOut] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [pickerProductId, setPickerProductId] = useState('')
  const [pickerQty, setPickerQty] = useState(1)
  const [saving, setSaving] = useState(false)

  // Reset ao abrir
  useEffect(() => {
    if (!open) return
    setObservations('')
    setActualCheckOut(new Date().toISOString().split('T')[0])
    setPaymentMethod('pix')
    setSelectedProducts([])
    setPickerProductId('')
    setPickerQty(1)
  }, [open])

  const checkInDate = new Date(stay.actualCheckIn || stay.checkIn)
  const checkOutDate = actualCheckOut ? new Date(actualCheckOut) : new Date()
  const days = Math.max(1, differenceInDays(checkOutDate, checkInDate))

  const boardingTotal = days * stay.dailyRate
  const extraServicesTotal = stay.services?.reduce((acc, item) => acc + item.totalPrice, 0) ?? 0
  const selectedProductsTotal = selectedProducts.reduce((acc, sp) => acc + sp.product.price * sp.quantity, 0)
  const grandTotal = boardingTotal + extraServicesTotal + selectedProductsTotal

  const mainService = allServices.find((s) => s.id === stay.serviceId)
  const availableProducts = products.filter((p) => p.stock > 0)

  const addProductToList = () => {
    const product = products.find((p) => p.id === pickerProductId)
    if (!product) return
    setSelectedProducts((prev) => {
      const existing = prev.find((sp) => sp.product.id === pickerProductId)
      if (existing) {
        return prev.map((sp) => sp.product.id === pickerProductId ? { ...sp, quantity: sp.quantity + pickerQty } : sp)
      }
      return [...prev, { product, quantity: pickerQty }]
    })
    setPickerProductId('')
    setPickerQty(1)
  }

  const handleFinish = async () => {
    if (!actualCheckOut) return toast.error('Informe a data de saída')
    setSaving(true)
    try {
      for (const sp of selectedProducts) {
        await addBoardingService({
          boardingId: stay.id,
          productId: sp.product.id,
          name: sp.product.name,
          quantity: sp.quantity,
          unitPrice: sp.product.price,
          totalPrice: sp.product.price * sp.quantity,
        })
      }
      onSave({
        ...stay,
        status: 'completed',
        actualCheckOut: new Date(`${actualCheckOut}T12:00:00`).toISOString(),
        observations,
        totalPrice: grandTotal,
        paymentMethod,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Check-out: {petName}</DialogTitle>
          <DialogDescription>Registre os produtos utilizados e finalize a estadia.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="grid gap-6 py-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Coluna esquerda */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Resumo da Estadia</h3>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm border">
                  <div className="flex justify-between">
                    <span>Entrada:</span>
                    <span className="font-medium">{checkInDate.toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saída:</span>
                    <span className="font-medium">{checkOutDate.toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duração:</span>
                    <span className="font-medium">{days} dia{days !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Data de Saída</Label>
                  <Input
                    type="date"
                    value={actualCheckOut}
                    min={new Date(stay.actualCheckIn || stay.checkIn).toISOString().split('T')[0]}
                    onChange={(e) => setActualCheckOut(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Produtos Utilizados</h3>
                  <div className="flex gap-2">
                    <Select value={pickerProductId} onValueChange={setPickerProductId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione o produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {formatCurrency(p.price)}/{p.unit || 'un'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      value={pickerQty}
                      onChange={(e) => setPickerQty(Math.max(1, Number(e.target.value)))}
                      className="w-16 text-center"
                    />
                    <Button type="button" variant="secondary" size="icon" onClick={addProductToList} disabled={!pickerProductId}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedProducts.length > 0 && (
                    <div className="border rounded-md divide-y text-sm">
                      {selectedProducts.map((sp) => (
                        <div key={sp.product.id} className="flex items-center justify-between px-3 py-2">
                          <div>
                            <span className="font-medium">{sp.product.name}</span>
                            <span className="text-muted-foreground ml-2">{sp.quantity}× {formatCurrency(sp.product.price)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatCurrency(sp.product.price * sp.quantity)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500 hover:text-red-600"
                              onClick={() => setSelectedProducts((prev) => prev.filter((x) => x.product.id !== sp.product.id))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Observações Finais</Label>
                  <RichTextEditor
                    placeholder="Comportamento, consumo de ração..."
                    value={observations}
                    onChange={setObservations}
                  />
                </div>
              </div>

              {/* Coluna direita */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Detalhamento Financeiro</h3>
                <div className="border rounded-lg overflow-hidden text-sm">
                  <div className="bg-muted p-2 font-medium grid grid-cols-4 gap-2">
                    <div className="col-span-2">Item</div>
                    <div className="text-right">Qtd</div>
                    <div className="text-right">Total</div>
                  </div>
                  <div className="divide-y">
                    <div className="p-2 grid grid-cols-4 gap-2">
                      <div className="col-span-2 font-medium">{mainService?.name || 'Diária Hospedagem'}</div>
                      <div className="text-right">{days}</div>
                      <div className="text-right">{formatCurrency(boardingTotal)}</div>
                    </div>
                    {stay.services?.map((item) => (
                      <div key={item.id} className="p-2 grid grid-cols-4 gap-2">
                        <div className="col-span-2 text-muted-foreground">{item.name}</div>
                        <div className="text-right">{item.quantity}</div>
                        <div className="text-right">{formatCurrency(item.totalPrice)}</div>
                      </div>
                    ))}
                    {selectedProducts.map((sp) => (
                      <div key={sp.product.id} className="p-2 grid grid-cols-4 gap-2 bg-blue-50/50">
                        <div className="col-span-2 text-blue-700">{sp.product.name}</div>
                        <div className="text-right">{sp.quantity}</div>
                        <div className="text-right">{formatCurrency(sp.product.price * sp.quantity)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-muted/50 p-3 flex justify-between items-center font-bold text-lg border-t">
                    <span>Total Final</span>
                    <span className="text-green-600">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleFinish}
            disabled={saving || !actualCheckOut}
            className="w-full sm:w-auto"
          >
            {saving ? 'Salvando...' : 'Finalizar e Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── ConfirmCheckInDialog ─────────────────────────────────────────────────────

interface ConfirmCheckInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stay: BoardingStay
  petName: string
  onConfirmed?: (stay: BoardingStay) => void
}

export function ConfirmCheckInDialog({ open, onOpenChange, stay, petName, onConfirmed }: ConfirmCheckInDialogProps) {
  const { kennels, boardingStays, updateBoardingStay } = useBoardingStore()
  const { refreshAppointments } = useAppointmentStore()
  const [kennelId, setKennelId] = useState(stay.kennelNumber || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setKennelId(stay.kennelNumber || '')
  }, [open, stay.kennelNumber])

  const availableKennels = kennels.filter((k) => {
    if (k.status === 'maintenance') return false
    return !hasKennelConflict(k.id, stay.checkIn, stay.actualCheckOut || stay.checkOut, boardingStays, stay.id)
  })

  const vaccinationMissing = !stay.vaccinationStatus || stripHtml(stay.vaccinationStatus) === ''

  const handleConfirm = async () => {
    if (!kennelId) return toast.error('Selecione o canil')
    setSaving(true)
    try {
      const updatedStay = {
        ...stay,
        kennelNumber: kennelId,
        status: 'active' as const,
        actualCheckIn: new Date().toISOString(),
      }
      await updateBoardingStay(updatedStay)
      refreshAppointments()
      onConfirmed?.(updatedStay)
      toast.success(`Check-in de ${petName} confirmado!`)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirmar Check-in</DialogTitle>
          <DialogDescription>
            {petName} — entrada prevista para {new Date(stay.checkIn).toLocaleDateString('pt-BR')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Canil</Label>
            <Select value={kennelId} onValueChange={setKennelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o canil..." />
              </SelectTrigger>
              <SelectContent>
                {availableKennels.length === 0 ? (
                  <SelectItem value="_none" disabled>Nenhum canil disponível</SelectItem>
                ) : (
                  availableKennels.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.name} ({k.size})</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {vaccinationMissing && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <span className="text-base shrink-0">⚠️</span>
              <div>
                <p className="font-medium">Vacinação não informada</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Nenhum status de vacinação foi registrado. Confirme com o tutor antes de prosseguir.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirm}
            disabled={saving || !kennelId}
            className=""
          >
            {saving ? 'Confirmando...' : 'Confirmar Check-in'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
