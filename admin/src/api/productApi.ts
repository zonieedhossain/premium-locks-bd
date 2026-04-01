import adminClient from './adminApi'
import type { Product, ProductFormData } from '../types/product'
import type { PaginatedResponse } from '../types/pagination'
import { AxiosError } from 'axios'

function handleError(err: unknown): never {
  if (err instanceof AxiosError && err.response?.data?.error) throw new Error(err.response.data.error as string)
  throw err
}

function toFormData(data: ProductFormData): FormData {
  const fd = new FormData()
  fd.append('name', data.name)
  fd.append('category', data.category)
  fd.append('price', String(data.price))
  fd.append('discount_price', String(data.discount_price))
  fd.append('short_description', data.short_description)
  fd.append('description', data.description)
  fd.append('stock_quantity', String(data.stock_quantity))
  fd.append('cost_price', String(data.cost_price ?? 0))
  fd.append('is_active', data.is_active ? 'true' : 'false')
  if (data.main_image) fd.append('main_image', data.main_image)
  return fd
}

export const productApi = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Product>> => {
    try { return (await adminClient.get<PaginatedResponse<Product>>('/admin/products', { params: { page, limit } })).data }
    catch (err) { return handleError(err) }
  },
  getById: async (id: string): Promise<Product> => {
    try { return (await adminClient.get<Product>(`/admin/products/${id}`)).data }
    catch (err) { return handleError(err) }
  },
  create: async (data: ProductFormData): Promise<Product> => {
    try { return (await adminClient.post<Product>('/admin/products', toFormData(data), { headers: { 'Content-Type': 'multipart/form-data' } })).data }
    catch (err) { return handleError(err) }
  },
  update: async (id: string, data: ProductFormData): Promise<Product> => {
    try { return (await adminClient.put<Product>(`/admin/products/${id}`, toFormData(data), { headers: { 'Content-Type': 'multipart/form-data' } })).data }
    catch (err) { return handleError(err) }
  },
  delete: async (id: string): Promise<void> => {
    try { await adminClient.delete(`/admin/products/${id}`) }
    catch (err) { return handleError(err) }
  },
}
