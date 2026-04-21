import { useState, useEffect } from 'react'
import { Task } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { format, addDays, getDay, addMonths, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useConfigStore } from '@/stores/ConfigStore'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (task: Task | Task[]) => void
  task?: Task | null
}

export function TaskDialog({
  open,
  onOpenChange,
  onSave,
  task,
}: TaskDialogProps) {
  const { profiles } = useConfigStore()

  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    category: 'other',
    assignee: '',
    status: 'pending',
    priority: 'medium',
  })
  
  const [dueDate, setDueDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [dueTime, setDueTime] = useState<string>('09:00')

  // Repetition State
  const [repeatFreq, setRepeatFreq] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none')
  const [repeatDays, setRepeatDays] = useState<number[]>([getDay(new Date())]) // Days of the week (0-6)
  const [repeatEndType, setRepeatEndType] = useState<'count' | 'date'>('count')
  const [repeatCount, setRepeatCount] = useState<number>(5)
  const [repeatEndDate, setRepeatEndDate] = useState<string>(addDays(new Date(), 30).toISOString().split('T')[0])

  useEffect(() => {
    if (task) {
      setFormData(task)
      const d = new Date(task.dueDate)
      setDueDate(format(d, 'yyyy-MM-dd'))
      setDueTime(format(d, 'HH:mm'))
      setRepeatFreq('none') // Editing is always single instance
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'other',
        assignee: '',
        status: 'pending',
        priority: 'medium',
      })
      const now = new Date()
      setDueDate(format(now, 'yyyy-MM-dd'))
      setDueTime(format(now, 'HH:mm'))
      setRepeatFreq('none')
      setRepeatCount(5)
      setRepeatDays([getDay(now)])
    }
  }, [task, open])

  const WEEK_DAYS = [
    { label: 'Dom', value: 0 },
    { label: 'Seg', value: 1 },
    { label: 'Ter', value: 2 },
    { label: 'Qua', value: 3 },
    { label: 'Qui', value: 4 },
    { label: 'Sex', value: 5 },
    { label: 'Sab', value: 6 },
  ]

  const buildTaskWithDate = (dateOb: Date): Task => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.title!,
      description: formData.description || '',
      category: formData.category as any,
      assignee: formData.assignee!,
      dueDate: dateOb.toISOString(),
      status: formData.status as any,
      priority: formData.priority as any,
      notifiedOverdue: false,
      createdAt: new Date().toISOString(),
    }
  }

  const handleSave = () => {
    if (!formData.title || !formData.assignee || !dueDate || !dueTime) {
      return toast.error('Preencha os campos obrigatórios')
    }

    const [yyyy, MM, dd] = dueDate.split('-').map(Number)
    const [hh, mm] = dueTime.split(':').map(Number)
    const baseDate = new Date(yyyy, MM - 1, dd, hh, mm, 0)

    // Modification Mode
    if (task) {
      const updatedTask: Task = {
        ...task,
        ...formData,
        title: formData.title!,
        category: formData.category as any,
        assignee: formData.assignee!,
        status: formData.status as any,
        priority: formData.priority as any,
        dueDate: baseDate.toISOString(),
      }
      onSave(updatedTask)
      onOpenChange(false)
      return
    }

    // Single creation
    if (repeatFreq === 'none') {
      onSave(buildTaskWithDate(baseDate))
      onOpenChange(false)
      return
    }

    // Repetition logic
    const tasks: Task[] = []
    let current = new Date(baseDate)
    const endCountMax = repeatEndType === 'count' ? repeatCount : 999
    let endLimitDate: Date | null = null
    if (repeatEndType === 'date' && repeatEndDate) {
      const [ey, em, ed] = repeatEndDate.split('-').map(Number)
      endLimitDate = new Date(ey, em - 1, ed, 23, 59, 59)
    }

    let added = 0
    let safety = 0

    while (added < endCountMax && safety < 365) {
      safety++
      
      let isValidDay = true
      if (repeatFreq === 'weekly') {
        isValidDay = repeatDays.includes(getDay(current))
      }

      if (isValidDay) {
        if (endLimitDate && current > endLimitDate) {
          break
        }
        tasks.push(buildTaskWithDate(current))
        added++
      }

      // Advance
      if (repeatFreq === 'daily') {
        current = addDays(current, 1)
      } else if (repeatFreq === 'weekly') {
        current = addDays(current, 1)
      } else if (repeatFreq === 'monthly') {
        current = addMonths(current, 1)
      }
    }

    if (tasks.length === 0) {
      toast.error('Nenhuma tarefa gerada na repetição. Verifique a configuração.')
      return
    }

    onSave(tasks)
    onOpenChange(false)
  }

  const toggleDay = (d: number) => {
    if (repeatDays.includes(d)) {
      setRepeatDays(repeatDays.filter(day => day !== d))
    } else {
      setRepeatDays([...repeatDays, d])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Editar Tarefa' : 'Nova Tarefa Interna'}
          </DialogTitle>
          <DialogDescription>
            Organize as atividades da equipe.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título da Tarefa</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Limpeza do Gatil"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(val: any) =>
                  setFormData({ ...formData, category: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleaning">Limpeza</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="administrative">Administrativo</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(val: any) =>
                  setFormData({ ...formData, priority: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detalhes sobre a tarefa..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Responsável</Label>
              <Select
                value={formData.assignee}
                onValueChange={(val) =>
                  setFormData({ ...formData, assignee: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles.length === 0 && <SelectItem disabled value="empty">Nenhum funcionário</SelectItem>}
                  {profiles.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val: any) =>
                  setFormData({ ...formData, status: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Data de Início/Alvo</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Horário do Aviso</Label>
              <Input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          {/* Repetition Block (Only for New Task) */}
          {!task && (
            <div className="border bg-muted/20 p-4 rounded-lg mt-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="grid gap-2">
                  <Label>Repetição</Label>
                  <Select value={repeatFreq} onValueChange={(v: any) => setRepeatFreq(v)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não repetir</SelectItem>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {repeatFreq !== 'none' && (
                  <div className="grid gap-2 flex-1">
                    <Label>Fim da repetição</Label>
                    <div className="flex bg-muted rounded-md p-1 items-center max-w-[200px]">
                       <Button size="sm" type="button" variant={repeatEndType === 'count' ? 'secondary' : 'ghost'} className="flex-1 h-7 text-xs" onClick={() => setRepeatEndType('count')}>Vezes</Button>
                       <Button size="sm" type="button" variant={repeatEndType === 'date' ? 'secondary' : 'ghost'} className="flex-1 h-7 text-xs" onClick={() => setRepeatEndType('date')}>Data</Button>
                    </div>
                  </div>
                )}
              </div>

              {repeatFreq !== 'none' && (
                <div className="space-y-4 pt-2 border-t mt-2">
                  {repeatFreq === 'weekly' && (
                    <div className="grid gap-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Dias da Semana</Label>
                      <div className="flex gap-2 flex-wrap">
                        {WEEK_DAYS.map((wd) => (
                          <div key={wd.value} className="flex items-center space-x-1 border rounded px-2 py-1 bg-background">
                            <Checkbox 
                               checked={repeatDays.includes(wd.value)} 
                               onCheckedChange={() => toggleDay(wd.value)} 
                               id={`wd-${wd.value}`} />
                            <Label htmlFor={`wd-${wd.value}`} className="cursor-pointer font-normal text-xs">{wd.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                     {repeatEndType === 'count' ? (
                        <div className="grid gap-2">
                          <Label>Quantidade de Ocorrências</Label>
                          <Input type="number" min={1} max={365} value={repeatCount} onChange={e => setRepeatCount(Number(e.target.value) || 1)} />
                        </div>
                     ) : (
                        <div className="grid gap-2">
                          <Label>Repetir até a Data</Label>
                          <Input type="date" value={repeatEndDate} onChange={e => setRepeatEndDate(e.target.value)} />
                        </div>
                     )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Salvar Tarefa{repeatFreq !== 'none' && 's'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
