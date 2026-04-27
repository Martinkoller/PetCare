import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Syringe,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ClipboardCheck,
} from 'lucide-react'
import { HospitalizationStay } from '@/lib/types'
import { useHospitalizationStore } from '@/stores/HospitalizationContext'

interface HospitalizationCarePanelProps {
  stay: HospitalizationStay
}

export function HospitalizationCarePanel({ stay }: HospitalizationCarePanelProps) {
  const { executeCareTask } = useHospitalizationStore()

  const allTasks = useMemo(() => {
    const tasks =
      (stay.prescriptions || []).flatMap((prescription) =>
        (prescription.tasks || []).map((task) => ({
          ...task,
          prescriptionTitle: prescription.title,
          prescriptionType: prescription.type,
          prescriptionActive: prescription.active,
        }))
      ) || []

    return tasks
      .map((task) => {
        if (task.status !== 'pending') return task

        const isLate = new Date(task.scheduledFor).getTime() < Date.now()

        if (isLate) {
          return {
            ...task,
            status: 'late' as const,
          }
        }

        return task
      })
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
  }, [stay])

  const pendingTasks = allTasks.filter((t) => t.status === 'pending' || t.status === 'late')
  const doneTasks = allTasks.filter((t) => t.status === 'done').slice(-5).reverse()

  const handleExecute = async (taskId: string) => {
    await executeCareTask(stay.id, {
      taskId,
      executedByName: 'Equipe Internação',
      notes: 'Execução registrada no painel assistencial.',
    })
  }

  return (
    <div className="space-y-4">
      <Card className="border-violet-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-violet-700">
            <Syringe className="h-4 w-4" />
            Painel Assistencial / Prescrições
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Pendentes: {pendingTasks.length}
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Executados: {allTasks.filter((t) => t.status === 'done').length}
            </Badge>
            <Badge variant="outline">
              Prescrições: {(stay.prescriptions || []).length}
            </Badge>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhuma pendência assistencial no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.slice(0, 8).map((task) => (
                <div
                  key={task.id}
                  className={`rounded-xl border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                    task.status === 'late'
                      ? 'border-red-200 bg-red-50/60'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{task.prescriptionTitle}</span>

                      {task.status === 'late' ? (
                        <Badge className="bg-red-100 text-red-700 border-none">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Atrasado
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-700 border-none">
                          <Clock3 className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-slate-600">
                      Programado para: {new Date(task.scheduledFor).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                      onClick={() => handleExecute(task.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Marcar como Executado
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {doneTasks.length > 0 && (
            <div className="space-y-3 pt-2 border-t">
              <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                Últimos Executados
              </div>

              <div className="space-y-2">
                {doneTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border bg-emerald-50/40 p-3 text-sm">
                    <div className="font-medium text-slate-900">{task.prescriptionTitle}</div>
                    <div className="text-xs text-slate-600">
                      Executado em: {task.executedAt ? new Date(task.executedAt).toLocaleString('pt-BR') : '--'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}