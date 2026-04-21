import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Plus,
  Save,
  Trash2,
  MessageSquare,
  Dog,
  Stethoscope,
  Scissors,
  Home,
  Package,
  Clock,
  ExternalLink,
  Edit2,
  DollarSign,
  AlertCircle,
  FileText,
  User,
  Heart,
  TrendingUp,
  CreditCard,
  Syringe,
  ClipboardList
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useClientStore } from '@/stores/ClientContext'
import { usePetStore } from '@/stores/PetContext'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useBoardingStore } from '@/stores/BoardingStore'
import { useInventoryStore } from '@/stores/InventoryStore'
import { clientInteractionService } from '@/services/client-interaction-service'
import { whatsappService } from '@/services/whatsapp-service'
import { Client, Pet, ClientInteraction, Appointment, Sale, NotificationLog } from '@/lib/types'
import { format, differenceInYears } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { ClientInteractionDialog } from './ClientInteractionDialog'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from '@/lib/utils'

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { clients, updateClient, deleteClient } = useClientStore()
  const { pets } = usePetStore()
  const { appointments } = useAppointmentStore()
  const { boardingStays } = useBoardingStore()
  const { sales } = useInventoryStore()

  const [client, setClient] = useState<Client | null>(null)
  const [interactions, setInteractions] = useState<ClientInteraction[]>([])
  const [whatsappLogs, setWhatsappLogs] = useState<NotificationLog[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [filterDays, setFilterDays] = useState(30)
  const [formData, setFormData] = useState<Partial<Client>>({})
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false)
  const [isLoadingWhatsappLogs, setIsLoadingWhatsappLogs] = useState(false)
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false)

  // Data mapping
  const clientPets = useMemo(() => pets.filter(p => p.clientId === id), [pets, id])
  const petIds = useMemo(() => clientPets.map(p => p.id), [clientPets])

  const clientAppointments = useMemo(() =>
    appointments.filter(a => petIds.includes(a.petId) && a.status !== 'cancelled'),
    [appointments, petIds]
  )

  const clientBoardingStays = useMemo(() =>
    boardingStays.filter(b => petIds.includes(b.petId) && b.status !== 'cancelled'),
    [boardingStays, petIds]
  )

  const clientSales = useMemo(() => sales.filter(s => s.clientId === id), [sales, id])

  useEffect(() => {
    const found = clients.find(c => c.id === id)
    if (found) {
      setClient(found)
      setFormData(found)
      loadInteractions(found.id)
      loadWhatsappLogs(found.id)
    }
  }, [id, clients])

  const loadWhatsappLogs = async (clientId: string) => {
    setIsLoadingWhatsappLogs(true)
    try {
      const data = await whatsappService.getLogs(clientId)
      setWhatsappLogs(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoadingWhatsappLogs(false)
    }
  }

  const loadInteractions = async (clientId: string) => {
    setIsLoadingInteractions(true)
    try {
      const data = await clientInteractionService.getInteractions(clientId)
      setInteractions(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoadingInteractions(false)
    }
  }

  const handleSave = async () => {
    if (!client) return
    try {
      await updateClient({ ...formData, id: client.id } as Client)
      setIsEditing(false)
      toast.success('Dados atualizados com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar alterações.')
    }
  }

  const handleDelete = async () => {
    if (!id || clientPets.length > 0) {
      toast.error('Não é possível excluir clientes com pets vinculados.')
      return
    }
    if (confirm('Tem certeza que deseja excluir este cliente? Esta ação é irreversível.')) {
      await deleteClient(id)
      navigate('/clients')
    }
  }

  const unpaidTotal = useMemo(() => {
    // Simulate unpaid logic if not explicitly in Sale
    return clientSales.filter(s => s.status !== 'completed').reduce((acc, s) => acc + s.total, 0)
  }, [clientSales])

  const lastVisit = useMemo(() => {
    const completed = clientAppointments.filter(a => a.status === 'completed' || a.status === 'checked_out')
    if (completed.length === 0) return null
    return new Date(Math.max(...completed.map(a => new Date(a.date).getTime())))
  }, [clientAppointments])

  const allCommunications = useMemo(() => {
    const combined = [
      ...interactions.map(i => ({
        id: i.id,
        type: i.type,
        subject: i.subject,
        body: i.body,
        date: i.createdAt || i.date,
        responsible: i.responsible,
        isSystem: false
      })),
      ...whatsappLogs.map(l => ({
        id: l.id,
        type: 'whatsapp' as const,
        subject: l.type === 'agendamento_confirmacao' ? 'WhatsApp (Confirmação)' :
          l.type === 'agendamento_cancelamento' ? 'WhatsApp (Cancelamento)' :
            l.type === 'agendamento_solicitacao' ? 'WhatsApp (Solicitação)' : 'Notificação WhatsApp',
        body: l.message,
        date: l.sentAt || l.createdAt,
        responsible: 'Sistema',
        isSystem: true,
        status: l.status
      }))
    ]
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [interactions, whatsappLogs])

  if (!client) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground animate-pulse" />
      <p className="text-muted-foreground">Cliente não encontrado ou carregando...</p>
      <Button variant="outline" onClick={() => navigate('/clients')}>Voltar para lista</Button>
    </div>
  )

  const kpis = {
    grooming: clientAppointments.filter(a => a.serviceType === 'grooming').length,
    consults: clientAppointments.filter(a => a.serviceType === 'consultation').length,
    boarding: clientBoardingStays.length,
    products: clientSales.reduce((acc, s) => acc + s.items.length, 0)
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-[1400px] mx-auto px-4 md:px-0">
      {/* Breadcrumbs & Title */}
      <div className="space-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/clients">Clientes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Ficha do Cliente</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ficha do Cliente</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/clients')} className="h-10 text-slate-600 border-slate-200">
              Voltar à Lista
            </Button>
            {!isEditing ? (
              <Button className="h-10 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" /> Editar Perfil
              </Button>
            ) : (
              <Button className="h-10 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" /> Salvar Alterações
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Summary Card */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Left: Identity */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-inner">
                <AvatarFallback className="text-2xl font-black bg-blue-50 text-blue-600">
                  {client.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-none border-none font-bold px-2 py-0.5">ATIVO</Badge>
                  <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 transition-none border-none font-bold px-2 py-0.5">{clientPets.length} PETS</Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 font-medium">
                  <span>Cliente desde {format(new Date(client.joinedAt), "dd/MM/yyyy")}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 flex-1 lg:pl-8 lg:border-l border-slate-100">
              {[
                { label: 'Consultas', val: kpis.consults, icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                { label: 'Hospedagens', val: kpis.boarding, icon: Home, color: 'text-violet-600', bg: 'bg-violet-50/50' },
                { label: 'Banho & Tosa', val: kpis.grooming, icon: Scissors, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                { label: 'Produtos', val: kpis.products, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50/50' }
              ].map((k, i) => (
                <div key={i} className="bg-slate-50/50 px-4 py-3 rounded-2xl border border-slate-100 min-w-[120px] flex-1 group hover:bg-white hover:shadow-sm transition-all cursor-default">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <k.icon className={cn("h-3 w-3", k.color)} /> {k.label}
                      </p>
                      <p className="text-xl font-black text-slate-900">{k.val}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs Segmented Control */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 inline-flex h-14 mb-8">
          <TabsTrigger value="overview" className="rounded-xl px-8 h-full font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all border-none">
            Dados do Cliente
          </TabsTrigger>
          <TabsTrigger value="pets" className="rounded-xl px-8 h-full font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all border-none">
            Pets
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-8 h-full font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all border-none">
            Histórico
          </TabsTrigger>
          <TabsTrigger value="communication" className="rounded-xl px-8 h-full font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all border-none">
            Comunicação
          </TabsTrigger>
          <TabsTrigger value="financial" className="rounded-xl px-8 h-full font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all border-none">
            Financeiro
          </TabsTrigger>
        </TabsList>

        {/* TAB: Client Data */}
        <TabsContent value="overview" className="animate-in slide-in-from-bottom-2 duration-400">
          <Card className="border-slate-100 shadow-sm overflow-hidden">
            <CardContent className="p-8">
              {isEditing ? (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">Nome Completo</Label>
                      <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">CPF</Label>
                      <Input value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">Data de Nascimento</Label>
                      <Input type="date" value={formData.birthDate ? formData.birthDate.split('T')[0] : ''} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">Sexo</Label>
                      <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Feminino">Feminino</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">Telefone / WhatsApp</Label>
                      <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">E-mail</Label>
                      <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">Origem do Cliente</Label>
                      <Select value={formData.origin} onValueChange={v => setFormData({ ...formData, origin: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Indicação">Indicação</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Google">Google</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Passagem">Passagem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator className="bg-slate-100" />

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-x-12 gap-y-8">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">CEP</Label>
                      <Input value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">Logradouro</Label>
                      <Input value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">Número</Label>
                      <Input value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">Bairro</Label>
                      <Input value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">Cidade</Label>
                      <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">UF</Label>
                      <Input value={formData.state} className="uppercase" maxLength={2} onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-slate-400">Complemento</Label>
                      <Input value={formData.complement} onChange={e => setFormData({ ...formData, complement: e.target.value })} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} className="font-bold">Cancelar</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8 shadow-md shadow-emerald-100" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" /> Salvar Alterações Inline
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                  {[
                    { label: 'Nome Completo', val: client.name },
                    { label: 'CPF', val: client.cpf || '000.000.000-00' }, // fallback
                    { label: 'Data de Nascimento', val: client.birthDate ? format(new Date(client.birthDate), "dd/MM/yyyy") : '---' },
                    { label: 'Sexo', val: client.gender || '---' },
                    { label: 'Telefone', val: client.phone },
                    { label: 'WhatsApp', val: client.phone },
                    { label: 'E-mail', val: client.email || '---' },
                    { label: 'Origem do Cliente', val: client.origin || 'Indicação' },
                    { label: 'Data de Cadastro', val: format(new Date(client.joinedAt), "dd/MM/yyyy") },
                    { label: 'CEP', val: client.zipCode || '---' },
                    { label: 'Cidade', val: client.city || '---' },
                    { label: 'UF', val: client.state || '---' },
                    { label: 'Bairro', val: client.neighborhood || '---' },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1 group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-transparent group-hover:border-slate-100 transition-all">{item.val}</p>
                    </div>
                  ))}
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pets" className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 font-bold shadow-md shadow-blue-200">
              Adicionar Pet
            </Button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {clientPets.length === 0 ? (
              <Card className="col-span-full border-dashed border-2 p-20 text-center bg-slate-50/50">
                <Dog className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Nenhum pet cadastrado para este cliente.</p>
              </Card>
            ) : (
              clientPets.map(pet => {
                const petAppts = clientAppointments.filter(a => a.petId === pet.id)
                const lastBath = petAppts.filter(a => a.serviceType === 'grooming' && a.status === 'completed').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                const lastConsult = petAppts.filter(a => a.serviceType === 'consultation' && a.status === 'completed').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

                return (
                  <Card key={pet.id} className="border-slate-100 shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-0">
                      {/* Pet Top Summary */}
                      <div className="p-6 flex items-start gap-6 border-b border-slate-50">
                        <div className="h-24 w-24 rounded-3xl bg-blue-50/50 p-2 border-4 border-white shadow-sm flex items-center justify-center shrink-0">
                          {pet.avatar ? (
                            <img src={pet.avatar} className="h-full w-full object-cover rounded-2xl" />
                          ) : (
                            <Dog className="h-10 w-10 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-2xl font-black text-slate-900 leading-tight">{pet.name}</h4>
                              <p className="text-slate-500 font-bold text-sm h-6">
                                {pet.species === 'dog' ? 'Canino' : 'Felino'} • {pet.breed} • <span className="capitalize">{pet.gender === 'male' ? 'Macho' : 'Fêmea'}</span>
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] uppercase">ATIVO</Badge>
                              <Badge className="bg-blue-50 text-blue-600 border-none font-bold text-[10px] uppercase tracking-wider">BANHO & TOSA</Badge>
                              <Button variant="outline" size="sm" className="h-8 text-[10px] uppercase font-bold border-slate-200">Ver Ficha Completa</Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Operational Grid */}
                      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Porte', val: pet.size || 'Médio', color: 'text-slate-800' },
                          { label: 'Peso', val: `${pet.weight} kg`, color: 'text-slate-800' },
                          { label: 'Nascimento', val: pet.birthDate ? format(new Date(pet.birthDate), "dd/MM/yyyy") : '---', color: 'text-slate-800' },
                          { label: 'Castrado', val: pet.isCastrated ? 'Sim' : 'Não', color: 'text-slate-800' }
                        ].map((m, i) => (
                          <div key={i} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50 text-center">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                            <p className={cn("text-sm font-black", m.color)}>{m.val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Last Events Grid */}
                      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Último Banho</p>
                          <p className="text-sm font-bold text-slate-900">{lastBath ? format(new Date(lastBath.date), "dd/MM/yyyy") : '---'}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Banho + Tosa Higiênica</p>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Última Consulta</p>
                          <p className="text-sm font-bold text-slate-900">{lastConsult ? format(new Date(lastConsult.date), "dd/MM/yyyy") : '---'}</p>
                          <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Consulta de rotina</p>
                        </div>
                        <div className="bg-amber-50/20 p-3 rounded-2xl border border-amber-100 flex flex-col justify-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Próxima Vacina</p>
                          <p className="text-sm font-bold text-amber-700">20/05/2026</p>
                          <p className="text-[10px] text-amber-600 font-medium italic">Lembrete recomendado</p>
                        </div>
                      </div>

                      {/* Specific Clinical Alert Field */}
                      <div className="mx-6 mb-4 bg-red-50/30 p-2 px-4 rounded-xl border border-red-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-[10px] font-black text-red-800 uppercase tracking-widest">Alerta Clínico</span>
                        </div>
                        <span className="text-xs font-bold text-red-600">{pet.clinicalAlert || 'Nenhum alerta clínico registrado'}</span>
                      </div>

                      {/* Operational Observations */}
                      <div className="p-6 pt-2 bg-slate-50/30">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observações Operacionais</h5>
                          <Badge variant="outline" className="text-[9px] font-bold text-red-500 border-red-200">ATENÇÃO</Badge>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {pet.notes || "Sem observações registradas."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* TAB: History (Consolidated Timeline) */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Linha do tempo consolidada</h3>
              <p className="text-sm text-slate-500 font-medium">Histórico operacional unificado por cliente e pets</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-9 px-4 font-bold border-slate-200 text-slate-600">Filtrar</Button>
              <Button variant="outline" size="sm" className="h-9 px-4 font-bold border-slate-200 text-slate-600">Exportar</Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Combine all events */}
            {[
              ...clientAppointments.map(a => ({
                type: 'appt',
                date: new Date(a.date),
                category: a.serviceType,
                title: `${a.serviceType === 'grooming' ? 'Banho + Tosa Higiênica' : 'Consulta clínica'} • ${pets.find(p => p.id === a.petId)?.name}`,
                meta: a.serviceType === 'grooming' ? 'Profissional: Ana Paula • Duração: 1h20' : 'Veterinário: Dr. Ricardo',
                status: a.status,
                icon: a.serviceType === 'grooming' ? Scissors : Stethoscope,
                color: a.serviceType === 'grooming' ? 'text-blue-600 bg-blue-50' : 'text-emerald-600 bg-emerald-50'
              })),
              ...clientBoardingStays.map(b => ({
                type: 'boarding',
                date: new Date(b.checkIn),
                category: 'boarding',
                title: `Hospedagem • ${pets.find(p => p.id === b.petId)?.name}`,
                meta: `Canil: ${b.kennelNumber} • Status: ${b.status}`,
                status: b.status,
                icon: Home,
                color: 'text-violet-600 bg-violet-50'
              })),
              ...clientSales.map(s => ({
                type: 'sale',
                date: new Date(s.date),
                category: 'venda',
                title: `Venda de produto • ${s.items.map(i => i.productName).join(', ')}`,
                meta: `Valor: R$ ${s.total.toFixed(2)} • Caixa: Loja 01`,
                status: s.status === 'completed' ? 'PAGO' : 'PENDENTE',
                icon: Package,
                color: 'text-amber-600 bg-amber-50'
              }))
            ].sort((a, b) => b.date.getTime() - a.date.getTime()).map((event, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-center gap-6">
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", event.color)}>
                    <event.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="text-[9px] font-bold uppercase tracking-wider h-5 bg-white border-slate-200 text-slate-500" variant="outline">
                        {event.category === 'grooming' ? 'BANHO & TOSA' :
                          event.category === 'consultation' ? 'CONSULTA' :
                            event.category === 'boarding' ? 'HOSPEDAGEM' : 'VENDA'}
                      </Badge>
                      <Badge className={cn("text-[9px] font-black uppercase tracking-wider h-5 px-2",
                        ['completed', 'PAGO', 'checked_out', 'active'].includes(event.status) ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      )} variant="secondary">
                        {event.status === 'completed' ? 'FINALIZADO' :
                          event.status === 'active' ? 'EM ANDAMENTO' :
                            event.status === 'reserved' ? 'RESERVADO' :
                              event.status === 'PAGO' ? 'PAGO' :
                                event.status === 'confirmed' ? 'CONFIRMADO' : 'ENCERRADO'}
                      </Badge>
                    </div>
                    <h4 className="text-base font-black text-slate-800">{event.title}</h4>
                    <p className="text-xs text-slate-400 font-medium">{event.meta}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-400">{format(event.date, "dd/MM/yyyy • HH:mm")}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Placeholder for Communication and Financial - they follow same visual refinement */}
        <TabsContent value="communication" className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Histórico de Comunicação</h3>
              <p className="text-sm text-slate-500 font-medium">Registros de contatos, WhatsApp e avisos do sistema nos últimos {filterDays} dias</p>
            </div>
            <div className="flex gap-3">
              <Select value={filterDays.toString()} onValueChange={(val) => setFilterDays(parseInt(val))}>
                <SelectTrigger className="w-[180px] h-10 border-slate-200">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Todo o histórico</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-blue-600 hover:bg-blue-700 font-bold shadow-md shadow-blue-200" onClick={() => setIsInteractionDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Registrar Contato
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {(isLoadingInteractions || isLoadingWhatsappLogs) ? (
              <div className="py-20 text-center space-y-4">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-slate-500 font-medium">Carregando interações...</p>
              </div>
            ) : allCommunications.filter(i => {
              const limitDate = new Date();
              limitDate.setDate(limitDate.getDate() - filterDays);
              return new Date(i.date) >= limitDate;
            }).length === 0 ? (
              <Card className="border-dashed border-2 p-20 text-center bg-slate-50/50">
                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Nenhum registro de comunicação encontrado neste período.</p>
                <Button variant="link" className="text-blue-600 font-bold mt-2" onClick={() => setIsInteractionDialogOpen(true)}>Registrar agora</Button>
              </Card>
            ) : (
              allCommunications
                .filter(i => {
                  const limitDate = new Date();
                  limitDate.setDate(limitDate.getDate() - filterDays);
                  return new Date(i.date) >= limitDate;
                })
                .map((item) => {
                  const InteractionIcon =
                    item.type === 'whatsapp' ? MessageSquare :
                      item.type === 'call' ? Phone :
                        item.type === 'email' ? Mail :
                          item.type === 'in_person' ? User : MessageSquare;

                  const InteractionColor =
                    item.isSystem ? 'text-blue-600 bg-blue-50' :
                      item.type === 'whatsapp' ? 'text-emerald-600 bg-emerald-50' :
                        item.type === 'call' ? 'text-blue-600 bg-blue-50' :
                          item.type === 'email' ? 'text-amber-600 bg-amber-50' :
                            item.type === 'in_person' ? 'text-violet-600 bg-violet-50' : 'text-slate-600 bg-slate-50';

                  return (
                    <div key={item.id} className={cn(
                      "p-6 rounded-2xl border flex items-start gap-6 group hover:shadow-md transition-all",
                      item.isSystem ? "bg-blue-50/30 border-blue-100" : "bg-white border-slate-100"
                    )}>
                      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", InteractionColor)}>
                        <InteractionIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={cn(
                              "text-[10px] font-black uppercase tracking-wider h-5 border-none",
                              item.isSystem ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                            )} variant="outline">
                              {item.isSystem ? 'SISTEMA (AUT)' :
                                item.type === 'whatsapp' ? 'WHATSAPP' :
                                  item.type === 'call' ? 'LIGAÇÃO' :
                                    item.type === 'email' ? 'E-MAIL' :
                                      item.type === 'in_person' ? 'PRESENCIAL' : 'SISTEMA'}
                            </Badge>
                            {item.responsible && (
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">por {item.responsible}</span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-400">{format(new Date(item.date), "dd/MM/yyyy • HH:mm")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-800">{item.subject}</h4>
                          {item.isSystem && (
                            <Badge variant="secondary" className={cn(
                              "text-[9px] font-bold uppercase py-0 px-1.5",
                              (item as any).status === 'sent' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                              {(item as any).status === 'sent' ? 'Enviado' : 'Falhou'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed font-normal whitespace-pre-wrap">{item.body}</p>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </TabsContent>

        <TabsContent value="financial" className="bg-white rounded-2xl border border-slate-100 p-8">
          <div className="text-center py-20 text-slate-400 italic">
            Aba Financeira Refinada (Extrato Consolidado + Pendências)
          </div>
        </TabsContent>
      </Tabs>

      <ClientInteractionDialog
        open={isInteractionDialogOpen}
        onOpenChange={setIsInteractionDialogOpen}
        clientId={id!}
        onSave={() => id && loadInteractions(id)}
      />
    </div>
  )
}
