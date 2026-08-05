import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type { AdminReviewResponse, AdminReviewStatus } from '../../types/review/adminReview'

export interface ListAdminReviewsParams {
  productId?: number
  status?: AdminReviewStatus
  page?: number
  size?: number
}

export async function listAdminReviews(
  params: ListAdminReviewsParams = {},
): Promise<PageResponse<AdminReviewResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminReviewResponse>>>('/admin/reviews', { params })
  return response.data.data
}

export async function hideAdminReview(id: number): Promise<AdminReviewResponse> {
  const response = await apiClient.post<ApiResponse<AdminReviewResponse>>(`/admin/reviews/${id}/hide`)
  return response.data.data
}

export async function unhideAdminReview(id: number): Promise<AdminReviewResponse> {
  const response = await apiClient.post<ApiResponse<AdminReviewResponse>>(`/admin/reviews/${id}/unhide`)
  return response.data.data
}
