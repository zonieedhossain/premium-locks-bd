export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  imageUrl: string
  createdAt: string
  updatedAt: string
}

export interface ProductInput {
  name: string
  description: string
  price: number
  category: string
  stock: number
}

export type ProductFormData = ProductInput & { image?: File }
