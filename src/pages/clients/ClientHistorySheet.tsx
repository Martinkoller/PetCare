import { Client } from '@/lib/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInventoryStore } from '@/stores/InventoryStore'
import { SalesHistoryList } from '@/pages/sales/SalesHistoryList'

interface ClientHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
}

export function ClientHistorySheet({
  open,
  onOpenChange,
  client,
}: ClientHistorySheetProps) {
  const { sales } = useInventoryStore()

  if (!client) return null

  const clientSales = sales.filter((s) => s.clientId === client.id)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[600px] flex flex-col h-full">
        <SheetHeader className="mb-4">
          <SheetTitle>Histórico de Compras</SheetTitle>
          <SheetDescription>
            Cliente: {client.name} • Total de Pedidos: {clientSales.length}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <SalesHistoryList sales={clientSales} hideClientColumn />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
