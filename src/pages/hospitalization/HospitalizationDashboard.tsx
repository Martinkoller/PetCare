import { useState, useEffect } from 'react'
import { Plus, Activity, HeartPulse, Clock, FilePlus2, UserCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useHospitalizationStore } from '@/stores/HospitalizationContext'
import { AdmissionModal } from './components/AdmissionModal'
import { EvolutionModal } from './components/EvolutionModal'
import { HospitalizationStay } from '@/lib/types'

export default function HospitalizationDashboard() {
  const { stays, fetchStays, loading } = useHospitalizationStore()
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false)
  const [selectedStay, setSelectedStay] = useState<HospitalizationStay | null>(null)
  
  const today = format(new Date(), "dd 'de' MMMM", { locale: ptBR })

  useEffect(() => {
    fetchStays()
  }, [fetchStays])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-red-600">
            <Activity className="h-6 w-6" />
            Mapa de Internação Médica
          </h1>
          <p className="text-muted-foreground text-sm">
            Plantão atual: {today}. Acompanhamento paramétrico e clínico.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="bg-red-600 hover:bg-red-700 gap-2 text-white shadow-md transition-all active:scale-95"
            onClick={() => setIsAdmissionOpen(true)}
          >
            <Plus className="h-4 w-4" /> Admitir Paciente (Nova Internação)
          </Button>
        </div>
      </div>

      {loading && stays.length === 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
           {[1,2,3].map(i => (
             <div key={i} className="h-64 bg-muted rounded-xl border border-dashed" />
           ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stays.map(stay => {
            const lastLog = stay.logs?.[0]
            const lastHr = lastLog?.heartRate
            const lastTemp = lastLog?.temperature

            return (
              <Card key={stay.id} className="relative overflow-hidden hover:shadow-lg transition-all border-t-4 border-t-red-500 group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="mb-2 bg-red-50 text-red-700 border-red-200 font-mono">
                        Leito: {stay.kennelNumber}
                      </Badge>
                      <CardTitle className="text-xl font-bold text-gray-800">{stay.pet?.name}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {stay.pet?.species} • {stay.pet?.breed}
                      </p>
                    </div>
                    <Badge className={`capitalize shadow-none border-none py-1 px-3 ${
                      stay.status === 'treatment' 
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}>
                      {stay.status === 'treatment' ? 'Em Terapia' : 'Admitido'}
                    </Badge>
                  </div>
                  {stay.appointmentId && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium bg-slate-50 w-fit px-2 py-0.5 rounded-full border border-slate-200">
                      <Clock className="h-3 w-3" />
                      ORIGEM: AGENDA
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-50/30 p-3 rounded-lg border border-red-100 text-sm">
                    <span className="font-bold text-red-900 block mb-1 text-[11px] uppercase tracking-wider">Motivo da Internação:</span>
                    <span className="text-red-600 font-medium">{stay.reasonForAdmission}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-muted/20 rounded border border-gray-100">
                      <HeartPulse className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-600">FC: {lastHr || '--'} bpm</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-muted/20 rounded border border-gray-100">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-600">Temp: {lastTemp || '--'}°C</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground italic border-l-2 pl-2 border-muted">
                    <UserCircle className="h-3.5 w-3.5" />
                    Última evolução: {lastLog ? format(new Date(lastLog.createdAt), "dd/MM 'às' HH:mm") : 'Sem registros'}
                  </div>

                  <div className="border-t pt-4 flex items-center justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold"
                      onClick={() => setSelectedStay(stay)}
                    >
                      <FilePlus2 className="h-4 w-4" />
                      Evoluir / Lançar Ficha
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {stays.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Nenhum paciente internado no plantão atual.</p>
              <p className="text-sm">Os pacientes aparecerão aqui após a admissão.</p>
            </div>
          )}
        </div>
      )}

      <AdmissionModal 
        open={isAdmissionOpen} 
        onOpenChange={setIsAdmissionOpen} 
      />

      {selectedStay && (
        <EvolutionModal
          open={!!selectedStay}
          onOpenChange={(open) => !open && setSelectedStay(null)}
          stay={selectedStay}
        />
      )}
    </div>
  )
}

