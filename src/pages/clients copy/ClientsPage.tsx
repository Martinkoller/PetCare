import { useState } from 'react'
import { useClientStore } from '@/stores/ClientContext'
import { usePetStore } from '@/stores/PetContext'
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
import { Search, Plus, Phone, MapPin, Eye, Trash, Dog, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Client } from '@/lib/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ClientDetailsSheet } from './ClientDetailsSheet'
import { Badge } from '@/components/ui/badge'
import { ClientDialog } from './ClientDialog'

function displayPhone(phone: string): string {
  let d = phone.replace(/\D/g, '')
  if (d.startsWith('55') && d.length > 11) d = d.slice(2)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}

export default function ClientsPage() {
  const { clients, deleteClient } = useClientStore()
  const { pets } = usePetStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  // Details Sheet State
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleOpenDetails = (client: Client) => {
    setSelectedClient(client)
    setIsDetailsOpen(true)
  }

  const handleDeleteClient = (id: string) => {
    const hasPets = pets.some((p) => p.clientId === id)
    if (hasPets) {
      toast.error(
        'Não é possível excluir clientes com pets vinculados. Remova os pets primeiro.',
      )
      return
    }
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteClient(id)
      toast.success('Cliente removido com sucesso.')
    }
  }

  const getPetCount = (clientId: string) => {
    return pets.filter((p) => p.clientId === clientId).length
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie proprietários e visualize seus pets.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingClient(null)
            setIsAddOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
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
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Pets</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
              {filteredClients.map((client) => {
                const petCount = getPetCount(client.id)
                return (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {client.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div>{client.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {client.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" /> {displayPhone(client.phone)}
                        {client.whatsappEnabled && (
                          <Tooltip>
                            <TooltipTrigger>
                              <img
                                src="https://img.usecurling.com/i?q=whatsapp&color=green"
                                className="h-3 w-3"
                                alt="WhatsApp Enabled"
                              />
                            </TooltipTrigger>
                            <TooltipContent>Recebe Notificações</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {client.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Dog className="h-3 w-3" /> {petCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(client)}
                        >
                          <Eye className="h-4 w-4 mr-2" /> Detalhes
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingClient(client)
                            setIsAddOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClientDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        client={editingClient}
      />

      <ClientDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        client={selectedClient}
      />
    </div>
  )
}
