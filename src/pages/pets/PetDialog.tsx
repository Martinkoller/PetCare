import { useState, useEffect } from 'react'
import { Pet } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { usePetStore } from '@/stores/PetContext'
import { useClientStore } from '@/stores/ClientContext'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dog, Cat, Bird, HelpCircle, Heart, AlertCircle, Info, User,
  CalendarDays, Home, Activity, Stethoscope, Syringe, Loader2,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import api from '@/lib/api'

interface PetHistory {
  appointments: Array<{
    id: string; date: string; serviceType: string; status: string; notes?: string; price?: number
  }>
  boardings: Array<{
    id: string; checkIn: string; checkOut?: string; status: string; kennelNumber?: string
    totalPrice?: number; notes?: string; services: Array<{ name: string; totalPrice: number }>
  }>
  hospitalizations: Array<{
    id: string; admittedAt: string; dischargeAt?: string; status: string; kennelNumber?: string
    reasonForAdmission?: string; finalDiagnosis?: string; dischargeType?: string
  }>
  medicalRecords: Array<{
    id: string; date: string; description?: string; diagnosis?: string; treatment?: string
  }>
  vaccinations: Array<{
    id: string; name: string; date: string; nextDueDate?: string; batch?: string
  }>
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  consultation: 'Consulta',
  grooming: 'Banho e Tosa',
  boarding: 'Hospedagem',
  hospitalization: 'Internação',
  surgery: 'Cirurgia',
  exam: 'Exame',
  vaccine: 'Vacinação',
  return: 'Retorno',
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-cyan-100 text-cyan-700',
  in_progress: 'bg-violet-100 text-violet-700',
  active: 'bg-violet-100 text-violet-700',
  reserved: 'bg-slate-100 text-slate-700',
  admitted: 'bg-slate-100 text-slate-700',
  treatment: 'bg-blue-100 text-blue-700',
  critical: 'bg-red-100 text-red-700',
  discharged: 'bg-emerald-100 text-emerald-700',
  transferred: 'bg-violet-100 text-violet-700',
  deceased: 'bg-zinc-200 text-zinc-700',
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Finalizado', cancelled: 'Cancelado', scheduled: 'Agendado',
  confirmed: 'Confirmado', checked_in: 'Em atendimento', in_progress: 'Em andamento',
  active: 'Ativo', reserved: 'Reservado', admitted: 'Internado',
  treatment: 'Em tratamento', critical: 'Crítico', discharged: 'Alta',
  transferred: 'Transferido', deceased: 'Óbito',
}

function fmtDate(val?: string | null) {
  if (!val) return '--'
  try { return format(new Date(val), 'dd/MM/yyyy', { locale: ptBR }) } catch { return '--' }
}

