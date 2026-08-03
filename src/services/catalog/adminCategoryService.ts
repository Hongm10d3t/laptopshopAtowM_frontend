import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type { CategoryFormRequest, CategoryResponse } from '../../types/catalog/category'

// Toàn bộ hàm dưới đây gọi /admin/categories (AdminCategoryController) — yêu
// cầu đã đăng nhập ADMIN, khác hẳn getActiveCategories() (public,
// categoryService.ts) chỉ đọc và chỉ trả danh mục ACTIVE.

export interface ListCategoriesParams {
  page?: number
  size?: number
}

export async function listCategories(
  params: ListCategoriesParams = {},
): Promise<PageResponse<CategoryResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<CategoryResponse>>>('/admin/categories', { params })
  return response.data.data
}

export async function getCategory(id: number): Promise<CategoryResponse> {
  const response = await apiClient.get<ApiResponse<CategoryResponse>>(`/admin/categories/${id}`)
  return response.data.data
}

export async function createCategory(payload: CategoryFormRequest): Promise<CategoryResponse> {
  const response = await apiClient.post<ApiResponse<CategoryResponse>>('/admin/categories', payload)
  return response.data.data
}

export async function updateCategory(id: number, payload: CategoryFormRequest): Promise<CategoryResponse> {
  const response = await apiClient.put<ApiResponse<CategoryResponse>>(`/admin/categories/${id}`, payload)
  return response.data.data
}

export async function activateCategory(id: number): Promise<CategoryResponse> {
  const response = await apiClient.post<ApiResponse<CategoryResponse>>(`/admin/categories/${id}/activate`)
  return response.data.data
}

export async function deactivateCategory(id: number): Promise<CategoryResponse> {
  const response = await apiClient.post<ApiResponse<CategoryResponse>>(`/admin/categories/${id}/deactivate`)
  return response.data.data
}
