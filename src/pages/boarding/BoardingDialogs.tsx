import { useState, useEffect } from 'react'
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
import { usePetStore } from '@/stores/PetContext'
import { useClientStore } from '@/stores/ClientContext'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useInventoryStore } from '@/stores/InventoryStore'
import { useConfigStore } from '@/stores/ConfigStore'
import { Plus, UserPlus, CalendarPlus, X, Trash2 } from 'lucide-react'
import { PetDialog } from '@/pages/pets/PetDialog'
import { ClientDialog } from '@/pages/clients/ClientDialog'
import { SignaturePad } from '@/components/SignaturePad'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/lib/utils'

interface CheckInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (stay: BoardingStay) => void // Made optional as we use store directly
  pets: Pet[]
  existingStays: BoardingStay[]
  kennels: Kennel[]
}

interface Period {
  checkIn: string
  checkOut: string
  kennelId: string
  tempId: string
}

export function CheckInDialog({
  open,
  onOpenChange,
  pets,
  existingStays,
  kennels,
}: CheckInDialogProps) {
  const { addBoardingService, addBoardingStay } = useBoardingStore()
  const { addPet } = usePetStore()
  const { addClient } = useClientStore()
  const { services, refreshAppointments } = useAppointmentStore()
  const { templates } = useConfigStore()
  const { products } = useInventoryStore()
  const [petId, setPetId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [dailyRate, setDailyRate] = useState(0)
  const [belongings, setBelongings] = useState('')
  const [instructions, setInstructions] = useState('')

  // Multiple Periods Support
  const [periods, setPeriods] = useState<Period[]>([])
  const [currentCheckIn, setCurrentCheckIn] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [currentCheckOut, setCurrentCheckOut] = useState('')
  const [currentKennelId, setCurrentKennelId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none')

  // Dialog states for new pet/client
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false)
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [newClientId, setNewClientId] = useState<string | null>(null)

  const boardingServices = services.filter((s) => s.category === 'boarding')

  // Filter available kennels for CURRENT input selection
  const getAvailableKennels = (start: string, end: string) => {
    if (!start) return []
    return kennels.filter((k) => {
      if (k.status === 'maintenance') return false
      // Check against existing database stays
      const dbConflict = existingStays.some((stay) => {
        if (stay.status !== 'active' && stay.status !== 'reserved') return false
        const stayStart = stay.checkIn
        const stayEnd = stay.actualCheckOut || stay.checkOut
        const rangeStart = start
        const rangeEnd = end || start

        return (
          stay.kennelNumber === k.id &&
          ((rangeStart >= stayStart && rangeStart < stayEnd) ||
            (rangeEnd > stayStart && rangeEnd <= stayEnd) ||
            (rangeStart <= stayStart && rangeEnd >= stayEnd))
        )
      })
      if (dbConflict) return false

      // Check against periods currently being added in this dialog
      const localConflict = periods.some((p) => {
        const pStart = p.checkIn
        const pEnd = p.checkOut
        const rangeStart = start
        const rangeEnd = end || start
        return (
          p.kennelId === k.id &&
          ((rangeStart >= pStart && rangeStart < pEnd) ||
            (rangeEnd > pStart && rangeEnd <= pEnd) ||
            (rangeStart <= pStart && rangeEnd >= pEnd))
        )
      })
      if (localConflict) return false

      return true
    })
  }

  const currentAvailableKennels = getAvailableKennels(
    currentCheckIn,
    currentCheckOut,
  )

  useEffect(() => {
    if (serviceId) {
      const service = services.find((s) => s.id === serviceId)
      if (service) {
        setDailyRate(service.price)
      }
    }
  }, [serviceId, services])

  useEffect(() => {
    if (selectedTemplateId && selectedTemplateId !== 'none') {
      const tpl = templates.find((t) => t.id === selectedTemplateId)
      if (tpl) {
        if (currentCheckIn) {
          const endDate = addDays(
            parseISO(currentCheckIn),
            tpl.defaultDurationDays,
          )
          setCurrentCheckOut(format(endDate, 'yyyy-MM-dd'))
        }
      }
    }
  }, [selectedTemplateId, currentCheckIn, templates])

  const handleAddPeriod = () => {
    if (!currentCheckIn || !currentCheckOut || !currentKennelId) {
      return toast.error('Preencha as datas e o canil')
    }
    setPeriods([
      ...periods,
      {
        checkIn: currentCheckIn,
        checkOut: currentCheckOut,
        kennelId: currentKennelId,
        tempId: Math.random().toString(36),
      },
    ])
    // Reset for next
    setCurrentCheckIn('')
    setCurrentCheckOut('')
    setCurrentKennelId('')
    toast.success('Período adicionado à lista')
  }

  const handleRemovePeriod = (id: string) => {
    setPeriods(periods.filter((p) => p.tempId !== id))
  }

  const handleSave = async (saveAndAddAnother = false) => {
    if (!petId) return toast.error('Selecione um pet')
    if (!serviceId) return toast.error('Selecione o pacote de hospedagem')

    let periodsToSave = [...periods]
    if (periodsToSave.length === 0) {
      if (!currentCheckOut || !currentKennelId) {
        return toast.error('Adicione um período ou preencha os dados atuais')
      }
      periodsToSave.push({
        checkIn: currentCheckIn,
        checkOut: currentCheckOut,
        kennelId: currentKennelId,
        tempId: 'temp',
      })
    }

    try {
      for (const p of periodsToSave) {
        const checkInDate = new Date(`${p.checkIn}T12:00:00`)
        const checkOutDate = new Date(`${p.checkOut}T12:00:00`)
        const isToday =
          p.checkIn === new Date().toISOString().split('T')[0]
        const stay: BoardingStay = {
          id: '',
          petId,
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
          kennelNumber: p.kennelId,
          status: isToday ? 'active' : 'reserved',
          dailyRate: dailyRate,
          serviceId,
          belongings,
          specialInstructions: instructions,
        }

        const savedStay = await addBoardingStay(stay)

        if (
          selectedTemplateId &&
          selectedTemplateId !== 'none' &&
          savedStay?.id
        ) {
          const tpl = templates.find((t) => t.id === selectedTemplateId)
          if (tpl && tpl.services) {
            for (const item of tpl.services) {
              await addBoardingService({
                boardingId: savedStay.id,
                serviceId: item.type === 'service' ? item.id : undefined,
                productId: item.type === 'product' ? item.id : undefined,
                name:
                  item.type === 'service'
                    ? services.find((s) => s.id === item.id)?.name || 'Item'
                    : products.find((p) => p.id === item.id)?.name || 'Item',
                quantity: item.quantity,
                unitPrice: 0, // Should be fetched but kept 0 for now as logic is backend or service
                totalPrice: 0,
              })
            }
          }
        }
      }

      toast.success(`${periodsToSave.length} agendamento(s) criado(s)!`)
      refreshAppointments()

      if (saveAndAddAnother) {
        setPeriods([])
        setCurrentCheckIn(new Date().toISOString().split('T')[0])
        setCurrentCheckOut('')
        setCurrentKennelId('')
      } else {
        onOpenChange(false)
        setPetId('')
        setPeriods([])
        setBelongings('')
        setInstructions('')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao salvar agendamentos')
    }
  }

  const handleClientSave = async (clientData: any) => {
    try {
      const created = await addClient(clientData)
      setNewClientId(created.id)
      setIsPetDialogOpen(true)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Check-in / Agendamento em Massa</DialogTitle>
            <DialogDescription>
              Registre entrada ou agende múltiplos períodos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Top Section: Pet & Service */}
            <div className="grid md:grid-cols-2 gap-4 border-b pb-4">
              <div className="grid gap-2">
                <Label>Pet</Label>
                <div className="flex gap-2">
                  <Select value={petId} onValueChange={setPetId}>
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPetDialogOpen(true)}
                    title="Novo Pet"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsClientDialogOpen(true)}
                    title="Novo Cliente"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Pacote de Hospedagem</Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o pacote..." />
                  </SelectTrigger>
                  <SelectContent>
                    {boardingServices.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} - {formatCurrency(s.price)}/dia
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {serviceId && (
                  <p className="text-xs text-muted-foreground">
                    Diária: {formatCurrency(dailyRate)}
                  </p>
                )}
              </div>
            </div>

            {/* Template & Extras */}
            <div className="grid gap-2">
              <Label>Modelo de Agendamento (Opcional)</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo para preencher..." />
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
              {selectedTemplateId !== 'none' && (
                <p className="text-xs text-muted-foreground">
                  Aplicar modelo preencherá a duração e adicionará serviços
                  extras automaticamente após salvar.
                </p>
              )}
            </div>

            {/* Date & Kennel Section */}
            <div className="bg-muted/30 p-4 rounded-lg space-y-4">
              <Label className="font-semibold">Adicionar Período</Label>
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div className="grid gap-2">
                  <Label>Entrada</Label>
                  <Input
                    type="date"
                    value={currentCheckIn}
                    onChange={(e) => setCurrentCheckIn(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Saída</Label>
                  <Input
                    type="date"
                    value={currentCheckOut}
                    min={currentCheckIn}
                    onChange={(e) => setCurrentCheckOut(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Canil Disponível</Label>
                  <Select
                    value={currentKennelId}
                    onValueChange={setCurrentKennelId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currentAvailableKennels.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.name} ({k.size})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAddPeriod}
                variant="secondary"
                className="w-full"
                disabled={!currentCheckOut || !currentKennelId}
              >
                <CalendarPlus className="mr-2 h-4 w-4" /> Adicionar à Lista
              </Button>
            </div>

            {/* Periods List */}
            {periods.length > 0 && (
              <div className="border rounded-md">
                <div className="bg-muted p-2 text-sm font-medium grid grid-cols-4 gap-2">
                  <div>Entrada</div>
                  <div>Saída</div>
                  <div>Canil</div>
                  <div></div>
                </div>
                <div className="divide-y">
                  {periods.map((p) => (
                    <div
                      key={p.tempId}
                      className="p-2 text-sm grid grid-cols-4 gap-2 items-center"
                    >
                      <div>{format(parseISO(p.checkIn), 'dd/MM/yyyy')}</div>
                      <div>{format(parseISO(p.checkOut), 'dd/MM/yyyy')}</div>
                      <div>
                        Canil {kennels.find((k) => k.id === p.kennelId)?.name}
                      </div>
                      <div className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePeriod(p.tempId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Pertences</Label>
              <RichTextEditor
                placeholder="Coleira, brinquedos, ração..."
                value={belongings}
                onChange={setBelongings}
              />
            </div>

            <div className="grid gap-2">
              <Label>Instruções Especiais</Label>
              <RichTextEditor
                placeholder="Medicação, alimentação, cuidados..."
                value={instructions}
                onChange={setInstructions}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-end gap-2">
            <Button variant="outline" onClick={() => handleSave(true)}>
              Salvar e Adicionar Outro
            </Button>
            <Button onClick={() => handleSave(false)}>
              Confirmar Agendamentos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PetDialog
        open={isPetDialogOpen}
        onOpenChange={setIsPetDialogOpen}
        onSave={(pet) => {
          // PetDialog already handles persistence via usePetStore
          setPetId(pet.id)
          toast.success('Pet cadastrado e selecionado.')
        }}
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

interface CheckOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (stay: BoardingStay) => void
  stay: BoardingStay
  petName: string
}

interface SelectedProduct {
  product: Product
  quantity: number
}

export function CheckOutDialog({
  open,
  onOpenChange,
  onSave,
  stay,
  petName,
}: CheckOutDialogProps) {
  const { services: allServices } = useAppointmentStore()
  const { products } = useInventoryStore()
  const { addBoardingService } = useBoardingStore()
  const [observations, setObservations] = useState('')
  const [actualCheckOut, setActualCheckOut] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [signature, setSignature] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [pickerProductId, setPickerProductId] = useState('')
  const [pickerQty, setPickerQty] = useState(1)
  const [saving, setSaving] = useState(false)

  const availableProducts = products.filter((p) => p.stock > 0)

  const addProductToList = () => {
    const product = products.find((p) => p.id === pickerProductId)
    if (!product) return
    setSelectedProducts((prev) => {
      const existing = prev.find((sp) => sp.product.id === pickerProductId)
      if (existing) {
        return prev.map((sp) =>
          sp.product.id === pickerProductId
            ? { ...sp, quantity: sp.quantity + pickerQty }
            : sp,
        )
      }
      return [...prev, { product, quantity: pickerQty }]
    })
    setPickerProductId('')
    setPickerQty(1)
  }

  const removeProduct = (productId: string) =>
    setSelectedProducts((prev) => prev.filter((sp) => sp.product.id !== productId))

  const days = Math.max(
    1,
    differenceInDays(
      new Date(actualCheckOut),
      new Date(stay.actualCheckIn || stay.checkIn),
    ),
  )

  const boardingTotal = days * stay.dailyRate
  const extraServicesTotal =
    stay.services?.reduce((acc, item) => acc + item.totalPrice, 0) || 0
  const selectedProductsTotal = selectedProducts.reduce(
    (acc, sp) => acc + sp.product.price * sp.quantity,
    0,
  )
  const grandTotal = boardingTotal + extraServicesTotal + selectedProductsTotal

  const mainService = allServices.find((s) => s.id === stay.serviceId)

  const handleFinish = async () => {
    if (!signature) {
      return toast.error('A assinatura do responsável é obrigatória.')
    }
    setSaving(true)
    try {
      // Persist each selected product as a boarding service item
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
        actualCheckOut: new Date().toISOString(),
        observations,
        totalPrice: grandTotal,
        signature: signature,
      })
      onOpenChange(false)
      setSelectedProducts([])
      setObservations('')
      setSignature(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Check-out: {petName}</DialogTitle>
          <DialogDescription>
            Registre os produtos utilizados e finalize a estadia.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="grid gap-6 py-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Resumo da Estadia</h3>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm border">
                  <div className="flex justify-between">
                    <span>Entrada:</span>
                    <span className="font-medium">
                      {new Date(stay.actualCheckIn || stay.checkIn).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saída:</span>
                    <span className="font-medium">
                      {new Date(actualCheckOut).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duração:</span>
                    <span className="font-medium">{days} dias</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Data de Saída</Label>
                  <Input
                    type="date"
                    value={actualCheckOut}
                    onChange={(e) => setActualCheckOut(e.target.value)}
                  />
                </div>

                {/* Products used */}
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
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={addProductToList}
                      disabled={!pickerProductId}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedProducts.length > 0 && (
                    <div className="border rounded-md divide-y text-sm">
                      {selectedProducts.map((sp) => (
                        <div key={sp.product.id} className="flex items-center justify-between px-3 py-2">
                          <div>
                            <span className="font-medium">{sp.product.name}</span>
                            <span className="text-muted-foreground ml-2">
                              {sp.quantity}× {formatCurrency(sp.product.price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatCurrency(sp.product.price * sp.quantity)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500 hover:text-red-600"
                              onClick={() => removeProduct(sp.product.id)}
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

              {/* Right column */}
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
                      <div className="col-span-2 font-medium">
                        {mainService?.name || 'Diária Hospedagem'}
                      </div>
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
                  <Label>Assinatura do Responsável</Label>
                  <SignaturePad
                    onEnd={setSignature}
                    className="h-32 border rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleFinish}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
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

export function ConfirmCheckInDialog({
  open,
  onOpenChange,
  stay,
  petName,
  onConfirmed,
}: ConfirmCheckInDialogProps) {
  const { kennels, boardingStays, updateBoardingStay } = useBoardingStore()
  const { refreshAppointments } = useAppointmentStore()
  const [kennelId, setKennelId] = useState(stay.kennelNumber || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setKennelId(stay.kennelNumber || '')
  }, [open, stay.kennelNumber])

  const availableKennels = kennels.filter((k) => {
    if (k.status === 'maintenance') return false
    const conflict = boardingStays.some(
      (s) =>
        s.id !== stay.id &&
        s.kennelNumber === k.id &&
        (s.status === 'active' || s.status === 'reserved'),
    )
    return !conflict
  })

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
            {petName} — entrada prevista para{' '}
            {new Date(stay.checkIn).toLocaleDateString('pt-BR')}
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
                {availableKennels.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.name} ({k.size})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirm}
            disabled={saving || !kennelId}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {saving ? 'Confirmando...' : 'Confirmar Check-in'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
