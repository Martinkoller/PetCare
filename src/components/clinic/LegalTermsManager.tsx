import { useState } from 'react'
import { Pet } from '@/lib/types'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Printer } from 'lucide-react'

interface LegalTermsManagerProps {
  pet: Pet
}

type TermType = 'surgery_anesthesia' | 'refusal' | 'euthanasia' | 'hospitalization'

export function LegalTermsManager({ pet }: LegalTermsManagerProps) {
  const { user } = useAuthStore()
  const [selectedTerm, setSelectedTerm] = useState<TermType | ''>('')

  const getTermContent = () => {
    const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    const vetName = user?.name || 'Médico Veterinário'

    switch (selectedTerm) {
      case 'surgery_anesthesia':
        return `
TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO PARA ANESTESIA E PROCEDIMENTO CIRÚRGICO

Autorizo o(a) Médico(a) Veterinário(a) ${vetName}, e sua equipe, a submeter o animal identificado como ${pet.name}, espécie ${pet.species || '___________'}, raça ${pet.breed || '___________'}, aos procedimentos anestésicos e cirúrgicos necessários.

Fui devidamente informado(a) sobre a natureza e os propósitos dos procedimentos, bem como sobre os riscos e possíveis complicações inerentes ao ato anestésico-cirúrgico, incluindo o risco de óbito. Estou ciente de que a medicina veterinária não é uma ciência exata e que não existem garantias absolutas de sucesso no tratamento.

Declaro que prestei informações verdadeiras sobre o histórico do paciente.

Local e data: __________________________, ${today}

___________________________________________________
Assinatura do Tutor / Responsável
`
      case 'refusal':
        return `
TERMO DE RECUSA DE TRATAMENTO / EXAMES / PROCEDIMENTOS

Eu, tutor(a) responsável pelo animal ${pet.name}, declaro que fui informado(a) pelo(a) Médico(a) Veterinário(a) ${vetName} sobre a necessidade e importância da realização de procedimentos/exames complementares e/ou tratamentos para o adequado diagnóstico e manejo clínico do paciente.

Fui amplamente esclarecido(a) sobre:
1. Os riscos inerentes à não realização dos exames/tratamentos sugeridos;
2. O potencial agravamento do quadro clínico;
3. Risco iminente de óbito por falta de diagnóstico tempestivo.

Por minha livre e espontânea vontade, e ciente das responsabilidades e consequências legais advindas da minha decisão, RECUSO a realização do(s) referido(s) procedimento(s). Isento a clínica e os profissionais envolvidos de qualquer responsabilidade civil ou criminal sobre o agravamento do quadro de saúde do paciente em decorrência desta recusa.

Local e data: __________________________, ${today}

___________________________________________________
Assinatura do Tutor / Responsável
`
      case 'hospitalization':
        return `
TERMO DE AUTORIZAÇÃO PARA INTERNAÇÃO E TRATAMENTO CLÍNICO

Autorizo a internação do animal ${pet.name} nas dependências desta clínica veterinária, sob a supervisão do(a) Dr(a). ${vetName} e equipe.

Declaro-me ciente de que:
1. O paciente receberá a fluidoterapia, medicações e cuidados estipulados no protocolo médico.
2. É obrigação do responsável arcar com os custos diários de internação, materiais e medicamentos, que serão contabilizados em extrato próprio.
3. Em caso de parada cardiorrespiratória e indisponibilidade de contato imediato, (  ) AUTORIZO / (  ) NÃO AUTORIZO manobras de reanimação.

Local e data: __________________________, ${today}

___________________________________________________
Assinatura do Tutor / Responsável
`
      case 'euthanasia':
        return `
TERMO DE CONSENTIMENTO PARA EUTANÁSIA

Eu, responsável legal pelo animal ${pet.name}, diante do quadro clínico irreversível, ausência de resposta terapêutica e em virtude do respeito ao bem-estar animal para alívio do sofrimento, AUTORIZO o(a) Médico(a) Veterinário(a) ${vetName} a realizar o procedimento de EUTANÁSIA.

Fui orientado(a) de que o procedimento é ético, sem dor e de maneira assistida, em conformidade com as diretrizes do Conselho Federal de Medicina Veterinária (CFMV).

Destinação do corpo:
(  ) Cremação Individual
(  ) Cremação Coletiva
(  ) Retirada pelo tutor

Local e data: __________________________, ${today}

___________________________________________________
Assinatura do Tutor / Responsável
`
      default:
        return ''
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Impressão - Termo Legal</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
              h1 { font-size: 16px; text-align: center; text-transform: uppercase; margin-bottom: 20px; }
              p { white-space: pre-wrap; font-size: 14px; }
              .signature-block { margin-top: 50px; text-align: center; }
            </style>
          </head>
          <body>
            <p>${getTermContent()}</p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" /> Termos Legais
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Emissão de Termos Legais</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Selecione o Documento</label>
            <Select
              value={selectedTerm}
              onValueChange={(val) => setSelectedTerm(val as TermType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha um termo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="surgery_anesthesia">
                  Termo de Consentimento para Cirurgia/Anestesia
                </SelectItem>
                <SelectItem value="refusal">
                  Termo de Recusa de Tratamento/Exame
                </SelectItem>
                <SelectItem value="hospitalization">
                  Termo de Internação
                </SelectItem>
                <SelectItem value="euthanasia">
                  Termo de Autorização de Eutanásia
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedTerm && (
            <div className="border rounded-md p-4 bg-muted/20 relative">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                {getTermContent()}
              </pre>
              <div className="mt-6 flex justify-end">
                <Button onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" /> Imprimir Documento
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
