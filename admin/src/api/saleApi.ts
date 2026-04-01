import adminClient from './adminApi'
import type { Sale, CreateSaleInput } from '../types/sale'
import type { PaginatedResponse } from '../types/pagination'

export const saleApi = {
  getAll: (page = 1, limit = 10, from?: string, to?: string) => 
    adminClient.get<PaginatedResponse<Sale>>('/admin/sales', { params: { page, limit, from: from || undefined, to: to || undefined } }).then(r => r.data),
  getById: (id: string) => adminClient.get<Sale>(`/admin/sales/${id}`).then(r => r.data),
  create: (data: CreateSaleInput) => adminClient.post<Sale>('/admin/sales', data).then(r => r.data),
  update: (id: string, data: Partial<CreateSaleInput>) => adminClient.put<Sale>(`/admin/sales/${id}`, data).then(r => r.data),
  cancel: (id: string) => adminClient.patch<Sale>(`/admin/sales/${id}/cancel`).then(r => r.data),
  complete: (id: string) => adminClient.patch<Sale>(`/admin/sales/${id}/complete`).then(r => r.data),
  delete: (id: string) => adminClient.delete(`/admin/sales/${id}`).then(r => r.data),
}
