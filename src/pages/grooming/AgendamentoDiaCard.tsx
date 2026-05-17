import { useState } from 'react'
import { Appointment, Client, Pet, Profile } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Eye, Edit, ArrowRight, ChevronRight, Stethoscope, UserX } from 'lucide-react'
import { CheckinDialog, CheckinData } from './CheckinDialog'

const STATUS_META: Record<string, { label: string; dot: string }> = {
  scheduled:   { label: 'Agendado',       dot: 'bg-slate-500' },
  confirmed:   { label: 'Confirmado',     dot: 'bg-blue-600' },
  in_progress: { label: 'Em Atendimento', dot: 'bg-amber-500' },
  completed:   { label: 'Finalizado',     dot: 'bg-green-600' },
  cancelled:   { label: 'Cancelado',      dot: 'bg-red-600' },
}

interface Props {
  apt: Appointment
  pet: Pet | undefined
  client: Client | undefined
  professional: Profile | undefined
  onCheckin: (data: CheckinData) => void
  onNextStage: (e: React.MouseEvent) => void
  onNoShow: () => void
  onEdit: () => void
  onView: () => void
}

export function AgendamentoDiaCard({
  apt,
  pet,
  client,
  professional,
  onCheckin,
  onNextStage,
  onNoShow,
  onEdit,
  onView,
}: Props) {
  const [checkinOpen, setCheckinOpen] = useState(false)

  const aptDate = apt.date ? new Date(apt.date) : null
  const isDifferentDay = aptDate ? !isSameDay(aptDate, new Date()) : false

  const mainItem = apt.serviceItems?.find((i) => i.itemType === 'main')
  const legacyItems = apt.serviceItems?.filter((i) => !i.itemType) ?? []
  const serviceItems = mainItem
    ? [mainItem, ...apt.serviceItems!.filter((i) => i.itemType === 'checklist').slice(0, 1)]
    : legacyItems.slice(0, 2)

  const aptTime = apt.date ? format(new Date(apt.date), 'HH:mm', { locale: ptBR }) : null
  const statusMeta = STATUS_META[apt.status] ?? STATUS_META['scheduled']

  const handleCheckinClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCheckinOpen(true)
  }

  const tooltipContent = (
    <div className="space-y-1.5 text-xs min-w-[160px]">
      <div className="font-bold text-sm">{pet?.name ?? '—'}</div>
      {client && <div className="text-muted-foreground">{client.name}</div>}
      <div className="flex items-center gap-2 pt-0.5">
        {aptTime && <span className="font-semibold">{aptTime}</span>}
        <span className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full shrink-0 ${statusMeta.dot}`} />
          {statusMeta.label}
        </span>
      </div>
      {serviceItems.length > 0 && (
        <div className="pt-0.5 space-y-0.5">
          {serviceItems.map((item) => (
            <div key={item.id} className="text-muted-foreground truncate">{item.description}</div>
          ))}
        </div>
      )}
      {professional && (
        <div className="flex items-center gap-1 pt-0.5 text-muted-foreground">
          <Stethoscope className="h-3 w-3 shrink-0" />
          {professional.name}
        </div>
      )}
    </div>
  )

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full min-w-0 bg-white border border-violet-200 border-l-[4px] border-l-violet-500 rounded-2xl px-3 py-3 shadow-sm hover:shadow-md transition-all cursor-default space-y-2.5">

                  {/* TOPO: avatar + nome + bolinha status + horário */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={pet?.avatar} />
                      <AvatarFallback className="bg-violet-100 text-violet-700 text-sm font-bold">
                        {pet?.name?.[0] ?? 'P'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <span className="block text-[15px] font-bold text-slate-900 truncate">
                        {pet?.name ?? 'Pet sem nome'}
                      </span>
                      {client && (
                        <span className="block text-[12px] text-slate-500 truncate">{client.name}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.dot}`} />
                      {aptTime && (
                        <span className="bg-violet-50 text-violet-700 text-[12px] font-bold px-2 py-1 rounded-lg">
                          {aptTime}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SERVIÇOS + BOTÃO */}
                  <div className="flex items-end justify-between gap-2">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      {serviceItems.slice(0, 2).map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex w-fit max-w-full rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 leading-tight truncate"
                        >
                          {item.description}
                        </span>
                      ))}
                    </div>

                    {apt.groomingStatus ? (
                      <button
                        title="Próxima etapa"
                        onClick={onNextStage}
                        className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-200/70 hover:-translate-y-px hover:shadow-lg transition-all active:translate-y-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        title="Iniciar atendimento"
                        onClick={handleCheckinClick}
                        className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-b from-violet-500 to-violet-700 text-white flex items-center justify-center shadow-md shadow-violet-200/70 hover:-translate-y-px hover:shadow-lg transition-all active:translate-y-0"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="p-3">
                {tooltipContent}
              </TooltipContent>
            </Tooltip>
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
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onNoShow} className="text-red-600 focus:text-red-600">
              <UserX className="mr-2 h-4 w-4" />
              Marcar como falta
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </TooltipProvider>

      <CheckinDialog
        open={checkinOpen}
        apt={apt}
        pet={pet}
        client={client}
        professional={professional}
        isDifferentDay={isDifferentDay}
        onConfirm={(data) => {
          setCheckinOpen(false)
          onCheckin(data)
        }}
        onCancel={() => setCheckinOpen(false)}
      />
    </>
  )
}
