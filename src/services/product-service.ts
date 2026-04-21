import api from '@/lib/api'
import { Product } from '@/lib/types'

export const productService = {
  async getProducts() {
    const response = await api.get<Product[]>('/products')
    return response.data
  },

  async createProduct(product: Omit<Product, 'id'>) {
    const response = await api.post<Product>('/products', product)
    return response.data
  },

  async updateProduct(product: Product) {
    const response = await api.put<Product>(`/products/${product.id}`, product)
    return response.data
  },

  async deleteProduct(id: string) {
    await api.delete(`/products/${id}`)
  }
}

