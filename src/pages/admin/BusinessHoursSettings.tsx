import { useState } from 'react'
import { useConfigStore } from '@/stores/ConfigStore'
import { BusinessHours, WeekDay, DaySchedule } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DAY_LABELS: Record<WeekDay, string> = {
  sun: 'Domingo',
  mon: 'Segunda-feira',
  tue: 'Terça-feira',
  wed: 'Quarta-feira',
  thu: 'Quinta-feira',
  fri: 'Sexta-feira',
  sat: 'Sábado',
}

const WEEK_DAYS: WeekDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const DEFAULT_HOURS: BusinessHours = {
  sun: { open: false, start: '08:00', end: '12:00' },
  mon: { open: true,  start: '08:00', end: '12:00', breakStart: '12:00', breakEnd: '13:00', end2: '18:00' },
  tue: { open: true,  start: '08:00', end: '12:00', breakStart: '12:00', breakEnd: '13:00', end2: '18:00' },
  wed: { open: true,  start: '08:00', end: '12:00', breakStart: '12:00', breakEnd: '13:00', end2: '18:00' },
  thu: { open: true,  start: '08:00', end: '12:00', breakStart: '12:00', breakEnd: '13:00', end2: '18:00' },
  fri: { open: true,  start: '08:00', end: '12:00', breakStart: '12:00', breakEnd: '13:00', end2: '18:00' },
  sat: { open: true,  start: '08:00', end: '13:00' },
}

const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

function TimeSelect({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[4.5rem] h-8 text-sm px-2">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-56">
        {TIME_OPTIONS.map((t) => (
          <SelectItem key={t} value={t} className="text-sm">
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function BusinessHoursSettings() {
  const { businessHours, updateBusinessHours } = useConfigStore()
  const [hours, setHours] = useState<BusinessHours>(() => {
    if (!businessHours) return DEFAULT_HOURS
    const merged = { ...DEFAULT_HOURS }
    for (const day of WEEK_DAYS) {
      if (businessHours[day]) merged[day] = businessHours[day]
    }
    return merged
  })
  const [saving, setSaving] = useState(false)

  const update = (day: WeekDay, patch: Partial<DaySchedule>) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }))
  }

  const toggleBreak = (day: WeekDay, enabled: boolean) => {
    if (enabled) {
      update(day, { breakStart: '12:00', breakEnd: '13:00', end2: hours[day].end })
    } else {
      update(day, { breakStart: undefined, breakEnd: undefined, end2: undefined })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateBusinessHours(hours)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Horário de Atendimento</h3>
        <p className="text-sm text-muted-foreground">
          Configure os dias e horários de funcionamento. Ative o intervalo para definir pausa de almoço ou horário partido.
        </p>
      </div>

      <div className="rounded-lg border divide-y">
        {WEEK_DAYS.map((day) => {
          const d = hours[day]
          const hasBreak = !!(d.breakStart && d.breakEnd && d.end2)

          return (
            <div key={day} className="px-4 py-3 space-y-2">
              {/* Row 1: toggle + nome + período 1 */}
              <div className="flex items-center gap-3 flex-wrap">
                <Switch
                  checked={d.open}
                  onCheckedChange={(v) => update(day, { open: v })}
                />
                <span className={`text-sm font-medium w-36 ${d.open ? '' : 'text-muted-foreground'}`}>
                  {DAY_LABELS[day]}
                </span>

                {d.open ? (
                  <>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <TimeSelect value={d.start} onChange={(v) => update(day, { start: v })} />
                      <span>às</span>
                      <TimeSelect
                        value={hasBreak ? (d.breakStart ?? d.end) : d.end}
                        onChange={(v) => hasBreak ? update(day, { breakStart: v }) : update(day, { end: v })}
                      />
                    </div>

                    {/* Intervalo toggle */}
                    <div className="flex items-center gap-2 ml-2">
                      <Switch
                        checked={hasBreak}
                        onCheckedChange={(v) => toggleBreak(day, v)}
                      />
                      <span className="text-xs text-muted-foreground">Intervalo</span>
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Fechado</span>
                )}
              </div>

              {/* Row 2: período 2 (intervalo ativo) */}
              {d.open && hasBreak && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground ml-[calc(theme(spacing.10)+theme(spacing.36)+theme(spacing.3))]">
                  <span className="text-xs">Retorno:</span>
                  <TimeSelect value={d.breakEnd ?? '13:00'} onChange={(v) => update(day, { breakEnd: v })} />
                  <span>às</span>
                  <TimeSelect value={d.end2 ?? '18:00'} onChange={(v) => update(day, { end2: v, end: d.breakStart ?? d.end })} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Horários'}
        </Button>
      </div>
    </div>
  )
}
