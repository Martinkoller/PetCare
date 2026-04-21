import { useState, useEffect } from 'react'
import { Appointment, GroomingStage, Pet, ServiceItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Lock } from 'lucide-react'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { AtendimentoInfoSection } from './AtendimentoInfoSection'
import { ServicosPrincipalSection } from './ServicosPrincipalSection'
import { ServicosAdicionaisSection } from './ServicosAdicionaisSection'
import { ChecklistSection } from './ChecklistSection'
import { InstrucoesSection } from './InstrucoesSection'
import { ResumoFinanceiroSection } from './ResumoFinanceiroSection'
import { Separator } from '@/components/ui/separator'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (apt: Partial<Appointment>) => void
  appointment?: Appointment
  pets: Pet[]
  stages: GroomingStage[]
  readOnly?: boolean
}

const buildDefaultForm = (stages: GroomingStage[]): Partial<Appointment> => ({
  petId: '',
  price: 0,
  groomingStatus: stages[0]?.id || '',
  status: 'scheduled',
  priority: 'normal',
  appointmentType: 'scheduled',
  notes: '',
  serviceItems: [],
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

const calcTotal = (items: ServiceItem[]): number => {
  const mainAndAdditionals = items
    .filter((i) => i.itemType === 'main' || i.itemType === 'additional')
    .reduce((s, i) => s + i.price, 0)
  const checklistExtra = items
    .filter((i) => i.itemType === 'checklist' && i.checked && (i.additionalPrice ?? 0) > 0)
    .reduce((s, i) => s + (i.additionalPrice ?? 0), 0)
  return mainAndAdditionals + checklistExtra
}

// ─── AppointmentDialog ───────────────────────────────────────────────────────

export function AppointmentDialog({
  open,
  onOpenChange,
  onSave,
  appointment,
  pets,
  stages,
  readOnly = false,
}: AppointmentDialogProps) {
  const { services } = useAppointmentStore()

  // Serviços principais: grooming, sem parentId, sem itemType ou itemType === 'main'
  const mainCatalogItems = services.filter(
    (s) => s.category === 'grooming' && s.active && !s.parentId &&
      (s.itemType === 'main' || s.itemType == null),
  )
  // Adicionais: grooming, sem parentId, itemType === 'additional'
  const additionalCatalogItems = services.filter(
    (s) => s.category === 'grooming' && s.active && !s.parentId && s.itemType === 'additional',
  )
  // Checklist do catálogo sem pai (avulsos): itemType === 'checklist'
  const checklistCatalogItems = services.filter(
    (s) => s.category === 'grooming' && s.active && s.itemType === 'checklist',
  )
  // Instruções do catálogo: itemType === 'instruction'
  const instructionCatalogItems = services.filter(
    (s) => s.category === 'grooming' && s.active && s.itemType === 'instruction',
  )

  const [formData, setFormData] = useState<Partial<Appointment>>(buildDefaultForm(stages))
  const [pendingFinalStage, setPendingFinalStage] = useState<string | null>(null)

  useEffect(() => {
    setFormData(appointment ?? buildDefaultForm(stages))
  }, [appointment, open, stages])

  const patch = (update: Partial<Appointment>) =>
    setFormData((prev) => ({ ...prev, ...update }))

  const allItems = formData.serviceItems ?? []
  const mainItem = allItems.find((i) => i.itemType === 'main')
  const additionalItems = allItems.filter((i) => i.itemType === 'additional')
  const checklistItems = allItems.filter((i) => i.itemType === 'checklist')
  const instructionItems = allItems.filter((i) => i.itemType === 'instruction')

  const replaceByType = (type: ServiceItem['itemType'], updated: ServiceItem[]) => {
    const rest = allItems.filter((i) => i.itemType !== type)
    const next = [...rest, ...updated]
    patch({ serviceItems: next, price: calcTotal(next) })
  }

  const handleMainChange = (
    main: ServiceItem | undefined,
    suggestedChecklist: ServiceItem[],
    suggestedInstructions: ServiceItem[],
  ) => {
    const mainArr = main ? [main] : []
    // Only auto-populate checklist/instructions if there are none yet
    const nextChecklist = checklistItems.length === 0 ? suggestedChecklist : checklistItems
    const nextInstructions = instructionItems.length === 0 ? suggestedInstructions : instructionItems
    const next = [...mainArr, ...additionalItems, ...nextChecklist, ...nextInstructions]
    patch({ serviceItems: next, price: calcTotal(next) })
  }

  const handleConfirmFinalStage = () => {
    if (pendingFinalStage) {
      patch({ groomingStatus: pendingFinalStage })
      setPendingFinalStage(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {readOnly
                ? 'Visualizar Atendimento'
                : appointment
                  ? 'Editar Atendimento'
                  : 'Novo Atendimento'}
            </DialogTitle>
            <DialogDescription>
              {readOnly
                ? 'Este atendimento está finalizado e não pode ser editado.'
                : 'Registre os serviços e informações do atendimento.'}
            </DialogDescription>
          </DialogHeader>

          {readOnly && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Atendimento finalizado — bloqueado para edição.</span>
            </div>
          )}

          <div className="space-y-5 py-2">

            {/* 1. Serviço Principal */}
            <ServicosPrincipalSection
              mainItem={mainItem}
              onChange={handleMainChange}
              catalogItems={mainCatalogItems}
              allCatalogItems={services}
              readOnly={readOnly}
            />

            <Separator />

            {/* 2. Serviços Adicionais */}
            <ServicosAdicionaisSection
              items={additionalItems}
              onChange={(updated) => replaceByType('additional', updated)}
              catalogItems={additionalCatalogItems}
              readOnly={readOnly}
            />

            <Separator />

            {/* 3. Checklist Operacional */}
            <ChecklistSection
              items={checklistItems}
              onChange={(updated) => {
                const rest = allItems.filter((i) => i.itemType !== 'checklist')
                const next = [...rest, ...updated]
                patch({ serviceItems: next, price: calcTotal(next) })
              }}
              catalogItems={checklistCatalogItems}
              readOnly={readOnly}
            />

            <Separator />

            {/* 4. Instruções */}
            <InstrucoesSection
              items={instructionItems}
              onChange={(updated) => replaceByType('instruction', updated)}
              catalogItems={instructionCatalogItems}
              readOnly={readOnly}
            />

            <Separator />

            {/* 5. Resumo Financeiro */}
            <ResumoFinanceiroSection items={allItems} />

            <Separator />

            {/* 6. Info do Atendimento */}
            <AtendimentoInfoSection
              formData={formData}
              onChange={patch}
              pets={pets}
              stages={stages}
              readOnly={readOnly}
              isNew={!appointment}
              onRequestFinalStage={setPendingFinalStage}
            />
          </div>

          <DialogFooter>
            {readOnly ? (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            ) : (
              <Button onClick={() => onSave(formData)}>Salvar Atendimento</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation: moving to final stage via form */}
      <Dialog
        open={!!pendingFinalStage}
        onOpenChange={(open) => { if (!open) setPendingFinalStage(null) }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Finalizar Atendimento?</DialogTitle>
            <DialogDescription>
              Após finalizado, o atendimento será bloqueado para edição.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingFinalStage(null)}>
              Não
            </Button>
            <Button onClick={handleConfirmFinalStage}>Sim, Finalizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
