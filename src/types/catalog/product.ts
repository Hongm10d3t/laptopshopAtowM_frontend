// Khớp ProductListItemResponse/ProductSortOption
// (backend/.../catalog/dto/). Không có status — kết quả public luôn ngầm
// định ACTIVE (lọc sẵn ở ProductRepository.searchPublic).
export interface ProductListItemResponse {
  id: number
  name: string
  slug: string
  categoryName: string
  brandName: string
  priceFrom: number
  priceTo: number
  thumbnailUrl: string | null
}

// Whitelist thật của Backend — không được tự thêm giá trị (vd "FEATURED")
// vì ProductSearchService chỉ resolve đúng 5 giá trị này.
export type ProductSortOption = 'NEWEST' | 'NAME_ASC' | 'NAME_DESC' | 'PRICE_ASC' | 'PRICE_DESC'

// Khớp ProductVariantStatus (backend/.../catalog/entity/). Public API chỉ
// trả variant ACTIVE nhưng field status vẫn có mặt trên DTO nên khai đủ.
export type ProductVariantStatus = 'ACTIVE' | 'INACTIVE'

// Khớp ProductVariantResponse.
export interface ProductVariantResponse {
  id: number
  productId: number
  sku: string
  variantName: string
  price: number
  ramGb: number | null
  storageGb: number | null
  storageType: string | null
  color: string | null
  status: ProductVariantStatus
}

// Khớp ProductImageResponse.
export interface ProductImageResponse {
  id: number
  url: string
  altText: string | null
  sortOrder: number
}

// Khớp ProductSpecValueResponse.
export interface ProductSpecValueResponse {
  specificationDefinitionId: number
  code: string
  label: string
  unit: string | null
  groupLabel: string
  value: string
}

// Khớp ProductDetailResponse — images/variants chỉ gồm phần tử ACTIVE (lọc
// sẵn ở ProductSearchService).
export interface ProductDetailResponse {
  id: number
  name: string
  slug: string
  categoryName: string
  brandName: string
  shortDescription: string | null
  description: string | null
  images: ProductImageResponse[]
  variants: ProductVariantResponse[]
  specifications: ProductSpecValueResponse[]
}
