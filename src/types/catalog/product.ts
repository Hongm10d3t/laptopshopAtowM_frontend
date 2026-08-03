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

// ==========================================================================
// Từ đây trở xuống — dùng cho Admin (Phase 6.2, AdminProductController).
// ProductVariantResponse/ProductImageResponse/ProductSpecValueResponse ở trên
// đã khớp NGUYÊN VẸN DTO Admin dùng (cùng 1 class Java) nên tái dùng thẳng,
// không khai lại.
// ==========================================================================

export type ProductStatus = 'ACTIVE' | 'INACTIVE'

// Khớp ProductResponse (admin) — có categoryId/brandId thô (khác
// ProductDetailResponse công khai chỉ có tên) để đổ vào <select> khi sửa.
export interface ProductResponse {
  id: number
  categoryId: number
  categoryName: string
  brandId: number
  brandName: string
  name: string
  slug: string
  shortDescription: string | null
  description: string | null
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

// Khớp ProductSummaryResponse (admin, list) — chưa có giá/ảnh đại diện (đúng
// giới hạn hiện tại của Backend, xem comment trong ProductSummaryResponse.java).
export interface ProductSummaryResponse {
  id: number
  name: string
  slug: string
  categoryName: string
  brandName: string
  status: ProductStatus
  createdAt: string
}

// Khớp ProductCreateRequest/ProductUpdateRequest — 2 DTO giống hệt field.
export interface ProductFormRequest {
  categoryId: number
  brandId: number
  name: string
  slug?: string
  shortDescription?: string
  description?: string
}

// Khớp ProductVariantCreateRequest.
export interface ProductVariantCreateRequest {
  sku: string
  variantName?: string
  price: number
  ramGb?: number
  storageGb?: number
  storageType?: string
  color?: string
}

// Khớp ProductVariantUpdateRequest — không có sku (cố định sau khi tạo).
export interface ProductVariantUpdateRequest {
  variantName?: string
  price: number
  ramGb?: number
  storageGb?: number
  storageType?: string
  color?: string
}

// Khớp ProductImageCreateRequest.
export interface ProductImageCreateRequest {
  url: string
  altText?: string
  sortOrder?: number
}

// Khớp ProductImageReorderRequest.
export interface ProductImageReorderRequest {
  orderedImageIds: number[]
}

// Khớp ProductSpecValuesUpsertRequest — bulk replace toàn bộ giá trị.
export interface ProductSpecValuesUpsertRequest {
  values: { specificationDefinitionId: number; value: string }[]
}

// Khớp SpecificationDefinitionResponse (GET /admin/specifications) — dữ liệu
// tham chiếu chỉ đọc, dùng để dựng form nhập thông số kỹ thuật.
export interface SpecificationDefinitionResponse {
  id: number
  code: string
  label: string
  unit: string | null
  groupLabel: string
  displayOrder: number
}
