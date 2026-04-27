import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from 'react'
import {
  Product,
  Sale,
  StockTransaction,
} from '@/lib/types'
import { productService } from '@/services/product-service'
import { saleService } from '@/services/sale-service'
import { toast } from 'sonner'

interface InventoryContextType {
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  sales: Sale[]
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>
  stockTransactions: StockTransaction[]
  setStockTransactions: React.Dispatch<React.SetStateAction<StockTransaction[]>>
  addProduct: (product: Product) => Promise<void>
  updateProduct: (product: Product) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  registerStockMovement: (
    productId: string,
    quantity: number,
    type: 'in' | 'out',
    reason: string,
    referenceId?: string,
    batchId?: string,
  ) => void
  addSale: (sale: Omit<Sale, 'id'> & { id?: string }) => Promise<void>
}

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined,
)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(
    [],
  )

  const loadProducts = useCallback(async () => {
    try {
      const fetched = await productService.getProducts()
      setProducts(fetched)
    } catch {
      toast.error('Erro ao carregar produtos')
    }
  }, [])

  const loadSales = useCallback(async () => {
    try {
      const fetched = await saleService.getSales()
      setSales(fetched)
    } catch {
      // silencia: vendas são não-críticas
    }
  }, [])

  useEffect(() => {
    loadProducts()
    loadSales()
  }, [loadProducts, loadSales])

  const registerStockMovement = useCallback(
    (
      productId: string,
      quantity: number,
      type: 'in' | 'out',
      reason: string,
      referenceId?: string,
      batchId?: string,
    ) => {
      const product = products.find((p) => p.id === productId)
      if (!product) return

      let updatedProduct = { ...product }
      let newStock = product.stock
      let newBatches = product.batches ? [...product.batches] : []

      if (batchId && newBatches.length > 0) {
        newBatches = newBatches.map((b) => {
          if (b.id === batchId) {
            const bQty =
              type === 'in' ? b.quantity + quantity : b.quantity - quantity
            return { ...b, quantity: Math.max(0, bQty) }
          }
          return b
        })
        newStock = newBatches.reduce((acc, b) => acc + b.quantity, 0)
      } else {
        newStock =
          type === 'in' ? product.stock + quantity : product.stock - quantity
      }
      updatedProduct = { ...product, stock: newStock, batches: newBatches }

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updatedProduct : p)),
      )

      productService.updateProduct(updatedProduct).catch(() => {
        toast.error('Erro ao sincronizar estoque')
      })

      const transaction: StockTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        productId,
        productName: product.name,
        quantity,
        type,
        reason,
        date: new Date().toISOString(),
        referenceId,
        batchId,
      }
      setStockTransactions((prev) => [transaction, ...prev])
    },
    [products],
  )

  const addProduct = useCallback(
    async (product: Product) => {
      try {
        const newProduct = await productService.createProduct(product)
        setProducts((prev) => [...prev, newProduct])
      } catch (_e) {
        toast.error('Erro ao criar produto')
      }
    },
    [],
  )

  const updateProduct = useCallback(
    async (product: Product) => {
      try {
        const updated = await productService.updateProduct(product)
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? updated : p)),
        )
      } catch (_e) {
        toast.error('Erro ao atualizar produto')
      }
    },
    [],
  )

  const deleteProduct = useCallback(
    async (id: string) => {
      try {
        await productService.deleteProduct(id)
        setProducts((prev) => prev.filter((p) => p.id !== id))
      } catch (_e) {
        toast.error('Erro ao excluir produto')
      }
    },
    [],
  )

  const addSale = useCallback(
    async (sale: Omit<Sale, 'id'> & { id?: string }) => {
      try {
        const saved = await saleService.createSale(sale)
        setSales((prev) => [saved, ...prev])
        // Atualiza estoque local a partir do retorno do servidor
        const updated = await productService.getProducts()
        setProducts(updated)
      } catch {
        toast.error('Erro ao registrar venda')
      }
    },
    [],
  )

  const value = useMemo(
    () => ({
      products,
      setProducts,
      sales,
      setSales,
      stockTransactions,
      setStockTransactions,
      addProduct,
      updateProduct,
      deleteProduct,
      registerStockMovement,
      addSale,
    }),
    [
      products,
      sales,
      stockTransactions,
      addProduct,
      updateProduct,
      deleteProduct,
      registerStockMovement,
      addSale,
    ],
  )

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventoryStore() {
  const context = useContext(InventoryContext)
  if (context === undefined) {
    throw new Error(
      'useInventoryStore must be used within an InventoryProvider',
    )
  }
  return context
}
