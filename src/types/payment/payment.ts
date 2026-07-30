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
