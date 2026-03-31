import axios, { AxiosError } from 'axios'
import type { Product } from '../types/product'

const client = axios.create({ baseURL: '/api/public' })

function handleError(err: unknown): never {
  if (err instanceof AxiosError && err.response?.data?.error) {
    throw new Error(err.response.data.error as string)
  }
  throw err
}

export const publicApi = {
  getProducts: async (): Promise<Product[]> => {
    try {
      const res = await client.get<Product[]>('/products')
      return res.data ?? []
    } catch (err) { return handleError(err) }
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    try {
      const res = await client.get<Product>(`/products/${slug}`)
      return res.data
    } catch (err) { return handleError(err) }
  },

  getProductsByCategory: async (category: string): Promise<Product[]> => {
    try {
      const res = await client.get<Product[]>(`/products/category/${encodeURIComponent(category)}`)
      return res.data ?? []
    } catch (err) { return handleError(err) }
  },
}
