import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type {
  OrderResponse,
  OrderStatus,
  OrderSummaryResponse,
} from '../../types/order/order'

// AdminOrderController chỉ hỗ trợ lọc theo 1 OrderStatus tại một thời điểm.
// Không tự thêm keyword/date/sort ở Frontend vì Backend không nhận các tham số đó.
export interface ListAdminOrdersParams {
  status?: OrderStatus
  page?: number
  size?: number
}

export async function listAdminOrders(
  params: ListAdminOrdersParams = {},
): Promise<PageResponse<OrderSummaryResponse>> {
  const response = await apiClient.get<
    ApiResponse<PageResponse<OrderSummaryResponse>>
  >('/admin/orders', { params })
  return response.data.data
}

export async function getAdminOrder(id: number): Promise<OrderResponse> {
  const response = await apiClient.get<ApiResponse<OrderResponse>>(
    `/admin/orders/${id}`,
  )
  return response.data.data
}

async function postAdminOrderAction(
  id: number,
  action: 'confirm' | 'prepare' | 'ship' | 'deliver' | 'cancel',
): Promise<OrderResponse> {
  const response = await apiClient.post<ApiResponse<OrderResponse>>(
    `/admin/orders/${id}/${action}`,
  )
  return response.data.data
}

export function confirmAdminOrder(id: number): Promise<OrderResponse> {
  return postAdminOrderAction(id, 'confirm')
}

export function prepareAdminOrder(id: number): Promise<OrderResponse> {
  return postAdminOrderAction(id, 'prepare')
}

export function shipAdminOrder(id: number): Promise<OrderResponse> {
  return postAdminOrderAction(id, 'ship')
}

export function deliverAdminOrder(id: number): Promise<OrderResponse> {
  return postAdminOrderAction(id, 'deliver')
}

export function cancelAdminOrder(id: number): Promise<OrderResponse> {
  return postAdminOrderAction(id, 'cancel')
}
