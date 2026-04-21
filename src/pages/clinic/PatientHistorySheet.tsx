import { Pet } from '@/lib/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Activity, Syringe, FileText, CalendarClock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentManager } from './DocumentManager'
import { SalesHistoryList } from '@/pages/sales/SalesHistoryList'
import { useInventoryStore } from '@/stores/InventoryStore'
import { useProfessionals } from '@/hooks/useProfessionals'

interface PatientHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pet: Pet | null
}

export function PatientHistorySheet({
  open,
  onOpenChange,
  pet,
}: PatientHistorySheetProps) {
  const { sales } = useInventoryStore()
  const { professionals } = useProfessionals()

  if (!pet) return null

  const petSales = sales.filter((s) => s.petId === pet.id)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[600px] flex flex-col h-full">
        <SheetHeader className="mb-4">
          <SheetTitle>Prontuário: {pet.name}</SheetTitle>
          <SheetDescription>
            {pet.species} • {pet.breed} • {pet.age} anos
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="history" className="flex-1 flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">Histórico Clínico</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="purchases">Compras</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="flex-1 mt-4 relative">
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <div className="space-y-8 pb-10">
                {!pet.medicalHistory || pet.medicalHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  pet.medicalHistory.map((record) => (
                    <div
                      key={record.id}
                      className="relative pl-8 pb-8 border-l-2 border-muted last:border-0 last:pb-0"
                    >
                      <div className="absolute top-0 left-[-9px] w-4 h-4 rounded-full bg-primary border-4 border-background" />

                      <div className="flex flex-col mb-4">
                        <time className="text-sm font-semibold text-primary">
                          {format(
                            new Date(record.date),
                            "d 'de' MMMM, yyyy 'às' HH:mm",
                            {
                              locale: ptBR,
                            },
                          )}
                        </time>
                        <span className="text-xs text-muted-foreground">
                          Dr(a). {professionals.find((p) => p.id === record.veterinarianId)?.name || record.veterinarianId}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Vitals */}
                        {record.vitals && (
                          <div className="grid grid-cols-3 gap-2 text-xs bg-muted/30 p-2 rounded border">
                            <div>
                              <span className="font-bold">Peso:</span>{' '}
                              {record.vitals.weight}kg
                            </div>
                            <div>
                              <span className="font-bold">Temp:</span>{' '}
                              {record.vitals.temperature}°C
                            </div>
                            <div>
                              <span className="font-bold">FC:</span>{' '}
                              {record.vitals.heartRate}bpm
                            </div>
                          </div>
                        )}

                        {/* SOAP */}
                        <div className="space-y-2">
                          {record.complaint && (
                            <div>
                              <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">
                                Queixa
                              </span>
                              <p className="text-sm">{record.complaint}</p>
                            </div>
                          )}
                          {record.assessment && (
                            <div>
                              <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">
                                Diagnóstico
                              </span>
                              <p className="text-sm font-medium">
                                {record.assessment}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Prescriptions */}
                        {record.prescriptions &&
                          record.prescriptions.length > 0 && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                              <h4 className="text-xs font-bold uppercase text-blue-800 tracking-wider mb-2 flex items-center gap-1">
                                <FileText className="h-3 w-3" /> Receita
                              </h4>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {record.prescriptions.map((p, idx) => (
                                  <li key={idx}>
                                    <span className="font-medium">
                                      {p.medication} {p.concentration}
                                    </span>
                                    <span className="text-xs text-muted-foreground block pl-4">
                                      {p.dosage}, {p.frequency} por {p.duration}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {/* Exams */}
                        {record.exams && record.exams.length > 0 && (
                          <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                            <h4 className="text-xs font-bold uppercase text-purple-800 tracking-wider mb-2 flex items-center gap-1">
                              <Activity className="h-3 w-3" /> Exames e Resultados
                            </h4>
                            <ul className="space-y-1">
                              {record.exams.map((e, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm flex flex-col sm:flex-row justify-between sm:items-center gap-1"
                                >
                                  <span className="font-medium text-purple-900">{e.name}</span>
                                  {e.result ? (
                                    <span className="text-xs text-purple-700 bg-white px-2 py-0.5 rounded border">
                                      Res: {e.result}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">
                                      Pendente
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Vaccines */}
                        {record.vaccines && record.vaccines.length > 0 && (
                          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                            <h4 className="text-xs font-bold uppercase text-green-800 tracking-wider mb-2 flex items-center gap-1">
                              <Syringe className="h-3 w-3" /> Vacinas Aplicadas
                            </h4>
                            <ul className="space-y-1">
                              {record.vaccines.map((v, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm flex justify-between"
                                >
                                  <span>{v.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    Lote: {v.batch}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Return Date */}
                        {record.returnDate && (
                          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-amber-700" />
                            <span className="text-sm font-medium text-amber-900">
                              Retorno programado: {format(new Date(record.returnDate + 'T12:00:00'), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="documents" className="flex-1 mt-4">
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <DocumentManager pet={pet} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="purchases" className="flex-1 mt-4 relative">
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <SalesHistoryList sales={petSales} hideClientColumn />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