function fmtDateTime(val?: string | null) {
  if (!val) return '--'
  try { return format(new Date(val), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) } catch { return '--' }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn('text-[10px] font-bold border-none shrink-0', STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600')}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

function EmptyRow() {
  return <p className="py-6 text-center text-sm text-muted-foreground italic">Nenhum registro encontrado.</p>
}

function HistorySection({
  icon, title, count, children,
}: {
  icon: React.ReactNode; title: string; count: number; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b">
        {icon}
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <Badge variant="outline" className="ml-auto text-xs">{count}</Badge>
      </div>
      <div>{children}</div>
    </div>
  )
}

interface PetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (pet: Pet) => void
  pet?: Pet | null
  initialClientId?: string
}

export function PetDialog({
  open,
  onOpenChange,
  onSave,
  pet,
  initialClientId,
}: PetDialogProps) {
  const { addPet, updatePet } = usePetStore()
  const { clients } = useClientStore()
  const [formData, setFormData] = useState<Partial<Pet>>({
    name: '',
    species: 'dog',
    breed: '',
    gender: 'male',
    age: 0,
    weight: 0,
    clientId: initialClientId || '',
    notes: '',
    isCastrated: false,
    clinicalAlert: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [history, setHistory] = useState<PetHistory | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (pet) {
      setFormData({
        ...pet,
        isCastrated: pet.isCastrated ?? false,
        clinicalAlert: pet.clinicalAlert ?? '',
      })
    } else {
      setFormData({
        name: '',
        species: 'dog',
        breed: '',
        gender: 'male',
        age: 0,
        weight: 0,
        clientId: initialClientId || '',
        notes: '',
        isCastrated: false,
        clinicalAlert: '',
      })
      setHistory(null)
    }
  }, [pet, open, initialClientId])

  useEffect(() => {
    if (activeTab === 'history' && pet?.id && !history && !historyLoading) {
      setHistoryLoading(true)
      api.get<PetHistory>(`/pets/${pet.id}/history`)
        .then((r) => setHistory(r.data))
        .catch(() => toast.error('Erro ao carregar histórico.'))
        .finally(() => setHistoryLoading(false))
    }
  }, [activeTab, pet?.id])

  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.clientId ||
      !formData.breed ||
      !formData.species
    ) {
      return toast.error(
        'Preencha os campos obrigatórios (Nome, Tutor, Raça, Espécie)',
      )
    }

    setIsSaving(true)

    try {
      const petData: Pet = {
        id: pet?.id || '',
        name: formData.name!,
        species: formData.species as any,
        breed: formData.breed!,
        age: Number(formData.age),
        weight: Number(formData.weight),
        gender: formData.gender as any,
        size: formData.size,
        clientId: formData.clientId!,
        notes: formData.notes,
        isCastrated: formData.isCastrated,
        clinicalAlert: formData.clinicalAlert,
        avatar:
          pet?.avatar ||
          `https://img.usecurling.com/p/200/200?q=${formData.breed || 'pet'}`,
        medicalHistory: pet?.medicalHistory || [],
        vaccinations: pet?.vaccinations || [],
        documents: pet?.documents || [],
      }

      let savedPet: Pet
      if (pet?.id) {
        savedPet = await updatePet(petData)
        toast.success('Ficha do pet atualizada!')
      } else {
        savedPet = await addPet(petData)
        toast.success('Pet cadastrado com sucesso!')
      }

      onSave(savedPet)
      onOpenChange(false)
    } catch (e: any) {
      toast.error('Erro ao salvar pet.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-white">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {pet ? `Ficha de ${pet.name}` : 'Cadastrar Novo Pet'}
          </DialogTitle>
          <DialogDescription className="text-base text-slate-500">
            {pet
              ? 'Gerencie as informações detalhadas e o prontuário do pet.'
              : 'Preencha os campos abaixo para adicionar o pet ao cliente.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-8 border-b bg-slate-50/50">
            <TabsList className="bg-transparent h-12 p-0 gap-8">
              <TabsTrigger 
                value="details" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none px-0 h-full font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all"
              >
                Dados Cadastrais
              </TabsTrigger>
              <TabsTrigger
                value="history"
                disabled={!pet}
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent rounded-none px-0 h-full font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all"
              >
                Histórico Completo
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-8 pb-8">
            <TabsContent value="details" className="mt-0 pt-8 space-y-10 focus-visible:outline-none">
              {/* Seção: Identificação */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-[0.1em]">
                  <User className="h-3 w-3" /> Identificação & Tutor
                  <div className="h-[1px] flex-1 bg-slate-100 ml-1" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Tutor Responsável *</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(val) => setFormData({ ...formData, clientId: val })}
                      disabled={!!initialClientId && !pet}
                    >
                      <SelectTrigger className="h-12 bg-slate-50/50">
                        <SelectValue placeholder="Selecione o tutor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} • {c.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">Nome do Pet *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Rex, Luna..."
                      className="h-12 bg-slate-50/50"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Características */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-[0.1em]">
                  <HelpCircle className="h-3 w-3" /> Características & Raça
                  <div className="h-[1px] flex-1 bg-slate-100 ml-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Espécie *</Label>
                    <Select
                      value={formData.species}
                      onValueChange={(val: any) => setFormData({ ...formData, species: val })}
                    >
                      <SelectTrigger className="h-12 bg-slate-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dog"><div className="flex items-center gap-2"><Dog className="h-4 w-4" /> Cachorro</div></SelectItem>
                        <SelectItem value="cat"><div className="flex items-center gap-2"><Cat className="h-4 w-4" /> Gato</div></SelectItem>
                        <SelectItem value="bird"><div className="flex items-center gap-2"><Bird className="h-4 w-4" /> Pássaro</div></SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="breed" className="text-sm font-semibold">Raça *</Label>
                    <Input
                      id="breed"
                      placeholder="Ex: Golden Retriever, SRD..."
                      className="h-12 bg-slate-50/50"
                      value={formData.breed}
                      onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Porte</Label>
                    <Select
                      value={formData.size || ''}
                      onValueChange={(val: any) => setFormData({ ...formData, size: val || undefined })}
                    >
                      <SelectTrigger className="h-12 bg-slate-50/50">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">P — Pequeno</SelectItem>
                        <SelectItem value="medium">M — Médio</SelectItem>
                        <SelectItem value="large">G — Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Gênero</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(val: any) => setFormData({ ...formData, gender: val })}
                    >
                      <SelectTrigger className="h-12 bg-slate-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Macho</SelectItem>
                        <SelectItem value="female">Fêmea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 h-12 mt-auto">
                    <Label htmlFor="isCastrated" className="font-bold text-sm cursor-pointer">Castrado?</Label>
                    <Switch 
                      id="isCastrated" 
                      checked={formData.isCastrated} 
                      onCheckedChange={(val) => setFormData({...formData, isCastrated: val})} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm font-semibold">Idade (anos)</Label>
                    <Input
                      id="age"
                      type="number"
                      className="h-12 bg-slate-50/50"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-semibold">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      className="h-12 bg-slate-50/50"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Clínica & Observações */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-[0.1em]">
                  <Heart className="h-3 w-3" /> Saúde & Alertas
                  <div className="h-[1px] flex-1 bg-slate-100 ml-1" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicalAlert" className="text-sm font-semibold text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Alerta Clínico (Urgente)
                  </Label>
                  <Input
                    id="clinicalAlert"
                    placeholder="Ex: Alérgico a Penicilina, Manejo Sensível..."
                    className="h-12 bg-red-50/30 border-red-100 text-red-800 placeholder:text-red-300 font-bold"
                    value={formData.clinicalAlert}
                    onChange={(e) => setFormData({ ...formData, clinicalAlert: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-semibold">Observações Operacionais</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações sobre comportamento, preferências ou cuidados especiais..."
                    className="min-h-[120px] bg-slate-50/50 resize-none p-4"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="focus-visible:outline-none pt-6 space-y-6">
              {historyLoading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Carregando histórico...
                </div>
              ) : !history ? null : (
                <>
                  {/* Agendamentos */}
                  <HistorySection
                    icon={<CalendarDays className="h-4 w-4 text-blue-600" />}
                    title="Agendamentos"
                    count={history.appointments.length}
                  >
                    {history.appointments.length === 0 ? (
                      <EmptyRow />
                    ) : history.appointments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg hover:bg-slate-50 border-b last:border-0">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-slate-800">
                            {SERVICE_TYPE_LABELS[a.serviceType] ?? a.serviceType}
                          </p>
                          <p className="text-xs text-muted-foreground">{fmtDateTime(a.date)}</p>
                          {a.notes && <p className="text-xs text-slate-500 line-clamp-1">{a.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {a.price ? <span className="text-sm font-bold text-slate-700">{formatCurrency(a.price)}</span> : null}
                          <StatusBadge status={a.status} />
                        </div>
                      </div>
                    ))}
                  </HistorySection>

                  {/* Hospedagem */}
                  <HistorySection
                    icon={<Home className="h-4 w-4 text-amber-600" />}
                    title="Hospedagem"
                    count={history.boardings.length}
                  >
                    {history.boardings.length === 0 ? (
                      <EmptyRow />
                    ) : history.boardings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg hover:bg-slate-50 border-b last:border-0">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-slate-800">
                            {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                            {b.kennelNumber && <span className="ml-2 text-xs text-muted-foreground">Canil {b.kennelNumber}</span>}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {b.services.map((s, i) => (
                              <Badge key={i} variant="secondary" className="text-[9px] uppercase">{s.name}</Badge>
                            ))}
                            {b.services.length === 0 && <span className="text-xs text-slate-400 italic">Somente estadia</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {b.totalPrice ? <span className="text-sm font-bold text-slate-700">{formatCurrency(b.totalPrice)}</span> : null}
                          <StatusBadge status={b.status} />
                        </div>
                      </div>
                    ))}
                  </HistorySection>

                  {/* Internação */}
                  <HistorySection
                    icon={<Activity className="h-4 w-4 text-red-600" />}
                    title="Internação"
                    count={history.hospitalizations.length}
                  >
                    {history.hospitalizations.length === 0 ? (
                      <EmptyRow />
                    ) : history.hospitalizations.map((h) => (
                      <div key={h.id} className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg hover:bg-slate-50 border-b last:border-0">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-slate-800">
                            Admissão: {fmtDateTime(h.admittedAt)}
                            {h.dischargeAt && <span className="text-muted-foreground"> → {fmtDate(h.dischargeAt)}</span>}
                          </p>
                          {h.reasonForAdmission && (
                            <p className="text-xs text-slate-600 line-clamp-1">{h.reasonForAdmission}</p>
                          )}
                          {h.finalDiagnosis && (
                            <p className="text-xs text-slate-500">Dx: {h.finalDiagnosis}</p>
                          )}
                        </div>
                        <StatusBadge status={h.status} />
                      </div>
                    ))}
                  </HistorySection>

                  {/* Prontuários médicos */}
                  <HistorySection
                    icon={<Stethoscope className="h-4 w-4 text-violet-600" />}
                    title="Registros Médicos"
                    count={history.medicalRecords.length}
                  >
                    {history.medicalRecords.length === 0 ? (
                      <EmptyRow />
                    ) : history.medicalRecords.map((m) => (
                      <div key={m.id} className="py-3 px-4 rounded-lg hover:bg-slate-50 border-b last:border-0 space-y-1">
                        <p className="text-xs text-muted-foreground">{fmtDate(m.date)}</p>
                        {m.description && <p className="text-sm text-slate-700 line-clamp-2">{m.description}</p>}
                        {m.diagnosis && <p className="text-xs text-slate-500">Dx: {m.diagnosis}</p>}
                      </div>
                    ))}
                  </HistorySection>

                  {/* Vacinas */}
                  <HistorySection
                    icon={<Syringe className="h-4 w-4 text-emerald-600" />}
                    title="Vacinação"
                    count={history.vaccinations.length}
                  >
                    {history.vaccinations.length === 0 ? (
                      <EmptyRow />
                    ) : history.vaccinations.map((v) => (
                      <div key={v.id} className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg hover:bg-slate-50 border-b last:border-0">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-slate-800">{v.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Aplicada em {fmtDate(v.date)}
                            {v.batch && ` · Lote ${v.batch}`}
                          </p>
                        </div>
                        {v.nextDueDate && (
                          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 shrink-0">
                            Reforço: {fmtDate(v.nextDueDate)}
                          </span>
                        )}
                      </div>
                    ))}
                  </HistorySection>
                </>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="p-8 pt-6 border-t bg-slate-50/30">
          <div className="flex w-full justify-between items-center">
            {activeTab === 'details' && (
              <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                <Info className="h-4 w-4" />
                <span>Campos com * são obrigatórios</span>
              </div>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <Button variant="ghost" size="lg" className="px-8 h-12 text-base font-semibold" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                size="lg" 
                className="px-10 h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200/50 transition-all" 
                onClick={handleSave} 
                disabled={isSaving}
              >
                {isSaving ? 'Gravando...' : 'Salvar Ficha'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
