import { Appointment, Client, NotificationLog, Pet, Profile } from '@/lib/types'
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
  now,
  onOpen,
  onNextStage,
  onDeliver,
  onWhatsApp,
  onEdit,
  onView,
  onDragStart,
}: Props) {
  const recentLogs = notificationLogs
    .filter((l) => l.clientId === client?.id && l.status === 'sent')

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

  const minutesInStage = apt.currentStageStartedAt
    ? Math.floor((now.getTime() - new Date(apt.currentStageStartedAt).getTime()) / 60000)
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
                  {minutesInStage !== null && (
                    <span className={cn('flex items-center gap-0.5', stageTimeColor)}>
                      {minutesInStage >= 60 && <AlertTriangle className="h-3 w-3" />}
                      {fmtDuration(minutesInStage)}
                    </span>
                  )}
                  {exitTime && (
                    <span className="text-muted-foreground">
                      Saída:{' '}
                      <span className="font-medium text-foreground">
                        {fmtTime(exitTime)}
                      </span>
                    </span>
                  )}
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
                          {recentLogs.map((log, i) => (
                            <div key={log.id} className={i > 0 ? 'border-t pt-2 space-y-0.5' : 'space-y-0.5'}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground">
                                  {new Date(log.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-xs font-bold text-foreground">
                                  {NOTIFICATION_TYPE_LABEL[log.type] ?? log.type}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{log.message}</p>
                            </div>
                          ))}
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
                  <div
                    title="Entregue"
                    className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 text-white flex items-center justify-center shadow-md shadow-violet-200/70 ml-auto"
                  >
                    <Car className="h-4 w-4" />
                  </div>
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
