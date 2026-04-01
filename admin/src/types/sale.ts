export interface SaleItem {
  product_id: string
  product_name: string
  sku: string
  quantity: number
  unit_price: number
  cost_price: number
  discount: number
  subtotal: number
}

export interface Sale {
  id: string
  invoice_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  items: SaleItem[]
  sub_total: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  paid_amount: number
  payment_method: string
  transaction_id: string
  status: 'pending' | 'completed' | 'cancelled' | 'refunded'
  note: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateSaleInput {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  items: { product_id: string; quantity: number; unit_price: number; discount: number }[]
  discount_amount: number
  paid_amount: number
  payment_method: string
  transaction_id: string
  note: string
}
