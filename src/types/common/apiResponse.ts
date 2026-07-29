// Khớp đúng com.laptophub.common.ApiResponse<T> phía Backend — envelope chung
// cho MỌI response thành công/thất bại (trừ ngoại lệ IPN VNPay, xem
// API_CONVENTION.md §6). errorCode chỉ có khi success=false.
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errorCode?: string
  timestamp: string
}
