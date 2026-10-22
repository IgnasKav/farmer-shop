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
