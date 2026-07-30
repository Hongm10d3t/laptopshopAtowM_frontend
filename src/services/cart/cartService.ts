import apiClient from '../../config/axios'
import { store } from '../../redux/store'
import { clearCartState, setCart } from '../../redux/slices/cartSlice'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { CartItemResponse, CartResponse } from '../../types/cart/cart'

// Tất cả API dưới đây yêu cầu đã đăng nhập (CustomerCartController) — luôn
// tự dispatch setCart vào Redux sau khi có kết quả mới nhất từ Backend, giống
// cách authService tự dispatch setCredentials/clearCredentials. Component chỉ
// cần gọi hàm rồi đọc lại state qua useAppSelector, không tự dispatch.

// GET /customer/cart — unitPrice/lineTotal đọc live từ ProductVariant.price.
export async function getCart(): Promise<CartResponse> {
  const response = await apiClient.get<ApiResponse<CartResponse>>('/customer/cart')
  store.dispatch(setCart(response.data.data))
  return response.data.data
}

// POST /customer/cart/items — chỉ trả về CartItemResponse của dòng vừa
// thêm/gộp, không phải cả giỏ -> gọi lại getCart() để có totalAmount và toàn
// bộ danh sách mới nhất (BE tự gộp số lượng nếu variant đã có trong giỏ).
export async function addCartItem(productVariantId: number, quantity: number): Promise<CartResponse> {
  await apiClient.post<ApiResponse<CartItemResponse>>('/customer/cart/items', { productVariantId, quantity })
  return getCart()
}

// PUT /customer/cart/items/{itemId}.
export async function updateCartItemQuantity(itemId: number, quantity: number): Promise<CartResponse> {
  await apiClient.put<ApiResponse<CartItemResponse>>(`/customer/cart/items/${itemId}`, { quantity })
  return getCart()
}

// DELETE /customer/cart/items/{itemId}.
export async function removeCartItem(itemId: number): Promise<CartResponse> {
  await apiClient.delete(`/customer/cart/items/${itemId}`)
  return getCart()
}

// DELETE /customer/cart — xóa hết, kết quả luôn rỗng nên set thẳng không cần
// gọi lại getCart().
export async function clearCart(): Promise<void> {
  await apiClient.delete('/customer/cart')
  store.dispatch(clearCartState())
}
