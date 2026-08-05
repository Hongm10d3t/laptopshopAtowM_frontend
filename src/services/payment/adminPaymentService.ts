import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type { PaymentStatus } from '../../types/order/order'
import type { PaymentResponse } from '../../types/payment/payment'

// AdminPaymentController chỉ hỗ trợ lọc theo status và orderId chính xác.
// Không tự gửi keyword, transaction number hoặc date range vì Backend không
// nhận các query param đó.
export interface ListAdminPaymentsParams {
  status?: PaymentStatus
  orderId?: number
  page?: number
  size?: number
}

export async function listAdminPayments(
  params: ListAdminPaymentsParams = {},
): Promise<PageResponse<PaymentResponse>> {
  const response = await apiClient.get<
    ApiResponse<PageResponse<PaymentResponse>>
  >('/admin/payments', { params })
  return response.data.data
}

export async function getAdminPayment(id: number): Promise<PaymentResponse> {
  const response = await apiClient.get<ApiResponse<PaymentResponse>>(
    `/admin/payments/${id}`,
  )
  return response.data.data
}
