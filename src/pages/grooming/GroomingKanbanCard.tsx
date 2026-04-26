import { Appointment, Client, GroomingStage, NotificationLog, Pet, Profile } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { AlertTriangle, ChevronRight, Lock, MessageCircle, PackageCheck, Eye, Edit, BellOff, SendHorizontal, Car } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const NOTIFICATION_TYPE_LABEL: Record<string, string> = {
  banho_tosa_checkin:  'Check-in',
  banho_tosa_pronto:   'Pronto',
  banho_tosa_entrega:  'Entregue',
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

const fmtTime = (d: Date) =>
  d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const fmtDuration = (minutes: number) =>
  minutes >= 60
    ? `${Math.floor(minutes / 60)}h${minutes % 60 > 0 ? String(minutes % 60).padStart(2, '0') : ''}`
    : `${minutes}min`

const fmtHHMM = (minutes: number) => {
  const abs = Math.max(0, minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const PET_SIZE_LABEL: Record<string, string> = { small: 'P', medium: 'M', large: 'G' }

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  apt: Appointment
  pet: Pet | undefined
  client: Client | undefined
  professional: Profile | undefined
  isFinal: boolean
  isDeliveryStage: boolean
  isDeliveryAvailable: boolean
  isNextStageAvailable: boolean
  isInitialStage: boolean
  notificationLogs: NotificationLog[]
  groomingStages: GroomingStage[]
  stageColor: string
  now: Date
  onOpen: () => void
  onNextStage: (e: React.MouseEvent) => void
  onDeliver: (e: React.MouseEvent) => void
  onWhatsApp: (e: React.MouseEvent) => void
  onEdit: () => void
  onView: () => void
  onDragStart: (e: React.DragEvent) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GroomingKanbanCard({
  apt,
  pet,
  client,
  professional,
  isFinal,
  isDeliveryStage,
  isDeliveryAvailable,
  isNextStageAvailable,
  isInitialStage,
  notificationLogs,
  groomingStages,
  stageColor,
  now,
  onOpen,
  onNextStage,
  onDeliver,
  onWhatsApp,
  onEdit,
  onView,
  onDragStart,
}: Props) {
  const aptDateKey = apt.date.split('T')[0]
  const recentLogs = notificationLogs
    .filter((l) => l.clientId === client?.id && l.status === 'sent' && l.sentAt.startsWith(aptDateKey))

  const items = apt.serviceItems ?? []
  const mainItem = items.find((i) => i.itemType === 'main')
  const checklistItems = items.filter((i) => i.itemType === 'checklist')
  const checkedCount = checklistItems.filter((i) => i.checked).length
  const hasPendingMandatory = checklistItems.some((i) => i.mandatory && !i.checked)

  // Legacy fallback: if no typed items, show old flat list
  const legacyItems = items.filter((i) => !i.itemType)
  const visibleServices = legacyItems.slice(0, 3)
  const hiddenCount = legacyItems.length - visibleServices.length

  const totalDuration = apt.serviceItems?.reduce((sum, i) => sum + (i.duration || 0), 0) || 0
  const exitTime =
    apt.startedAt && totalDuration > 0
      ? new Date(new Date(apt.startedAt).getTime() + totalDuration * 60000)
      : null

  // Duração real do atendimento (startedAt → completedAt ou agora)
  const realDurationMinutes = apt.startedAt
    ? Math.floor(((apt.completedAt ? new Date(apt.completedAt) : now).getTime() - new Date(apt.startedAt).getTime()) / 60000)
    : null

  const minutesInStage = apt.currentStageStartedAt
    ? Math.max(0, Math.floor((now.getTime() - new Date(apt.currentStageStartedAt).getTime()) / 60000))
    : null

  const stageTimeColor =
    minutesInStage === null
      ? ''
      : minutesInStage >= 90
        ? 'text-red-600 font-semibold'
        : minutesInStage >= 60
          ? 'text-amber-500 font-medium'
          : 'text-muted-foreground'

  const sizeLabel = pet?.size ? PET_SIZE_LABEL[pet.size] : null
  const hasTimeInfo = apt.startedAt || minutesInStage !== null || exitTime

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          draggable={!isFinal}
          onDragStart={onDragStart}
          className={isFinal ? 'cursor-default' : 'cursor-move'}
        >
          <Card
            className={cn(
              'hover:shadow-md transition-all relative overflow-hidden',
              stageColor.split(' ')[0], // bg-* only
              apt.priority === 'urgent' && 'border-l-4 border-l-red-500',
              apt.priority === 'preferential' && 'border-l-4 border-l-amber-400',
            )}
            onClick={onOpen}
          >
            <CardContent className="p-3 space-y-2">

              {/* ── Header: avatar + name + badges ── */}
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={pet?.avatar} />
                  <AvatarFallback>{pet?.name?.[0]}</AvatarFallback>
                </Avatar>

                <div className="overflow-hidden flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="font-bold text-sm truncate leading-tight">{pet?.name}</p>
                    {apt.priority === 'urgent' && (
                      <Badge className="text-[9px] px-1 py-0 h-4 bg-red-100 text-red-700 border-red-200 shrink-0">
                        Urgente
                      </Badge>
                    )}
                    {apt.priority === 'preferential' && (
                      <Badge className="text-[9px] px-1 py-0 h-4 bg-amber-100 text-amber-700 border-amber-200 shrink-0">
                        Pref.
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground leading-tight">
                    <span className="truncate">{pet?.breed}</span>
                    {sizeLabel && (
                      <>
                        <span>•</span>
                        <span className="shrink-0 font-medium">{sizeLabel}</span>
                      </>
                    )}
                    {apt.appointmentType === 'walkin' && (
                      <Badge className="text-[9px] px-1 py-0 h-3.5 bg-orange-100 text-orange-700 border-orange-200 shrink-0 ml-1">
                        Encaixe
                      </Badge>
                    )}
                  </div>
                </div>

                {isFinal && <Lock className="h-3 w-3 text-green-600 shrink-0" />}
              </div>

              {/* ── Serviço principal (novo modelo) ── */}
              {mainItem && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium truncate max-w-[90%]">
                    {mainItem.description}
                  </span>
                </div>
              )}

              {/* ── Checklist resumo ── */}
              {checklistItems.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      hasPendingMandatory
                        ? 'bg-red-100 text-red-700'
                        : checkedCount === checklistItems.length
                          ? 'bg-green-100 text-green-700'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    ✓ {checkedCount}/{checklistItems.length}
                  </span>
                </div>
              )}

              {/* ── Legacy service tags (atendimentos sem tipo) ── */}
              {visibleServices.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {visibleServices.map((item) => (
                    <span
                      key={item.id}
                      className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[90%]"
                    >
                      {item.description}
                    </span>
                  ))}
                  {hiddenCount > 0 && (
                    <span className="text-xs text-muted-foreground">+{hiddenCount}</span>
                  )}
                </div>
              )}

              {/* ── Tutor + professional ── */}
              <div className="space-y-0.5">
                {client && (
                  <p className="text-xs truncate font-medium">{client.name}</p>
                )}
                {professional && (
                  <p className="text-xs text-muted-foreground truncate">{professional.name}</p>
                )}
              </div>

              {/* ── Time row ── */}
              {hasTimeInfo && (
                <div className="flex flex-wrap justify-between gap-x-2 text-xs border-t pt-1.5">
                  {apt.startedAt && (
                    <span className="text-muted-foreground">
                      Entrada:{' '}
                      <span className="font-medium text-foreground">
                        {fmtTime(new Date(apt.startedAt))}
                      </span>
                    </span>
                  )}
                  {isDeliveryStage ? (
                    realDurationMinutes !== null && (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-0.5 cursor-default text-muted-foreground font-medium">
                              {fmtDuration(realDurationMinutes)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs font-semibold">Duração total do Att: {fmtHHMM(realDurationMinutes)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  ) : (
                    minutesInStage !== null && (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn('flex items-center gap-0.5 cursor-default', stageTimeColor)}>
                              {minutesInStage >= 60 && <AlertTriangle className="h-3 w-3" />}
                              {fmtDuration(minutesInStage)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Tempo na etapa atual: {fmtHHMM(minutesInStage)}</p>
                            {totalDuration > 0 && (
                              <p className="text-xs font-semibold">Duração prevista: {fmtHHMM(totalDuration)}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  )}
                  {exitTime && !isDeliveryStage && (
                    <span className="text-muted-foreground">
                      Saída prev.:{' '}
                      <span className="font-medium text-foreground">
                        {fmtTime(exitTime)}
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* ── Check-in alerts ── */}
              {(apt.checkinMatting === 'moderate' || apt.checkinMatting === 'severe' || apt.checkinFleas || apt.checkinBehavior === 'aggressive' || apt.checkinExtraAuthorized) && (
                <div className="flex flex-wrap gap-1 border-t pt-1.5">
                  {(apt.checkinMatting === 'moderate' || apt.checkinMatting === 'severe') && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">
                      Desembolo {apt.checkinMatting === 'severe' ? 'severo' : 'moderado'}
                    </span>
                  )}
                  {apt.checkinFleas && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">
                      Pulgas
                    </span>
                  )}
                  {apt.checkinBehavior === 'aggressive' && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">
                      Agressivo
                    </span>
                  )}
                  {apt.checkinExtraAuthorized && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                      Extra OK
                    </span>
                  )}
                </div>
              )}

              {/* ── Grooming preferences ── */}
              {apt.groomingPreferences && apt.groomingPreferences.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {apt.groomingPreferences.map((pref) => (
                    <span key={pref} className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">
                      {pref}
                    </span>
                  ))}
                </div>
              )}

              {/* ── Observations alert ── */}
              {apt.notes && (
                <div className="flex items-center gap-1 text-xs text-amber-600 border-t pt-1.5">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span className="truncate">{apt.notes}</span>
                </div>
              )}

              {/* ── Quick actions ── */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        title={isInitialStage ? 'Histórico de notificações' : 'Notificar via WhatsApp'}
                        onClick={isInitialStage ? undefined : onWhatsApp}
                        className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-b from-green-400 to-green-600 text-white flex items-center justify-center shadow-md shadow-green-200/70 hover:-translate-y-px hover:shadow-lg transition-all active:translate-y-0"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    {recentLogs.length > 0 && (
                      <TooltipContent side="bottom" className="p-0 max-w-[280px]">
                        <div className="max-h-48 overflow-y-auto p-3 space-y-3">
                          {recentLogs.map((log, i) => {
                            const sentAt = new Date(log.sentAt)
                            const dateStr = sentAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                            const timeStr = sentAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            const typeLabel = NOTIFICATION_TYPE_LABEL[log.type] ?? log.type
                            return (
                              <div key={log.id} className={i > 0 ? 'border-t pt-2 space-y-0.5' : 'space-y-0.5'}>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-foreground">{dateStr}</span>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <span className="text-xs font-bold text-foreground">{timeStr}</span>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <span className="text-xs font-semibold text-green-700">{typeLabel}</span>
                                </div>
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{log.message}</p>
                              </div>
                            )
                          })}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                {isFinal && (
                  <div
                    className={cn(
                      'h-8 w-8 shrink-0 rounded-xl flex items-center justify-center',
                      apt.tutorNotified
                        ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-200/70'
                        : 'bg-slate-100 text-slate-400',
                    )}
                    title={apt.tutorNotified ? 'Tutor notificado' : 'Tutor não notificado'}
                  >
                    {apt.tutorNotified
                      ? <SendHorizontal className="h-4 w-4" />
                      : <BellOff className="h-4 w-4" />
                    }
                  </div>
                )}

                {isNextStageAvailable && (
                  <button
                    title="Próxima etapa"
                    onClick={onNextStage}
                    className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-200/70 hover:-translate-y-px hover:shadow-lg transition-all active:translate-y-0 ml-auto"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                {isDeliveryAvailable && (
                  <button
                    title="Entregar Pet"
                    onClick={onDeliver}
                    className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 text-white flex items-center justify-center shadow-md shadow-violet-200/70 hover:-translate-y-px hover:shadow-lg transition-all active:translate-y-0 ml-auto"
                  >
                    <PackageCheck className="h-4 w-4" />
                  </button>
                )}
                {isDeliveryStage && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 text-white flex items-center justify-center shadow-md shadow-violet-200/70 ml-auto cursor-default"
                        >
                          <Car className="h-4 w-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="p-0 max-w-[280px]">
                        <div className="p-3 space-y-2">
                          <p className="text-xs font-bold text-foreground border-b pb-1.5">Histórico do atendimento</p>
                          <div className="space-y-2">
                            {groomingStages
                              .filter((s) => !s.isDelivery)
                              .map((s) => {
                                const entry = apt.stageHistory?.find((h) => h.stageId === s.id)
                                if (!entry) return null
                                return (
                                  <div key={s.id} className="flex items-start gap-2">
                                    <span className="mt-0.5 h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold text-foreground">{s.title}</p>
                                      <p className="text-xs text-muted-foreground">{fmtTime(new Date(entry.startedAt))}</p>
                                    </div>
                                  </div>
                                )
                              })}
                            {apt.completedAt && (
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-foreground">Entregue</p>
                                  <p className="text-xs text-muted-foreground">{fmtTime(new Date(apt.completedAt))}</p>
                                </div>
                              </div>
                            )}
                            {realDurationMinutes !== null && (
                              <div className="border-t pt-1.5 flex justify-between text-xs">
                                <span className="text-muted-foreground">Duração total</span>
                                <span className="font-semibold text-foreground">{fmtHHMM(realDurationMinutes)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </ContextMenuItem>
        <ContextMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
