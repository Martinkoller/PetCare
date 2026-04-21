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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { usePetStore } from '@/stores/PetContext'
import { useClientStore } from '@/stores/ClientContext'
import { useBoardingStore } from '@/stores/BoardingStore'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency, cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { Dog, Cat, Bird, HelpCircle, Heart, AlertCircle, Info, ClipboardList, User } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

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
  const { boardingStays } = useBoardingStore()
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
    }
  }, [pet, open, initialClientId])

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
      console.error('Error saving pet:', e)
      toast.error('Erro ao salvar pet.')
    } finally {
      setIsSaving(false)
    }
  }

  const history = boardingStays
    .filter((s) => s.petId === pet?.id)
    .sort(
      (a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime(),
    )

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
                Histórico de Serviços
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

            <TabsContent value="history" className="focus-visible:outline-none">
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden my-4">
                <Table>
                  <TableHeader className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest px-6 h-12">Data</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest px-6 h-12">Serviços</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest px-6 h-12">Obs.</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest px-6 h-12">Valor</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest px-6 h-12 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-slate-400 font-medium italic">
                          Nenhum histórico operacional encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((stay) => (
                        <TableRow key={stay.id} className="hover:bg-slate-50/30 transition-colors">
                          <TableCell className="px-6 py-4 font-bold text-slate-800 text-sm">
                            {format(parseISO(stay.checkIn), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {stay.services?.map((s, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[9px] uppercase">
                                  {s.name}
                                </Badge>
                              ))}
                              {!stay.services?.length && (
                                <span className="text-xs text-slate-400 font-medium italic">Somente Estadia</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <p className="text-xs text-slate-500 line-clamp-1 max-w-[150px]">
                              {stay.observations || stay.specialInstructions || '---'}
                            </p>
                          </TableCell>
                          <TableCell className="px-6 py-4 font-black text-slate-900 text-sm">
                            {formatCurrency(stay.totalPrice || 0)}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Badge
                              className={cn(
                                "text-[10px] font-black uppercase tracking-wider h-6 px-3",
                                stay.status === 'completed' ? "bg-emerald-100 text-emerald-700" : 
                                stay.status === 'cancelled' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                              )}
                            >
                              {stay.status === 'scheduled' ? 'Agendado' : 
                               stay.status === 'confirmed' ? 'Confirmado' : 
                               stay.status === 'in_progress' ? 'Em atendimento' : 
                               stay.status === 'completed' ? 'Finalizado' : 
                               stay.status === 'cancelled' ? 'Cancelado' : 'Reservado'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
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
