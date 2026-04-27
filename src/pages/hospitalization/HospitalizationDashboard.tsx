import { useMemo, useState } from 'react'
import {
  Plus,
  Activity,
  HeartPulse,
  Clock,
  FilePlus2,
  UserCircle,
  LogOut,
  Stethoscope,
  FileText,
  Archive,
  Syringe,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useHospitalizationStore } from '@/stores/HospitalizationContext'
import { AdmissionModal } from './components/AdmissionModal'
import { EvolutionModal } from './components/EvolutionModal'
import { DischargeModal } from './components/DischargeModal'
import { HospitalizationDetailModal } from './components/HospitalizationDetailModal'
import { PrescriptionModal } from './components/PrescriptionModal'
import { HospitalizationCarePanel } from './components/HospitalizationCarePanel'
import { HospitalizationStay, HospitalizationStatus } from '@/lib/types'

export default function HospitalizationDashboard() {
  const { stays, loading } = useHospitalizationStore()

  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false)
  const [selectedStay, setSelectedStay] = useState<HospitalizationStay | null>(null)
  const [selectedDischargeStay, setSelectedDischargeStay] = useState<HospitalizationStay | null>(null)
  const [selectedDetailStay, setSelectedDetailStay] = useState<HospitalizationStay | null>(null)
  const [selectedPrescriptionStay, setSelectedPrescriptionStay] = useState<HospitalizationStay | null>(null)

  const today = format(new Date(), "dd 'de' MMMM", { locale: ptBR })

  const activeStatuses: HospitalizationStatus[] = [
    'admitted',
    'under_observation',
    'treatment',
    'critical',
    'ready_for_discharge',
  ]

  const closedStatuses: HospitalizationStatus[] = [
    'discharged',
    'transferred',
    'deceased',
    'cancelled',
  ]

  const activeStays = useMemo(
    () => stays.filter((stay) => activeStatuses.includes(stay.status)),
    [stays]
  )

  const closedStays = useMemo(
    () =>
      stays
        .filter((stay) => closedStatuses.includes(stay.status))
        .sort((a, b) => {
          const aDate = a.dischargeAt ? new Date(a.dischargeAt).getTime() : 0
          const bDate = b.dischargeAt ? new Date(b.dischargeAt).getTime() : 0
          return bDate - aDate
        }),
    [stays]
  )

  const getStatusMeta = (status: HospitalizationStatus) => {
    switch (status) {
      case 'admitted':
        return { label: 'Admitido', className: 'bg-slate-100 text-slate-700 hover:bg-slate-200' }
      case 'under_observation':
        return { label: 'Observação', className: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' }
      case 'treatment':
        return { label: 'Em Tratamento', className: 'bg-blue-100 text-blue-700 hover:bg-blue-200' }
      case 'critical':
        return { label: 'Crítico', className: 'bg-red-100 text-red-700 hover:bg-red-200' }
      case 'ready_for_discharge':
        return { label: 'Apto para Alta', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' }
      case 'discharged':
        return { label: 'Alta', className: 'bg-green-100 text-green-700 hover:bg-green-200' }
      case 'transferred':
        return { label: 'Transferido', className: 'bg-violet-100 text-violet-700 hover:bg-violet-200' }
      case 'deceased':
        return { label: 'Óbito', className: 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300' }
      case 'cancelled':
        return { label: 'Cancelado', className: 'bg-orange-100 text-orange-700 hover:bg-orange-200' }
      default:
        return { label: 'Internado', className: 'bg-slate-100 text-slate-700 hover:bg-slate-200' }
    }
  }

  const getElapsedTime = (admittedAt?: string) => {
    if (!admittedAt) return '--'
    const start = new Date(admittedAt).getTime()
    const now = Date.now()
    const diffMs = now - start

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24

    if (days > 0) return `${days}d ${remainingHours}h`
    return `${hours}h`
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-red-600">
            <Activity className="h-6 w-6" />
            Mapa de Internação Médica
          </h1>
          <p className="text-muted-foreground text-sm">
            Plantão atual: {today}. Internação com evolução, prescrição, execução assistencial e prontuário.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            className="bg-red-600 hover:bg-red-700 gap-2 text-white shadow-md transition-all active:scale-95"
            onClick={() => setIsAdmissionOpen(true)}
          >
            <Plus className="h-4 w-4" /> Admitir Paciente
          </Button>
        </div>
      </div>

      {/* Cards ativos */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-semibold text-slate-900">Pacientes Internados (Ativos)</h2>
          <Badge variant="outline">{activeStays.length}</Badge>
        </div>

        {loading && activeStays.length === 0 ? (
          <div className="grid md:grid-cols-1 xl:grid-cols-2 gap-6 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-[650px] bg-muted rounded-xl border border-dashed" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-1 xl:grid-cols-2 gap-6">
            {activeStays.map((stay) => {
              const sortedLogs = [...(stay.logs || [])].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )

              const lastLog = sortedLogs[0]
              const lastHr = lastLog?.vitals?.heartRate ?? lastLog?.heartRate
              const lastTemp = lastLog?.vitals?.temperature ?? lastLog?.temperature
              const statusMeta = getStatusMeta(stay.status)

              return (
                <Card
                  key={stay.id}
                  className="relative overflow-hidden hover:shadow-lg transition-all border-t-4 border-t-red-500 group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <Badge
                          variant="outline"
                          className="mb-2 bg-red-50 text-red-700 border-red-200 font-mono"
                        >
                          Leito: {stay.kennelNumber}
                        </Badge>

                        <CardTitle className="text-xl font-bold text-gray-800">
                          {stay.pet?.name || 'Pet não identificado'}
                        </CardTitle>

                        <p className="text-xs text-muted-foreground">
                          {stay.pet?.species || 'Espécie'} • {stay.pet?.breed || 'Raça não informada'}
                        </p>

                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                          <Clock className="h-3 w-3" />
                          Internado há {getElapsedTime(stay.admittedAt)}
                        </div>
                      </div>

                      <Badge className={`capitalize shadow-none border-none py-1 px-3 ${statusMeta.className}`}>
                        {statusMeta.label}
                      </Badge>
                    </div>

                    {stay.appointmentId && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium bg-slate-50 w-fit px-2 py-0.5 rounded-full border border-slate-200">
                        <Clock className="h-3 w-3" />
                        ORIGEM: AGENDA
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <div className="bg-red-50/30 p-3 rounded-lg border border-red-100 text-sm">
                      <span className="font-bold text-red-900 block mb-1 text-[11px] uppercase tracking-wider">
                        Motivo da Internação:
                      </span>
                      <span className="text-red-600 font-medium">{stay.reasonForAdmission}</span>
                    </div>

                    {(stay.attendingVetName || stay.presumptiveDiagnosis) && (
                      <div className="space-y-2">
                        {stay.attendingVetName && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Stethoscope className="h-3.5 w-3.5 text-slate-500" />
                            Vet responsável: <span className="font-medium">{stay.attendingVetName}</span>
                          </div>
                        )}

                        {stay.presumptiveDiagnosis && (
                          <div className="text-xs text-slate-600">
                            <span className="font-medium">Dx presumido:</span> {stay.presumptiveDiagnosis}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-muted/20 rounded border border-gray-100">
                        <HeartPulse className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-600">FC: {lastHr || '--'} bpm</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/20 rounded border border-gray-100">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-600">Temp: {lastTemp || '--'}°C</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground italic border-l-2 pl-2 border-muted">
                      <UserCircle className="h-3.5 w-3.5" />
                      Última evolução:{' '}
                      {lastLog ? format(new Date(lastLog.createdAt), "dd/MM 'às' HH:mm") : 'Sem registros'}
                    </div>

                    <HospitalizationCarePanel stay={stay} />

                    <div className="border-t pt-4 flex flex-wrap items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2"
                        onClick={() => setSelectedDetailStay(stay)}
                      >
                        <FileText className="h-4 w-4" />
                        Ver Prontuário
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2 text-violet-700 border-violet-200 hover:bg-violet-50"
                        onClick={() => setSelectedPrescriptionStay(stay)}
                      >
                        <Syringe className="h-4 w-4" />
                        Prescrever
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold"
                        onClick={() => setSelectedStay(stay)}
                      >
                        <FilePlus2 className="h-4 w-4" />
                        Evoluir
                      </Button>

                      <Button
                        size="sm"
                        className="h-9 gap-2 bg-rose-600 hover:bg-rose-700 text-white"
                        onClick={() => setSelectedDischargeStay(stay)}
                      >
                        <LogOut className="h-4 w-4" />
                        Alta / Liberação
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {activeStays.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">Nenhum paciente internado no plantão atual.</p>
                <p className="text-sm">Os pacientes aparecerão aqui após a admissão.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Histórico encerrados */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Histórico de Encerrados</h2>
          <Badge variant="outline">{closedStays.length}</Badge>
        </div>

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {closedStays.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Nenhuma internação encerrada ainda.
            </div>
          ) : (
            <div className="divide-y">
              {closedStays.map((stay) => {
                const statusMeta = getStatusMeta(stay.status)

                return (
                  <div
                    key={stay.id}
                    className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{stay.pet?.name || 'Pet não identificado'}</span>
                        <Badge className={`shadow-none border-none ${statusMeta.className}`}>
                          {statusMeta.label}
                        </Badge>
                        <Badge variant="outline">Leito: {stay.kennelNumber}</Badge>
                      </div>

                      <div className="text-sm text-slate-600">
                        {stay.reasonForAdmission}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Admitido em {stay.admittedAt ? format(new Date(stay.admittedAt), "dd/MM/yyyy HH:mm") : '--'} •
                        Encerrado em {stay.dischargeAt ? format(new Date(stay.dischargeAt), "dd/MM/yyyy HH:mm") : '--'}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setSelectedDetailStay(stay)}
                      >
                        <FileText className="h-4 w-4" />
                        Ver Prontuário
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modais */}
      <AdmissionModal open={isAdmissionOpen} onOpenChange={setIsAdmissionOpen} />

      {selectedStay && (
        <EvolutionModal
          open={!!selectedStay}
          onOpenChange={(open: boolean) => !open && setSelectedStay(null)}
          stay={selectedStay}
        />
      )}

      {selectedDischargeStay && (
        <DischargeModal
          open={!!selectedDischargeStay}
          onOpenChange={(open: boolean) => !open && setSelectedDischargeStay(null)}
          stay={selectedDischargeStay}
        />
      )}

      {selectedDetailStay && (
        <HospitalizationDetailModal
          open={!!selectedDetailStay}
          onOpenChange={(open: boolean) => !open && setSelectedDetailStay(null)}
          stay={selectedDetailStay}
        />
      )}

      {selectedPrescriptionStay && (
        <PrescriptionModal
          open={!!selectedPrescriptionStay}
          onOpenChange={(open: boolean) => !open && setSelectedPrescriptionStay(null)}
          stay={selectedPrescriptionStay}
        />
      )}
    </div>
  )
}