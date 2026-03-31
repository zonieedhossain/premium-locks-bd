export interface PurchaseItem {
  product_id: string
  product_name: string
  sku: string
  quantity: number
  unit_cost: number
  subtotal: number
}

export interface Purchase {
  id: string
  supplier_name: string
  items: PurchaseItem[]
  total_amount: number
  paid_amount: number
  status: 'pending' | 'received' | 'cancelled'
  note: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreatePurchaseInput {
  supplier_name: string
  items: { product_id: string; quantity: number; unit_cost: number }[]
  paid_amount: number
  note: string
}
