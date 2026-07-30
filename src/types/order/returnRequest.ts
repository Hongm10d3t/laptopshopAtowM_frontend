// Khớp ReturnRequestStatus (backend/.../order/entity/).
export type ReturnRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED'

// Khớp ReturnRequestResponse.
export interface ReturnRequestResponse {
  id: number
  orderId: number
  userId: number
  reason: string
  status: ReturnRequestStatus
  decidedByUserId: number | null
  decidedAt: string | null
  decisionNote: string | null
  createdAt: string
  updatedAt: string
}
