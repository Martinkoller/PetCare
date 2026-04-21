import { Sale } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useClientStore } from '@/stores/ClientContext'
import { usePetStore } from '@/stores/PetContext'

interface SalesHistoryListProps {
  sales: Sale[]
  hideClientColumn?: boolean
}

export function SalesHistoryList({
  sales,
  hideClientColumn = false,
}: SalesHistoryListProps) {
  const { clients } = useClientStore()
  const { pets } = usePetStore()

  const getClientName = (id?: string) =>
    id
      ? clients.find((c) => c.id === id)?.name || 'Cliente Desconhecido'
      : 'Venda Avulsa / Anônimo'
  const getPetName = (id?: string) =>
    id ? pets.find((p) => p.id === id)?.name || '-' : '-'

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            {!hideClientColumn && <TableHead>Cliente / Pet</TableHead>}
            <TableHead>Itens</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={hideClientColumn ? 4 : 5}
                className="text-center py-8 text-muted-foreground"
              >
                Nenhuma venda registrada.
              </TableCell>
            </TableRow>
          )}
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="text-xs">
                {format(new Date(sale.date), "dd/MM/yy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </TableCell>
              {!hideClientColumn && (
                <TableCell>
                  <div className="font-medium">
                    {getClientName(sale.clientId)}
                  </div>
                  {sale.petId && (
                    <div className="text-xs text-muted-foreground">
                      Pet: {getPetName(sale.petId)}
                    </div>
                  )}
                </TableCell>
              )}
              <TableCell>
                <div className="flex flex-col gap-1">
                  {sale.items.map((item, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-bold">{item.quantity}x</span>{' '}
                      {item.productName}
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell className="font-bold text-green-600">
                R$ {sale.total.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant="outline"
                  className={
                    sale.status === 'completed'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }
                >
                  {sale.status === 'completed' ? 'Concluído' : 'Cancelado'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
