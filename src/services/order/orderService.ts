import apiClient from '../../config/axios'
import { getCart } from '../cart/cartService'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PageResponse } from '../../types/common/pageResponse'
import type { CheckoutRequest, OrderResponse, OrderSummaryResponse } from '../../types/order/order'

// POST /customer/orders — Backend tự xóa giỏ hàng sau khi đặt thành công
// (OrderService.checkout gọi cartService.clear) -> gọi lại getCart() để
// cartSlice/badge Header đồng bộ ngay, không đợi tới lần điều hướng kế tiếp.
export async function checkout(payload: CheckoutRequest): Promise<OrderResponse> {
  const response = await apiClient.post<ApiResponse<OrderResponse>>('/customer/orders', payload)
  await getCart().catch(() => {})
  return response.data.data
}

export interface ListOrdersParams {
  page?: number
  size?: number
}

// GET /customer/orders — CustomerOrderController nhận thẳng Pageable chuẩn
// Spring (page/size/sort), không có custom sort DTO như PublicProductController
// -> luôn truyền sort=createdAt,desc để đơn mới nhất hiện trước, Backend
// không tự sắp xếp mặc định.
export async function listOrders(params: ListOrdersParams = {}): Promise<PageResponse<OrderSummaryResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<OrderSummaryResponse>>>('/customer/orders', {
    params: { ...params, sort: 'createdAt,desc' },
  })
  return response.data.data
}

// GET /customer/orders/{id}.
export async function getOrder(id: number): Promise<OrderResponse> {
  const response = await apiClient.get<ApiResponse<OrderResponse>>(`/customer/orders/${id}`)
  return response.data.data
}

// POST /customer/orders/{id}/cancel — Backend tự chặn nếu status không còn
// PENDING/CONFIRMED (OrderService.cancelByCustomer), FE chỉ ẩn nút theo cùng
// điều kiện để tránh gọi API rồi mới báo lỗi ở tình huống bình thường.
export async function cancelOrder(id: number): Promise<OrderResponse> {
  const response = await apiClient.post<ApiResponse<OrderResponse>>(`/customer/orders/${id}/cancel`)
  return response.data.data
}
