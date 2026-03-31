import adminClient from './adminApi'

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

export const reportApi = {
  summary: () => adminClient.get<SummaryReport>('/admin/reports/summary').then(r => r.data),
  sales: (from?: string, to?: string) =>
    adminClient.get<DailySales[]>('/admin/reports/sales', { params: { from, to } }).then(r => r.data),
  purchases: (from?: string, to?: string) =>
    adminClient.get<DailyPurchases[]>('/admin/reports/purchases', { params: { from, to } }).then(r => r.data),
  stock: () => adminClient.get<StockItem[]>('/admin/reports/stock').then(r => r.data),
  topProducts: () => adminClient.get<TopProduct[]>('/admin/reports/top-products').then(r => r.data),
  monthlyComparison: () => adminClient.get<MonthlyComparison[]>('/admin/reports/monthly-comparison').then(r => r.data),
  paymentMethods: () => adminClient.get<PaymentMethodBreakdown[]>('/admin/reports/payment-methods').then(r => r.data),
}
