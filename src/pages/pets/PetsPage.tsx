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
import { Search, Plus, Trash, Edit, Dog, Cat, Bird } from 'lucide-react'
import { toast } from 'sonner'
import { Pet } from '@/lib/types'
import { PetDialog } from './PetDialog'

export default function PetsPage() {
  const { pets, addPet, updatePet, deletePet } = usePetStore()
  const { clients } = useClientStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)

  const getClientName = (id: string) =>
    clients.find((c) => c.id === id)?.name || 'Desconhecido'

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

  const handleDelete = (id: string) => {
    if (
      confirm(
        'Tem certeza que deseja remover este pet? O histórico será perdido.',
      )
    ) {
      deletePet(id)
      toast.success('Pet removido com sucesso.')
    }
  }

  const handleSave = (pet: Pet) => {
    // PetDialog already handled persistence via usePetStore
    // We just close the dialog and refresh if needed (PetStore is reactive)
    setEditingPet(null)
  }

  const getSpeciesIcon = (species: string) => {
    const s = species?.toLowerCase() || ''
    switch (s) {
      case 'dog':
        return <Dog className="h-4 w-4" />
      case 'cat':
        return <Cat className="h-4 w-4" />
      case 'bird':
        return <Bird className="h-4 w-4" />
      default:
        return <Dog className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pets</h1>
          <p className="text-muted-foreground">
            Gerencie todos os animais cadastrados na clínica.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPet(null)
            setIsDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Pet
        </Button>
      </div>

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
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum pet encontrado.
                  </TableCell>
                </TableRow>
              )}
              {filteredPets.map((pet) => (
                <TableRow key={pet.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={pet.avatar} />
                        <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold">{pet.name}</div>
                        <div className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                          {pet.gender === 'male' ? 'Macho' : 'Fêmea'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        {getSpeciesIcon(pet.species)}
                        <span className="capitalize">
                          {pet.species?.toLowerCase() === 'dog'
                            ? 'Cão'
                            : pet.species?.toLowerCase() === 'cat'
                              ? 'Gato'
                              : pet.species}
                        </span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {pet.breed}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {getClientName(pet.clientId)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {pet.age} anos • {pet.weight}kg
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(pet)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(pet.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PetDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        pet={editingPet}
      />
    </div>
  )
}
