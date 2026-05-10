import { useState } from 'react'
import { usePetStore } from '@/stores/PetContext'
import { useClientStore } from '@/stores/ClientContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Dog, Cat, Bird, Mars, Venus } from 'lucide-react'
import { toast } from 'sonner'
import { Pet } from '@/lib/types'
import { PetDialog } from './PetDialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EditButton, DeleteButton } from '@/components/ui/action-buttons'

const SPECIES_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  dog: { label: 'Cão', icon: <Dog className="h-4 w-4" /> },
  cat: { label: 'Gato', icon: <Cat className="h-4 w-4" /> },
  bird: { label: 'Pássaro', icon: <Bird className="h-4 w-4" /> },
}

export default function PetsPage() {
  const { pets, deletePet } = usePetStore()
  const { clients } = useClientStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [deletingPetId, setDeletingPetId] = useState<string | null>(null)

  const getClientName = (id: string) => clients.find((c) => c.id === id)?.name || 'Desconhecido'

  const filteredPets = pets.filter((p) => {
    const ownerName = getClientName(p.clientId).toLowerCase()
    const search = searchTerm.toLowerCase()
    return (
      (p.name?.toLowerCase() || '').includes(search) ||
      (p.breed?.toLowerCase() || '').includes(search) ||
      ownerName.includes(search)
    )
  })

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet)
    setIsDialogOpen(true)
  }

  const handleDeleteRequest = (id: string) => setDeletingPetId(id)

  const handleDeleteConfirm = async () => {
    if (!deletingPetId) return
    try {
      await deletePet(deletingPetId)
      toast.success('Pet removido com sucesso.')
    } catch {
      // error handled in store
    } finally {
      setDeletingPetId(null)
    }
  }

  const getSpecies = (species: string) => {
    const s = species?.toLowerCase() || ''
    return SPECIES_MAP[s] ?? { label: species || 'Outros', icon: <Dog className="h-4 w-4" /> }
  }

  const deletingPet = pets.find((p) => p.id === deletingPetId)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, raça ou tutor..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pet</TableHead>
                <TableHead>Espécie / Raça</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Idade / Peso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum pet encontrado.
                  </TableCell>
                </TableRow>
              )}
              {filteredPets.map((pet) => {
                const species = getSpecies(pet.species)
                return (
                  <TableRow key={pet.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={pet.avatar} />
                          <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold">{pet.name}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {pet.gender === 'male' ? (
                              <><Mars className="h-3 w-3 text-blue-500" /> Macho</>
                            ) : pet.gender === 'female' ? (
                              <><Venus className="h-3 w-3 text-pink-500" /> Fêmea</>
                            ) : '—'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          {species.icon}
                          <span>{species.label}</span>
                        </Badge>
                        <span className="text-sm text-muted-foreground">{pet.breed}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{getClientName(pet.clientId)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {pet.age != null ? `${pet.age} anos` : '—'}
                        {pet.weight != null ? ` · ${pet.weight} kg` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <EditButton onClick={() => handleEdit(pet)} />
                        <DeleteButton onClick={() => handleDeleteRequest(pet.id)} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PetDialog
        open={isDialogOpen}
        onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingPet(null) }}
        onSave={() => setIsDialogOpen(false)}
        pet={editingPet}
      />

      <ConfirmDialog
        open={!!deletingPetId}
        onOpenChange={(open) => { if (!open) setDeletingPetId(null) }}
        title="Remover pet"
        description={`Tem certeza que deseja remover "${deletingPet?.name}"? O histórico do pet será perdido permanentemente.`}
        confirmLabel="Remover"
        onConfirm={handleDeleteConfirm}
      />

      <Button
        onClick={() => { setEditingPet(null); setIsDialogOpen(true) }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 shadow-lg hover:shadow-xl"
        size="lg"
      >
        <Plus className="h-5 w-5" />
        Novo Pet
      </Button>
    </div>
  )
}
