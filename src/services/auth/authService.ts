import apiClient from '../../config/axios'
import { store } from '../../redux/store'
import { clearCredentials, setCredentials } from '../../redux/slices/authSlice'
import { deriveCredentials } from '../../utils/session'
import type { ApiResponse } from '../../types/common/apiResponse'
import type { ChangePasswordRequest } from '../../types/auth/changePassword'
import type { ResendVerificationEmailRequest, VerifyEmailRequest } from '../../types/auth/emailVerification'
import type { LoginRequest, LoginResponse } from '../../types/auth/login'
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

// POST /auth/login — public. Backend set refresh token qua HttpOnly Cookie
// (browser tự lưu, JS không đọc được và không cần đọc); accessToken trong
// JSON body được lưu vào Redux (authSlice), không phải localStorage — mất
// khi refresh trang, khôi phục lại bằng restoreSession() bên dưới.
export async function login(payload: LoginRequest): Promise<void> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', payload)
  store.dispatch(setCredentials(deriveCredentials(response.data.data)))
}

// POST /auth/logout — yêu cầu đã đăng nhập (JwtAuthenticationFilter gắn
// user từ Authorization header). Luôn clear phiên phía FE dù API lỗi (vd
// access token vừa hết hạn ngay lúc bấm logout) — mục tiêu logout là "không
// còn đăng nhập ở FE nữa", không phụ thuộc API có trả 204 kịp hay không.
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout')
  } finally {
    store.dispatch(clearCredentials())
  }
}

// Gọi 1 lần lúc app khởi động (App.tsx) để khôi phục phiên đăng nhập từ
// refresh token cookie (nếu còn hạn). Thất bại (chưa từng đăng nhập/cookie
// hết hạn) vẫn PHẢI dispatch clearCredentials để tắt cờ isRestoring — nếu chỉ
// im lặng bỏ qua, authSlice kẹt mãi ở isRestoring=true (giá trị khởi tạo),
// khiến AuthGuard (Gói 1.4) treo loading vĩnh viễn thay vì điều hướng /login.
export async function restoreSession(): Promise<void> {
  try {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh')
    store.dispatch(setCredentials(deriveCredentials(response.data.data)))
  } catch {
    store.dispatch(clearCredentials())
  }
}

// POST /auth/change-password — yêu cầu đã đăng nhập. Backend revoke refresh
// token hiện tại ngay sau khi đổi thành công (giống logout — access token cũ
// vẫn dùng được tới khi hết hạn tự nhiên, xem ChangePasswordService.java) —
// vì vậy FE chủ động clearCredentials() ngay sau khi API thành công, không
// đợi tới lần refresh kế tiếp mới phát hiện phiên đã chết.
export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  await apiClient.post<ApiResponse<null>>('/auth/change-password', payload)
  store.dispatch(clearCredentials())
}
