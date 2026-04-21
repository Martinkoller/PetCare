import { Appointment, Client, Pet, Profile } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Edit, LogIn } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PET_SIZE_LABEL: Record<string, string> = { small: 'P', medium: 'M', large: 'G' }

interface Props {
  apt: Appointment
  pet: Pet | undefined
  client: Client | undefined
  professional: Profile | undefined
  onCheckin: () => void
  onEdit: (e: React.MouseEvent) => void
}

export function AgendamentoDiaCard({ apt, pet, client, professional, onCheckin, onEdit }: Props) {
  const sizeLabel = pet?.size ? PET_SIZE_LABEL[pet.size] : null
  const mainItem = apt.serviceItems?.find((i) => i.itemType === 'main')
  const legacyItems = apt.serviceItems?.filter((i) => !i.itemType) ?? []

  const aptTime = apt.date ? format(new Date(apt.date), 'HH:mm', { locale: ptBR }) : null

  return (
    <Card className="group relative overflow-hidden border-l-4 border-l-violet-400 hover:shadow-md transition-all">
      <CardContent className="p-3 space-y-2">

        {/* Header: avatar + nome + hora */}
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={pet?.avatar} />
            <AvatarFallback>{pet?.name?.[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 overflow-hidden">
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
              {apt.appointmentType === 'walkin' && (
                <Badge className="text-[9px] px-1 py-0 h-4 bg-orange-100 text-orange-700 border-orange-200 shrink-0">
                  Encaixe
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground leading-tight">
              <span className="truncate">{pet?.breed}</span>
              {sizeLabel && (
                <>
                  <span>•</span>
                  <span className="font-medium shrink-0">{sizeLabel}</span>
                </>
              )}
            </div>
          </div>

          {aptTime && (
            <span className="text-xs font-semibold text-violet-700 shrink-0 bg-violet-50 px-1.5 py-0.5 rounded">
              {aptTime}
            </span>
          )}
        </div>

        {/* Serviço principal ou legado */}
        {(mainItem || legacyItems.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {mainItem ? (
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium truncate max-w-full">
                {mainItem.description}
              </span>
            ) : (
              legacyItems.slice(0, 2).map((i) => (
                <span key={i.id} className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-full">
                  {i.description}
                </span>
              ))
            )}
          </div>
        )}

        {/* Tutor + profissional */}
        <div className="space-y-0.5">
          {client && <p className="text-xs font-medium truncate">{client.name}</p>}
          {professional && (
            <p className="text-xs text-muted-foreground truncate">{professional.name}</p>
          )}
        </div>

        {/* Botão de check-in */}
        <Button
          size="sm"
          className="w-full h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1"
          onClick={onCheckin}
        >
          <LogIn className="h-3 w-3" />
          Iniciar Atendimento
        </Button>

        {/* Editar (hover) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onEdit}
            title="Editar"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
