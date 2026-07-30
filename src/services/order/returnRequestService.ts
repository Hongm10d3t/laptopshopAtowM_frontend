import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { ReturnRequestResponse } from '../../types/order/returnRequest'

// POST /customer/orders/{orderId}/return-requests — Backend tự chuyển đơn
// sang RETURN_REQUESTED khi tạo thành công (ReturnRequestService.create gọi
// OrderService.markReturnRequested), FE chỉ cần load lại đơn sau khi gọi.
export async function createReturnRequest(orderId: number, reason: string): Promise<ReturnRequestResponse> {
  const response = await apiClient.post<ApiResponse<ReturnRequestResponse>>(
    `/customer/orders/${orderId}/return-requests`,
    { reason },
  )
  return response.data.data
}
