import adminClient from './adminApi'
import type { Invoice } from '../types/invoice'
import type { PaginatedResponse } from '../types/pagination'

export const invoiceApi = {
  getAll: (page = 1, limit = 10) => adminClient.get<PaginatedResponse<Invoice>>('/admin/invoices', { params: { page, limit } }).then(r => r.data),
  generateForSale: (saleId: string) => adminClient.post<Invoice>(`/admin/invoices/sale/${saleId}`).then(r => r.data),
  generateForPurchase: (purchaseId: string) => adminClient.post<Invoice>(`/admin/invoices/purchase/${purchaseId}`).then(r => r.data),
  downloadUrl: (id: string) => {
    const token = localStorage.getItem('access_token')
    return `/api/admin/invoices/${id}/download${token ? `?token=${token}` : ''}`
  },
  printUrl: (id: string) => {
    const token = localStorage.getItem('access_token')
    return `/api/admin/invoices/${id}/print${token ? `?token=${token}` : ''}`
  },
}
