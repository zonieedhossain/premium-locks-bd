import axios, { AxiosError } from 'axios'
import type { Product, ProductFormData } from '../types/product'

const BASE = '/api'

const client = axios.create({ baseURL: BASE })

function handleError(err: unknown): never {
  if (err instanceof AxiosError && err.response?.data?.error) {
    throw new Error(err.response.data.error as string)
  }
  throw err
}

function buildFormData(data: ProductFormData): FormData {
  const fd = new FormData()
  fd.append('name', data.name)
  fd.append('description', data.description)
  fd.append('price', String(data.price))
  fd.append('category', data.category)
  fd.append('stock', String(data.stock))
  if (data.image) fd.append('image', data.image)
  return fd
}

export const productApi = {
  getAll: async (): Promise<Product[]> => {
    try {
      const res = await client.get<Product[]>('/products')
      return res.data
    } catch (err) {
      return handleError(err)
    }
  },

  getById: async (id: string): Promise<Product> => {
    try {
      const res = await client.get<Product>(`/products/${id}`)
      return res.data
    } catch (err) {
      return handleError(err)
    }
  },

  create: async (data: ProductFormData): Promise<Product> => {
    try {
      const res = await client.post<Product>('/products', buildFormData(data), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    } catch (err) {
      return handleError(err)
    }
  },

  update: async (id: string, data: ProductFormData): Promise<Product> => {
    try {
      const res = await client.put<Product>(`/products/${id}`, buildFormData(data), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    } catch (err) {
      return handleError(err)
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await client.delete(`/products/${id}`)
    } catch (err) {
      return handleError(err)
    }
  },
}
