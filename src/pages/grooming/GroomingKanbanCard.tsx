import { Appointment, Client, Pet, Profile } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ChevronRight, Edit, Lock, MessageCircle, PackageCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  isDeliveryAvailable: boolean
  isNextStageAvailable: boolean
  now: Date
  onOpen: () => void
  onNextStage: (e: React.MouseEvent) => void
  onDeliver: (e: React.MouseEvent) => void
  onWhatsApp: (e: React.MouseEvent) => void
  onEdit: (e: React.MouseEvent) => void
  onDragStart: (e: React.DragEvent) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GroomingKanbanCard({
  apt,
  pet,
  client,
  professional,
  isFinal,
  isDeliveryAvailable,
  isNextStageAvailable,
  now,
  onOpen,
  onNextStage,
  onDeliver,
  onWhatsApp,
  onEdit,
  onDragStart,
}: Props) {
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
    <div
      draggable={!isFinal}
      onDragStart={onDragStart}
      className={isFinal ? 'cursor-default' : 'cursor-move'}
    >
      <Card
        className={cn(
          'hover:shadow-md transition-all group relative overflow-hidden',
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

          {/* ── Tutor notification status (final stage only) ── */}
          {isFinal && (
            <div
              className={cn(
                'text-xs border-t pt-1.5',
                apt.tutorNotified ? 'text-green-600' : 'text-muted-foreground',
              )}
            >
              {apt.tutorNotified ? '✓ Tutor notificado' : 'Tutor não notificado'}
            </div>
          )}

          {/* ── Quick actions (visible on hover) ── */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isNextStageAvailable && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={onNextStage}
                title="Próxima etapa"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}
            {isDeliveryAvailable && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                onClick={onDeliver}
                title="Entregar Pet"
              >
                <PackageCheck className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={onWhatsApp}
              title="Notificar via WhatsApp"
            >
              <MessageCircle className="h-3 w-3" />
            </Button>
            {!isFinal && !isDeliveryAvailable && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={onEdit}
                title="Editar"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
