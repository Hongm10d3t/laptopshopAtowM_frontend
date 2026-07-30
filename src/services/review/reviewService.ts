import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type { ReviewResponse, ReviewSummaryResponse } from '../../types/review/review'

export interface GetProductReviewsParams {
  page?: number
  size?: number
}

// GET /public/products/{productId}/reviews — public, Guest cũng xem được
// (PublicReviewController).
export async function getProductReviews(
  productId: number,
  params: GetProductReviewsParams = {},
): Promise<PageResponse<ReviewResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<ReviewResponse>>>(
    `/public/products/${productId}/reviews`,
    { params },
  )
  return response.data.data
}

// GET /public/products/{productId}/reviews/summary
export async function getReviewSummary(productId: number): Promise<ReviewSummaryResponse> {
  const response = await apiClient.get<ApiResponse<ReviewSummaryResponse>>(
    `/public/products/${productId}/reviews/summary`,
  )
  return response.data.data
}
