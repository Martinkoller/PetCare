import { useState } from 'react'
import { Pet, PrescriptionItem } from '@/lib/types'
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
import { FileBadge, Printer } from 'lucide-react'

interface OfficialDocumentsProps {
  pet: Pet
  prescriptions: PrescriptionItem[]
}

type DocType = 'prescription_simple' | 'prescription_special' | 'health_certificate'

export function OfficialDocuments({ pet, prescriptions }: OfficialDocumentsProps) {
  const { user } = useAuthStore()
  const [selectedDoc, setSelectedDoc] = useState<DocType | ''>('')

  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const vetName = user?.name || 'Médico Veterinário'

  const generatePrescriptionHtml = (isSpecial: boolean) => {
    const rxItems = prescriptions.map((p, index) => `
      <div class="rx-item">
        <strong>${index + 1}. Uso ${p.frequency.toLowerCase().includes('oral') ? 'Interno' : 'Informado'}: ${p.medication} ${p.concentration}</strong>
        <p>Dar ${p.dosage} a cada ${p.frequency} por ${p.duration}.</p>
      </div>
    `).join('')

    const header = `
      <div class="header">
        <h2>Clínica Veterinária PetCare</h2>
        <p>Rua Exemplo, 123 - Centro | Tel: (11) 99999-9999</p>
      </div>
    `

    const patientInfo = `
      <div class="patient-info">
        <p><strong>Paciente:</strong> ${pet.name} <strong>Espécie:</strong> ${pet.species}</p>
        <p><strong>Tutor:</strong> ${pet.clientId || 'Responsável'}</p>
        ${isSpecial ? `<p><strong>Endereço do Tutor:</strong> _________________________________________</p>` : ''}
      </div>
    `

    const signature = `
      <div class="signature">
        <p>Local e data: _________________, ${today}</p>
        <br/><br/>
        <p>_____________________________________</p>
        <p><strong>${vetName}</strong></p>
        <p>CRMV: ________</p>
      </div>
    `

    const content = `
      <div class="document ${isSpecial ? 'special-rx' : 'simple-rx'}">
        ${header}
        <h3 class="title">${isSpecial ? 'RECEITUÁRIO DE CONTROLE ESPECIAL' : 'RECEITUÁRIO VETERINÁRIO'}</h3>
        ${isSpecial ? `<div class="via-label">1ª VIA - RETENÇÃO DA FARMÁCIA</div>` : ''}
        ${patientInfo}
        <div class="rx-content">
          ${rxItems || '<p>Nenhum medicamento prescrito no momento.</p>'}
        </div>
        ${signature}
        ${isSpecial ? `
          <div class="buyer-info">
            <h4>Identificação do Comprador</h4>
            <p>Nome: ____________________________________ RG: ____________________</p>
            <p>End.: ____________________________________ Tel: ____________________</p>
          </div>
        ` : ''}
      </div>
    `

    if (isSpecial) {
      const contentVia2 = content.replace('1ª VIA - RETENÇÃO DA FARMÁCIA', '2ª VIA - ORIENTAÇÃO AO PACIENTE')
      return content + '<div style="page-break-after: always;"></div>' + contentVia2
    }

    return content
  }

  const generateHealthCertificateHtml = () => {
    return `
      <div class="document">
        <div class="header">
          <h2>Clínica Veterinária PetCare</h2>
        </div>
        <h3 class="title">ATESTADO DE SAÚDE VETERINÁRIO</h3>
        <p style="text-align: justify; line-height: 1.8;">
          Atesto para os devidos fins que o animal identificado como <strong>${pet.name}</strong>, 
          espécie ${pet.species}, da raça ${pet.breed || 'não definida'}, sexo ${pet.gender === 'male' ? 'Macho' : 'Fêmea'}, 
          pelagem ${pet.color || 'não definida'}, de propriedade de ______________________________, 
          foi examinado nesta data e, no momento do exame clínico, não apresentou sinais de doenças infectocontagiosas ou parasitárias, 
          encontrando-se <strong>APTO</strong> para trânsito/viagem.
        </p>
        <br/><br/><br/>
        <div class="signature">
          <p>Local e data: _________________, ${today}</p>
          <br/><br/>
          <p>_____________________________________</p>
          <p><strong>${vetName}</strong></p>
          <p>CRMV: ________</p>
        </div>
      </div>
    `
  }

  const handlePrint = () => {
    let htmlContent = ''
    if (selectedDoc === 'prescription_simple') htmlContent = generatePrescriptionHtml(false)
    if (selectedDoc === 'prescription_special') htmlContent = generatePrescriptionHtml(true)
    if (selectedDoc === 'health_certificate') htmlContent = generateHealthCertificateHtml()

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Impressão - Documento Oficial</title>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; color: #000; }
              .document { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; }
              .special-rx { border: 2px solid #ccc; background-color: #fcfcfc; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .header h2 { margin: 0; font-size: 20px; }
              .header p { margin: 5px 0 0; font-size: 12px; }
              .title { text-align: center; font-size: 18px; margin-bottom: 5px; }
              .via-label { text-align: center; font-size: 12px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
              .patient-info { border: 1px solid #000; padding: 10px; margin-bottom: 20px; font-size: 14px; }
              .patient-info p { margin: 5px 0; }
              .rx-content { min-height: 250px; font-size: 14px; }
              .rx-item { margin-bottom: 15px; }
              .rx-item p { margin: 5px 0 0 10px; }
              .signature { text-align: center; margin-top: 40px; }
              .signature p { margin: 5px 0; font-size: 14px; }
              .buyer-info { margin-top: 30px; border-top: 1px dashed #000; padding-top: 10px; font-size: 12px; }
              .buyer-info h4 { margin: 0 0 10px 0; }
              @media print {
                .document { border: none; }
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${htmlContent}
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
          <FileBadge className="h-4 w-4" /> Emissões CRMV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Documentos Oficiais</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Selecione o Documento</label>
            <Select
              value={selectedDoc}
              onValueChange={(val) => setSelectedDoc(val as DocType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha um documento..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prescription_simple">Receituário de Uso Comum</SelectItem>
                <SelectItem value="prescription_special">Receituário de Uso Controlado (2 Vias)</SelectItem>
                <SelectItem value="health_certificate">Atestado de Saúde Genérico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedDoc && (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-md">
                Certifique-se de que os dados do paciente estão corretos antes de imprimir. 
                Documentos controlados possuem marcações de via da farmácia.
              </p>
              <Button onClick={handlePrint} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                <Printer className="h-4 w-4" /> Gerar PDF / Imprimir
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
