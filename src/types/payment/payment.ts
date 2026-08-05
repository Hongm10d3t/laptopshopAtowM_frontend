import type { PaymentStatus } from '../order/order'

// Khớp PaymentUrlResponse (backend/.../payment/dto/).
export interface PaymentUrlResponse {
  paymentUrl: string
}

// Khớp VnPayReturnResponse — chỉ phục vụ hiển thị (KHÔNG phải nguồn xác nhận
// thanh toán thật, đó là /ipn phía server-to-server). orderId null khi không
// tìm thấy giao dịch (vd chữ ký sai/txnRef lạ).
export interface VnPayReturnResponse {
  success: boolean
  orderId: number | null
  message: string
}

// Khớp PaymentResponse của AdminPaymentController. Payment là bản ghi riêng
// chỉ có với đơn ONLINE; trạng thái chỉ đọc ở Frontend và chỉ thay đổi qua
// IPN/scheduler/cancel flow phía Backend.
export interface PaymentResponse {
  id: number
  orderId: number
  amount: number
  status: PaymentStatus
  gatewayTransactionNo: string | null
  expiresAt: string
  paidAt: string | null
  createdAt: string
}
