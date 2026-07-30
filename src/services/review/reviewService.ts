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

export interface ReviewCreateRequest {
  rating: number
  comment: string
}

// GET /customer/products/{productId}/reviews/me — yêu cầu đã đăng nhập, trả
// data=null (200, không phải 404) nếu chưa review — trạng thái hợp lệ của
// form viết đánh giá, dùng để ẩn/hiện nút "Viết đánh giá".
export async function getMyReview(productId: number): Promise<ReviewResponse | null> {
  const response = await apiClient.get<ApiResponse<ReviewResponse | null>>(
    `/customer/products/${productId}/reviews/me`,
  )
  return response.data.data
}

// POST /customer/products/{productId}/reviews — Backend tự kiểm tra đã có
// đơn DELIVERED chứa sản phẩm này và chưa từng review (REVIEW_NOT_ELIGIBLE/
// REVIEW_ALREADY_EXISTS), FE chỉ ẩn nút theo cùng điều kiện để tránh gọi API
// rồi mới báo lỗi ở tình huống bình thường.
export async function createReview(productId: number, payload: ReviewCreateRequest): Promise<ReviewResponse> {
  const response = await apiClient.post<ApiResponse<ReviewResponse>>(`/customer/products/${productId}/reviews`, payload)
  return response.data.data
}
