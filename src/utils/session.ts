import type { AuthCredentials } from '../redux/slices/authSlice'
import type { LoginResponse } from '../types/auth/login'
import type { AccessTokenPayload } from '../types/auth/session'
import { decodeJwtPayload } from './jwt'

// Suy ra thông tin phiên đăng nhập (userId/email/role/thời điểm hết hạn) từ
// LoginResponse — dùng chung cho cả login (authService) lẫn refresh
// (interceptor trong config/axios.ts), đặt ở file trung lập để 2 nơi đó
// không phải import lẫn nhau.
export function deriveCredentials(data: LoginResponse): AuthCredentials {
  const payload = decodeJwtPayload<AccessTokenPayload>(data.accessToken)
  return {
    accessToken: data.accessToken,
    userId: Number(payload.sub),
    email: payload.email,
    role: payload.role,
    expiresAt: Date.now() + data.expiresIn * 1000,
  }
}
