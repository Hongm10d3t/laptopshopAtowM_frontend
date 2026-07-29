import apiClient from '../../config/axios'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { ResendVerificationEmailRequest, VerifyEmailRequest } from '../../types/auth/emailVerification'
import type { RegisterRequest, RegisterResponse } from '../../types/auth/register'

// POST /auth/register — public, tạo customer PENDING_VERIFICATION, KHÔNG tự
// đăng nhập (đúng AuthController.register — login là hành động riêng).
export async function register(payload: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', payload)
  return response.data.data
}

// POST /auth/verify-email — public.
export async function verifyEmail(payload: VerifyEmailRequest): Promise<void> {
  await apiClient.post<ApiResponse<null>>('/auth/verify-email', payload)
}

// POST /auth/resend-verification-email — public, LUÔN trả 200 (chống dò
// email tồn tại), không có nhánh lỗi nghiệp vụ riêng để xử lý.
export async function resendVerificationEmail(payload: ResendVerificationEmailRequest): Promise<void> {
  await apiClient.post<ApiResponse<null>>('/auth/resend-verification-email', payload)
}
