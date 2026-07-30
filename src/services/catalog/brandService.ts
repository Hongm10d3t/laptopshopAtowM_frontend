import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { BrandPublicResponse } from '../../types/catalog/brand'

// GET /public/brands — public, không cần đăng nhập (PublicBrandController).
export async function getActiveBrands(): Promise<BrandPublicResponse[]> {
  const response = await apiClient.get<ApiResponse<BrandPublicResponse[]>>('/public/brands')
  return response.data.data
}
