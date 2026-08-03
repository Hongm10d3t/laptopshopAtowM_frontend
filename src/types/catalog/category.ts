// Khớp đúng CategoryPublicResponse (backend/.../catalog/dto/CategoryPublicResponse.java)
// — GET /public/categories chỉ trả 3 field này (danh mục đang ACTIVE).
export interface CategoryPublicResponse {
  id: number
  name: string
  slug: string
}

// Từ đây trở xuống — dùng cho Admin (Phase 6.1, AdminCategoryController).
export type CategoryStatus = 'ACTIVE' | 'INACTIVE'

// Khớp CategoryResponse.
export interface CategoryResponse {
  id: number
  name: string
  slug: string
  description: string | null
  status: CategoryStatus
  createdAt: string
  updatedAt: string
}

// Khớp CategoryCreateRequest/CategoryUpdateRequest — 2 DTO giống hệt field
// nên dùng chung 1 type ở Frontend.
export interface CategoryFormRequest {
  name: string
  slug?: string
  description?: string
}
