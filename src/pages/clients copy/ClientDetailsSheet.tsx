import { useState } from 'react'
import { Client, Pet } from '@/lib/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePetStore } from '@/stores/PetContext'
import { useInventoryStore } from '@/stores/InventoryStore'
import { SalesHistoryList } from '@/pages/sales/SalesHistoryList'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Plus,
  Edit,
  Trash,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PetDialog } from '@/pages/pets/PetDialog'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ClientDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
}

export function ClientDetailsSheet({
  open,
  onOpenChange,
  client,
}: ClientDetailsSheetProps) {
  const { pets, addPet, updatePet, deletePet } = usePetStore()
  const { sales } = useInventoryStore()
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)

  if (!client) return null

  const clientPets = pets.filter((p) => p.clientId === client.id)
  const clientSales = sales.filter((s) => s.clientId === client.id)

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet)
    setIsPetDialogOpen(true)
  }

  const handleAddPet = () => {
    setEditingPet(null)
    setIsPetDialogOpen(true)
  }

  const handleDeletePet = (id: string) => {
    if (confirm('Remover este pet?')) {
      deletePet(id)
      toast.success('Pet removido')
    }
  }

  const handleSavePet = (pet: Pet) => {
    // PetDialog already handles persistence via usePetStore
    setEditingPet(null)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[600px] flex flex-col h-full">
          <SheetHeader className="mb-4">
            <SheetTitle>Detalhes do Cliente</SheetTitle>
            <SheetDescription>
              Gerencie informações e histórico.
            </SheetDescription>
          </SheetHeader>

          <div className="flex items-start gap-4 mb-6 p-4 bg-muted/20 rounded-lg border">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">
                {client.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-lg">{client.name}</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" /> {client.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" /> {client.phone}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> {client.address}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Cliente desde{' '}
                  {format(new Date(client.joinedAt), 'dd/MM/yyyy')}
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="pets" className="flex-1 flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pets">Pets ({clientPets.length})</TabsTrigger>
              <TabsTrigger value="history">Histórico de Compras</TabsTrigger>
            </TabsList>

            <TabsContent value="pets" className="flex-1 mt-4 relative">
              <div className="absolute inset-0 flex flex-col">
                <div className="mb-4 flex justify-end">
                  <Button size="sm" onClick={handleAddPet}>
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Pet
                  </Button>
                </div>
                <ScrollArea className="flex-1 -mx-2 px-2">
                  <div className="space-y-3 pb-4">
                    {clientPets.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        Nenhum pet cadastrado.
                      </div>
                    )}
                    {clientPets.map((pet) => (
                      <div
                        key={pet.id}
                        className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-12 w-12 border">
                          <AvatarImage src={pet.avatar} />
                          <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold">{pet.name}</h4>
                            <Badge variant="outline" className="text-[10px]">
                              {pet.breed}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pet.age} anos • {pet.weight}kg •{' '}
                            <span className="capitalize">
                              {pet.species === 'dog' ? 'Cão' : pet.species}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEditPet(pet)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDeletePet(pet.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 mt-4 relative">
              <ScrollArea className="absolute inset-0">
                <SalesHistoryList sales={clientSales} hideClientColumn />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <PetDialog
        open={isPetDialogOpen}
        onOpenChange={setIsPetDialogOpen}
        onSave={handleSavePet}
        pet={editingPet}
        initialClientId={client.id}
      />
    </>
  )
}
