import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Appointment,
  Pet,
  MedicalRecord,
  PrescriptionItem,
  ExamRequest,
  VaccineRecord,
  MaterialUsed,
} from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useInventoryStore } from '@/stores/InventoryStore'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Trash,
  Plus,
  Activity,
  ArrowRight,
  FolderOpen,
  Package,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  CalendarPlus,
  Printer,
  Info,
} from 'lucide-react'
import { DocumentManager } from './DocumentManager'
import { LegalTermsManager } from '@/components/clinic/LegalTermsManager'
import { OfficialDocuments } from '@/components/clinic/OfficialDocuments'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { parseISO, isBefore, addDays, startOfDay, format as fmtDate } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConsultationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment
  pet: Pet
  onShowHistory?: () => void
}

export function ConsultationModal({
  open,
  onOpenChange,
  appointment,
  pet,
  onShowHistory,
}: ConsultationModalProps) {
  const { addMedicalRecord, updateAppointmentStatus } = useAppointmentStore()
  const { products } = useInventoryStore()
  const { user } = useAuthStore()

  const getInitialTab = useCallback(() => {
    if (appointment.clinicalStatus === 'waiting') return 'triage'
    if (appointment.clinicalStatus === 'triage') return 'triage'
    return 'soap'
  }, [appointment.clinicalStatus])

  const [activeTab, setActiveTab] = useState('triage')

  useEffect(() => {
    if (open) {
      setActiveTab(getInitialTab())
      setVitals((prev) => ({ ...prev, weight: pet.weight }))
    }
  }, [open, pet.weight, getInitialTab])

  const [complaint, setComplaint] = useState('')
  const [history, setHistory] = useState('')
  const [vitals, setVitals] = useState({
    weight: pet.weight || 0,
    temperature: 0,
    heartRate: 0,
    respiratoryRate: 0,
    mucousMembranes: 'Normocoradas',
    capillaryRefillTime: '< 2s',
    hydrationLevel: 'Hidratado (< 5%)',
    bodyConditionScore: 'Apropriado/Ideal',
  })

  const [diagnosisType, setDiagnosisType] = useState('suspect')
  const [painScore, setPainScore] = useState(0)
  const [systemChecklist, setSystemChecklist] = useState({
    cardiovascular: false,
    respiratory: false,
    gastrointestinal: false,
    neurological: false,
    dermatological: false,
    genitourinary: false,
    musculoskeletal: false,
  })

  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')

  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([])
  const [exams, setExams] = useState<ExamRequest[]>([])
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([])
  const [materials, setMaterials] = useState<MaterialUsed[]>([])

  const [newMeds, setNewMeds] = useState({
    medication: '',
    concentration: '',
    dosage: '',
    frequency: '',
    duration: '',
  })
  const [newExam, setNewExam] = useState('')
  const [newVaccine, setNewVaccine] = useState({
    name: '',
    batch: '',
    nextDose: '',
  })

  const [selectedMaterialId, setSelectedMaterialId] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [materialQuantity, setMaterialQuantity] = useState('1')

  // Medication calculator state
  const [calcDosePerKg, setCalcDosePerKg] = useState('')
  const [calcConcentration, setCalcConcentration] = useState('')
  const calcResult = useMemo(() => {
    const d = parseFloat(calcDosePerKg)
    const c = parseFloat(calcConcentration)
    const w = Number(vitals.weight) || 0
    if (!d || !c || !w) return null
    const totalDose = d * w
    const volume = totalDose / c
    return { totalDose: totalDose.toFixed(2), volume: volume.toFixed(2) }
  }, [calcDosePerKg, calcConcentration, vitals.weight])

  // Return scheduling state
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [returnDate, setReturnDate] = useState(
    fmtDate(addDays(new Date(), 30), 'yyyy-MM-dd'),
  )

  const availableMaterials = useMemo(() => {
    return products.filter(
      (p) =>
        p.category === 'medicines' ||
        p.category === 'vaccine' ||
        p.category === 'surgical',
    )
  }, [products])

  const selectedMaterialProduct = useMemo(
    () => products.find((p) => p.id === selectedMaterialId),
    [products, selectedMaterialId],
  )

  const triageChecklist = useMemo(
    () => ({
      complaint: complaint.trim().length > 0,
      weight: Number(vitals.weight) > 0,
      temperature: Number(vitals.temperature) > 0,
      heartRate: Number(vitals.heartRate) > 0,
    }),
    [complaint, vitals.weight, vitals.temperature, vitals.heartRate],
  )

  const soapChecklist = useMemo(
    () => ({
      subjective: subjective.trim().length > 0,
      objective: objective.trim().length > 0,
      assessment: assessment.trim().length > 0,
      plan: plan.trim().length > 0,
    }),
    [subjective, objective, assessment, plan],
  )

  const triageReady = Object.values(triageChecklist).every(Boolean)
  const soapReady = Object.values(soapChecklist).every(Boolean)

  const routineProgress = useMemo(() => {
    const checks = [
      ...Object.values(triageChecklist),
      ...Object.values(soapChecklist),
    ]
    const done = checks.filter(Boolean).length
    return Math.round((done / checks.length) * 100)
  }, [triageChecklist, soapChecklist])

  const handleAddMaterial = () => {
    if (!selectedMaterialId) return
    const product = selectedMaterialProduct
    if (!product) return

    const qty = Number(materialQuantity)
    if (qty <= 0) return toast.error('Quantidade inválida')

    let stockAvailable = product.stock

    // Batch Logic
    if (product.batches && product.batches.length > 0) {
      if (!selectedBatchId) {
        return toast.error('Este produto requer seleção de lote')
      }
      const batch = product.batches.find((b) => b.id === selectedBatchId)
      if (!batch) return toast.error('Lote inválido')
      stockAvailable = batch.quantity
    }

    if (qty > stockAvailable) {
      toast.warning('Atenção: Quantidade maior que o estoque atual.')
    }

    setMaterials((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        quantity: qty,
        unit: product.unit || 'un',
        batchId: selectedBatchId || undefined,
      },
    ])
    setSelectedMaterialId('')
    setSelectedBatchId('')
    setMaterialQuantity('1')
  }

  const handleAddMedication = () => {
    if (newMeds.medication && newMeds.dosage) {
      setPrescriptions([
        ...prescriptions,
        { id: Math.random().toString(), ...newMeds },
      ])
      setNewMeds({
        medication: '',
        concentration: '',
        dosage: '',
        frequency: '',
        duration: '',
      })
    }
  }

  const handleAddExam = () => {
    if (newExam) {
      setExams([
        ...exams,
        {
          id: Math.random().toString(),
          name: newExam,
          type: 'other',
          status: 'requested',
          dateRequested: new Date().toISOString(),
        },
      ])
      setNewExam('')
    }
  }

  const handleAddVaccine = () => {
    if (newVaccine.name) {
      setVaccines([
        ...vaccines,
        {
          id: Math.random().toString(),
          name: newVaccine.name,
          batch: newVaccine.batch,
          dateAdministered: new Date().toISOString(),
          nextDoseDate: newVaccine.nextDose,
          veterinarianId: user?.id || 'unknown',
        },
      ])
      setNewVaccine({ name: '', batch: '', nextDose: '' })
    }
  }

  const handleSaveTriage = () => {
    if (!triageReady) {
      toast.error('Preencha os campos obrigatorios da triagem antes de avancar.')
      return
    }

    updateAppointmentStatus(
      appointment.id,
      'in_progress',
      undefined,
      'consultation',
    )

    if (vitals.temperature >= 39.5 || vitals.heartRate >= 160) {
      toast.warning('Paciente com sinais de alerta. Priorize atendimento imediato.')
    } else {
      toast.success('Triagem salva! Iniciando consulta.')
    }

    setActiveTab('soap')
  }

  const handleFinish = () => {
    if (!assessment) return toast.error('Diagnóstico é obrigatório')
    setShowReturnDialog(true)
  }

  const handleConfirmFinish = (scheduleReturn: boolean) => {
    const finalReturnDate = scheduleReturn ? returnDate : undefined

    const record: MedicalRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      veterinarianId: user?.id || 'unknown',
      complaint,
      history,
      subjective,
      objective,
      vitals,
      assessment,
      plan,
      diagnosisType,
      painScore,
      hydrationLevel: vitals.hydrationLevel,
      bodyConditionScore: vitals.bodyConditionScore,
      mucousMembranes: vitals.mucousMembranes,
      capillaryRefillTime: vitals.capillaryRefillTime,
      systemicEvaluation: JSON.stringify(systemChecklist),
      prescriptions,
      exams,
      vaccines,
      returnDate: finalReturnDate,
    }

    addMedicalRecord(pet.id, record, materials)

    updateAppointmentStatus(
      appointment.id,
      'completed',
      undefined,
      'completed',
      finalReturnDate,
    )

    toast.success(
      scheduleReturn
        ? `Consulta finalizada! Retorno agendado para ${fmtDate(new Date(returnDate + 'T12:00:00'), 'dd/MM/yyyy')}.`
        : 'Consulta finalizada e prontuário registrado!',
    )
    setShowReturnDialog(false)
    onOpenChange(false)
  }

  const today = startOfDay(new Date())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-muted/10">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                Atendimento Clínico: {pet.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {pet.species} • {pet.breed} • {pet.age} anos
              </p>
            </div>
            <div className="flex items-center gap-3">
              {onShowHistory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShowHistory}
                  className="gap-2"
                >
                  <FolderOpen className="h-4 w-4" /> Histórico &amp; Docs
                </Button>
              )}
              <LegalTermsManager pet={pet} />
              <OfficialDocuments pet={pet} prescriptions={prescriptions} />
              <Button
                variant="outline"
                size="sm"
                className="gap-2 print:hidden"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" /> Imprimir
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-background">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full h-full flex flex-col"
          >
            <div className="px-6 pt-4 border-b">
              <TabsList className="grid w-full grid-cols-7 max-w-5xl mx-auto mb-2">
                <TabsTrigger value="triage">Triagem</TabsTrigger>
                <TabsTrigger value="soap">Exame Clínico</TabsTrigger>
                <TabsTrigger value="prescription">Receituário</TabsTrigger>
                <TabsTrigger value="exams">Exames</TabsTrigger>
                <TabsTrigger value="vaccines">Vacinas</TabsTrigger>
                <TabsTrigger value="materials">Insumos</TabsTrigger>
                <TabsTrigger value="attachments">Anexos</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
              <div className="mb-6 rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-sm">Checklist da rotina clinica</h3>
                  <Badge variant="outline" className="gap-1">
                    <ClipboardCheck className="h-3 w-3" /> {routineProgress}%
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {triageChecklist.complaint ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <AlertTriangle className="h-3 w-3 text-amber-600" />} Queixa principal
                  </div>
                  <div className="flex items-center gap-2">
                    {triageChecklist.weight ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <AlertTriangle className="h-3 w-3 text-amber-600" />} Peso aferido
                  </div>
                  <div className="flex items-center gap-2">
                    {triageChecklist.temperature ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <AlertTriangle className="h-3 w-3 text-amber-600" />} Temperatura aferida
                  </div>
                  <div className="flex items-center gap-2">
                    {soapChecklist.assessment ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <AlertTriangle className="h-3 w-3 text-amber-600" />} Diagnostico registrado
                  </div>
                </div>
              </div>
              <TabsContent value="triage" className="space-y-6 mt-0">
                {/* Dados clínicos do paciente */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100 text-sm">
                  <div className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="text-muted-foreground">Espécie:</span>
                    <span className="font-medium capitalize">{pet.species}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="text-muted-foreground">Raça:</span>
                    <span className="font-medium">{pet.breed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="text-muted-foreground">Gênero:</span>
                    <span className="font-medium">{pet.gender === 'male' ? 'Macho' : 'Fêmea'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="text-muted-foreground">Peso anterior:</span>
                    <span className="font-medium">{pet.weight} kg</span>
                  </div>
                  {pet.color && (
                    <div className="flex items-center gap-2">
                      <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="text-muted-foreground">Pelagem:</span>
                      <span className="font-medium">{pet.color}</span>
                    </div>
                  )}
                  {pet.microchip && (
                    <div className="flex items-center gap-2">
                      <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="text-muted-foreground">Microchip:</span>
                      <span className="font-medium font-mono text-xs">{pet.microchip}</span>
                    </div>
                  )}
                  {pet.notes && (
                    <div className="col-span-2 md:col-span-4 flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-amber-700 text-xs">{pet.notes}</span>
                    </div>
                  )}
                </div>
                <div className="grid gap-4 p-4 bg-orange-50/50 rounded-lg border border-orange-100">
                  <h3 className="font-semibold flex items-center gap-2 text-orange-800">
                    <Activity className="h-4 w-4" /> Sinais Vitais
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Vitals Inputs - condensed for brevity */}
                    <div className="space-y-1">
                      <Label className="text-xs">Peso (kg)</Label>
                      <Input
                        type="number"
                        value={vitals.weight}
                        onChange={(e) =>
                          setVitals({
                            ...vitals,
                            weight: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Temp (°C)</Label>
                      <Input
                        type="number"
                        value={vitals.temperature}
                        onChange={(e) =>
                          setVitals({
                            ...vitals,
                            temperature: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">FC (bpm)</Label>
                      <Input
                        type="number"
                        value={vitals.heartRate}
                        onChange={(e) =>
                          setVitals({
                            ...vitals,
                            heartRate: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">FR (mpm)</Label>
                      <Input
                        type="number"
                        value={vitals.respiratoryRate}
                        onChange={(e) =>
                          setVitals({
                            ...vitals,
                            respiratoryRate: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Mucosas</Label>
                      <Select value={vitals.mucousMembranes} onValueChange={(v) => setVitals({...vitals, mucousMembranes: v})}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="Normocoradas">Normocoradas</SelectItem>
                           <SelectItem value="Pálidas">Pálidas</SelectItem>
                           <SelectItem value="Congestas">Congestas</SelectItem>
                           <SelectItem value="Ictéricas">Ictéricas</SelectItem>
                           <SelectItem value="Cianóticas">Cianóticas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">TPC</Label>
                      <Select value={vitals.capillaryRefillTime} onValueChange={(v) => setVitals({...vitals, capillaryRefillTime: v})}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="< 2s">{'< 2s'}</SelectItem>
                           <SelectItem value="2-3s">2-3s</SelectItem>
                           <SelectItem value="> 3s">{'> 3s'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hidratação</Label>
                      <Select value={vitals.hydrationLevel} onValueChange={(v) => setVitals({...vitals, hydrationLevel: v})}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="Hidratado (< 5%)">Hidratado (&lt; 5%)</SelectItem>
                           <SelectItem value="Leve (5-7%)">Leve (5-7%)</SelectItem>
                           <SelectItem value="Moderada (8-9%)">Moderada (8-9%)</SelectItem>
                           <SelectItem value="Grave (> 10%)">Grave (&gt; 10%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Escore Corporal</Label>
                      <Select value={vitals.bodyConditionScore} onValueChange={(v) => setVitals({...vitals, bodyConditionScore: v})}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="Caquético / Subpeso">Caquético / Subpeso</SelectItem>
                           <SelectItem value="Apropriado/Ideal">Apropriado/Ideal</SelectItem>
                           <SelectItem value="Sobrepeso">Sobrepeso</SelectItem>
                           <SelectItem value="Obeso">Obeso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Queixa Principal</Label>
                  <Input
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anamnese</Label>
                  <Textarea
                    className="min-h-[150px]"
                    value={history}
                    onChange={(e) => setHistory(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="soap" className="space-y-6 mt-0">
                {/* ... SOAP fields ... same as before */}
                <div className="grid md:grid-cols-2 gap-6 h-full">
                  <div className="space-y-4 flex flex-col">
                    <div className="space-y-2 flex flex-col">
                      <Label className="font-semibold text-blue-400">
                        Subjetivo
                      </Label>
                      <Textarea
                        className="min-h-[100px]"
                        value={subjective}
                        onChange={(e) => setSubjective(e.target.value)}
                        placeholder="Histórico relatado pelo tutor, comportamento, apetite..."
                      />
                    </div>
                    <div className="space-y-2 flex flex-col">
                      <Label className="font-semibold text-blue-600">
                        Objetivo (Exame Físico)
                      </Label>
                      <div className="border rounded-md p-3 bg-white space-y-3">
                        <div className="space-y-2">
                           <Label className="text-xs text-muted-foreground">Escore de Dor Visual (0-10): <span className="font-bold text-black">{painScore}</span></Label>
                           <input type="range" min="0" max="10" value={painScore} onChange={(e) => setPainScore(Number(e.target.value))} className="w-full accent-blue-600" />
                           <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                              <span>0 (Sem Dor)</span>
                              <span>5 (Dor Moderada)</span>
                              <span>10 (Pior Dor)</span>
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <Label className="text-xs text-muted-foreground">Revisão por Sistemas (Check para 'Sem Alterações evidentes')</Label>
                           <div className="grid grid-cols-2 gap-2 text-xs">
                             {Object.entries(systemChecklist).map(([sys, val]) => (
                               <label key={sys} className="flex items-center gap-2 cursor-pointer bg-muted/40 p-1.5 rounded border">
                                  <input type="checkbox" checked={val} onChange={(e) => setSystemChecklist({...systemChecklist, [sys]: e.target.checked})} className="rounded border-gray-300" />
                                  <span className="capitalize">{sys} livre</span>
                               </label>
                             ))}
                           </div>
                        </div>
                      </div>
                      <Textarea
                        className="flex-1 min-h-[100px] mt-2"
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder="Descreva detalhes dos achados anormais..."
                      />
                    </div>
                  </div>
                  <div className="space-y-4 flex flex-col">
                    <div className="space-y-2 relative">
                      <Label className="font-semibold text-green-600">
                        Avaliação e Diagnóstico
                      </Label>
                      <div className="absolute right-0 top-0">
                        <Select value={diagnosisType} onValueChange={setDiagnosisType}>
                           <SelectTrigger className="h-6 text-xs bg-green-50 border-green-200 text-green-700 font-medium">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="suspect">Suspeito (Presuntivo)</SelectItem>
                              <SelectItem value="definite">Definitivo</SelectItem>
                           </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        className="min-h-[100px] mt-1"
                        value={assessment}
                        onChange={(e) => setAssessment(e.target.value)}
                        placeholder="Análise do caso..."
                      />
                    </div>
                    <div className="space-y-2 flex-1 flex flex-col">
                      <Label className="font-semibold text-purple-600">
                        Plano
                      </Label>
                      <Textarea
                        className="flex-1 min-h-[100px]"
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="prescription" className="space-y-6 mt-0">
                {/* ... Prescription fields ... same as before */}
                <div className="bg-muted/20 p-4 rounded-lg space-y-4 border">
                  {/* Simplified inputs for brevity */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Input
                      placeholder="Medicamento"
                      className="col-span-2"
                      value={newMeds.medication}
                      onChange={(e) =>
                        setNewMeds({ ...newMeds, medication: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Conc."
                      value={newMeds.concentration}
                      onChange={(e) =>
                        setNewMeds({
                          ...newMeds,
                          concentration: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Dose"
                      value={newMeds.dosage}
                      onChange={(e) =>
                        setNewMeds({ ...newMeds, dosage: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Freq."
                      value={newMeds.frequency}
                      onChange={(e) =>
                        setNewMeds({ ...newMeds, frequency: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Duração"
                      className="max-w-[200px]"
                      value={newMeds.duration}
                      onChange={(e) =>
                        setNewMeds({ ...newMeds, duration: e.target.value })
                      }
                    />
                    <Button onClick={handleAddMedication} size="sm">
                      <Plus className="mr-2 h-4 w-4" /> Adicionar
                    </Button>
                  </div>
                </div>
                {/* List Prescriptions */}
                {prescriptions.length > 0 && (
                  <Table>
                    <TableBody>
                      {prescriptions.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>{p.medication}</TableCell>
                          <TableCell>{p.dosage}</TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                setPrescriptions((prev) =>
                                  prev.filter((_, idx) => idx !== i),
                                )
                              }
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Calculadora de Dose */}
                <div className="bg-violet-50/60 p-4 rounded-lg border border-violet-100 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-violet-800 text-sm">
                    <Calculator className="h-4 w-4" /> Calculadora de Dose
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Dose (mg/kg)</Label>
                      <Input
                        type="number"
                        placeholder="ex: 5"
                        value={calcDosePerKg}
                        onChange={(e) => setCalcDosePerKg(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Concentração (mg/ml)</Label>
                      <Input
                        type="number"
                        placeholder="ex: 50"
                        value={calcConcentration}
                        onChange={(e) => setCalcConcentration(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Peso atual (kg)</Label>
                      <Input
                        type="number"
                        value={vitals.weight || ''}
                        readOnly
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                  {calcResult && (
                    <div className="flex gap-4 bg-violet-100 rounded p-2 text-sm font-medium">
                      <span>Dose total: <strong>{calcResult.totalDose} mg</strong></span>
                      <span>Volume: <strong>{calcResult.volume} ml</strong></span>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="exams" className="space-y-6 mt-0">
                {/* ... Exams fields ... */}
                <div className="flex gap-4 items-end bg-muted/20 p-4 rounded-lg border">
                  <div className="flex-1 space-y-2">
                    <Label>Solicitar Exame</Label>
                    <Input
                      value={newExam}
                      onChange={(e) => setNewExam(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddExam}>
                    <Plus className="mr-2 h-4 w-4" /> Solicitar
                  </Button>
                </div>
                {/* List Exams with result field */}
                <div className="space-y-2">
                  {exams.map((e, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/10"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{e.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={e.result ? 'default' : 'outline'} className="text-xs">
                            {e.result ? 'Resultado registrado' : 'Pendente'}
                          </Badge>
                          <Trash
                            className="h-4 w-4 cursor-pointer text-red-400 hover:text-red-600"
                            onClick={() =>
                              setExams((prev) => prev.filter((_, idx) => idx !== i))
                            }
                          />
                        </div>
                      </div>
                      <Input
                        placeholder="Resultado do exame (opcional)..."
                        className="text-sm h-8"
                        value={e.result || ''}
                        onChange={(ev) =>
                          setExams((prev) =>
                            prev.map((ex, idx) =>
                              idx === i ? { ...ex, result: ev.target.value } : ex,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="vaccines" className="space-y-6 mt-0">
                {/* ... Vaccines fields ... */}
                <div className="bg-green-50/50 p-4 rounded-lg border border-green-100 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      placeholder="Vacina"
                      value={newVaccine.name}
                      onChange={(e) =>
                        setNewVaccine({ ...newVaccine, name: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Lote"
                      value={newVaccine.batch}
                      onChange={(e) =>
                        setNewVaccine({ ...newVaccine, batch: e.target.value })
                      }
                    />
                    <Input
                      type="date"
                      value={newVaccine.nextDose}
                      onChange={(e) =>
                        setNewVaccine({
                          ...newVaccine,
                          nextDose: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleAddVaccine}
                    variant="outline"
                  >
                    Adicionar
                  </Button>
                </div>
                {/* List Vaccines */}
                <div className="space-y-2">
                  {vaccines.map((v, i) => (
                    <div
                      key={i}
                      className="flex justify-between p-3 border rounded-lg"
                    >
                      {v.name} - Lote {v.batch}{' '}
                      <Trash
                        className="h-4 w-4 cursor-pointer"
                        onClick={() =>
                          setVaccines((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="materials" className="space-y-6 mt-0">
                <div className="bg-gray-50/50 p-4 rounded-lg border space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" /> Insumos Utilizados
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Produto / Material</Label>
                      <Select
                        value={selectedMaterialId}
                        onValueChange={(val) => {
                          setSelectedMaterialId(val)
                          setSelectedBatchId('')
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o material..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMaterials.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({p.stock} {p.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedMaterialProduct?.batches &&
                      selectedMaterialProduct.batches.length > 0 && (
                        <div className="col-span-3 space-y-2 bg-yellow-50 p-3 rounded border border-yellow-200">
                          <Label>Selecione o Lote (Obrigatório)</Label>
                          <Select
                            value={selectedBatchId}
                            onValueChange={setSelectedBatchId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Lote..." />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedMaterialProduct.batches.map((b) => {
                                const isExpired = isBefore(
                                  parseISO(b.expirationDate),
                                  today,
                                )
                                const isNear = isBefore(
                                  parseISO(b.expirationDate),
                                  addDays(today, 30),
                                )

                                if (isExpired) return null // Filter expired as per requirements

                                return (
                                  <SelectItem
                                    key={b.id}
                                    value={b.id}
                                    className={
                                      isNear
                                        ? 'text-yellow-600 font-medium'
                                        : ''
                                    }
                                  >
                                    {b.code} (Qtd: {b.quantity}) - Val:{' '}
                                    {b.expirationDate}
                                    {isNear && ' ⚠️'}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Lotes vencidos não são exibidos.
                          </p>
                        </div>
                      )}

                    <div className="col-span-3 md:col-span-1 space-y-2">
                      <Label>Quantidade</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={materialQuantity}
                          onChange={(e) => setMaterialQuantity(e.target.value)}
                        />
                        <Button onClick={handleAddMaterial}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Materiais a Deduzir</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {m.name}
                          </TableCell>
                          <TableCell>
                            {m.batchId
                              ? products
                                  .find((p) => p.id === m.productId)
                                  ?.batches?.find((b) => b.id === m.batchId)
                                  ?.code
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {m.quantity} {m.unit}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-red-500"
                              onClick={() =>
                                setMaterials(
                                  materials.filter((_, idx) => idx !== i),
                                )
                              }
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-6 mt-0">
                <DocumentManager pet={pet} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/10">
          {activeTab === 'triage' &&
            appointment.clinicalStatus !== 'completed' && (
              <Button
                variant="default"
                onClick={handleSaveTriage}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!triageReady}
              >
                Salvar e Iniciar Consulta{' '}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          {activeTab !== 'triage' &&
            appointment.clinicalStatus !== 'completed' && (
              <Button
                onClick={handleFinish}
                className="bg-blue-600 hover:bg-blue-700 w-40"
                disabled={!soapReady}
              >
                Finalizar
              </Button>
            )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
      <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-blue-500" />
              Agendar Retorno
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deseja agendar um retorno para este paciente? A data sugerida é de
              30 dias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Data do Retorno</Label>
            <Input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => handleConfirmFinish(false)}
            >
              Não agendar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => handleConfirmFinish(true)}
            >
              Salvar e Agendar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
