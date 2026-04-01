import adminClient from './adminApi'
import type { PaginatedResponse } from '../types/pagination'

export interface SummaryReport {
  total_revenue: number
  total_purchase_cost: number
  gross_profit: number
  total_orders: number
  low_stock_products: number
  total_stock_value: number
}

export interface DailySales {
  date: string
  total: number
  orders: number
}

export interface DailyPurchases {
  date: string
  total: number
  count: number
}

export interface StockItem {
  product_id: string
  product_name: string
  sku: string
  category: string
  current_stock: number
  stock_value: number
  status: 'ok' | 'low' | 'out'
}

export interface TopProduct {
  product_id: string
  product_name: string
  sku: string
  units_sold: number
  revenue: number
}

export interface MonthlyComparison {
  month: string
  sales: number
  purchases: number
}

export interface PaymentMethodBreakdown {
  method: string
  count: number
  total: number
}

export interface ProfitRecord {
  sale_id: string
  date: string
  invoice_number: string
  customer_name: string
  revenue: number
  cogs: number
  gross_profit: number
}

export const reportApi = {
  summary: () => adminClient.get<SummaryReport>('/admin/reports/summary').then(r => r.data),
  profitList: (page = 1, limit = 10, from?: string, to?: string) =>
    adminClient.get<PaginatedResponse<ProfitRecord>>('/admin/reports/profit', { params: { page, limit, from, to } }).then(r => r.data),
  sales: (from?: string, to?: string) =>
    adminClient.get<DailySales[]>('/admin/reports/sales', { params: { from, to } }).then(r => r.data),
  purchases: (from?: string, to?: string) =>
    adminClient.get<DailyPurchases[]>('/admin/reports/purchases', { params: { from, to } }).then(r => r.data),
  stock: () => adminClient.get<StockItem[]>('/admin/reports/stock').then(r => r.data),
  topProducts: (from?: string, to?: string) =>
    adminClient.get<TopProduct[]>('/admin/reports/top-products', { params: { from, to } }).then(r => r.data),
  monthlyComparison: () => adminClient.get<MonthlyComparison[]>('/admin/reports/monthly-comparison').then(r => r.data),
  paymentMethods: () => adminClient.get<PaymentMethodBreakdown[]>('/admin/reports/payment-methods').then(r => r.data),

  downloadSalesUrl: (from?: string, to?: string, format: 'excel' | 'pdf' | 'csv' = 'csv') => {
    const token = localStorage.getItem('access_token')
    let url = `${import.meta.env.VITE_API_BASE_URL}/admin/reports/download/sales?token=${token}&format=${format}`
    if (from) url += `&from=${from}`
    if (to) url += `&to=${to}`
    return url
  },
  downloadPurchasesUrl: (from?: string, to?: string, format: 'excel' | 'pdf' | 'csv' = 'csv') => {
    const token = localStorage.getItem('access_token')
    let url = `${import.meta.env.VITE_API_BASE_URL}/admin/reports/download/purchases?token=${token}&format=${format}`
    if (from) url += `&from=${from}`
    if (to) url += `&to=${to}`
    return url
  },
  downloadStockUrl: (format: 'excel' | 'pdf' = 'excel') => {
    const token = localStorage.getItem('access_token')
    return `${import.meta.env.VITE_API_BASE_URL}/admin/reports/download/stock?token=${token}&format=${format}`
  },
  downloadTopProductsUrl: (from?: string, to?: string, format: 'excel' | 'pdf' = 'excel') => {
    const token = localStorage.getItem('access_token')
    let url = `${import.meta.env.VITE_API_BASE_URL}/admin/reports/download/top-products?token=${token}&format=${format}`
    if (from) url += `&from=${from}`
    if (to) url += `&to=${to}`
    return url
  },
  downloadProfitUrl: (from?: string, to?: string) => {
    const token = localStorage.getItem('access_token')
    let url = `${import.meta.env.VITE_API_BASE_URL}/admin/reports/download/profit?token=${token}`
    if (from) url += `&from=${from}`
    if (to) url += `&to=${to}`
    return url
  },
}
