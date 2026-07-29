import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { CategoryPublicResponse } from '../../types/catalog/category'

// GET /public/categories — public, không cần đăng nhập (PublicCategoryController).
export async function getActiveCategories(): Promise<CategoryPublicResponse[]> {
  const response = await apiClient.get<ApiResponse<CategoryPublicResponse[]>>('/public/categories')
  return response.data.data
}
