import adminClient from './adminApi'
import type { Sale, CreateSaleInput } from '../types/sale'

export const saleApi = {
  getAll: () => adminClient.get<Sale[]>('/admin/sales').then(r => r.data),
  getById: (id: string) => adminClient.get<Sale>(`/admin/sales/${id}`).then(r => r.data),
  create: (data: CreateSaleInput) => adminClient.post<Sale>('/admin/sales', data).then(r => r.data),
  update: (id: string, data: Partial<CreateSaleInput>) => adminClient.put<Sale>(`/admin/sales/${id}`, data).then(r => r.data),
  cancel: (id: string) => adminClient.patch<Sale>(`/admin/sales/${id}/cancel`).then(r => r.data),
  delete: (id: string) => adminClient.delete(`/admin/sales/${id}`).then(r => r.data),
}
