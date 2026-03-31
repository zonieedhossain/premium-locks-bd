export interface Invoice {
  id: string
  invoice_number: string
  type: 'sale' | 'purchase'
  linked_id: string
  file_path: string
  created_at: string
}
