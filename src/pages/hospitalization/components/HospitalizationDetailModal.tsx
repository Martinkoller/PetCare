import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Activity,
  HeartPulse,
  Thermometer,
  Droplets,
  Brain,
  ClipboardList,
  FileText,
  Clock3,
  Stethoscope,
  BedDouble,
  LogOut,
  Pill,
  AlertTriangle,
  Phone,
  Wrench,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  HospitalizationStay,
  HospitalizationLog,
  HospitalizationStatus,
  HospitalizationLogType,
} from '@/lib/types'

interface HospitalizationDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stay: HospitalizationStay
}

function formatDateTime(value?: string | null) {
  if (!value) return '--'
  try {
    return format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return '--'
  }
}

function formatStatus(status: HospitalizationStatus) {
  switch (status) {
    case 'admitted':
      return { label: 'Admitido', className: 'bg-slate-100 text-slate-700 border-slate-200' }
    case 'under_observation':
      return { label: 'Em observação', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' }
    case 'treatment':
      return { label: 'Em tratamento', className: 'bg-blue-100 text-blue-700 border-blue-200' }
    case 'critical':
      return { label: 'Crítico', className: 'bg-red-100 text-red-700 border-red-200' }
    case 'ready_for_discharge':
      return { label: 'Apto para alta', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    case 'discharged':
      return { label: 'Alta', className: 'bg-green-100 text-green-700 border-green-200' }
    case 'transferred':
      return { label: 'Transferido', className: 'bg-violet-100 text-violet-700 border-violet-200' }
    case 'deceased':
      return { label: 'Óbito', className: 'bg-zinc-200 text-zinc-800 border-zinc-300' }
    case 'cancelled':
      return { label: 'Cancelado', className: 'bg-orange-100 text-orange-700 border-orange-200' }
    default:
      return { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200' }
  }
}

function getLogMeta(type?: HospitalizationLogType) {
  switch (type) {
    case 'admission':
      return {
        label: 'Admissão',
        icon: <BedDouble className="h-4 w-4" />,
        className: 'bg-red-50 text-red-700 border-red-200',
      }
    case 'medical_evolution':
      return {
        label: 'Evolução médica',
        icon: <Stethoscope className="h-4 w-4" />,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      }
    case 'nursing':
      return {
        label: 'Enfermagem / Monitoramento',
        icon: <Activity className="h-4 w-4" />,
        className: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      }
    case 'medication':
      return {
        label: 'Medicação',
        icon: <Pill className="h-4 w-4" />,
        className: 'bg-purple-50 text-purple-700 border-purple-200',
      }
    case 'incident':
      return {
        label: 'Intercorrência',
        icon: <AlertTriangle className="h-4 w-4" />,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      }
    case 'procedure':
      return {
        label: 'Procedimento',
        icon: <Wrench className="h-4 w-4" />,
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      }
    case 'owner_contact':
      return {
        label: 'Contato com tutor',
        icon: <Phone className="h-4 w-4" />,
        className: 'bg-teal-50 text-teal-700 border-teal-200',
      }
    case 'discharge':
      return {
        label: 'Alta / Encerramento',
        icon: <LogOut className="h-4 w-4" />,
        className: 'bg-rose-50 text-rose-700 border-rose-200',
      }
    default:
      return {
        label: 'Registro',
        icon: <FileText className="h-4 w-4" />,
        className: 'bg-slate-50 text-slate-700 border-slate-200',
      }
  }
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value || '--'}</span>
    </div>
  )
}

function TimelineLogCard({ log }: { log: HospitalizationLog }) {
  const meta = getLogMeta(log.type)

  const hr = log.vitals?.heartRate ?? log.heartRate
  const temp = log.vitals?.temperature ?? log.temperature
  const rr = log.vitals?.respiratoryRate
  const pain = log.vitals?.painScore

  const hasVitals =
    hr !== undefined ||
    temp !== undefined ||
    rr !== undefined ||
    pain !== undefined ||
    log.vitals?.mucousMembranes ||
    log.vitals?.capillaryRefillTime ||
    log.vitals?.hydrationLevel ||
    log.vitals?.consciousness

  const hasClinical =
    log.clinical?.appetite ||
    log.clinical?.urination ||
    log.clinical?.defecation ||
    log.clinical?.vomiting !== undefined ||
    log.clinical?.diarrhea !== undefined

  return (
    <div className="relative pl-8">
      <div className="absolute left-[11px] top-0 bottom-0 w-px bg-slate-200" />
      <div className="absolute left-0 top-1 h-6 w-6 rounded-full border bg-white flex items-center justify-center text-slate-600 shadow-sm">
        {meta.icon}
      </div>

      <div className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <Badge variant="outline" className={meta.className}>
            {meta.label}
          </Badge>

          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDateTime(log.eventAt || log.createdAt)}
          </div>
        </div>

        {log.statusAfter && (
          <div className="text-xs">
            <span className="text-muted-foreground">Status após registro:</span>{' '}
            <span className="font-medium text-slate-700">{formatStatus(log.statusAfter).label}</span>
          </div>
        )}

        {hasVitals && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5 text-red-500" />
              Parâmetros Vitais
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-lg border bg-slate-50 p-2 text-xs">FC: <strong>{hr ?? '--'}</strong></div>
              <div className="rounded-lg border bg-slate-50 p-2 text-xs">FR: <strong>{rr ?? '--'}</strong></div>
              <div className="rounded-lg border bg-slate-50 p-2 text-xs">Temp: <strong>{temp ?? '--'}</strong></div>
              <div className="rounded-lg border bg-slate-50 p-2 text-xs">Dor: <strong>{pain ?? '--'}</strong></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600">
              <div>Mucosas: <strong>{log.vitals?.mucousMembranes || '--'}</strong></div>
              <div>TPC: <strong>{log.vitals?.capillaryRefillTime || '--'}</strong></div>
              <div>Hidratação: <strong>{log.vitals?.hydrationLevel || '--'}</strong></div>
              <div>Consciência: <strong>{log.vitals?.consciousness || '--'}</strong></div>
            </div>
          </div>
        )}

        {hasClinical && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5 text-emerald-600" />
              Checks Operacionais
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div className="rounded-lg border bg-emerald-50/50 p-2">Alimentação: <strong>{log.clinical?.appetite || '--'}</strong></div>
              <div className="rounded-lg border bg-emerald-50/50 p-2">Micção: <strong>{log.clinical?.urination || '--'}</strong></div>
              <div className="rounded-lg border bg-emerald-50/50 p-2">Defecação: <strong>{log.clinical?.defecation || '--'}</strong></div>
              <div className="rounded-lg border bg-emerald-50/50 p-2">Vômito: <strong>{log.clinical?.vomiting ? 'Sim' : 'Não'}</strong></div>
              <div className="rounded-lg border bg-emerald-50/50 p-2">Diarreia: <strong>{log.clinical?.diarrhea ? 'Sim' : 'Não'}</strong></div>
            </div>
          </div>
        )}

        {log.notes && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              Notas / Evolução
            </div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap rounded-lg border bg-slate-50 p-3">
              {log.notes}
            </div>
          </div>
        )}

        {log.conduct && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-700">
              Conduta / Plano
            </div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap rounded-lg border bg-blue-50/50 p-3">
              {log.conduct}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function HospitalizationDetailModal({
  open,
  onOpenChange,
  stay,
}: HospitalizationDetailModalProps) {
  const sortedLogs = [...(stay.logs || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const statusMeta = formatStatus(stay.status)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-white">
            <DialogTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-slate-900">
                  Prontuário da Internação — {stay.pet?.name || 'Pet não identificado'}
                </span>
                <DialogDescription className="text-sm">
                  Linha do tempo completa da internação, evolução clínica e encerramento.
                </DialogDescription>
              </div>

              <Badge variant="outline" className={statusMeta.className}>
                {statusMeta.label}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] min-h-0 flex-1">
            {/* Sidebar resumo */}
            <div className="border-r bg-slate-50/50 min-h-0">
              <ScrollArea className="h-[calc(92vh-88px)]">
                <div className="p-5 space-y-5">
                  <div className="rounded-xl border bg-white p-4 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Activity className="h-4 w-4 text-red-600" />
                      Resumo da Internação
                    </div>

                    <InfoRow label="Pet" value={stay.pet?.name} />
                    <InfoRow label="Espécie / Raça" value={`${stay.pet?.species || '--'} • ${stay.pet?.breed || '--'}`} />
                    <InfoRow label="Leito" value={stay.kennelNumber} />
                    <InfoRow label="Motivo" value={stay.reasonForAdmission} />
                    <InfoRow label="Origem" value={stay.origin || '--'} />
                    <InfoRow label="Veterinário responsável" value={stay.attendingVetName} />
                    <InfoRow label="Gravidade" value={stay.triageLevel} />
                    <InfoRow label="Peso de entrada (kg)" value={stay.weightAtAdmission} />
                    <InfoRow label="Admitido em" value={formatDateTime(stay.admittedAt)} />
                  </div>

                  {(stay.presumptiveDiagnosis || stay.initialNotes) && (
                    <div className="rounded-xl border bg-white p-4 space-y-3 shadow-sm">
                      <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                        Dados Iniciais
                      </div>

                      {stay.presumptiveDiagnosis && (
                        <div className="space-y-1">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                            Diagnóstico presumido
                          </div>
                          <div className="text-sm text-slate-700">{stay.presumptiveDiagnosis}</div>
                        </div>
                      )}

                      {stay.initialNotes && (
                        <div className="space-y-1">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                            Observações iniciais
                          </div>
                          <div className="text-sm text-slate-700 whitespace-pre-wrap">{stay.initialNotes}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {stay.dischargeAt && (
                    <div className="rounded-xl border bg-white p-4 space-y-3 shadow-sm">
                      <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <LogOut className="h-4 w-4 text-rose-600" />
                        Encerramento
                      </div>

                      <InfoRow label="Tipo" value={stay.dischargeType} />
                      <InfoRow label="Condição" value={stay.dischargeCondition} />
                      <InfoRow label="Diagnóstico final" value={stay.finalDiagnosis} />
                      <InfoRow label="Encerrado em" value={formatDateTime(stay.dischargeAt)} />

                      {stay.dischargeSummary && (
                        <div className="space-y-1">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                            Resumo clínico
                          </div>
                          <div className="text-sm text-slate-700 whitespace-pre-wrap">{stay.dischargeSummary}</div>
                        </div>
                      )}

                      {stay.dischargeInstructions && (
                        <div className="space-y-1">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                            Orientações ao tutor
                          </div>
                          <div className="text-sm text-slate-700 whitespace-pre-wrap">{stay.dischargeInstructions}</div>
                        </div>
                      )}

                      {stay.dischargeMedications && (
                        <div className="space-y-1">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                            Medicações para casa
                          </div>
                          <div className="text-sm text-slate-700 whitespace-pre-wrap">{stay.dischargeMedications}</div>
                        </div>
                      )}

                      {stay.returnRecommendation && (
                        <div className="space-y-1">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                            Retorno recomendado
                          </div>
                          <div className="text-sm text-slate-700 whitespace-pre-wrap">{stay.returnRecommendation}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Timeline */}
            <div className="min-h-0 bg-white">
              <ScrollArea className="h-[calc(92vh-88px)]">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Linha do Tempo Clínica</h3>
                      <p className="text-sm text-muted-foreground">
                        {sortedLogs.length} registro(s) encontrados para esta internação.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {sortedLogs.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground">
                      Nenhum registro encontrado nesta internação.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {sortedLogs.map((log) => (
                        <TimelineLogCard key={log.id} log={log} />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}