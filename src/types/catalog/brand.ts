// Khớp BrandPublicResponse (backend/.../catalog/dto/BrandPublicResponse.java).
export interface BrandPublicResponse {
  id: number
  name: string
  slug: string
  logoUrl: string | null
}

// Từ đây trở xuống — dùng cho Admin (Phase 6.1, AdminBrandController).
export type BrandStatus = 'ACTIVE' | 'INACTIVE'

// Khớp BrandResponse.
export interface BrandResponse {
  id: number
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  status: BrandStatus
  createdAt: string
  updatedAt: string
}

// Khớp BrandCreateRequest/BrandUpdateRequest — 2 DTO giống hệt field nên
// dùng chung 1 type ở Frontend.
export interface BrandFormRequest {
  name: string
  slug?: string
  description?: string
  logoUrl?: string
}
