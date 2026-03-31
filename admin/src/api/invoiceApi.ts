import adminClient from './adminApi'
import type { Invoice } from '../types/invoice'

export const invoiceApi = {
  getAll: () => adminClient.get<Invoice[]>('/admin/invoices').then(r => r.data),
  generateForSale: (saleId: string) => adminClient.post<Invoice>(`/admin/invoices/sale/${saleId}`).then(r => r.data),
  generateForPurchase: (purchaseId: string) => adminClient.post<Invoice>(`/admin/invoices/purchase/${purchaseId}`).then(r => r.data),
  downloadUrl: (id: string) => `/api/admin/invoices/${id}/download`,
  printUrl: (id: string) => `/api/admin/invoices/${id}/print`,
}
