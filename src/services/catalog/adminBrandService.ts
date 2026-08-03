import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type { BrandFormRequest, BrandResponse } from '../../types/catalog/brand'

// Toàn bộ hàm dưới đây gọi /admin/brands (AdminBrandController) — yêu cầu đã
// đăng nhập ADMIN, khác hẳn getActiveBrands() (public, brandService.ts).

export interface ListBrandsParams {
  page?: number
  size?: number
}

export async function listBrands(params: ListBrandsParams = {}): Promise<PageResponse<BrandResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<BrandResponse>>>('/admin/brands', { params })
  return response.data.data
}

export async function getBrand(id: number): Promise<BrandResponse> {
  const response = await apiClient.get<ApiResponse<BrandResponse>>(`/admin/brands/${id}`)
  return response.data.data
}

export async function createBrand(payload: BrandFormRequest): Promise<BrandResponse> {
  const response = await apiClient.post<ApiResponse<BrandResponse>>('/admin/brands', payload)
  return response.data.data
}

export async function updateBrand(id: number, payload: BrandFormRequest): Promise<BrandResponse> {
  const response = await apiClient.put<ApiResponse<BrandResponse>>(`/admin/brands/${id}`, payload)
  return response.data.data
}

export async function activateBrand(id: number): Promise<BrandResponse> {
  const response = await apiClient.post<ApiResponse<BrandResponse>>(`/admin/brands/${id}/activate`)
  return response.data.data
}

export async function deactivateBrand(id: number): Promise<BrandResponse> {
  const response = await apiClient.post<ApiResponse<BrandResponse>>(`/admin/brands/${id}/deactivate`)
  return response.data.data
}
