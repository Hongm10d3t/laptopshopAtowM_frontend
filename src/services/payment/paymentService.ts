import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { PaymentUrlResponse, VnPayReturnResponse } from '../../types/payment/payment'

// POST /customer/orders/{orderId}/payment-url — dùng chung cho lần đầu lấy
// URL thanh toán lẫn mọi lần "thanh toán lại" (Backend luôn sinh
// gatewayTxnRef/expiresAt mới, không có endpoint retry riêng). Trả về URL
// sang VNPay sandbox thật — caller phải điều hướng CẢ TRANG
// (window.location.href), không phải điều hướng SPA, vì đích là domain khác.
export async function getPaymentUrl(orderId: number): Promise<PaymentUrlResponse> {
  const response = await apiClient.post<ApiResponse<PaymentUrlResponse>>(`/customer/orders/${orderId}/payment-url`)
  return response.data.data
}

// GET /public/payments/vnpay/return — public, không cần đăng nhập (VNPay
// redirect thẳng trình duyệt tới route Frontend rồi Frontend gọi lại API
// này với đúng các query param VNPay đính kèm). Chỉ phục vụ hiển thị, không
// phải nguồn xác nhận thanh toán thật (đó là /ipn, server-to-server).
export async function getVnPayReturnResult(params: Record<string, string>): Promise<VnPayReturnResponse> {
  const response = await apiClient.get<ApiResponse<VnPayReturnResponse>>('/public/payments/vnpay/return', {
    params,
  })
  return response.data.data
}
