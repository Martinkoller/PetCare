import { useState } from 'react'
import { Pet, DocumentCategory, PetDocument } from '@/lib/types'
import { usePetStore } from '@/stores/PetContext'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  FileText,
  Trash,
  Upload,
  ExternalLink,
  Image,
  File,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DocumentManagerProps {
  pet: Pet
}

export function DocumentManager({ pet }: DocumentManagerProps) {
  const { addPetDocument, deletePetDocument } = usePetStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newDoc, setNewDoc] = useState<{
    name: string
    category: DocumentCategory
    notes: string
    type: 'image' | 'pdf' | 'other'
    file?: File
  }>({
    name: '',
    category: 'other',
    notes: '',
    type: 'other',
  })

  const handleUpload = () => {
    if (!newDoc.name) {
      return toast.error('Nome do documento é obrigatório')
    }

    let url = '#'
    if (newDoc.file) {
      url = URL.createObjectURL(newDoc.file)
    } else if (newDoc.type === 'image') {
      url = `https://img.usecurling.com/p/300/300?q=${newDoc.category}`
    }

    const doc: PetDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: newDoc.name,
      category: newDoc.category,
      url,
      dateUploaded: new Date().toISOString(),
      notes: newDoc.notes,
      type: newDoc.type,
    }

    addPetDocument(pet.id, doc)
    toast.success('Documento anexado com sucesso!')
    setNewDoc({ name: '', category: 'other', notes: '', type: 'other' })
    setIsDialogOpen(false)
  }

  const getCategoryBadge = (category: DocumentCategory) => {
    const styles = {
      vaccine_card: 'bg-green-100 text-green-700',
      exam_result: 'bg-blue-100 text-blue-700',
      imaging: 'bg-purple-100 text-purple-700',
      other: 'bg-gray-100 text-gray-700',
    }
    const labels = {
      vaccine_card: 'Vacina',
      exam_result: 'Exame Laboratorial',
      imaging: 'Imagem',
      other: 'Outros',
    }
    return (
      <Badge variant="secondary" className={styles[category]}>
        {labels[category]}
      </Badge>
    )
  }

  const documents = pet.documents || []
  const images = documents.filter((d) => d.type === 'image')
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border">
        <div>
          <h3 className="text-lg font-semibold">Documentos & Arquivos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie exames, carteiras de vacinação e imagens.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Anexar Documento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Arquivo</Label>
                <div
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) {
                      const type = file.type.startsWith('image/')
                        ? 'image'
                        : file.type === 'application/pdf'
                          ? 'pdf'
                          : 'other'
                      setNewDoc((prev) => ({
                        ...prev,
                        name: file.name,
                        type,
                        file,
                      }))
                    }
                  }}
                >
                  <div className="text-center space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      {newDoc.file ? (
                        <span className="text-primary font-medium">
                          {newDoc.file.name}
                        </span>
                      ) : (
                        <span>
                          Arraste um arquivo ou{' '}
                          <label className="text-primary hover:underline cursor-pointer">
                            clique aqui
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const type = file.type.startsWith('image/')
                                    ? 'image'
                                    : file.type === 'application/pdf'
                                      ? 'pdf'
                                      : 'other'
                                  setNewDoc((prev) => ({
                                    ...prev,
                                    name: file.name,
                                    type,
                                    file,
                                  }))
                                }
                              }}
                            />
                          </label>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Nome do Documento</Label>
                <Input
                  value={newDoc.name}
                  onChange={(e) =>
                    setNewDoc((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Hemograma 2024"
                />
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select
                  value={newDoc.category}
                  onValueChange={(val: DocumentCategory) =>
                    setNewDoc((prev) => ({ ...prev, category: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vaccine_card">
                      Carteira de Vacinação
                    </SelectItem>
                    <SelectItem value="exam_result">
                      Exame Laboratorial
                    </SelectItem>
                    <SelectItem value="imaging">Imagem / Raio-X</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Notas</Label>
                <Textarea
                  value={newDoc.notes}
                  onChange={(e) =>
                    setNewDoc((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpload}>Salvar Anexo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista de Arquivos</TabsTrigger>
          <TabsTrigger value="gallery">Galeria de Imagens</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <div className="space-y-2">
            {documents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                Nenhum documento anexado.
              </div>
            )}
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                    {doc.type === 'image' ? (
                      <Image className="h-5 w-5" />
                    ) : doc.type === 'pdf' ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <File className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{doc.name}</div>
                    <div className="text-xs text-muted-foreground flex gap-2">
                      <span>
                        {new Date(doc.dateUploaded).toLocaleDateString()}
                      </span>
                      {doc.notes && <span>• {doc.notes}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getCategoryBadge(doc.category)}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deletePetDocument(pet.id, doc.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="gallery" className="mt-4">
          {images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhuma imagem encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img) => (
                <Card key={img.id} className="overflow-hidden group relative">
                  <CardContent className="p-0 aspect-square">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => window.open(img.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deletePetDocument(pet.id, img.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                  <div className="p-2 border-t text-xs truncate font-medium bg-muted/20">
                    {img.name}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
