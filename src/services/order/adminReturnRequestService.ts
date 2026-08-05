import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type {
  ReturnRequestResponse,
  ReturnRequestStatus,
} from '../../types/order/returnRequest'

// AdminReturnRequestController chỉ hỗ trợ lọc theo 1 trạng thái, page và size.
// Không tự thêm keyword/date/sort vì Backend không nhận các tham số đó.
export interface ListAdminReturnRequestsParams {
  status?: ReturnRequestStatus
  page?: number
  size?: number
}

export async function listAdminReturnRequests(
  params: ListAdminReturnRequestsParams = {},
): Promise<PageResponse<ReturnRequestResponse>> {
  const response = await apiClient.get<
    ApiResponse<PageResponse<ReturnRequestResponse>>
  >('/admin/return-requests', { params })
  return response.data.data
}

export async function getAdminReturnRequest(
  id: number,
): Promise<ReturnRequestResponse> {
  const response = await apiClient.get<ApiResponse<ReturnRequestResponse>>(
    `/admin/return-requests/${id}`,
  )
  return response.data.data
}

export async function approveAdminReturnRequest(
  id: number,
): Promise<ReturnRequestResponse> {
  const response = await apiClient.post<ApiResponse<ReturnRequestResponse>>(
    `/admin/return-requests/${id}/approve`,
  )
  return response.data.data
}

export async function rejectAdminReturnRequest(
  id: number,
  note?: string,
): Promise<ReturnRequestResponse> {
  const normalizedNote = note?.trim()
  const body = normalizedNote ? { note: normalizedNote } : undefined

  const response = await apiClient.post<ApiResponse<ReturnRequestResponse>>(
    `/admin/return-requests/${id}/reject`,
    body,
  )
  return response.data.data
}
