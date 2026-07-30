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
