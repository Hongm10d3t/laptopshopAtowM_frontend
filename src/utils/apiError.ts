import axios from 'axios'
import type { ApiResponse } from '../types/common/apiResponse'

// Backend luôn trả lỗi theo cùng 1 envelope ApiResponse (success=false,
// message, errorCode) — xem GlobalExceptionHandler.java. Hàm này rút gọn lỗi
// Axios về đúng message đó, dùng chung cho mọi form/mutation trong app thay
// vì mỗi nơi tự parse lại error.response.data.
export function getApiErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined
    if (data?.message) {
      return data.message
    }
  }
  return fallback
}
