import { useState, useRef } from 'react'
import { Appointment, Client, Pet, Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ArrowRight, AlertTriangle, Camera, X, Stethoscope, Clock, Star } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Opções ──────────────────────────────────────────────────────────────────

const MATTING_OPTIONS = [
  { value: 'none',     label: 'Nenhum',   alert: false },
  { value: 'mild',     label: 'Leve',     alert: false },
  { value: 'moderate', label: 'Moderado', alert: true  },
  { value: 'severe',   label: 'Alto',     alert: true  },
  { value: 'critical', label: 'Crítico',  alert: true  },
] as const

const BEHAVIOR_OPTIONS = [
  { value: 'calm',       label: 'Tranquilo', color: 'green'  },
  { value: 'anxious',    label: 'Ansioso',   color: 'amber'  },
  { value: 'fearful',    label: 'Medroso',   color: 'amber'  },
  { value: 'agitated',   label: 'Agitado',   color: 'orange' },
  { value: 'aggressive', label: 'Agressivo', color: 'red'    },
] as const

const CONDITION_OPTIONS = [
  { value: 'fleas',       label: 'Pulgas'             },
  { value: 'ticks',       label: 'Carrapatos'         },
  { value: 'wounds',      label: 'Feridas'            },
  { value: 'otitis',      label: 'Otite'              },
  { value: 'skin',        label: 'Irritação na pele'  },
  { value: 'sensitivity', label: 'Sensibilidade'      },
  { value: 'injuries',    label: 'Machucados'         },
  { value: 'eyes',        label: 'Prob. oculares'     },
  { value: 'postsurgery', label: 'Pós-cirúrgico'      },
] as const

const CONSENTS = [
  'Tutor autorizou a realização dos serviços',
  'Tutor ciente sobre desembolo e possível cobrança adicional',
  'Tutor ciente sobre possíveis irritações de pele',
  'Tutor autorizou contenção se necessário',
  'Tutor confirmou as condições registradas na entrada',
] as const

