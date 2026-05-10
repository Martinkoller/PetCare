import { useState, useMemo } from 'react'
import { useBoardingStore } from '@/stores/BoardingStore'
import { usePetStore } from '@/stores/PetContext'
import { useClientStore } from '@/stores/ClientContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import {
  format,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { formatCurrency } from '@/lib/utils'

export function BoardingHistory() {
  const { boardingStays, kennels } = useBoardingStore()
  const { pets } = usePetStore()
  const { clients } = useClientStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const historyStays = useMemo(() => {
    return boardingStays.filter(
      (b) => b.status === 'completed' || b.status === 'cancelled',
    )
  }, [boardingStays])

  const filteredStays = useMemo(() => {
    return historyStays.filter((stay) => {
      const pet = pets.find((p) => p.id === stay.petId)
      const client = pet ? clients.find((c) => c.id === pet.clientId) : null

      const matchesSearch =
        pet?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.name.toLowerCase().includes(searchTerm.toLowerCase())

      let matchesDate = true
      if (dateFilter) {
        const filterDate = parseISO(dateFilter)
        const checkIn = parseISO(stay.checkIn)
        const checkOut = parseISO(stay.actualCheckOut || stay.checkOut)
        matchesDate = isWithinInterval(filterDate, {
          start: startOfDay(checkIn),
          end: endOfDay(checkOut),
        })
      }

      return matchesSearch && matchesDate
    })
  }, [historyStays, searchTerm, dateFilter, pets, clients])

  const getPetName = (id: string) =>
    pets.find((p) => p.id === id)?.name || 'Desconhecido'
  const getClientName = (petId: string) => {
    const pet = pets.find((p) => p.id === petId)
    return pet
      ? clients.find((c) => c.id === pet.clientId)?.name
      : 'Desconhecido'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pet ou tutor..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-[200px]">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registros Passados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Pet</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Canil</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStays.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum histórico encontrado.
                  </TableCell>
                </TableRow>
              )}
              {filteredStays.map((stay) => (
                <TableRow key={stay.id}>
                  <TableCell className="text-sm">
                    <div className="flex flex-col">
                      <span>
                        {format(
                          parseISO(stay.actualCheckIn || stay.checkIn),
                          'dd/MM/yy',
                        )}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        até{' '}
                        {format(
                          parseISO(stay.actualCheckOut || stay.checkOut),
                          'dd/MM/yy',
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {getPetName(stay.petId)}
                  </TableCell>
                  <TableCell>{getClientName(stay.petId)}</TableCell>
                  <TableCell>{kennels.find((k) => k.id === stay.kennelNumber)?.name ?? stay.kennelNumber}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="space-y-1">
                      {stay.specialInstructions && (
                        <div
                          className="text-xs bg-blue-50 text-blue-700 p-1 rounded prose prose-sm max-w-none truncate"
                          dangerouslySetInnerHTML={{
                            __html: stay.specialInstructions,
                          }}
                        />
                      )}
                      {stay.observations && (
                        <div
                          className="text-xs bg-gray-100 text-gray-600 p-1 rounded prose prose-sm max-w-none truncate"
                          dangerouslySetInnerHTML={{
                            __html: stay.observations,
                          }}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(stay.totalPrice || 0)}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className={
                        stay.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }
                    >
                      {stay.status === 'completed' ? 'Finalizado' : 'Cancelado'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
