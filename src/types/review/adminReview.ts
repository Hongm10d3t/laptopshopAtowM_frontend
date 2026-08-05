export type AdminReviewStatus = 'VISIBLE' | 'HIDDEN'

export interface AdminReviewResponse {
  id: number
  productId: number
  userId: number
  reviewerName: string | null
  orderId: number
  rating: number
  comment: string
  status: AdminReviewStatus
  createdAt: string
}
