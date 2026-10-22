export interface Product {
  id: string
  handle: string
  title: string
  description: string
  thumbnail: string | null
  images: string[]
  categories: string[]
  variants: {
    id: string
    title: string
    amount: number | null
    available: boolean
  }[]
  amount: number | null
  unit: string
  available: boolean
}
export interface Catalog {
  products: Product[]
  count: number
  total: number
  categories: { value: string; count: number }[]
  page: number
  pages: number
}

export interface CartItem {
  id: string
  variantId: string
  productHandle: string
  title: string
  variantTitle: string
  thumbnail: string | null
  quantity: number
  unitPrice: number
  total: number
}
export interface Cart {
  id: string | null
  items: CartItem[]
  itemCount: number
  total: number
}
