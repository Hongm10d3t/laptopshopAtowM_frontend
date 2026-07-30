import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { VoucherValidateResponse } from '../../types/voucher/voucher'

// POST /customer/vouchers/validate — chỉ xem trước (không redeem), tính lại
// rawTotal từ giỏ hàng hiện tại phía Backend, không tin số tiền FE gửi lên.
export async function validateVoucher(code: string): Promise<VoucherValidateResponse> {
  const response = await apiClient.post<ApiResponse<VoucherValidateResponse>>('/customer/vouchers/validate', {
    code,
  })
  return response.data.data
}
