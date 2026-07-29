// Khớp LoginRequest/LoginResponse (backend/.../auth/dto/LoginRequest.java,
// LoginResponse.java). Refresh token KHÔNG có ở đây — chỉ đi qua HttpOnly
// Cookie (Set-Cookie), không bao giờ vào JSON body (AUTH_SECURITY_USER_CONTRACT.md §7).
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}
