import adminClient from './adminApi'
import type { Purchase, CreatePurchaseInput } from '../types/purchase'
import type { PaginatedResponse } from '../types/pagination'

export const purchaseApi = {
  getAll: (page = 1, limit = 10, from?: string, to?: string) => 
    adminClient.get<PaginatedResponse<Purchase>>('/admin/purchases', { params: { page, limit, from, to } }).then(r => r.data),
  getById: (id: string) => adminClient.get<Purchase>(`/admin/purchases/${id}`).then(r => r.data),
  create: (data: CreatePurchaseInput) => adminClient.post<Purchase>('/admin/purchases', data).then(r => r.data),
  update: (id: string, data: CreatePurchaseInput) => adminClient.put<Purchase>(`/admin/purchases/${id}`, data).then(r => r.data),
  receive: (id: string) => adminClient.patch<Purchase>(`/admin/purchases/${id}/receive`).then(r => r.data),
  cancel: (id: string) => adminClient.patch<Purchase>(`/admin/purchases/${id}/cancel`).then(r => r.data),
  delete: (id: string) => adminClient.delete(`/admin/purchases/${id}`).then(r => r.data),
}
