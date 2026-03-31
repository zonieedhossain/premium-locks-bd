export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  category: string
  price: number
  discount_price: number
  short_description: string
  description: string
  stock_quantity: number
  main_image: string
  gallery_images: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductFormData {
  name: string
  category: string
  price: number
  discount_price: number
  short_description: string
  description: string
  stock_quantity: number
  is_active: boolean
  main_image?: File
}
