// Khớp ReviewResponse (backend/.../review/dto/ReviewResponse.java) — kết quả
// public chỉ gồm review VISIBLE (lọc sẵn ở ReviewService.listPublicByProduct).
export interface ReviewResponse {
  id: number
  productId: number
  reviewerName: string
  rating: number
  comment: string | null
  createdAt: string
}

// Khớp ReviewSummaryResponse — averageRating null khi chưa có review nào.
export interface ReviewSummaryResponse {
  averageRating: number | null
  reviewCount: number
}
