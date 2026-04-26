import { useState } from 'react'
import { Appointment } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

const MATTING_OPTIONS = [
  { value: 'none',     label: 'Nenhum' },
  { value: 'mild',     label: 'Leve' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'severe',   label: 'Severo' },
] as const

const BEHAVIOR_OPTIONS = [
  { value: 'calm',       label: 'Tranquilo' },
  { value: 'agitated',   label: 'Agitado' },
  { value: 'aggressive', label: 'Agressivo' },
] as const

export interface CheckinData {
  checkinArrivalTime: string
  checkinMatting: 'none' | 'mild' | 'moderate' | 'severe'
  checkinFleas: boolean
  checkinBehavior: 'calm' | 'agitated' | 'aggressive'
  checkinNotes: string
  newDate?: string
}

interface Props {
  open: boolean
  apt: Appointment
  petName?: string
  isDifferentDay: boolean
  onConfirm: (data: CheckinData) => void
  onCancel: () => void
}

export function CheckinDialog({ open, apt, petName, isDifferentDay, onConfirm, onCancel }: Props) {
  const now = new Date()
  const localNow = now.toLocaleString('sv').replace(' ', 'T')
  const localTime = now.toTimeString().slice(0, 5)

  const [arrivalTime, setArrivalTime] = useState(localTime)
  const [matting, setMatting] = useState<CheckinData['checkinMatting']>('none')
  const [fleas, setFleas] = useState(false)
  const [behavior, setBehavior] = useState<CheckinData['checkinBehavior']>('calm')
  const [notes, setNotes] = useState('')

  const handleConfirm = () => {
    const today = new Date().toLocaleDateString('sv')
    const checkinArrivalTime = `${today}T${arrivalTime}:00`
    onConfirm({
      checkinArrivalTime,
      checkinMatting: matting,
      checkinFleas: fleas,
      checkinBehavior: behavior,
      checkinNotes: notes,
      newDate: isDifferentDay ? localNow : undefined,
    })
  }

  const hasMainItem = !!(apt.serviceItems?.find(i => i.itemType === 'main') || apt.serviceItems?.filter(i => !i.itemType).length)
  const hasAlert = matting === 'severe' || matting === 'moderate' || fleas || behavior === 'aggressive'

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Recepção do Pet</DialogTitle>
          <DialogDescription>
            {petName && <span className="font-semibold">{petName}</span>}
            {isDifferentDay && (
              <span className="block text-amber-600 mt-1">
                Agendamento de outro dia. A data será atualizada para agora ao confirmar.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">

          {/* Hora de chegada */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Hora de chegada</Label>
            <input
              type="time"
              value={arrivalTime}
              onChange={e => setArrivalTime(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {/* Desembolo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nível de desembolo</Label>
            <div className="flex gap-2 flex-wrap">
              {MATTING_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMatting(opt.value)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                    matting === opt.value
                      ? opt.value === 'severe' || opt.value === 'moderate'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-violet-200 bg-violet-50 text-violet-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comportamento */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Comportamento</Label>
            <div className="flex gap-2 flex-wrap">
              {BEHAVIOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBehavior(opt.value)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                    behavior === opt.value
                      ? opt.value === 'aggressive'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : opt.value === 'agitated'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-green-200 bg-green-50 text-green-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pulgas / carrapatos */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Pulgas / carrapatos</p>
              <p className="text-xs text-slate-500">Pet chegou com infestação</p>
            </div>
            <Switch checked={fleas} onCheckedChange={setFleas} />
          </div>

          {/* Observação de entrada */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Observação de entrada</Label>
            <Textarea
              className="rounded-xl min-h-[72px] text-sm"
              placeholder="Informações adicionais sobre o estado do pet na chegada..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Aviso: serviço principal obrigatório */}
          {!hasMainItem && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              <p className="font-bold">Serviço principal não definido</p>
              <p className="mt-0.5">Edite o agendamento e selecione um serviço principal antes de dar entrada.</p>
            </div>
          )}

          {/* Alerta operacional */}
          {hasAlert && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 space-y-1">
              <p className="font-bold">Atenção — alertas registrados:</p>
              {(matting === 'moderate' || matting === 'severe') && <p>• Desembolo {matting === 'severe' ? 'severo' : 'moderado'} — verifique tempo e valor</p>}
              {fleas && <p>• Presença de pulgas/carrapatos — registre detalhes na observação</p>}
              {behavior === 'aggressive' && <p>• Comportamento agressivo — atenção redobrada da equipe</p>}
            </div>
          )}

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleConfirm}
            disabled={!hasMainItem}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Confirmar entrada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
