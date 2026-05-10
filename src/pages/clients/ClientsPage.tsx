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
import { Search, Plus, Phone, MapPin, MessageCircle, Dog } from 'lucide-react'
import { toast } from 'sonner'
import { Client } from '@/lib/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { ClientDialog } from './ClientDialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useNavigate } from 'react-router-dom'
import { ViewButton, EditButton, DeleteButton } from '@/components/ui/action-buttons'

function displayPhone(phone: string): string {
  let d = phone.replace(/\D/g, '')
  if (d.startsWith('55') && d.length > 11) d = d.slice(2)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}

export default function ClientsPage() {
  const navigate = useNavigate()
  const { clients, deleteClient } = useClientStore()
  const { pets } = usePetStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)

  const filteredClients = clients.filter((c) => {
    const searchLow = searchTerm.toLowerCase()
    const rawSearch = searchTerm.replace(/\D/g, '')
    return (
      c.name.toLowerCase().includes(searchLow) ||
      c.email.toLowerCase().includes(searchLow) ||
      (c.phone && c.phone.replace(/\D/g, '').includes(rawSearch)) ||
      (c.cpf && c.cpf.replace(/\D/g, '').includes(rawSearch))
    )
  })

  const handleOpenDetails = (client: Client) => navigate(`/clients/${client.id}`)

  const handleDeleteRequest = (id: string) => {
    const hasPets = pets.some((p) => p.clientId === id)
    if (hasPets) {
      toast.error('Não é possível excluir clientes com pets vinculados. Remova os pets primeiro.')
      return
    }
    setDeletingClientId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingClientId) return
    try {
      await deleteClient(deletingClientId)
      toast.success('Cliente removido com sucesso.')
    } catch {
      // error handled in store
    } finally {
      setDeletingClientId(null)
    }
  }

  const getPetCount = (clientId: string) => pets.filter((p) => p.clientId === clientId).length

  const deletingClient = clients.find((c) => c.id === deletingClientId)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, telefone ou CPF..."
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
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                            {client.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div
                            className="cursor-pointer hover:text-primary transition-colors font-medium"
                            onClick={() => handleOpenDetails(client)}
                          >
                            {client.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{client.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" /> {displayPhone(client.phone)}
                        {client.whatsappEnabled && (
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger>
                                <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                              </TooltipTrigger>
                              <TooltipContent>Recebe notificações via WhatsApp</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[180px]">{client.city ? `${client.city}${client.state ? ' - ' + client.state : ''}` : client.address || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Dog className="h-3 w-3" /> {petCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <ViewButton onClick={() => handleOpenDetails(client)} />
                        <EditButton onClick={() => { setEditingClient(client); setIsAddOpen(true) }} />
                        <DeleteButton onClick={() => handleDeleteRequest(client.id)} />
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
        onOpenChange={(open) => { setIsAddOpen(open); if (!open) setEditingClient(null) }}
        client={editingClient}
      />

      <ConfirmDialog
        open={!!deletingClientId}
        onOpenChange={(open) => { if (!open) setDeletingClientId(null) }}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir "${deletingClient?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDeleteConfirm}
      />

      <Button
        onClick={() => { setEditingClient(null); setIsAddOpen(true) }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 shadow-lg hover:shadow-xl"
        size="lg"
      >
        <Plus className="h-5 w-5" />
        Novo Cliente
      </Button>
    </div>
  )
}
