// Khớp VoucherValidateResponse (backend/.../voucher/dto/).
export interface VoucherValidateResponse {
  code: string
  orderAmount: number
  discountAmount: number
  finalAmount: number
}
