import apiClient from '../../config/axios'
import { getCart } from '../cart/cartService'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { CheckoutRequest, OrderResponse } from '../../types/order/order'

// POST /customer/orders — Backend tự xóa giỏ hàng sau khi đặt thành công
// (OrderService.checkout gọi cartService.clear) -> gọi lại getCart() để
// cartSlice/badge Header đồng bộ ngay, không đợi tới lần điều hướng kế tiếp.
export async function checkout(payload: CheckoutRequest): Promise<OrderResponse> {
  const response = await apiClient.post<ApiResponse<OrderResponse>>('/customer/orders', payload)
  await getCart().catch(() => {})
  return response.data.data
}