const BEHAVIOR_CLASS: Record<string, string> = {
  green:  'border-green-200 bg-green-50 text-green-700',
  amber:  'border-amber-200 bg-amber-50 text-amber-700',
  orange: 'border-orange-200 bg-orange-50 text-orange-700',
  red:    'border-red-200 bg-red-50 text-red-700',
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface CheckinData {
  checkinArrivalTime: string
  checkinMatting: string
  checkinFleas: boolean
  checkinBehavior: string
  checkinNotes: string
  checkinWeight?: number | null
  checkinConditions?: string[]
  checkinPhotos?: string[]
  newDate?: string
}

interface Props {
  open: boolean
  apt: Appointment
  pet?: Pet
  client?: Client
  professional?: Profile
  isDifferentDay: boolean
  onConfirm: (data: CheckinData) => void
  onCancel: () => void
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function CheckinDialog({
  open, apt, pet, client, professional, isDifferentDay, onConfirm, onCancel,
}: Props) {
  const now      = new Date()
  const localNow = now.toLocaleString('sv').replace(' ', 'T')
  const localTime = now.toTimeString().slice(0, 5)

  const [tab, setTab]                   = useState<'info' | 'checkin' | 'ok'>('info')
  const [arrivalTime, setArrivalTime]   = useState(localTime)
  const [weight, setWeight]             = useState<string>('')
  const [matting, setMatting]           = useState('none')
  const [behavior, setBehavior]         = useState('calm')
  const [conditions, setConditions]     = useState<string[]>([])
  const [notes, setNotes]               = useState('')
  const [photos, setPhotos]             = useState<string[]>([])
  const [consents, setConsents]         = useState<boolean[]>(CONSENTS.map(() => false))
  const fileRef = useRef<HTMLInputElement>(null)

  const hasMainItem = !!(
    apt.serviceItems?.find((i: any) => i.itemType === 'main') ||
    apt.serviceItems?.filter((i: any) => !i.itemType).length
  )

  const mattingOpt  = MATTING_OPTIONS.find(o => o.value === matting)
  const hasFleas    = conditions.includes('fleas') || conditions.includes('ticks')
  const needsMatting = mattingOpt?.alert ?? false
  const isAggressive = behavior === 'aggressive'
  const hasAlerts   = needsMatting || hasFleas || isAggressive || conditions.includes('wounds') || conditions.includes('postsurgery')

  const suggestions: string[] = []
  if (needsMatting) suggestions.push('Desembolo')
  if (hasFleas)     suggestions.push('Banho antipulgas / anticarrapato')

  const toggleCondition = (val: string) =>
    setConditions(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val])

  const toggleConsent = (idx: number) =>
    setConsents(prev => prev.map((v, i) => i === idx ? !v : v))

  const allConsentsChecked = consents.every(Boolean)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        if (ev.target?.result) setPhotos(prev => [...prev, ev.target!.result as string])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleConfirm = () => {
    const today = new Date().toLocaleDateString('sv')
    onConfirm({
      checkinArrivalTime: `${today}T${arrivalTime}:00`,
      checkinMatting:     matting,
      checkinFleas:       hasFleas,
      checkinBehavior:    behavior,
      checkinNotes:       notes,
      checkinWeight:      weight ? parseFloat(weight) : null,
      checkinConditions:  conditions,
      checkinPhotos:      photos,
      newDate:            isDifferentDay ? localNow : undefined,
    })
  }

  const canGoToCheckin = hasMainItem
  const canGoToOk      = true
  const canConfirm     = allConsentsChecked

  const mainItem    = apt.serviceItems?.find((i: any) => i.itemType === 'main')
  const legacyItems = apt.serviceItems?.filter((i: any) => !i.itemType) ?? []
  const aptTime     = apt.date ? format(new Date(apt.date), 'HH:mm', { locale: ptBR }) : null

  // Badges de resumo para o rodapé
  const checkinBadges: string[] = []
  if (mattingOpt && matting !== 'none') checkinBadges.push(mattingOpt.label)
  if (conditions.length) checkinBadges.push(`${conditions.length} cond.`)
  if (photos.length)     checkinBadges.push(`${photos.length} foto${photos.length > 1 ? 's' : ''}`)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">

        <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
          <DialogTitle className="text-base">Recepção do Pet</DialogTitle>
          {isDifferentDay && (
            <DialogDescription className="text-amber-600 text-xs">
              Agendamento de outro dia — a data será atualizada para agora ao confirmar.
            </DialogDescription>
          )}
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex flex-col">

          <TabsList className="grid grid-cols-3 mx-6 mt-3 mb-0 h-9 rounded-xl bg-slate-100">
            <TabsTrigger value="info"    className="rounded-lg text-xs">Identificação</TabsTrigger>
            <TabsTrigger value="checkin" className="rounded-lg text-xs" disabled={!canGoToCheckin}>
              Check-in
              {hasAlerts && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />}
            </TabsTrigger>
            <TabsTrigger value="ok"      className="rounded-lg text-xs" disabled={!canGoToOk}>
              Consentimentos
              {allConsentsChecked && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />}
            </TabsTrigger>
          </TabsList>

          {/* ── Aba 1: Identificação ─────────────────────────────────────── */}
          <TabsContent value="info" className="px-6 py-4 space-y-3 mt-0">

            {/* Cabeçalho do pet */}
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 shrink-0">
                <AvatarImage src={pet?.avatar} />
                <AvatarFallback className="bg-violet-100 text-violet-700 text-xl font-bold">
                  {pet?.name?.[0] ?? 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-[15px] truncate">{pet?.name ?? '—'}</p>
                {client && <p className="text-sm text-slate-500 truncate">{client.name}</p>}
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                  {aptTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{aptTime}
                    </span>
                  )}
                  {professional && (
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" />{professional.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Serviços */}
            {(mainItem || legacyItems.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {mainItem && (
                  <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700 border-0">
                    <Star className="w-3 h-3 mr-1" />{mainItem.description}
                  </Badge>
                )}
                {legacyItems.slice(0, 3).map((i: any) => (
                  <Badge key={i.id} variant="secondary" className="text-xs">{i.description}</Badge>
                ))}
              </div>
            )}

            {/* Alerta clínico */}
            {pet?.clinicalAlert && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{pet.clinicalAlert}</span>
              </div>
            )}

            {/* Observações do cadastro */}
            {pet?.notes && (
              <p className="text-xs text-slate-400 italic leading-snug">{pet.notes}</p>
            )}

            {/* Aviso sem serviço principal */}
            {!hasMainItem && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                <p className="font-bold">Serviço principal não definido</p>
                <p className="mt-0.5">Edite o agendamento e selecione um serviço principal antes de dar entrada.</p>
              </div>
            )}

          </TabsContent>

          {/* ── Aba 2: Check-in ──────────────────────────────────────────── */}
          <TabsContent value="checkin" className="px-6 py-4 space-y-4 mt-0">

            {/* Hora + Peso */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hora de chegada</Label>
                <input
                  type="time"
                  value={arrivalTime}
                  onChange={e => setArrivalTime(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Peso atual (kg)</Label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="Ex: 4.5"
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>

            {/* Desembolo */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nível de desembolo</Label>
              <div className="flex gap-1.5 flex-wrap">
                {MATTING_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMatting(opt.value)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                      matting === opt.value
                        ? opt.alert
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-violet-200 bg-violet-50 text-violet-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300',
                    )}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Comportamento */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Comportamento</Label>
              <div className="flex gap-1.5 flex-wrap">
                {BEHAVIOR_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBehavior(opt.value)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                      behavior === opt.value
                        ? BEHAVIOR_CLASS[opt.color]
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300',
                    )}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Condições */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Condições identificadas</Label>
              <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
                {CONDITION_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={conditions.includes(opt.value)}
                      onCheckedChange={() => toggleCondition(opt.value)}
                      className="rounded h-3.5 w-3.5"
                    />
                    <span className="text-xs text-slate-700 leading-tight">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sugestões */}
            {suggestions.length > 0 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 space-y-0.5">
                <p className="font-bold">Serviços sugeridos:</p>
                {suggestions.map(s => <p key={s}>• {s}</p>)}
              </div>
            )}

            {/* Alertas */}
            {hasAlerts && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 space-y-0.5">
                <p className="font-bold">Alertas:</p>
                {needsMatting     && <p>• Desembolo {mattingOpt?.label.toLowerCase()} — verifique valor</p>}
                {hasFleas         && <p>• Pulgas/carrapatos — registre na observação</p>}
                {isAggressive     && <p>• Comportamento agressivo — atenção da equipe</p>}
                {conditions.includes('wounds')      && <p>• Feridas — cuidado no manuseio</p>}
                {conditions.includes('postsurgery') && <p>• Pós-cirúrgico — validar liberação vet.</p>}
              </div>
            )}

            {/* Fotos */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fotos de entrada</Label>
              <div className="flex flex-wrap gap-2">
                {photos.map((src, i) => (
                  <div key={i} className="relative h-14 w-14">
                    <img src={src} alt="" className="h-14 w-14 rounded-xl object-cover border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="h-14 w-14 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:border-violet-400 hover:text-violet-500 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-[9px]">Adicionar</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Observações de entrada</Label>
              <Textarea
                className="rounded-xl min-h-[60px] text-sm"
                placeholder="Informações adicionais sobre o estado do pet..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

          </TabsContent>

          {/* ── Aba 3: Consentimentos ────────────────────────────────────── */}
          <TabsContent value="ok" className="px-6 py-4 space-y-3 mt-0">

            <p className="text-xs text-slate-500">Confirme os consentimentos do tutor antes de dar entrada no pet.</p>

            <div className="space-y-3">
              {CONSENTS.map((text, i) => (
                <label key={i} className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={consents[i]}
                    onCheckedChange={() => toggleConsent(i)}
                    className="mt-0.5 rounded"
                  />
                  <span className="text-sm text-slate-700 leading-snug">{text}</span>
                </label>
              ))}
            </div>

            {/* Resumo do check-in */}
            {checkinBadges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">Registrado:</span>
                {checkinBadges.map(b => (
                  <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
                ))}
              </div>
            )}

          </TabsContent>

        </Tabs>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={onCancel} className="h-9">Cancelar</Button>

          <div className="flex gap-2">
            {tab !== 'info' && (
              <Button
                variant="outline"
                className="h-9"
                onClick={() => setTab(tab === 'ok' ? 'checkin' : 'info')}
              >
                Voltar
              </Button>
            )}
            {tab !== 'ok' ? (
              <Button
                className="h-9 bg-violet-600 hover:bg-violet-700 text-white"
                disabled={tab === 'info' && !canGoToCheckin}
                onClick={() => setTab(tab === 'info' ? 'checkin' : 'ok')}
              >
                Prosseguir <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="h-9 bg-violet-600 hover:bg-violet-700 text-white"
                disabled={!canConfirm}
                onClick={handleConfirm}
              >
                Confirmar entrada <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
